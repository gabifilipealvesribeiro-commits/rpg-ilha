"use strict";

/* ========== EVENTOS DA ILHA ==========
   Corre uma vez por dia e decide: fome e vida, desmaios, amigos que ajudam,
   discussões e lutas entre rivais, mortes, mexericos e incidentes que pedem uma decisão tua. */

const FALAS_DISCUSSAO = [
  "Tu nunca percebes nada!",
  "Não me venhas com essas!",
  "Isso é o que tu dizes!",
  "Já chega desta conversa!",
  "Quem te pediu opinião?"
];
const FALAS_LUTA = ["Vem cá, se és capaz!", "Toma!", "Isto acaba já!", "Larga-me!"];
const FALAS_DESMAIO = ["Estou a ver estrelas...", "Está tudo a andar à roda...", "Só... um bocadinho... de pão..."];
const FALAS_MEXERICO = [
  "Não digo nada, mas {B} não é flor que se cheire.",
  "Já viram o que {B} anda a fazer?",
  "{B} acha-se o chefe da ilha!",
  "Cuidado com {B}, anda a tramar alguma coisa.",
  "{B} não faz nada o dia todo.",
  "Ninguém aguenta {B}."
];
const FLAVOR_DIA = [
  "Um dia tranquilo na ilha. Os cocos continuam a cair.",
  "A maré subiu e desceu. Ninguém se afogou.",
  "Alguém tentou pescar com uma sandália. Não correu bem.",
  "O sol brilhou. Os 25 queixaram-se do calor."
];

/* quanta comida a ilha passa a produzir por dia, conforme as decisões */
const PRODUCAO = { merito: 0.6, conselho: 0.2, autoridade: 0.2, mercado: 0.2, dialogo: 0.1 };
const PRODUCAO_MAX = 4.5;
const EXPULSAR = /\b(expuls|exil|banir|banid|fora da ilha|manda[rm]? embora)/;

const vivo = (q) => !q.morto && !q.exilado;
const acordado = (q) => vivo(q) && !q.desmaiado;
const limitar = (v) => Math.max(0, Math.min(100, v));

function porNome(nome) { return pessoas.find((q) => q.nome === nome); }
function chaveTensao(a, b) { return [a, b].sort((x, y) => x.localeCompare(y)).join("|"); }
function amigosDe(nome) { return (RELACOES[nome]?.amigos ?? []).map(porNome).filter(Boolean); }
function rivaisDe(nome) { return (RELACOES[nome]?.rivais ?? []).map(porNome).filter(Boolean); }

/* só quem está vivo e acordado reage às decisões */
function acordados() {
  return SOBREVIVENTES.filter((s, i) => pessoas[i] && acordado(pessoas[i]));
}

function animar(q, tipo, fala, ms = 5500) {
  const agora = performance.now();
  q.animTipo = tipo;
  q.animAte = agora + ms;
  if (fala) { q.falaTexto = fala; q.falaAte = agora + ms; }
}

/* os dois vão ao encontro um do outro */
function aproximar(a, b) {
  const agora = performance.now();
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  a.irPara = { x: mx - 9, y: my };
  b.irPara = { x: mx + 9, y: my };
  a.irAte = agora + 5500;
  b.irAte = agora + 5500;
}

/* quem se zanga passa a ser rival, mesmo que fossem amigos */
function tornarRivais(n1, n2) {
  [[n1, n2], [n2, n1]].forEach(([a, b]) => {
    const r = RELACOES[a];
    if (!r) return;
    r.amigos = r.amigos.filter((x) => x !== b);
    if (!r.rivais.includes(b)) r.rivais.push(b);
  });
}

/* se forem muitos, resume-se numa só frase */
function resumirLista(nomes, singular, plural, eventos) {
  if (nomes.length > 3) eventos.push(`${nomes.length} pessoas ${plural}.`);
  else nomes.forEach((n) => eventos.push(`${n} ${singular}.`));
}

/* ---------- 1. fome, vida, humor e desmaios ---------- */

function ganhoDeFome() {
  const ajuste = modificadoresDoRegime().ajusteFome;   // a Constituição pode tornar a comida mais justa
  if (estado.comida > 50) return -3 + ajuste;          // com comida de sobra, comem bem
  if (estado.comida > 25) return 4 + ajuste;
  return 12 + ajuste;
}

function atualizarFomeEVida(q, ganho, partilharam) {
  if (!q.metab) q.metab = 0.7 + sorte() * 0.6;   // cada um tem o seu metabolismo
  const subida = ganho > 0 ? Math.round(ganho * q.metab) : ganho;
  q.fome = limitar(q.fome + subida - (partilharam ? 14 : 0));
  q.causa = null;
  if (q.fome >= 80) {
    q.vida = Math.max(0, q.vida - (q.desmaiado ? 14 : 8));
    q.causa = "fome";
  } else {
    q.vida = limitar(q.vida + 2);
  }
}

function atualizarHumor(q, resultado, tipoReacao) {
  const efeitos = { apoio: 8, revolta: -10, duvida: -2 };
  const reacao = efeitos[tipoReacao] ?? 0;
  const aoFundo = Math.round((50 - q.moralInd) * 0.08);   // com o tempo, o humor volta ao normal
  const cansaco = q.fome >= 70 ? 4 : 0;
  const regras = satisfacaoComAConstituicao(q);        // gostar (ou não) do que está escrito
  q.moralInd = limitar(q.moralInd + reacao + Math.round(resultado.moral / 3) + aoFundo + regras - cansaco);
}

/* devolve "desmaiou", "recuperou" ou null */
function verificarDesmaio(q) {
  if (q.fome >= 90 && !q.desmaiado) {
    q.desmaiado = true;
    animar(q, "desmaio", aleatorio(FALAS_DESMAIO));
    return "desmaiou";
  }
  if (q.fome < 85 && q.desmaiado) {
    q.desmaiado = false;
    return "recuperou";
  }
  return null;
}

function etapaCorpo(resultado, reagiu, factos, eventos) {
  const partilharam = (resultado.temas ?? []).includes("partilha");
  const ganho = ganhoDeFome();
  const desmaiaram = [];
  const recuperaram = [];
  pessoas.filter(vivo).forEach((q) => {
    atualizarFomeEVida(q, ganho, partilharam);
    atualizarHumor(q, resultado, reagiu[q.nome]);
    const mudanca = verificarDesmaio(q);
    if (mudanca === "desmaiou") { desmaiaram.push(q.nome); factos.desmaios.push(q.nome); }
    if (mudanca === "recuperou") recuperaram.push(q.nome);
  });
  resumirLista(desmaiaram, "desmaiou de fome", "desmaiaram de fome", eventos);
  resumirLista(recuperaram, "recuperou os sentidos", "recuperaram os sentidos", eventos);
}

/* ---------- 2. os amigos acordados e bem alimentados partilham a ração ---------- */

function etapaAjuda(eventos) {
  pessoas.filter((q) => vivo(q) && q.desmaiado).forEach((q) => {
    const amigo = amigosDe(q.nome).find((a) => acordado(a) && a.fome < 60);
    if (!amigo) return;
    q.fome = limitar(q.fome - 25);
    amigo.fome = limitar(amigo.fome + 10);
    eventos.push(`${amigo.nome} partilhou a sua ração com ${q.nome}.`);
    animar(amigo, "apoio", "Aguenta aí, eu ajudo!", 5000);
    if (q.fome < 85) q.desmaiado = false;
  });
}

/* ---------- 3. rivais zangados discutem; à terceira vez vão à pancada ---------- */

function reacaoOposta(a, b, reagiu) {
  const ra = reagiu[a.nome];
  const rb = reagiu[b.nome];
  return (ra === "apoio" && rb === "revolta") || (ra === "revolta" && rb === "apoio");
}

function probabilidadeBase(a, b, opostos) {
  if (opostos) return 0.9;
  const pior = Math.min(a.moralInd, b.moralInd);
  if (pior < 25) return 0.6;
  if (a.moralInd < 35 && b.moralInd < 35) return 0.5;
  return pior < 45 ? 0.1 : 0;
}

function probabilidadeDeBriga(a, b, opostos) {
  const base = probabilidadeBase(a, b, opostos) * modificadoresDoRegime().dissuasao;
  const semConfianca = (estado.legitimidade ?? 50) < 25;   // ninguém respeita uma Constituição desacreditada
  return base > 0 && semConfianca ? Math.min(1, base + 0.15) : base;
}

function candidatosDeBriga(reagiu) {
  const candidatos = [];
  const vistos = new Set();
  pessoas.filter(acordado).forEach((a) => {
    rivaisDe(a.nome).filter(acordado).forEach((b) => {
      const k = chaveTensao(a.nome, b.nome);
      if (vistos.has(k)) return;
      vistos.add(k);
      const opostos = reacaoOposta(a, b, reagiu);
      if (sorte() < probabilidadeDeBriga(a, b, opostos)) candidatos.push({ a, b, opostos, k });
    });
  });
  return candidatos;
}

function aplicarLuta(a, b, k, eventos, factos) {
  [a, b].forEach((q) => {
    q.vida = Math.max(0, q.vida - (15 + Math.floor(sorte() * 10)));
    q.moralInd = limitar(q.moralInd - 10);
    q.causa = "luta";
    animar(q, "luta", aleatorio(FALAS_LUTA));
  });
  estado.tensao[k] = 1;
  factos.lutas.push([a.nome, b.nome]);
  eventos.push(`${a.nome} e ${b.nome} foram à pancada!`);
}

function aplicarDiscussao(a, b, opostos, eventos) {
  [a, b].forEach((q) => {
    q.moralInd = limitar(q.moralInd - 6);
    animar(q, "discussao", aleatorio(FALAS_DISCUSSAO));
  });
  const motivo = opostos ? "por causa da tua decisão" : "por mau humor";
  eventos.push(`${a.nome} e ${b.nome} discutiram ${motivo}.`);
}

function etapaConflitos(reagiu, factos, eventos) {
  const usados = new Set();
  baralhar(candidatosDeBriga(reagiu)).forEach(({ a, b, opostos, k }) => {
    if (usados.size >= 4 || usados.has(a.nome) || usados.has(b.nome)) return;   // no máximo 2 conflitos por dia
    usados.add(a.nome);
    usados.add(b.nome);
    estado.tensao[k] = (estado.tensao[k] ?? 0) + 1;
    aproximar(a, b);
    if (estado.tensao[k] >= 3) aplicarLuta(a, b, k, eventos, factos);
    else aplicarDiscussao(a, b, opostos, eventos);
    tornarRivais(a.nome, b.nome);
  });
}

/* ---------- 4. mortes (e luto dos amigos) ---------- */

function etapaMortes(factos, eventos) {
  const mortos = [];
  pessoas.filter((q) => vivo(q) && q.vida <= 0).forEach((q) => {
    q.morto = true;
    q.desmaiado = false;
    q.falaAte = 0;
    factos.mortes.push(q.nome);
    estado.gente -= 1;
    const causa = q.causa === "luta" ? "não resistiu aos ferimentos" : "não aguentou a fome";
    mortos.push(`${q.nome} ${causa} e morreu.`);
    amigosDe(q.nome).filter(vivo).forEach((a) => { a.moralInd = limitar(a.moralInd - 15); });
  });
  if (mortos.length > 3) eventos.push(`${mortos.length} pessoas não sobreviveram a este dia.`);
  else eventos.push(...mortos);
}

/* Devolve a lista de acontecimentos do dia, em texto */
function atualizarPessoasDoDia(resultado) {
  const eventos = [];
  const factos = { lutas: [], desmaios: [], mortes: [], mexericos: [] };   // o que aconteceu hoje, para os incidentes
  estado.factos = factos;
  Object.keys(estado.tensao).forEach((k) => {                              // as tensões esfriam com o tempo
    if (estado.tensao[k] > 0 && sorte() < modificadoresDoRegime().decaimentoTensao) estado.tensao[k] -= 1;
  });
  const reagiu = {};
  (resultado.reacoes ?? []).forEach((r) => { reagiu[r.nome] = r.tipo; });

  etapaCorpo(resultado, reagiu, factos, eventos);
  etapaAjuda(eventos);
  etapaConflitos(reagiu, factos, eventos);
  etapaMortes(factos, eventos);
  return eventos;
}

/* ========== O CICLO DOS DIAS ========== */

function paresDeRivais() {
  const pares = [];
  pessoas.filter(acordado).forEach((a) => {
    rivaisDe(a.nome).filter(acordado).forEach((b) => { pares.push([a, b]); });
  });
  return baralhar(pares);
}

function gerarMexericos(eventos, factos) {
  const agora = performance.now();
  const usados = new Set();
  paresDeRivais().forEach(([a, b]) => {
    if (usados.size >= 2 || usados.has(a.nome) || a.animAte > agora) return;
    if (sorte() > (a.moralInd < 50 ? 0.5 : 0.15)) return;
    usados.add(a.nome);
    b.moralInd = limitar(b.moralInd - 3);
    animar(a, "mexerico", aleatorio(FALAS_MEXERICO).replace("{B}", b.nome));
    eventos.push(`${a.nome} anda a dizer mal de ${b.nome}.`);
    factos.mexericos.push([a.nome, b.nome]);
  });
}

/* ---------- incidentes: no máximo um por dia que precise de uma decisão tua ---------- */

function incidenteDeLuta(factos) {
  if (!factos.lutas.length) return null;
  const [a, b] = factos.lutas[0];
  const culpado = porNome(a).moralInd <= porNome(b).moralInd ? a : b;
  return { tipo: "luta", nomes: [a, b], culpado, descricao: `${a} e ${b} foram à pancada, e há feridos. A ilha está de olhos postos em ti.` };
}

function incidenteDeDesmaio(factos) {
  const n = factos.desmaios.find((nome) => porNome(nome).desmaiado);
  if (!n || sorte() >= 0.7) return null;
  return { tipo: "desmaio", nomes: [n], culpado: null, descricao: `${n} desmaiou de fome e ninguém lhe deu de comer. Os outros esperam que faças alguma coisa.` };
}

function incidenteDeRoubo() {
  const esfomeados = pessoas.filter((q) => acordado(q) && q.fome >= 70);
  if (!esfomeados.length || sorte() >= 0.35) return null;
  const n = aleatorio(esfomeados).nome;
  return { tipo: "roubo", nomes: [n], culpado: n, descricao: `Descobriram que ${n} andou a roubar comida do armazém.` };
}

function incidenteDeMexerico(factos) {
  if (!factos.mexericos.length || sorte() >= 0.35) return null;
  const [a, b] = factos.mexericos[0];
  return { tipo: "mexerico", nomes: [a, b], culpado: a, descricao: `${a} anda a dizer mal de ${b} pelas costas, e já meia ilha ouviu.` };
}

function detetarIncidente(factos) {
  const luta = incidenteDeLuta(factos);
  if (luta) return luta;
  const recente = estado.ultimoIncidente && estado.dia - estado.ultimoIncidente < 2;
  if (recente) return null;
  return incidenteDeDesmaio(factos) ?? incidenteDeRoubo() ?? incidenteDeMexerico(factos);
}

/* Um dia na ilha: produção e consumo, fome, conversas, brigas e (talvez) um incidente */
function passarDia() {
  estado.comida = limitar(estado.comida + estado.producao + modificadoresDoRegime().producaoExtra - 0.16 * estado.gente);   // cada boca come todos os dias (25 pessoas = 4)
  const eventos = atualizarPessoasDoDia({ moral: 0, temas: [], reacoes: [] });
  gerarMexericos(eventos, estado.factos);
  const incidente = detetarIncidente(estado.factos);
  if (incidente) estado.ultimoIncidente = estado.dia;
  if (!eventos.length) eventos.push(aleatorio(FLAVOR_DIA));
  return { eventos, incidente };
}

/* ---------- a tua reação a um incidente ---------- */

function expulsar(culpado, extras) {
  culpado.exilado = true;
  culpado.desmaiado = false;
  culpado.falaAte = 0;
  estado.gente -= 1;
  extras.push(`Por tua ordem, ${culpado.nome} teve de abandonar a ilha.`);
  amigosDe(culpado.nome).filter(vivo).forEach((a) => { a.moralInd = limitar(a.moralInd - 10); });
}

function aplicarCastigo(culpado, inc, r, extras) {
  culpado.moralInd = limitar(culpado.moralInd - 15);
  extras.push(`${culpado.nome} cumpriu o castigo que decidiste.`);
  if (inc.tipo === "roubo") r.comida += 4;
}

function fazerPazes(par, envolvidos, extras) {
  estado.tensao[par] = 0;
  envolvidos.forEach((q) => { q.moralInd = limitar(q.moralInd + 5); });
  extras.push("Os dois fizeram as pazes... por agora.");
}

function distribuirComida(extras) {
  pessoas.filter(vivo).forEach((q) => {
    q.fome = limitar(q.fome - 10);
    if (q.desmaiado && q.fome < 85) q.desmaiado = false;
  });
  extras.push("Distribuiu-se comida e ninguém passou fome esta noite.");
}

function ignorarProblema(par, r) {
  r.moral = -4;
  r.resumo = "Ignoraste o problema, e a ilha reparou.";
  if (par) estado.tensao[par] = (estado.tensao[par] ?? 0) + 1;
}

/* Usa os mesmos temas das perguntas e mexe nos envolvidos */
function resolverIncidente(inc, resposta) {
  const r = interpretarComRegras(inc.descricao, resposta, acordados());
  const extras = [];
  const envolvidos = inc.nomes.map(porNome).filter(Boolean);
  const culpado = inc.culpado ? porNome(inc.culpado) : null;
  const par = inc.nomes.length === 2 ? chaveTensao(inc.nomes[0], inc.nomes[1]) : null;
  const exilar = EXPULSAR.test(normalizar(resposta));

  if (exilar && culpado) {
    expulsar(culpado, extras);
    if (!r.temas.length) { r.resumo = "Decidiste, e a ilha ouviu."; r.reacoes = []; }
  } else if (r.temas.includes("castigo") && culpado) {
    aplicarCastigo(culpado, inc, r, extras);
  }
  if (r.temas.includes("dialogo") && par) fazerPazes(par, envolvidos, extras);
  if (r.temas.includes("partilha") && ["desmaio", "roubo"].includes(inc.tipo)) distribuirComida(extras);
  if (!r.temas.length && !exilar) ignorarProblema(par, r);
  avaliarConstituicao(inc, r, extras);                  // respeitaste a Constituição?

  estado.casos.push({ dia: estado.dia, caso: inc.descricao, decisao: resposta, consequencias: extras });
  return { ...r, extras };
}