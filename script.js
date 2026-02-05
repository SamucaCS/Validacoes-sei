const SUPABASE_URL = "https://rfnbyzehscgxdoxdjwwp.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbmJ5emVoc2NneGRveGRqd3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODQ4ODMsImV4cCI6MjA4NTg2MDg4M30.MpMsvr_2Ijo-OOgj8wqPGcRGjZ-vC_f_xzG-ItnHt_M";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const formElement = document.getElementById("seiForm");

if (formElement) {
  document.getElementById("cpf").addEventListener("input", function (e) {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    e.target.value = v;
  });

  formElement.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.querySelector(".btn-glow");
    const originalText = btn.innerText;
    btn.innerText = "Validando...";
    btn.disabled = true;

    const dados = {
      nome: document.getElementById("nome").value.toUpperCase(),
      cpf: document.getElementById("cpf").value.replace(/\D/g, ""),
      escola: document.getElementById("escola").value,
      designado: document.getElementById("designado").value,
      cargo: document.getElementById("cargo").value,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await _supabase.from("validacoes").insert([dados]);
      if (error) throw error;
      alert("Acesso VALIDADO com sucesso!");
      formElement.reset();
    } catch (error) {
      alert("Erro ao validar: " + error.message);
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  });
}

const tabelaElement = document.getElementById("tabelaDados");

if (tabelaElement) {
  document.addEventListener("DOMContentLoaded", carregarDados);
  const searchInput = document.getElementById("search");
  const cargoFilter = document.getElementById("filtroCargo");
  if (searchInput) searchInput.addEventListener("keyup", filtrarTabela);
  if (cargoFilter) cargoFilter.addEventListener("change", filtrarTabela);
  const formEdicao = document.getElementById("formEdicao");
  if (formEdicao) {
    formEdicao.addEventListener("submit", salvarEdicao);
  }
}

function filtrarTabela() {
  const termo = document.getElementById("search").value.toLowerCase();
  const cargoSelecionado = document.getElementById("filtroCargo").value;
  const linhas = document
    .getElementById("tabelaDados")
    .getElementsByTagName("tr");

  for (let tr of linhas) {
    if (tr.cells.length < 2) continue;
    const textoLinha = tr.textContent.toLowerCase();
    const colunaCargo = tr.cells[3] ? tr.cells[3].textContent : "";
    const matchPesquisa = textoLinha.includes(termo);
    const matchCargo =
      cargoSelecionado === "" || colunaCargo === cargoSelecionado;
    tr.style.display = matchPesquisa && matchCargo ? "" : "none";
  }
}

async function carregarDados() {
  const tbody = document.getElementById("tabelaDados");
  const stats = {
    designados: document.getElementById("statDesignados"),
    cessados: document.getElementById("statCessados"),
    diretores: document.getElementById("statDiretores"),
    vices: document.getElementById("statVices"),
    coordenadores: document.getElementById("statCoordenadores"),
    aoe: document.getElementById("statAOE"),
  };

  if (!tbody) return;
  tbody.innerHTML =
    "<tr><td colspan='7' style='text-align:center; padding: 20px;'>Carregando dados...</td></tr>";

  const { data, error } = await _supabase
    .from("validacoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    tbody.innerHTML =
      "<tr><td colspan='7' style='text-align:center; color: red;'>Erro ao buscar dados.</td></tr>";
    return;
  }

  if (data) {
    if (stats.designados)
      stats.designados.innerText = data.filter(
        (d) => d.designado === "Sim",
      ).length;
    if (stats.cessados)
      stats.cessados.innerText = data.filter(
        (d) => d.designado === "Não",
      ).length;
    if (stats.diretores)
      stats.diretores.innerText = data.filter(
        (d) => d.cargo === "Diretor",
      ).length;
    if (stats.vices)
      stats.vices.innerText = data.filter(
        (d) => d.cargo === "Vice Diretor",
      ).length;
    if (stats.coordenadores)
      stats.coordenadores.innerText = data.filter(
        (d) => d.cargo === "Coordenador",
      ).length;
    if (stats.aoe)
      stats.aoe.innerText = data.filter(
        (d) => d.cargo === "Agente Organizacional",
      ).length;
  }

  tbody.innerHTML = "";
  if (data.length === 0) {
    tbody.innerHTML =
      "<tr><td colspan='7' style='text-align:center; padding: 20px;'>Nenhum registro encontrado.</td></tr>";
    return;
  }

  data.forEach((item) => {
    const cpfVisual = item.cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "***.$2.$3-$4",
    );
    const nomes = item.nome.split(" ");
    const iniciais = (
      nomes[0][0] + (nomes.length > 1 ? nomes[nomes.length - 1][0] : "")
    ).toUpperCase();

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>
            <div class="colaborador-info">
                <div class="mini-avatar">${iniciais}</div>
                <span style="font-weight: 600; color: #455a64;">${item.nome}</span>
            </div>
        </td>
        <td style="color:#78909c; font-family:monospace;">${cpfVisual}</td>
        <td>${item.escola}</td>
        <td>${item.cargo}</td>
        <td>${item.designado}</td>
        <td><span class="badge active">Validado</span></td>
        <td>
            <div class="actions-cell">
                <button onclick="abrirModalEdicao('${item.id}', '${item.nome}', '${item.cpf}', '${item.escola}', '${item.designado}', '${item.cargo}')" class="btn-action btn-edit" title="Editar">
                    <i class='bx bx-edit-alt'></i>
                </button>
                <button onclick="excluirUsuario('${item.id}', '${item.nome}')" class="btn-action btn-delete" title="Excluir">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        </td>
    `;
    tbody.appendChild(tr);
  });
  filtrarTabela();
}

// --- LÓGICA DE EXCLUSÃO ---
async function excluirUsuario(id, nome) {
  if (confirm(`Tem certeza que deseja excluir o registro de ${nome}?`)) {
    const { error } = await _supabase.from("validacoes").delete().eq("id", id);

    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      alert("Registro excluído com sucesso.");
      carregarDados(); 
    }
  }
}

function abrirModalEdicao(id, nome, cpf, escola, designado, cargo) {
  document.getElementById("editId").value = id;
  document.getElementById("editNome").value = nome;
  document.getElementById("editCpf").value = cpf;
  document.getElementById("editEscola").value = escola;
  document.getElementById("editDesignado").value = designado;
  document.getElementById("editCargo").value = cargo;

  const selectEscola = document.getElementById("editEscola");
  let opcaoExiste = Array.from(selectEscola.options).some(
    (op) => op.value === escola,
  );
  if (!opcaoExiste) {
    let opt = document.createElement("option");
    opt.value = escola;
    opt.innerHTML = escola;
    opt.selected = true;
    selectEscola.appendChild(opt);
  }

  document.getElementById("modalEdicao").classList.remove("hidden");
}

function fecharModal() {
  document.getElementById("modalEdicao").classList.add("hidden");
}

async function salvarEdicao(e) {
  e.preventDefault();

  const id = document.getElementById("editId").value;
  const btnSalvar = document.querySelector(".btn-save");
  const textoOriginal = btnSalvar.innerText;
  btnSalvar.innerText = "Salvando...";
  btnSalvar.disabled = true;

  const dadosAtualizados = {
    nome: document.getElementById("editNome").value.toUpperCase(),
    cpf: document.getElementById("editCpf").value.replace(/\D/g, ""),
    escola: document.getElementById("editEscola").value,
    designado: document.getElementById("editDesignado").value,
    cargo: document.getElementById("editCargo").value,
  };

  const { error } = await _supabase
    .from("validacoes")
    .update(dadosAtualizados)
    .eq("id", id);

  if (error) {
    alert("Erro ao atualizar: " + error.message);
  } else {
    alert("Registro atualizado com sucesso!");
    fecharModal();
    carregarDados(); 
  }

  btnSalvar.innerText = textoOriginal;
  btnSalvar.disabled = false;
}
