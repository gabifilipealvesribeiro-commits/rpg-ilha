"use strict";

/* ========== O REGIME: a Constituição manda na ilha ==========
   Os artigos (as 9 respostas iniciais) deixam de ser só um documento:
   - cada sobrevivente gosta ou não do que ficou escrito, e isso mexe no humor dele todos os dias;
   - alguns artigos mudam as regras do jogo (castigos, mediação, partilha, mérito);
   - nos incidentes, a ilha lembra-te o artigo que se aplica, e a "legitimidade" sobe se o respeitares
     e desce se o violares;
   - se escreveres o nome de alguém no artigo sobre quem manda, essa pessoa torna-se o líder. */

/* artigos (posição 0 a 8) que se aplicam a cada incidente, do mais para o menos importante */
const ARTIGOS_DO_INCIDENTE = { luta: [7, 3], roubo: [3, 4], desmaio: [4], mexerico: [7] };

function temasDoArtigo(i) { return estado.constituicao[i]?.resultado?.temas ?? []; }
function artigoTem(i, tema) { return temasDoArtigo(i).includes(tema); }
function temasDaConstituicao() { return estado.constituicao.flatMap((c) => c.resultado?.temas ?? []); }

/* os artigos aplicáveis que já foram decididos */
function artigosDoIncidente(tipo) {
  return (ARTIGOS_DO_INCIDENTE[tipo] ?? []).filter((n) => estado.constituicao[n]);
}

function citarArtigoDoIncidente(tipo) {
  return artigosDoIncidente(tipo)
    .map((i) => `A Constituição (Art. ${i + 1}.º — ${TITULOS_ARTIGOS[i]}) diz: “${estado.constituicao[i].resposta}”.`)
    .join("\n");
}

/* o que a Constituição muda nas regras do jogo */
function modificadoresDoRegime() {
  return {
    dissuasao: artigoTem(3, "castigo") ? 0.7 : 1,               // castigos a sério fazem pensar duas vezes
    decaimentoTensao: artigoTem(7, "dialogo") ? 0.4 : 0.2,      // a mediação acalma as brigas mais depressa
    ajusteFome: artigoTem(4, "partilha") ? -1 : 0,              // partilhar a comida deixa a ilha menos esfomeada
    producaoExtra: artigoTem(4, "merito") || artigoTem(8, "merito") ? 0.3 : 0
  };
}

/* -2 a +2: quanto cada um gosta (ou não) do que está na Constituição, por dia */
function satisfacaoComAConstituicao(q) {
  const perfil = PERFIS[q.nome];
  if (!perfil) return 0;
  const temas = temasDaConstituicao();
  const gosta = temas.filter((t) => perfil.gosta.includes(t)).length;
  const odeia = temas.filter((t) => perfil.odeia.includes(t)).length;
  return Math.max(-2, Math.min(2, Math.round((gosta - odeia) / 2)));
}

function descricaoSatisfacao(q) {
  if (!estado.constituicao.length) return "ainda sem opinião";
  const s = satisfacaoComAConstituicao(q);
  if (s > 0) return `satisfeito com as regras (+${s})`;
  if (s < 0) return `descontente com as regras (${s})`;
  return "indiferente às regras";
}

/* Quem manda: se o artigo 1 nomear alguém, é essa pessoa; senão, alguém que goste de autoridade */
function detetarLider(resposta, resultado) {
  const txt = normalizar(resposta);
  const citado = pessoas.find((q) => new RegExp(`\\b${normalizar(q.nome)}\\b`).test(txt));
  if (citado) return citado.nome;
  if (!resultado.temas.includes("autoridade")) return null;
  const candidatos = pessoas.filter((q) => vivo(q) && (PERFIS[q.nome]?.gosta ?? []).includes("autoridade"));
  return baralhar(candidatos)[0]?.nome ?? null;
}

/* Depois da tua reação a um incidente: respeitaste ou violaste a tua própria Constituição?
   Basta respeitares um dos artigos que se aplicam. */
function avaliarConstituicao(inc, r, extras) {
  const aplicaveis = artigosDoIncidente(inc.tipo).filter((i) => temasDoArtigo(i).length);
  if (!aplicaveis.length) return;
  const legit = estado.legitimidade ?? 50;
  const respeitado = aplicaveis.find((i) => r.temas.some((t) => temasDoArtigo(i).includes(t)));
  if (respeitado !== undefined) {
    estado.legitimidade = limitar(legit + 4);
    r.moral += 2;
    extras.push(`Respeitaste o Artigo ${respeitado + 1}.º da Constituição. A ilha confia mais em ti.`);
    return;
  }
  const art = `${aplicaveis[0] + 1}.º`;
  if (!r.temas.length) {
    estado.legitimidade = limitar(legit - 3);
    extras.push(`Não reagiste, apesar de o Artigo ${art} dizer o que fazer.`);
    return;
  }
  estado.legitimidade = limitar(legit - 6);
  r.moral -= 3;
  extras.push(`Violaste o Artigo ${art} da tua própria Constituição. A ilha reparou.`);
  const regra = temasDoArtigo(aplicaveis[0]);
  pessoas.filter(vivo).filter((q) => regra.some((tm) => (PERFIS[q.nome]?.gosta ?? []).includes(tm))).forEach((q) => {
    q.moralInd = limitar(q.moralInd - 5);   // quem gostava da regra sente-se traído
  });
}

/* texto para a Constituição: como ela funciona na prática */
function descreverRegime() {
  const m = modificadoresDoRegime();
  const linhas = [];
  if (estado.lider) linhas.push(`Líder da ilha: ${estado.lider}.`);
  linhas.push(`Legitimidade da Constituição: ${Math.round(estado.legitimidade ?? 50)} em 100.`);
  if (m.dissuasao < 1) linhas.push("Os castigos previstos fazem pensar duas vezes antes de brigar.");
  if (m.decaimentoTensao > 0.2) linhas.push("A mediação de conflitos acalma as brigas mais depressa.");
  if (m.ajusteFome < 0) linhas.push("A partilha da comida deixa a ilha menos esfomeada.");
  if (m.producaoExtra > 0) linhas.push("O mérito de quem trabalha aumenta a comida produzida.");
  return linhas;
}