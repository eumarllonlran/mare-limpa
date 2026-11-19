"use strict";

const chaveArmazenamento = "mare-limpa.ocorrencias.v1";
const formularioRegistro = document.querySelector("#form-registro");
const filtros = document.querySelector("#filtros");
const botaoFiltros = document.querySelector("#alternar-filtros");
const opcoesFiltros = document.querySelector("#opcoes-filtros");
const rotuloFiltros = document.querySelector("#rotulo-filtros");
const telaEstreita = window.matchMedia("(max-width: 760px)");
const listaRelatos = document.querySelector("#relatos");
const modeloRelato = document.querySelector("#modelo-relato");
const listaVazia = document.querySelector("#lista-vazia");
const retorno = document.querySelector("#retorno");
const erroArmazenamento = document.querySelector("#erro-armazenamento");
const telas = [...document.querySelectorAll(".tela")];
const linksNavegacao = [...document.querySelectorAll("nav a")];
const formatoData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const mensagensCampos = {
  praia: "Selecione uma praia.",
  categoria: "Selecione uma categoria.",
  trecho: "Informe o trecho ou ponto de referência.",
};

let telaAtiva;
let idNovoRelato;

function criarExemplos() {
  const exemplos = [
    ["Tambaú", "Em frente ao Busto de Tamandaré", "Plástico", "Sacolas e tampinhas junto à calçada.", "Registrada"],
    ["Cabo Branco", "Acesso à areia próximo à ciclovia", "Vidro", "Cacos na faixa de areia perto do acesso.", "Registrada"],
    ["Cabo Branco", "Trecho próximo à Praça de Iemanjá", "Metal", "Latas de bebida perto da calçada.", "Registrada"],
    ["Tambaú", "Faixa de areia perto da Feirinha de Tambaú", "Papel", "Embalagens de papel junto ao calçadão.", "Recolhida"],
  ];
  const agora = Date.now();
  return exemplos.map(([praia, trecho, categoria, descricao, status], indice) => ({
    id: `exemplo-${indice + 1}`,
    praia, trecho, categoria, descricao, status,
    data: new Date(agora - (indice + 1) * 86_400_000).toISOString(),
    simulado: true,
  }));
}

const exemplos = criarExemplos();

function lerRelatos() {
  const salvo = localStorage.getItem(chaveArmazenamento);
  if (salvo === null) {
    salvarRelatos(exemplos);
    return exemplos;
  }

  const itens = JSON.parse(salvo);
  if (!Array.isArray(itens)) throw new Error("Formato inválido.");
  return itens;
}

function salvarRelatos(itens) {
  localStorage.setItem(chaveArmazenamento, JSON.stringify(itens));
}

function mostrarErroArmazenamento(mensagem) {
  erroArmazenamento.textContent = mensagem;
}

function navegar() {
  const solicitada = location.hash.slice(1);
  const proxima = telas.find((tela) => tela.id === solicitada) ?? telas[0];

  if (proxima !== telaAtiva) {
    retorno.textContent = "";
    erroArmazenamento.textContent = "";
    if (proxima.id !== "ocorrencias") idNovoRelato = null;
  }

  telas.forEach((tela) => { tela.hidden = tela !== proxima; });
  linksNavegacao.forEach((link) => {
    if (link.hash === `#${proxima.id}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  if (proxima.id === "ocorrencias") mostrarRelatos();
  if (telaAtiva && proxima !== telaAtiva) {
    proxima.querySelector("h1").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  telaAtiva = proxima;
}

function validarCampo(campo) {
  const erro = document.querySelector(`#erro-${campo.name}`);
  const mensagem = campo.value.trim() ? "" : mensagensCampos[campo.name];
  const descricao = campo.name === "trecho" ? ["ajuda-trecho"] : [];

  erro.textContent = mensagem;
  erro.hidden = !mensagem;
  if (mensagem) {
    campo.setAttribute("aria-invalid", "true");
    descricao.unshift(erro.id);
  } else {
    campo.removeAttribute("aria-invalid");
  }
  if (descricao.length) campo.setAttribute("aria-describedby", descricao.join(" "));
  else campo.removeAttribute("aria-describedby");
  return !mensagem;
}

formularioRegistro.addEventListener("input", ({ target }) => {
  if (target.hasAttribute("aria-invalid")) validarCampo(target);
});

formularioRegistro.addEventListener("submit", (evento) => {
  evento.preventDefault();
  erroArmazenamento.textContent = "";
  const camposObrigatorios = [...formularioRegistro.querySelectorAll("[required]")];
  const camposInvalidos = camposObrigatorios.filter((campo) => !validarCampo(campo));
  if (camposInvalidos.length) {
    camposInvalidos[0].focus();
    return;
  }

  const valores = new FormData(formularioRegistro);
  const agora = Date.now();
  const relato = {
    id: globalThis.crypto?.randomUUID?.() ?? `${agora}-${Math.random().toString(36).slice(2)}`,
    praia: valores.get("praia"),
    trecho: valores.get("trecho").trim(),
    categoria: valores.get("categoria"),
    descricao: valores.get("descricao").trim(),
    data: new Date(agora).toISOString(),
    status: "Registrada",
    simulado: false,
  };

  try {
    salvarRelatos([relato, ...lerRelatos()]);
  } catch {
    mostrarErroArmazenamento("Não foi possível salvar. Verifique se o navegador permite armazenamento local e tente novamente.");
    return;
  }

  formularioRegistro.reset();
  filtros.reset();
  idNovoRelato = relato.id;
  abrirPainelFiltros(!telaEstreita.matches);
  history.pushState(null, "", "#ocorrencias");
  navegar();
  retorno.textContent = `Ocorrência registrada com sucesso. ${relato.trecho} · ${relato.praia}.`;
});

function normalizar(valor) {
  return valor.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
}

function criarCartao(item) {
  const cartao = modeloRelato.content.firstElementChild.cloneNode(true);
  const recolhido = item.status === "Recolhida";
  const ehNovo = item.id === idNovoRelato;
  cartao.dataset.id = item.id;
  cartao.classList.toggle("novo", ehNovo);
  cartao.querySelector(".relato-novo").hidden = !ehNovo;
  cartao.querySelector(".relato-praia").textContent = item.praia;
  cartao.querySelector(".relato-trecho").textContent = item.trecho;

  const descricao = cartao.querySelector(".relato-descricao");
  descricao.textContent = item.descricao;
  descricao.hidden = !item.descricao;

  const status = cartao.querySelector(".relato-status");
  status.textContent = item.status;
  status.classList.toggle("recolhida", recolhido);
  cartao.querySelector(".relato-categoria").textContent = item.categoria;
  cartao.querySelector(".relato-exemplo").hidden = !item.simulado;

  const horario = cartao.querySelector("time");
  horario.dateTime = item.data;
  horario.textContent = formatoData.format(new Date(item.data));
  const botao = cartao.querySelector(".recolher");
  botao.hidden = recolhido;
  botao.setAttribute("aria-label", `Marcar como recolhida: ${item.trecho}, ${item.praia}`);
  return cartao;
}

function mostrarRelatos() {
  let itens;
  try {
    itens = lerRelatos();
  } catch {
    itens = exemplos;
    mostrarErroArmazenamento("Os dados salvos estão indisponíveis. A lista exibe apenas os dados simulados.");
  }
  const valores = new FormData(filtros);
  const filtroPraia = valores.get("praia");
  const filtroCategoria = valores.get("categoria");
  const status = valores.get("status");
  const filtroTrecho = normalizar(valores.get("trecho").trim());
  const filtrosAtivos = [filtroPraia, filtroCategoria, status].filter(Boolean).length;
  rotuloFiltros.textContent = filtrosAtivos ? `Filtros (${filtrosAtivos})` : "Filtros";
  const resultados = itens.filter((item) =>
    (!filtroPraia || item.praia === filtroPraia) &&
    (!filtroCategoria || item.categoria === filtroCategoria) &&
    (!status || item.status === status) &&
    (!filtroTrecho || normalizar(item.trecho).includes(filtroTrecho))
  ).sort((primeiro, segundo) => segundo.data.localeCompare(primeiro.data));

  listaRelatos.replaceChildren(...resultados.map(criarCartao));
  const quantidade = resultados.length;
  const contador = document.querySelector("#contagem");
  const textoContagem = quantidade === 1 ? "1 ocorrência" : `${quantidade} ocorrências`;
  if (contador.textContent !== textoContagem) contador.textContent = textoContagem;
  listaVazia.hidden = quantidade > 0;
  if (quantidade === 0) {
    document.querySelector("#titulo-vazio").textContent = itens.length
      ? "Nenhuma ocorrência corresponde aos filtros."
      : "Nenhuma ocorrência registrada.";
    document.querySelector("#mensagem-vazio").textContent = itens.length
      ? "Altere ou limpe os filtros para consultar outros relatos."
      : "Use o botão Registrar ocorrência para adicionar o primeiro relato.";
  }
}

function aplicarFiltros() {
  retorno.textContent = "";
  mostrarRelatos();
}

function abrirPainelFiltros(aberto) {
  opcoesFiltros.hidden = !aberto;
  botaoFiltros.setAttribute("aria-expanded", String(aberto));
}

function ajustarFiltros() {
  const estavaNoBotao = document.activeElement === botaoFiltros;
  abrirPainelFiltros(!telaEstreita.matches || opcoesFiltros.contains(document.activeElement));
  botaoFiltros.hidden = !telaEstreita.matches;
  if (estavaNoBotao && botaoFiltros.hidden) opcoesFiltros.querySelector("select").focus();
}

telaEstreita.addEventListener("change", ajustarFiltros);
ajustarFiltros();
botaoFiltros.addEventListener("click", () => abrirPainelFiltros(opcoesFiltros.hidden));

filtros.addEventListener("input", aplicarFiltros);
filtros.addEventListener("submit", (evento) => evento.preventDefault());
document.querySelector("#limpar-filtros").addEventListener("click", () => {
  filtros.reset();
  aplicarFiltros();
});

listaRelatos.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".recolher");
  if (!botao) return;
  const id = botao.closest(".relato").dataset.id;
  retorno.textContent = "";
  erroArmazenamento.textContent = "";
  let relato;
  try {
    const atuais = lerRelatos();
    relato = atuais.find((item) => item.id === id);
    if (relato) {
      relato.status = "Recolhida";
      salvarRelatos(atuais);
    }
  } catch {
    mostrarErroArmazenamento("Não foi possível atualizar o status. Verifique o armazenamento local e tente novamente.");
    return;
  }

  if (idNovoRelato === id) idNovoRelato = null;
  mostrarRelatos();
  retorno.textContent = relato
    ? `Ocorrência marcada como recolhida. ${relato.trecho} · ${relato.praia}.`
    : "Esta ocorrência já não consta na lista.";
  const atualizado = [...listaRelatos.children].find((cartao) => cartao.dataset.id === id);
  if (atualizado) {
    const confirmacao = document.createElement("span");
    confirmacao.className = "confirmacao-recolhimento";
    confirmacao.textContent = "Recolhimento confirmado";
    confirmacao.tabIndex = -1;
    atualizado.querySelector(".recolher").after(confirmacao);
    confirmacao.focus({ preventScroll: true });
    confirmacao.scrollIntoView({ block: "nearest" });
  } else {
    retorno.focus({ preventScroll: true });
    retorno.scrollIntoView({ block: "nearest" });
  }
});

document.querySelector(".link-pular").addEventListener("click", (evento) => {
  evento.preventDefault();
  document.querySelector("#conteudo").focus();
});

window.addEventListener("hashchange", navegar);
window.addEventListener("storage", ({ key }) => {
  if ((key === chaveArmazenamento || key === null) && telaAtiva.id === "ocorrencias") mostrarRelatos();
});

try {
  lerRelatos();
} catch {
  // A tela de ocorrências explica a indisponibilidade e exibe os exemplos.
}
navegar();
