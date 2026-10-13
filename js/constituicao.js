"use strict";

/* ========== A CONSTITUIÇÃO DA ILHA (viva: cresce com as tuas decisões) ==========
   Monta-se a partir das respostas às perguntas (artigos), das decisões nos incidentes
   (jurisprudência) e das emendas. Pode ver-se a qualquer momento, imprimir (ou guardar em PDF),
   copiar ou descarregar em texto. */

const TITULOS_ARTIGOS = [
  "Quem manda",
  "Como se tomam as decisões",
  "Quem cria as regras",
  "O que acontece a quem não cumpre",
  "Como se distribui a comida",
  "Quem controla os recursos",
  "Quem pode participar nas decisões",
  "Como se resolvem os conflitos",
  "Como o grupo se organiza para sobreviver"
];

/* Devolve a Constituição como uma lista de secções: { titulo, linhas: [texto...] } */
function dadosConstituicao() {
  const gente = pessoas.length ? pessoas : [];
  const vivos = gente.filter(vivo).map((q) => q.nome);
  const mortos = gente.filter((q) => q.morto).map((q) => q.nome);
  const expulsos = gente.filter((q) => q.exilado).map((q) => q.nome);
  const secoes = [];

  secoes.push({
    titulo: "Preâmbulo",
    linhas: [`Nós, os sobreviventes do naufrágio, reunidos numa ilha sem governo, polícia nem moeda, ao fim de ${estado.dia} dias, estabelecemos esta Constituição para podermos viver juntos.`]
  });

  TITULOS_ARTIGOS.forEach((titulo, i) => {
    const c = estado.constituicao[i];
    const linhas = [];
    if (!c) {
      linhas.push("Ainda por decidir.");
    } else {
      linhas.push(`Decidiu-se: “${c.resposta}”.`);
      const temas = (c.resultado.temas || []).map((t) => NOME_TEMA[t]);
      if (temas.length) linhas.push(`Princípios reconhecidos: ${temas.join(", ")}.`);
      const reacoes = c.resultado.reacoes || [];
      const apoios = reacoes.filter((r) => r.tipo === "apoio").length;
      const revoltas = reacoes.filter((r) => r.tipo === "revolta").length;
      if (apoios || revoltas) linhas.push(`Reação da ilha: ${apoios} a favor, ${revoltas} contra.`);
    }
    secoes.push({ titulo: `Artigo ${i + 1}.º — ${titulo}`, linhas });
  });

  (estado.emendas || []).forEach((em, i) => {
    secoes.push({ titulo: `Emenda ${i + 1} — ${em.titulo || "alteração"} (dia ${em.dia})`, linhas: [em.texto] });
  });

  if (estado.casos.length) {
    secoes.push({ titulo: "Jurisprudência (casos julgados)", linhas: [] });
    estado.casos.forEach((c, i) => {
      const linhas = [c.caso, `Decisão: “${c.decisao}”.`];
      (c.consequencias || []).forEach((x) => linhas.push(x));
      secoes.push({ titulo: `Caso ${i + 1} (dia ${c.dia})`, linhas, sub: true });
    });
  }

  secoes.push({ titulo: "Como a Constituição funciona na prática", linhas: descreverRegime() });

  const estadoIlha = [
    `Sobreviventes: ${vivos.length}.`,
    `Comida: ${Math.round(estado.comida)}. Moral: ${Math.round(estado.moral)}.`
  ];
  if (mortos.length) estadoIlha.push(`Em memória de: ${mortos.join(", ")}.`);
  if (expulsos.length) estadoIlha.push(`Expulsos da ilha: ${expulsos.join(", ")}.`);
  secoes.push({ titulo: "Estado da ilha", linhas: estadoIlha });
  if (vivos.length) secoes.push({ titulo: "Assinam", linhas: [vivos.join(", ") + "."] });

  return secoes;
}

function textoConstituicao() {
  const partes = ["CONSTITUIÇÃO DA ILHA", `Dia ${estado.dia}`, "Grupo: ______________________", ""];
  dadosConstituicao().forEach((s) => {
    partes.push(s.sub ? s.titulo : s.titulo.toUpperCase());
    s.linhas.forEach((l) => partes.push(l));
    partes.push("");
  });
  return partes.join("\n");
}

/* ---------- ecrã ---------- */
const constit = {
  caixa: document.getElementById("const"),
  doc: document.getElementById("const-doc")
};

function renderConstituicao() {
  const novo2 = (tag, texto) => { const e = document.createElement(tag); e.textContent = texto; return e; };
  const itens = [novo2("h2", "Constituição da Ilha"), novo2("p", `Dia ${estado.dia}`), novo2("p", "Grupo: ______________________")];
  dadosConstituicao().forEach((s) => {
    itens.push(novo2(s.sub ? "h5" : "h4", s.titulo));
    s.linhas.forEach((l) => itens.push(novo2("p", l)));
  });
  constit.doc.replaceChildren(...itens);
}

function abrirConstituicao() {
  if (typeof introAtiva !== "undefined" && introAtiva) return;
  renderConstituicao();
  constit.caixa.hidden = false;
}
function fecharConstituicao() { constit.caixa.hidden = true; }

function feedbackBotao(id, texto) {
  const b = document.getElementById(id);
  const antigo = b.textContent;
  b.textContent = texto;
  setTimeout(() => { b.textContent = antigo; }, 1600);
}

document.getElementById("btn-const").addEventListener("click", abrirConstituicao);
document.getElementById("const-fechar").addEventListener("click", fecharConstituicao);
constit.caixa.addEventListener("click", (e) => { if (e.target === constit.caixa) fecharConstituicao(); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !constit.caixa.hidden) fecharConstituicao(); });

document.getElementById("const-imprimir").addEventListener("click", () => window.print());

document.getElementById("const-copiar").addEventListener("click", () => {
  const texto = textoConstituicao();
  const ok = () => feedbackBotao("const-copiar", "Copiado!");
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(texto).then(ok).catch(() => feedbackBotao("const-copiar", "Não foi possível"));
  } else {
    feedbackBotao("const-copiar", "Não foi possível");
  }
});

document.getElementById("const-descarregar").addEventListener("click", () => {
  const blob = new Blob([textoConstituicao()], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "constituicao-da-ilha.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});