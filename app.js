"use strict";

const storageKey = "mare-limpa.ocorrencias.v1";
const registration = document.querySelector("#form-registro");
const filters = document.querySelector("#filtros");
const reports = document.querySelector("#relatos");
const template = document.querySelector("#modelo-relato");
const empty = document.querySelector("#lista-vazia");
const feedback = document.querySelector("#feedback");
const storageError = document.querySelector("#erro-armazenamento");
const views = [...document.querySelectorAll(".view")];
const navLinks = [...document.querySelectorAll("nav a")];
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const fieldMessages = {
  praia: "Selecione uma praia.",
  categoria: "Selecione uma categoria.",
  trecho: "Informe o trecho ou ponto de referência.",
};

let activeView;

function exampleReports() {
  const examples = [
    ["Tambaú", "Em frente ao Busto de Tamandaré", "Plástico", "Sacolas e tampinhas junto à calçada.", "Registrada"],
    ["Cabo Branco", "Acesso à areia próximo à ciclovia", "Vidro", "Cacos na faixa de areia perto do acesso.", "Registrada"],
    ["Cabo Branco", "Trecho próximo à Praça de Iemanjá", "Metal", "Latas de bebida perto da calçada.", "Registrada"],
    ["Tambaú", "Faixa de areia perto da Feirinha de Tambaú", "Papel", "Embalagens de papel junto ao calçadão.", "Recolhida"],
  ];
  const now = Date.now();
  return examples.map(([praia, trecho, categoria, descricao, status], index) => ({
    id: `exemplo-${index + 1}`,
    praia, trecho, categoria, descricao, status,
    data: new Date(now - (index + 1) * 86_400_000).toISOString(),
    simulado: true,
  }));
}

const examples = exampleReports();

function readReports() {
  const stored = localStorage.getItem(storageKey);
  if (stored === null) {
    writeReports(examples);
    return examples;
  }

  const items = JSON.parse(stored);
  if (!Array.isArray(items)) throw new Error("Formato inválido.");
  return items;
}

function writeReports(items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

function showStorageError(message) {
  storageError.textContent = message;
}

function route() {
  const requested = location.hash.slice(1);
  const next = views.find((view) => view.id === requested) ?? views[0];

  if (next !== activeView) {
    feedback.textContent = "";
    storageError.textContent = "";
  }

  views.forEach((view) => { view.hidden = view !== next; });
  navLinks.forEach((link) => {
    if (link.hash === `#${next.id}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  if (next.id === "ocorrencias") renderReports();
  if (activeView && next !== activeView) {
    next.querySelector("h1").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  activeView = next;
}

function validateField(field) {
  const error = document.querySelector(`#erro-${field.name}`);
  const message = field.value.trim() ? "" : fieldMessages[field.name];
  const description = field.name === "trecho" ? ["ajuda-trecho"] : [];

  error.textContent = message;
  error.hidden = !message;
  if (message) {
    field.setAttribute("aria-invalid", "true");
    description.unshift(error.id);
  } else {
    field.removeAttribute("aria-invalid");
  }
  if (description.length) field.setAttribute("aria-describedby", description.join(" "));
  else field.removeAttribute("aria-describedby");
  return !message;
}

registration.addEventListener("input", ({ target }) => {
  if (target.hasAttribute("aria-invalid")) validateField(target);
});

registration.addEventListener("submit", (event) => {
  event.preventDefault();
  storageError.textContent = "";
  const requiredFields = [...registration.querySelectorAll("[required]")];
  const invalidFields = requiredFields.filter((field) => !validateField(field));
  if (invalidFields.length) {
    invalidFields[0].focus();
    return;
  }

  const values = new FormData(registration);
  const now = Date.now();
  const report = {
    id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(36).slice(2)}`,
    praia: values.get("praia"),
    trecho: values.get("trecho").trim(),
    categoria: values.get("categoria"),
    descricao: values.get("descricao").trim(),
    data: new Date(now).toISOString(),
    status: "Registrada",
    simulado: false,
  };

  try {
    writeReports([report, ...readReports()]);
  } catch {
    showStorageError("Não foi possível salvar. Verifique se o navegador permite armazenamento local e tente novamente.");
    return;
  }

  registration.reset();
  filters.reset();
  history.pushState(null, "", "#ocorrencias");
  route();
  feedback.textContent = "Ocorrência registrada com sucesso.";
});

function normalize(value) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
}

function createCard(item) {
  const card = template.content.firstElementChild.cloneNode(true);
  const collected = item.status === "Recolhida";
  card.dataset.id = item.id;
  card.querySelector(".report-beach").textContent = item.praia;
  card.querySelector(".report-place").textContent = item.trecho;

  const description = card.querySelector(".report-description");
  description.textContent = item.descricao;
  description.hidden = !item.descricao;

  const status = card.querySelector(".report-status");
  status.textContent = item.status;
  status.classList.toggle("collected", collected);
  card.querySelector(".report-category").textContent = item.categoria;
  card.querySelector(".report-example").hidden = !item.simulado;

  const time = card.querySelector("time");
  time.dateTime = item.data;
  time.textContent = dateFormat.format(new Date(item.data));
  const button = card.querySelector(".collect");
  button.hidden = collected;
  button.setAttribute("aria-label", `Marcar como recolhida: ${item.trecho}, ${item.praia}`);
  return card;
}

function renderReports() {
  let items;
  try {
    items = readReports();
  } catch {
    items = examples;
    showStorageError("Os dados salvos estão indisponíveis. A lista exibe apenas os dados simulados.");
  }
  const values = new FormData(filters);
  const beach = values.get("praia");
  const category = values.get("categoria");
  const status = values.get("status");
  const place = normalize(values.get("trecho").trim());
  const matches = items.filter((item) =>
    (!beach || item.praia === beach) &&
    (!category || item.categoria === category) &&
    (!status || item.status === status) &&
    (!place || normalize(item.trecho).includes(place))
  ).sort((first, second) => second.data.localeCompare(first.data));

  reports.replaceChildren(...matches.map(createCard));
  const count = matches.length;
  const counter = document.querySelector("#contagem");
  const countText = count === 1 ? "1 ocorrência" : `${count} ocorrências`;
  if (counter.textContent !== countText) counter.textContent = countText;
  empty.hidden = count > 0;
  if (count === 0) {
    document.querySelector("#titulo-vazio").textContent = items.length
      ? "Nenhuma ocorrência corresponde aos filtros."
      : "Nenhuma ocorrência registrada.";
    document.querySelector("#mensagem-vazio").textContent = items.length
      ? "Altere ou limpe os filtros para consultar outros relatos."
      : "Use o botão Registrar ocorrência para adicionar o primeiro relato.";
  }
}

function applyFilters() {
  feedback.textContent = "";
  renderReports();
}

filters.addEventListener("input", applyFilters);
filters.addEventListener("submit", (event) => event.preventDefault());
document.querySelector("#limpar-filtros").addEventListener("click", () => {
  filters.reset();
  applyFilters();
});

reports.addEventListener("click", (event) => {
  const button = event.target.closest(".collect");
  if (!button) return;
  const id = button.closest(".report").dataset.id;
  feedback.textContent = "";
  storageError.textContent = "";
  try {
    const current = readReports();
    writeReports(current.map((item) => item.id === id ? { ...item, status: "Recolhida" } : item));
  } catch {
    showStorageError("Não foi possível atualizar o status. Verifique o armazenamento local e tente novamente.");
    return;
  }

  renderReports();
  const updated = [...reports.children].find((card) => card.dataset.id === id);
  (updated?.querySelector(".report-place") ?? document.querySelector("#titulo-lista")).focus();
  feedback.textContent = "Ocorrência marcada como recolhida.";
});

document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#conteudo").focus();
});

window.addEventListener("hashchange", route);
window.addEventListener("storage", ({ key }) => {
  if ((key === storageKey || key === null) && activeView.id === "ocorrencias") renderReports();
});

document.querySelector("#trecho").setAttribute("aria-describedby", "ajuda-trecho");
try {
  readReports();
} catch {
  // A tela de ocorrências explica a indisponibilidade e exibe os exemplos.
}
route();

