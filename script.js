const SUPABASE_URL = "https://rfnbyzehscgxdoxdjwwp.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbmJ5emVoc2NneGRveGRqd3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODQ4ODMsImV4cCI6MjA4NTg2MDg4M30.MpMsvr_2Ijo-OOgj8wqPGcRGjZ-vC_f_xzG-ItnHt_M";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const formElement = document.getElementById("seiForm");

if (formElement) {
  const maskNumbers = (v) => v.replace(/\D/g, "");

  document.getElementById("cpf").addEventListener("input", (e) => {
    let v = maskNumbers(e.target.value).slice(0, 11);
    v = v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    e.target.value = v;
  });

  document.getElementById("rg").addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase().slice(0, 12);
  });

  formElement.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.querySelector(".btn-glow");
    const originalText = btn.innerText;
    btn.innerText = "Salvando...";
    btn.disabled = true;

    const dados = {
      nome: document.getElementById("nome").value.toUpperCase(),
      cpf: maskNumbers(document.getElementById("cpf").value),
      rg: document.getElementById("rg").value,
      email: document.getElementById("email").value,
      origem: document.getElementById("origem").value,
      escola: document.getElementById("escola").value,
      designado: document.getElementById("designado").value,
      cargo: document.getElementById("cargo").value,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await _supabase.from("validacoes").insert([dados]);
      if (error) throw error;
      alert("Cadastro realizado com sucesso via " + dados.origem + "!");
      formElement.reset();
    } catch (error) {
      alert("Erro: " + error.message);
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  });
}

const tabelaElement = document.getElementById("tabelaDados");

if (tabelaElement) {
  const urlParams = new URLSearchParams(window.location.search);
  const viewAtual = urlParams.get("view") || "geral";

  const titles = {
    geral: "Visão Geral",
    gabinete: "Painel Gabinete",
    seape: "Painel Seape",
  };
  document.getElementById("pageTitle").innerText = titles[viewAtual];
  document.getElementById("filtroAtivoTexto").innerText =
    viewAtual === "geral" ? "Todos os Setores" : "Setor: " + viewAtual;

  document
    .querySelectorAll(".sidebar nav a")
    .forEach((a) => a.classList.remove("active"));
  const linkId =
    "link" + viewAtual.charAt(0).toUpperCase() + viewAtual.slice(1);
  if (document.getElementById(linkId))
    document.getElementById(linkId).classList.add("active");

  document.addEventListener("DOMContentLoaded", () => carregarDados(viewAtual));
  document
    .getElementById("search")
    .addEventListener("keyup", filtrarLocalmente);
  document
    .getElementById("filtroCargo")
    .addEventListener("change", filtrarLocalmente);

  const formEdicao = document.getElementById("formEdicao");
  if (formEdicao) formEdicao.addEventListener("submit", salvarEdicao);
}

async function carregarDados(view) {
  const tbody = document.getElementById("tabelaDados");
  tbody.innerHTML =
    "<tr><td colspan='7' style='text-align:center; padding:20px;'>Carregando...</td></tr>";
  let query = _supabase
    .from("validacoes")
    .select("*")
    .order("created_at", { ascending: false });
  if (view !== "geral") {
    const origemCapitalizada = view.charAt(0).toUpperCase() + view.slice(1);
    query = query.eq("origem", origemCapitalizada);
  }
  const { data, error } = await query;
  if (error) {
    console.error(error);
    tbody.innerHTML =
      "<tr><td colspan='7' style='color:red; text-align:center'>Erro.</td></tr>";
    return;
  }
  atualizarStats(data);
  renderizarTabela(data);
}

function atualizarStats(data) {
  if (!data) return;
  const count = (filterFn) => data.filter(filterFn).length;
  document.getElementById("statDesignados").innerText = count(
    (d) => d.designado === "Designado",
  );
  document.getElementById("statCessados").innerText = count(
    (d) => d.designado === "Cessado",
  );
  document.getElementById("statDiretores").innerText = count(
    (d) => d.cargo === "Diretor",
  );
  document.getElementById("statVices").innerText = count(
    (d) => d.cargo === "Vice Diretor",
  );
  document.getElementById("statCoordenadores").innerText = count(
    (d) => d.cargo === "Coordenador",
  );
  document.getElementById("statAOE").innerText = count(
    (d) => d.cargo === "Agente Organizacional",
  );
}

function renderizarTabela(data) {
  const tbody = document.getElementById("tabelaDados");
  tbody.innerHTML = "";
  if (data.length === 0) {
    tbody.innerHTML =
      "<tr><td colspan='7' style='text-align:center; padding:20px;'>Nenhum registro.</td></tr>";
    return;
  }

  data.forEach((item) => {
    const cpfVisual = item.cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "***.$2.$3-$4",
    );
    const iniciais = item.nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const origemClass =
      item.origem === "Seape" ? "origem-seape" : "origem-gabinete";
    const statusClass =
      item.designado === "Designado" ? "badge active" : "badge inactive";

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><span class="origem-tag ${origemClass}">${item.origem || "N/A"}</span></td>
        <td><div style="display:flex; align-items:center; gap:10px;"><div style="width:30px; height:30px; background:#eee; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:11px; font-weight:bold;">${iniciais}</div><span style="font-weight:600;">${item.nome}</span></div></td>
        <td><div style="font-size:11px; color:#777;">CPF: ${cpfVisual}</div><div style="font-size:11px; color:#777;">RG: ${item.rg || "-"}</div></td>
        <td>${item.escola}</td><td>${item.cargo}</td><td><span class="${statusClass}">${item.designado}</span></td>
        <td><button onclick="abrirEdicao('${item.id}', '${item.nome}', '${item.cpf}', '${item.rg}', '${item.email}', '${item.origem}', '${item.escola}', '${item.designado}', '${item.cargo}')" style="border:none; background:transparent; cursor:pointer; color:var(--color-royal);"><i class='bx bx-edit'></i></button><button onclick="excluir('${item.id}')" style="border:none; background:transparent; cursor:pointer; color:var(--color-red);"><i class='bx bx-trash'></i></button></td>
    `;
    tbody.appendChild(tr);
  });
}

function filtrarLocalmente() {
  const termo = document.getElementById("search").value.toLowerCase();
  const cargo = document.getElementById("filtroCargo").value;
  const linhas = document.querySelectorAll("#tabelaDados tr");
  linhas.forEach((tr) => {
    if (tr.cells.length < 2) return;
    const texto = tr.innerText.toLowerCase();
    const cargoLinha = tr.cells[4].innerText;
    const matchSearch = texto.includes(termo);
    const matchCargo = cargo === "" || cargoLinha === cargo;
    tr.style.display = matchSearch && matchCargo ? "" : "none";
  });
}

async function excluir(id) {
  if (confirm("Excluir registro?")) {
    await _supabase.from("validacoes").delete().eq("id", id);
    location.reload();
  }
}

function abrirEdicao(
  id,
  nome,
  cpf,
  rg,
  email,
  origem,
  escola,
  designado,
  cargo,
) {
  document.getElementById("editId").value = id;
  document.getElementById("editNome").value = nome;
  document.getElementById("editCpf").value = cpf;
  document.getElementById("editRg").value =
    rg !== "undefined" && rg !== "null" ? rg : "";
  document.getElementById("editEmail").value =
    email !== "undefined" && email !== "null" ? email : "";
  document.getElementById("editOrigem").value = origem || "Gabinete";
  document.getElementById("editDesignado").value = designado;
  document.getElementById("editCargo").value = cargo;

  const selEscola = document.getElementById("editEscola");
  let existe = false;
  for (let i = 0; i < selEscola.options.length; i++)
    if (selEscola.options[i].value === escola) existe = true;
  if (!existe) {
    let opt = document.createElement("option");
    opt.value = escola;
    opt.innerHTML = escola;
    selEscola.appendChild(opt);
  }
  selEscola.value = escola;

  document.getElementById("modalEdicao").classList.remove("hidden");
}

function fecharModal() {
  document.getElementById("modalEdicao").classList.add("hidden");
}

async function salvarEdicao(e) {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  const btnSave = document.querySelector("#formEdicao .btn-save");
  btnSave.innerText = "Salvando...";
  btnSave.disabled = true;

  const dados = {
    nome: document.getElementById("editNome").value.toUpperCase(),
    cpf: document.getElementById("editCpf").value.replace(/\D/g, ""),
    rg: document.getElementById("editRg").value,
    email: document.getElementById("editEmail").value,
    origem: document.getElementById("editOrigem").value,
    designado: document.getElementById("editDesignado").value,
    escola: document.getElementById("editEscola").value,
    cargo: document.getElementById("editCargo").value,
  };

  const { error } = await _supabase
    .from("validacoes")
    .update(dados)
    .eq("id", id);
  if (error) alert("Erro: " + error.message);
  else {
    alert("Atualizado!");
    location.reload();
  }
  btnSave.innerText = "Salvar Alterações";
  btnSave.disabled = false;
}

const menuBtn = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("sidebarOverlay");

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  });
}
