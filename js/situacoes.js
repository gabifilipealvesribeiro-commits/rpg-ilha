"use strict";

/* ========== SITUAÇÕES: o que a ilha te pergunta depois das 9 perguntas base ==========
   Escolhem-se conforme o estado da ilha (comida, moral, mortos, tensões, tempo...), por isso o jogo
   nunca acaba sozinho: cada decisão passa a ser uma emenda à Constituição.
   Campos: cond = quando pode acontecer; peso = probabilidade relativa; cooldown = dias até poder repetir;
           aoIgnorar = o que acontece se a resposta não disser nada que a ilha perceba. */

/* se a resposta ao barco disser isto, a ilha é resgatada e o jogo termina */
const RESGATE = /resgat|pedir ajuda|sinal|socorro|sair da ilha|voltar para casa|ir embora|fogueira/;

const SITUACOES = [
  {
    id: "escassez", titulo: "A comida está a acabar", peso: 5, cooldown: 6,
    texto: "Os armazéns estão quase vazios e 25 estômagos não se calam. O que fazem? (racionar, pescar mais, explorar a ilha...)",
    cond: () => estado.comida < 35,
    aoIgnorar: () => { estado.moral = limitar(estado.moral - 5); estado.comida = limitar(estado.comida - 5); }
  },
  {
    id: "desanimo", titulo: "A ilha está desanimada", peso: 4, cooldown: 7,
    texto: "Ninguém sorri há dias, e até as palmeiras parecem tristes. Como levantam o moral?",
    cond: () => estado.moral < 30,
    aoIgnorar: () => { estado.moral = limitar(estado.moral - 5); }
  },
  {
    id: "descredito", titulo: "A ilha deixou de acreditar nas regras", peso: 6, cooldown: 8, ganhoLegitimidade: 12,
    texto: "Ninguém cumpre a Constituição que escreveram, e há quem ria quando a lêem em voz alta. Como recuperas a confiança?",
    cond: () => (estado.legitimidade ?? 50) < 25,
    aoIgnorar: () => { estado.legitimidade = limitar((estado.legitimidade ?? 50) - 5); }
  },
  {
    id: "luto", titulo: "Já perdemos gente", peso: 3, cooldown: 12,
    texto: "Há cruzes na areia e o silêncio pesa. Como honram os mortos, e como evitam que morra mais alguém?",
    cond: () => pessoas.filter((q) => q.morto).length >= 2
  },
  {
    id: "abundancia", titulo: "Comida a mais", peso: 3, cooldown: 8,
    texto: "Os armazéns estão cheios, e já há quem queira o excedente só para si. O que fazem com ele? (guardar, trocar, fazer uma festa...)",
    cond: () => estado.comida > 85
  },
  {
    id: "moeda", titulo: "Alguém propôs uma moeda", peso: 3, cooldown: 30,
    texto: "Alguém já anda a fazer conchas com o seu próprio retrato. Aceitam criar uma moeda? Como funcionaria?",
    cond: () => estado.dia > 12
  },
  {
    id: "eleicoes", titulo: "Mudar quem manda?", peso: 3, cooldown: 25,
    texto: "Passou muito tempo desde a primeira decisão sobre quem manda. Mantêm tudo como está, ou mudam? Como?",
    cond: () => estado.dia > 18
  },
  {
    id: "divisao", titulo: "A ilha está dividida", peso: 5, cooldown: 10,
    texto: "Há dois grupos que já nem se cumprimentam. Como evitam uma guerra civil?",
    cond: () => Object.values(estado.tensao).filter((v) => v >= 2).length >= 2,
    aoIgnorar: () => { Object.keys(estado.tensao).forEach((k) => { if (estado.tensao[k] >= 2) estado.tensao[k] += 1; }); }
  },
  {
    id: "doenca", titulo: "Uma doença espalha-se", peso: 2, cooldown: 20,
    texto: "Há quem tussa, e quem jure que são só cocos mal digeridos. Como lidam com a doença?",
    cond: () => estado.dia > 8,
    aoIgnorar: () => { pessoas.filter(vivo).forEach((q) => { q.vida = Math.max(0, q.vida - 10); }); }
  },
  {
    id: "tempestade", titulo: "Vem aí uma tempestade", peso: 2, cooldown: 14,
    texto: "O céu escurece (outra vez!). Como se preparam para a tempestade?",
    cond: () => estado.dia > 5,
    aoIgnorar: () => { estado.comida = limitar(estado.comida - 8); }
  },
  {
    id: "cabana", titulo: "Descoberta na ilha", peso: 2, cooldown: 40,
    texto: "Alguém encontrou uma cabana abandonada... com um bar lá dentro. Sim, um bar. O que fazem com ela?",
    cond: () => estado.dia > 10
  },
  {
    id: "barco", titulo: "Um barco ao longe", peso: 2, cooldown: 25,
    texto: "Um veleiro passa no horizonte. Pedem resgate, ou preferem ficar na ilha que construíram?",
    cond: () => estado.dia > 25
  },
  {
    id: "lei", titulo: "Uma lei nova", peso: 1, cooldown: 4,
    texto: "Há quem queira propor uma nova lei (ou mudar uma antiga). Qual é a proposta, e porquê?",
    cond: () => true
  }
];

/* Escolhe a próxima situação, ao acaso, entre as que fazem sentido agora */
function escolherSituacao() {
  const dia = estado.dia;
  const elegiveis = SITUACOES.filter((s) =>
    s.cond() && dia - (estado.ultimaSituacao[s.id] === undefined ? -999 : estado.ultimaSituacao[s.id]) >= s.cooldown && s.id !== estado.ultimaSituacaoId);
  const lista = elegiveis.length ? elegiveis : [SITUACOES.at(-1)];
  let r = sorte() * lista.reduce((a, s) => a + s.peso, 0);
  for (const s of lista) { r -= s.peso; if (r <= 0) return s; }
  return lista[0];
}

function situacaoPorId(id) { return SITUACOES.find((s) => s.id === id) || null; }