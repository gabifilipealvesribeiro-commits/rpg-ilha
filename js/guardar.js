"use strict";

const CHAVE_SAVE = "ilha25_save_v1";

function guardarJogo() {
  try {
    const dados = {
      estado,
      modo,
      diasRestantes,
      incidente,
      situacaoId: situacaoAtual ? situacaoAtual.id : null,
      relacoes: RELACOES,
      pessoas: pessoas.map((q) => ({
        nome: q.nome,
        vida: q.vida,
        fome: q.fome,
        moralInd: q.moralInd,
        morto: !!q.morto,
        exilado: !!q.exilado,
        desmaiado: !!q.desmaiado,
        metab: q.metab,
        causa: q.causa,
        lug: q.lug,
        jx: q.jx,
        jy: q.jy
      }))
    };
    localStorage.setItem(CHAVE_SAVE, JSON.stringify(dados));
  } catch (e) {
    console.warn("Não foi possível guardar o jogo:", e);
  }
}

function lerSave() {
  try {
    const bruto = localStorage.getItem(CHAVE_SAVE);
    if (!bruto) return null;
    const salvo = JSON.parse(bruto);
    if (!salvo || !salvo.estado || !Array.isArray(salvo.pessoas)) return null;
    return salvo;
  } catch (e) {
    return null;
  }
}

function apagarSave() {
  try {
    localStorage.removeItem(CHAVE_SAVE);
  } catch (e) {
    console.warn("Erro ao apagar gravação:", e);
  }
}

function restaurarSave(salvo) {
  Object.assign(estado, salvo.estado);
  if (salvo.relacoes) {
    Object.keys(salvo.relacoes).forEach((k) => {
      if (RELACOES[k]) RELACOES[k] = salvo.relacoes[k];
    });
  }
  salvo.pessoas.forEach((sp, i) => {
    const q = pessoas.find((p) => p.nome === sp.nome) || pessoas[i];
    if (!q) return;
    Object.assign(q, sp);
  });
}

function entrarPraiaDireto() {
  introAtiva = false;
  document.querySelector(".jogo").classList.remove("intro");
  narracaoPraiaIdx = NARRACAO_PRAIA.length - 1;
  iniciarPraia(performance.now() - CHEGADA_FIM);
  pessoas.forEach((q) => {
    q.atraso = 0;
    q.x = q.alvoX;
    q.y = q.alvoY;
  });
}

function retomarModo(salvo) {
  if (salvo.modo === "incidente" && salvo.incidente) {
    modo = "incidente";
    incidente = salvo.incidente;
    diasRestantes = salvo.diasRestantes ?? 0;
    el.avancar.hidden = true;
    mostrarIncidente();
  } else if (salvo.modo === "dias") {
    iniciarDias(salvo.diasRestantes || DIAS_POR_PERGUNTA);
  } else {
    mostrarPergunta(salvo.situacaoId);
  }
}

document.getElementById("btn-novo")?.addEventListener("click", () => {
  if (modo !== "fim" && !window.confirm("Queres mesmo começar um novo jogo do zero?")) return;
  apagarSave();
  window.location.reload();
});