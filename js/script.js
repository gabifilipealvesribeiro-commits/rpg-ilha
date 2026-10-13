"use strict";

/* ========== CONFIGURAÇÃO ========== */
const ALTURA = 240;      // altura interna da cena (as camadas do mar têm 240 píxeis)
let LARGURA = 320;       // muda sozinha conforme o ecrã
const TEMPO = "Day";     // "Day", "Noon" ou "Night" (pasta do pack do mar)

/* As 9 decisões do trabalho, com um toque de humor */
const PERGUNTAS = [
  "Quem manda aqui? Cuidado: toda a gente acha que é a pessoa certa, e há 25 candidatos.",
  "Como se tomam as decisões? Votação, conselho, ou quem gritar mais alto?",
  "Quem cria as regras? E quem garante que não são só regras que favorecem quem as criou?",
  "O que acontece a quem não cumpre as regras? Lembra-te: não há polícia nem tribunal.",
  "Como se distribui a comida? Temos mantimentos para umas semanas, por isso a coisa vai ficar séria.",
  "Quem controla os recursos? Água, madeira, comida e aquele coco misterioso.",
  "Todos podem participar nas decisões? Até o Fernando, que só pensa em dormir?",
  "Como se resolvem os conflitos? Antes que alguém atire um coco a alguém.",
  "Como se organiza o grupo para sobreviver? Quem pesca, quem constrói, quem vigia?"
];

/* Os 25 sobreviventes, pela mesma ordem dos sprites (M01, F01, M02, F02 ... M12, F12, F13) */
const SOBREVIVENTES = [
  { nome: "Fernando",   traco: "só quer dormir e acha que tudo se resolve com uma sesta" },
  { nome: "Marta",      traco: "acha que devia mandar, e diz isso a toda a gente" },
  { nome: "Rui",        traco: "engenheiro, quer organizar tudo em tabelas" },
  { nome: "Inês",       traco: "médica, preocupa-se com a saúde de todos" },
  { nome: "Tiago",      traco: "influencer, só pensa em filmar a aventura" },
  { nome: "Dona Alice", traco: "reformada, sabe de tudo e opina sobre tudo" },
  { nome: "Bruno",      traco: "personal trainer, quer pôr todos a treinar" },
  { nome: "Carla",      traco: "advogada, discute cada vírgula das regras" },
  { nome: "Zé",         traco: "pescador, o único que sabe pescar a sério" },
  { nome: "Sofia",      traco: "estudante ansiosa, imagina sempre o pior" },
  { nome: "Paulo",      traco: "cozinheiro, guarda a comida com ciúmes" },
  { nome: "Beatriz",    traco: "professora, quer votações e fichas de trabalho" },
  { nome: "Hugo",       traco: "desconfiado, acha que há sempre um complô" },
  { nome: "Joana",      traco: "otimista incurável, diz que vai correr tudo bem" },
  { nome: "Miguel",     traco: "mal-humorado, queixa-se de tudo" },
  { nome: "Rita",       traco: "aventureira, quer explorar a ilha toda" },
  { nome: "Nuno",       traco: "contabilista, conta cada migalha" },
  { nome: "Teresa",     traco: "ex-polícia, quer fazer cumprir as regras" },
  { nome: "André",      traco: "músico, acha que uma festa resolve tudo" },
  { nome: "Catarina",   traco: "cientista, quer estudar tudo o que mexe" },
  { nome: "Sérgio",     traco: "empresário, já quer criar uma moeda e negócios" },
  { nome: "Filipa",     traco: "espiritual, fala com as palmeiras" },
  { nome: "Gonçalo",    traco: "rebelde, não gosta de regras nenhumas" },
  { nome: "Lúcia",      traco: "mediadora, tenta resolver todos os conflitos" },
  { nome: "Mariana",    traco: "a mais nova, só quer saber onde está o wifi" }
];

/* ========== ESTADO DO JOGO ========== */
const estado = {
  dia: 1,
  gente: 25,
  comida: 100,
  moral: 50,
  legitimidade: 50,   // quanto a ilha confia na Constituição (sobe se a respeitares, desce se a violares)
  lider: null,        // nome de quem manda (artigo 1)
  perguntaAtual: 0,
  perguntasConcluidas: false,
  producao: 1.5,   // comida produzida por dia (cresce com as decisões)
  ultimoIncidente: 0,
  ultimaSituacao: {},       // id da situação -> último dia em que apareceu
  ultimaSituacaoId: null,
  emendas: [],     // alterações à Constituição ao longo do tempo: { dia, texto }
  casos: [],       // incidentes julgados: { dia, caso, decisao, consequencias }
  tensao: {},      // brigas entre pares ("A|B" -> número)
  constituicao: [] // { pergunta, resposta, resultado }
};

/* ========== ELEMENTOS ========== */
const canvas = document.getElementById("cena");
const ctx = canvas.getContext("2d");

const el = {
  dia: document.getElementById("st-dia"),
  gente: document.getElementById("st-gente"),
  comida: document.getElementById("st-comida"),
  moral: document.getElementById("st-moral"),
  lei: document.getElementById("st-lei"),
  titulo: document.getElementById("pergunta-titulo"),
  texto: document.getElementById("pergunta-texto"),
  campo: document.getElementById("resposta-campo"),
  botao: document.getElementById("btn-responder"),
  avancar: document.getElementById("btn-avancar")
};

/* Canvas com altura fixa e largura que acompanha o ecrã (sem barras) */
function ajustarCanvas() {
  const p = canvas.parentElement;
  const largura = Math.max(240, Math.round(ALTURA * p.clientWidth / p.clientHeight));
  if (largura !== canvas.width || canvas.height !== ALTURA) {
    canvas.width = largura;
    canvas.height = ALTURA;
  }
  LARGURA = canvas.width;
  ctx.imageSmoothingEnabled = false; // píxeis nítidos
}
window.addEventListener("resize", ajustarCanvas);

/* ========== INTERFACE ========== */
function atualizarEstado() {
  el.dia.textContent = estado.dia;
  el.gente.textContent = estado.gente;
  el.comida.textContent = Math.round(estado.comida);
  el.moral.textContent = Math.round(estado.moral);
  if (el.lei) el.lei.textContent = Math.round(estado.legitimidade ?? 50);
}

/* ========== O CICLO DO JOGO: pergunta -> dias -> incidentes -> pergunta ... ========== */
const DIAS_POR_PERGUNTA = 3;   // dias que a ilha vive depois de cada decisão
const DIA_MS = 7000;           // duração de um dia (o botão "Avançar dia" salta a espera)
let modo = "intro";            // "intro" | "pergunta" | "dias" | "incidente" | "fim"
let incidente = null;
let situacaoAtual = null;   // a situação em curso depois das 9 perguntas (null = pergunta base)
let diasRestantes = 0;
let timerDia = null;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function bloquearResposta(msg) {
  el.campo.disabled = true;
  el.botao.disabled = true;
  el.campo.value = "";
  el.campo.placeholder = msg;
}

function liberarResposta(placeholder, rotuloBotao) {
  el.campo.disabled = false;
  el.botao.disabled = false;
  el.campo.value = "";
  el.campo.placeholder = placeholder;
  el.botao.textContent = rotuloBotao;
  el.campo.focus();
}

function mostrarPergunta(situacaoId) {
  modo = "pergunta";
  el.avancar.hidden = true;
  if (estado.perguntasConcluidas) {                 // depois das 9 perguntas, a ilha cria as suas próprias situações
    situacaoAtual = (situacaoId && situacaoPorId(situacaoId)) || escolherSituacao();
    el.titulo.textContent = situacaoAtual.titulo;
    el.texto.textContent = `${situacaoAtual.texto}\n\nO que decides?`;
    liberarResposta("Escreve a tua decisão...", "Decidir!");
  } else {
    situacaoAtual = null;
    const i = estado.perguntaAtual;
    el.titulo.textContent = `Pergunta ${i + 1} de ${PERGUNTAS.length}`;
    el.texto.textContent = PERGUNTAS[i];
    liberarResposta("Escreve aqui o que a ilha deve fazer...", "Responder!");
  }
  guardarJogo();
}

/* Passo 5: aqui vai ligar à IA. Por agora usa as regras. */
async function interpretarResposta(pergunta, resposta) {
  return interpretarComRegras(pergunta, resposta, acordados());   // depois: tentar a IA e usar isto como reserva
}

/* efeitos de uma decisão (pergunta ou incidente) */
function aplicarResultado(r) {
  estado.comida = limitar(estado.comida + r.comida);
  estado.moral = limitar(estado.moral + r.moral);
  (r.temas || []).forEach((t) => { estado.producao = Math.min(PRODUCAO_MAX, estado.producao + (PRODUCAO[t] || 0)); });
  atualizarEstado();
}

async function responder() {
  if (introAtiva) return;
  const resposta = el.campo.value.trim();
  if (!resposta) {
    el.campo.placeholder = "Tens de escrever alguma coisa, a ilha não adivinha!";
    return;
  }
  if (modo === "pergunta") await responderPergunta(resposta);
  else if (modo === "incidente") await responderIncidente(resposta);
}

async function responderPergunta(resposta) {
  bloquearResposta("A ilha está a pensar...");
  const sit = situacaoAtual;
  const pergunta = sit ? sit.texto : PERGUNTAS[estado.perguntaAtual];
  const resultado = await interpretarResposta(pergunta, resposta);
  if (sit) {                                        // uma situação vira emenda à Constituição
    estado.emendas.push({ dia: estado.dia, titulo: sit.titulo, texto: `Decidiu-se: “${resposta}”.` });
    estado.ultimaSituacao[sit.id] = estado.dia;
    estado.ultimaSituacaoId = sit.id;
    if (!resultado.temas.length && sit.aoIgnorar) sit.aoIgnorar();
  } else {
    estado.constituicao.push({ pergunta, resposta, resultado });
  }
  aplicarResultado(resultado);
  mostrarReacoes(resultado);
  let texto = resultado.resumo;
  if (sit) {
    if (resultado.temas.length) estado.legitimidade = limitar((estado.legitimidade ?? 50) + (sit.ganhoLegitimidade ?? 2));
  } else if (estado.perguntaAtual === 0) {                 // artigo 1: quem manda
    const lider = detetarLider(resposta, resultado);
    if (lider) { estado.lider = lider; texto += `\n${lider} foi escolhido para liderar a ilha.`; }
  }
  atualizarEstado();
  el.titulo.textContent = "A ilha reage";
  el.texto.textContent = texto;
  await espera(5000);
  if (sit && sit.id === "barco" && RESGATE.test(normalizar(resposta))) { fim("resgate"); return; }
  if (!sit) {
    if (estado.perguntaAtual < PERGUNTAS.length - 1) estado.perguntaAtual += 1;
    else estado.perguntasConcluidas = true;
  }
  iniciarDias(DIAS_POR_PERGUNTA);
}

function iniciarDias(n) {
  modo = "dias";
  diasRestantes = n;
  bloquearResposta("A ilha vive o seu dia...");
  el.avancar.hidden = false;
  el.titulo.textContent = "A ilha vive";
  el.texto.textContent = "Observa a ilha. Quando algo exigir uma decisão tua, vais ser chamado.";
  clearTimeout(timerDia);
  timerDia = setTimeout(proximoDia, DIA_MS);
  guardarJogo();
}

function proximoDia() {
  clearTimeout(timerDia);
  if (modo !== "dias") return;
  estado.dia += 1;
  const { eventos, incidente: inc } = passarDia();
  atualizarEstado();
  diasRestantes -= 1;
  el.titulo.textContent = `Dia ${estado.dia}`;
  el.texto.textContent = eventos.join("\n");

  if (inc) {                                    // a ilha pára à espera da tua decisão
    modo = "incidente";
    incidente = inc;
    el.avancar.hidden = true;
    timerDia = setTimeout(mostrarIncidente, 3500);
  } else {
    timerDia = setTimeout(diasRestantes > 0 ? proximoDia : seguinte, DIA_MS);
  }
  guardarJogo();
}

function mostrarIncidente() {
  if (modo !== "incidente" || !incidente) return;
  el.titulo.textContent = `Incidente (dia ${estado.dia})`;
  const artigo = citarArtigoDoIncidente(incidente.tipo);   // a Constituição lembra o que ficou escrito
  el.texto.textContent = `${incidente.descricao}${artigo ? `\n\n${artigo}` : ""}\n\nComo reages?`;
  liberarResposta("Escreve como reages (castigo, diálogo, partilha...)", "Decidir!");
}

async function responderIncidente(resposta) {
  bloquearResposta("A ilha ouve a tua decisão...");
  const r = resolverIncidente(incidente, resposta);
  aplicarResultado(r);
  mostrarReacoes(r);
  el.titulo.textContent = "A ilha reage";
  el.texto.textContent = [r.resumo, ...r.extras].join("\n");
  await espera(5000 + Math.min(r.extras.length, 3) * 1200);
  incidente = null;
  if (diasRestantes > 0) iniciarDias(diasRestantes); else seguinte();
}

function seguinte() {
  clearTimeout(timerDia);
  if (estado.gente <= 0) fim("extincao"); else mostrarPergunta();   // o jogo continua até todos morrerem ou serem resgatados
}

function fim(motivo) {
  modo = "fim";
  clearTimeout(timerDia);
  el.avancar.hidden = true;
  apagarSave();
  const vivos = pessoas.filter(vivo).length;
  el.titulo.textContent = motivo === "resgate" ? "Resgatados!" : "Fim do jogo";
  el.texto.textContent = motivo === "resgate"
    ? `O barco viu o vosso sinal. Os ${vivos} sobreviventes foram resgatados ao fim de ${estado.dia} dias. A Constituição da Ilha fica para a história (abre-a e guarda-a antes de recomeçar!).`
    : `A ilha ficou vazia ao fim de ${estado.dia} dias. Ninguém sobreviveu para contar a história, mas a Constituição ficou escrita (abre-a e guarda-a).`;
  bloquearResposta('O jogo terminou. Usa "Novo jogo" para recomeçar.');
}

el.avancar.addEventListener("click", () => {
  if (modo !== "dias") return;
  if (diasRestantes > 0) proximoDia(); else seguinte();
});

el.botao.addEventListener("click", () => responder().catch(console.error));
el.campo.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    responder().catch(console.error);
  }
});

/* ========== IMAGENS ========== */
const imagens = {};
function carregarImagem(caminho) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => { console.warn("Não encontrei:", caminho); resolve(null); };
    img.src = encodeURI(caminho); // os nomes podem ter espaços
  });
}

/* Repete uma camada na horizontal para preencher o ecrã */
function desenharCamada(img, y, deslocamento = 0) {
  if (!img) return;
  const w = img.width;
  let x = -(((deslocamento % w) + w) % w);
  for (; x < LARGURA; x += w) ctx.drawImage(img, Math.round(x), y);
}

/* ========== PESSOAS (os 25 sobreviventes) ========== */
const SPRITE = 32;
const ORDEM_ANIM = [1, 0, 1, 2];   // colunas: parado, passo, parado, passo
const SUPERFICIE = 112;            // linha da água na cena

// 12 homens e 13 mulheres, intercalados para a fila não ficar toda do mesmo género
const FICHEIROS = [];
for (let i = 0; i < 13; i++) {
  const n = String(i + 1).padStart(2, "0");
  if (i < 12) FICHEIROS.push(`assets/characters/male/Male ${n}-1.png`);
  FICHEIROS.push(`assets/characters/female/Female ${n}-1.png`);
}

let pessoas = [];
function criarPessoas() {
  pessoas = imagens.pessoas.map((img, i) => ({
    img,
    iconeUrl: urlDoSprite(img),
    nome: SOBREVIVENTES[i].nome,
    traco: SOBREVIVENTES[i].traco,
    fila: i < 13 ? 0 : 1,          // 0 = fila da frente (13), 1 = fila de trás (12)
    col: i % 13,
    off: sorte() * 6,        // desfasamento para não andarem todos em sincronia
    saida: 6500 + sorte() * 2200, // momento em que salta do barco
    estado: "barco",               // "barco" | "voo" | "agua"
    x: 0, y: 0, vx: 0, vy: 0,
    vida: 100, fome: 5 + Math.floor(sorte() * 15), moralInd: 50, morto: false, desmaiado: false   // estado individual, mostrado no menu
  }));
  const ordem = baralhar(pessoas.map((_, i) => i));
  pessoas.forEach((q, i) => { q.slot = ordem[i]; q.prof = ordem[i] % 3; });
}

/* ========== BARCO (desenhado em código, num canvas à parte) ========== */
let barcoCv = null;
let BW = 0; // largura do casco, ajusta-se ao ecrã

function prepararBarco() {
  const novo = Math.round(Math.min(220, LARGURA * 0.75));
  if (novo !== BW || !barcoCv) {
    BW = novo;
    barcoCv = document.createElement("canvas");
    barcoCv.width = BW + 40;
    barcoCv.height = 150;
  }
}

/* posição de cada pessoa dentro do barco (pés) */
function localPessoa(p) {
  const sp = (BW - 60) / 12.5;
  return { x: 50 + p.col * sp + p.fila * sp / 2, y: p.fila === 0 ? 103 : 95 };
}

function desenharBarco(t) {
  const g = barcoCv.getContext("2d");
  g.clearRect(0, 0, barcoCv.width, barcoCv.height);
  const mx = Math.round(barcoCv.width / 2);

  g.fillStyle = "#4a2c14"; g.fillRect(mx - 1, 10, 3, 92);           // mastro
  g.fillStyle = "#d33a2c"; g.fillRect(mx + 2, 10, 10, 5);           // bandeira
  for (let r = 0; r < 76; r++) {                                     // velas
    g.fillStyle = "#f4efe0"; g.fillRect(mx + 3, 18 + r, Math.floor(r * 0.8) + 1, 1);
    g.fillStyle = "#e0d6bd"; g.fillRect(mx - 3 - Math.floor(r * 0.5), 26 + r, Math.floor(r * 0.5) + 1, 1);
  }

  const panico = t >= 3500;
  [1, 0].forEach((fila) => {                                         // trás primeiro, frente depois
    pessoas.filter((p) => p.fila === fila && p.estado === "barco").forEach((p) => {
      const l = localPessoa(p);
      let frame = 1, linha = 0, salto = 0;
      if (panico) {
        frame = ORDEM_ANIM[Math.floor(t / 90 + p.off) % 4];
        linha = 1 + (Math.floor(t / 260 + p.off) % 2);               // olha para um lado e para o outro
        salto = -Math.abs(Math.sin(t / 110 + p.off * 3)) * 6;        // salta de aflição
      }
      const x = Math.round(l.x), y = Math.round(l.y + salto);
      if (p.img) g.drawImage(p.img, frame * SPRITE, linha * SPRITE, SPRITE, SPRITE, x - 16, y - 30, SPRITE, SPRITE);
      if (panico && Math.floor(t / 220 + p.off) % 2 === 0) {         // "!" a piscar
        g.fillStyle = "#e22"; g.fillRect(x - 1, y - 42, 2, 5); g.fillRect(x - 1, y - 36, 2, 2);
      }
    });
  });

  for (let r = 0; r < 28; r++) {                                     // casco (tapa os pés da frente)
    const recuo = Math.floor(Math.pow(r / 27, 2) * 45);
    g.fillStyle = r < 3 ? "#c68b4e" : (r % 7 === 0 ? "#5e3818" : "#7a4a24");
    g.fillRect(20 + recuo, 100 + r, BW - recuo * 2, 1);
  }
}

/* ponto do barco (em coordenadas do canvas do barco) para a cena */
function aMundo(b, ox, oy) {
  const dx = ox - barcoCv.width / 2, dy = oy - 100;
  const c = Math.cos(b.rot), s = Math.sin(b.rot);
  return { x: b.cx + dx * c - dy * s, y: b.cy + dx * s + dy * c };
}

/* ========== INTRO: O NAUFRÁGIO ========== */
const INTRO_FIM = 12500;
const NARRACAO = [
  { t: 0,     texto: "Era uma vez um barco com 25 pessoas muito confiantes e zero conhecimentos de navegação." },
  { t: 3500,  texto: "Tempestade! O capitão garantiu que era só uma nuvem passageira." },
  { t: 5500,  texto: "O capitão deixou de garantir fosse o que fosse." },
  { t: 6100,  texto: "BUM! Um raio acertou em cheio no mastro." },
  { t: 6500,  texto: "Agora é cada um por si! O barco concluiu que o fundo do mar era mais sossegado." },
  { t: 10000, texto: "Boas notícias: os 25 safaram-se a nado. Más notícias: a ilha não tem governo, polícia nem moeda." }
];

let introAtiva = true;
let t0 = 0;
let tFim = 0;
let narracaoIdx = -1;
let bolhas = [];
let ultimaBolha = 0;
let ultimoFrame = 0;

const suave = (x) => x * x * (3 - 2 * x);

function posicaoBarco(t) {
  const meio = LARGURA / 2;
  if (t < 3500) {                        // a navegar
    const k = suave(t / 3500);
    return { cx: -BW / 2 + (meio + BW / 2) * k, cy: 98 + Math.sin(t / 250) * 2, rot: Math.sin(t / 400) * 0.03 };
  }
  if (t < 6500) {                        // a abanar e a inclinar
    const k = suave((t - 3500) / 3000);
    return { cx: meio + Math.sin(t / 60) * 1.2, cy: 98 + Math.sin(t / 90) * 2, rot: 0.35 * k };
  }
  if (t < 10000) {                       // a afundar
    const k = suave((t - 6500) / 3500);
    return { cx: meio + 30 * k, cy: 98 + 52 * k, rot: 0.35 + 0.25 * k };
  }
  return { cx: meio + 30, cy: 150, rot: 0.6 };   // no fundo
}

function atualizarPessoas(t, agora, dt, b) {
  pessoas.forEach((q) => {
    if (q.estado === "barco" && t >= q.saida) {            // salta do barco
      const w = aMundo(b, localPessoa(q).x, localPessoa(q).y);
      q.x = w.x; q.y = w.y;
      q.vx = (sorte() - 0.5) * 0.08 + (w.x < LARGURA / 2 ? -0.03 : 0.03);
      q.vy = -0.16 - sorte() * 0.1;
      q.estado = "voo";
    } else if (q.estado === "voo") {
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.0004 * dt;
      if (q.y >= SUPERFICIE && q.vy > 0) {                 // cai à água
        q.estado = "agua";
        for (let i = 0; i < 5; i++) bolhas.push({ x: q.x + sorte() * 12 - 6, y: SUPERFICIE + 4, v: 0.4 + sorte() * 0.6, r: 1 });
      }
    } else if (q.estado === "agua") {                      // nada até ao seu lugar
      const dx = nxAgua(q) - q.x;
      q.x += Math.sign(dx) * Math.min(Math.abs(dx), 0.02 * dt);
    }
  });
}

/* lugar na água: espalhados por toda a largura do ecrã */
function nxAgua(q) { return LARGURA * (0.06 + 0.88 * q.slot / 24); }

function atualizarBolhas(t, agora, dt, b) {
  const afundar = t >= 6500 && t < 10000;
  if ((afundar && agora - ultimaBolha > 70) || (!afundar && t >= 10000 && agora - ultimaBolha > 450)) {
    ultimaBolha = agora;
    bolhas.push({ x: b.cx + (sorte() - 0.5) * BW * 0.6, y: b.cy, v: 0.3 + sorte() * 0.5, r: 1 + Math.floor(sorte() * 2) });
  }
  bolhas.forEach((o) => { o.y -= o.v * dt / 16; });
  bolhas = bolhas.filter((o) => o.y > SUPERFICIE - 4);
}

function desenharSobreviventes(agora) {
  const ordem = (q) => (q.estado === "agua" ? q.prof : 9);   // os de trás primeiro, os que voam à frente
  pessoas.filter((q) => q.img && q.estado !== "barco").sort((x, y) => ordem(x) - ordem(y)).forEach((q) => {
    if (q.estado === "voo") {
      const f = ORDEM_ANIM[Math.floor(agora / 80 + q.off) % 4];
      ctx.drawImage(q.img, f * SPRITE, 0, SPRITE, SPRITE, Math.round(q.x - 16), Math.round(q.y - 30), SPRITE, SPRITE);
    } else {                                               // a nadar: só se vê a cabeça e os ombros
      const f = ORDEM_ANIM[Math.floor(agora / 160 + q.off) % 4];
      const base = Math.round(SUPERFICIE + 2 + q.prof * 7 + Math.sin(agora / 400 + q.off) * 1.5);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, LARGURA, base); ctx.clip();
      ctx.drawImage(q.img, f * SPRITE, 0, SPRITE, SPRITE, Math.round(q.x - 16), base - 20, SPRITE, SPRITE);
      ctx.restore();
    }
  });
}

/* ========== PRAIA (a chegada à ilha) ========== */
const PASTAS_PRAIA = ["assets/Beach-2D-Backgrounds/game_background_2/layers/", "assets/praia/2/layers/", "assets/praia/layers/", "assets/praia/2/", "assets/praia/"];
const CAMADAS_PRAIA = ["sky", "cloud", "sea", "land", "decor"];
const CHEGADA_FIM = 9000;
const NARRACAO_PRAIA = [
  { t: 0,    texto: "Os 25 chegaram à praia, molhados, exaustos e já a discutir de quem foi a ideia de apanhar este barco." },
  { t: 5500, texto: "Sem governo, sem polícia, sem moeda. Só areia, cocos e 25 opiniões. Está na hora de decidir como isto vai funcionar." }
];

let fase = "mar";                  // "mar" (naufrágio) ou "praia"
let tPraia = 0;
let narracaoPraiaIdx = -1;
const praia = { img: {}, cache: {}, chave: 0, escala: 1, ox: 0, oy: 0 };
const rato = { x: -99, y: -99 };

async function carregarPraia() {
  const lista = await Promise.all(CAMADAS_PRAIA.map((n) => carregarPrimeira(candidatosPraia(n))));
  CAMADAS_PRAIA.forEach((n, i) => {
    praia.img[n] = lista[i];
    if (!lista[i]) faltas.push(`praia: ${n}.png`);
  });
}

/* Ajusta as camadas (1920x1080) à altura da cena. Se o ecrã for mais largo que a imagem,
   os lados são preenchidos com cópias espelhadas, para nunca cortar o céu nem a ilhota. */
const PAD_PRAIA = 20; // margem extra para as nuvens e o mar se mexerem sem mostrar falhas

function prepararPraia() {
  const ref = praia.img.sky || praia.img.land;
  if (praia.chave === LARGURA) return;
  if (!ref) {                                  // sem imagens: usa o cenário de emergência
    praia.chave = LARGURA; praia.escala = ALTURA / 1080; praia.ox = 0; praia.oy = 0;
    if (fase === "praia") atribuirLugares();
    return;
  }
  praia.chave = LARGURA;
  praia.escala = ALTURA / ref.height;
  praia.ox = -PAD_PRAIA;
  praia.oy = 0;
  const w = Math.round(ref.width * praia.escala);
  const larg = LARGURA + PAD_PRAIA * 2;
  const x0 = Math.round((larg - w) / 2);
  const n = Math.ceil(larg / w);
  CAMADAS_PRAIA.forEach((nome) => {
    const img = praia.img[nome];
    if (!img) return;
    const cv = document.createElement("canvas");
    cv.width = larg; cv.height = ALTURA;
    const g = cv.getContext("2d");
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    for (let k = -n; k <= n; k++) {
      const x = x0 + k * w;
      if (x + w <= 0 || x >= larg) continue;
      g.save();
      if (Math.abs(k) % 2) { g.translate(x + w, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, w, ALTURA); }
      else g.drawImage(img, x, 0, w, ALTURA);
      g.restore();
    }
    praia.cache[nome] = cv;
  });
  if (fase === "praia") atribuirLugares();
}

/* 25 lugares na areia, em 3 filas (py = altura dos pés na imagem original) */
function atribuirLugares() {
  const filas = [{ py: 940, n: 9 }, { py: 1000, n: 8 }, { py: 1052, n: 8 }];
  const lugares = [];
  filas.forEach((f, r) => {
    for (let i = 0; i < f.n; i++) {
      lugares.push({ x: LARGURA * (i + 0.5 + (r === 1 ? 0.25 : 0)) / f.n, y: f.py * praia.escala + praia.oy });
    }
  });
  pessoas.forEach((q) => {
    if (q.lug === undefined) return;
    const l = lugares[q.lug % lugares.length];
    q.alvoX = l.x + q.jx;
    q.alvoY = l.y + q.jy;
  });
}

function iniciarPraia(agora) {
  prepararPraia();      // antes de mudar de fase, para ainda não atribuir lugares
  fase = "praia";
  tPraia = agora;
  const ordem = baralhar(pessoas.map((_, i) => i));
  pessoas.forEach((q, i) => {
    q.estado = "praia";
    q.lug = ordem[i];
    q.jx = sorte() * 8 - 4;
    q.jy = sorte() * 4 - 2;
    q.x = LARGURA * (0.05 + sorte() * 0.9);
    q.y = (790 + sorte() * 50) * praia.escala + praia.oy;   // começam no mar pouco fundo
    q.atraso = sorte() * 4500;
    q.andando = false;
    q.linha = 0;
  });
  atribuirLugares();
}

/* Põe a fala e a animação em quem reagiu (dura 5 segundos) */
function mostrarReacoes(resultado) {
  const agora = performance.now();
  pessoas.forEach((q) => { q.falaAte = 0; q.animTipo = null; });
  (resultado.reacoes || []).forEach((r) => {
    const q = pessoas.find((p) => p.nome === r.nome);
    if (!q) return;
    q.falaTexto = r.fala;
    q.falaAte = agora + 5000;
    q.animTipo = r.tipo;
    q.animAte = agora + 5000;
  });
}

function desenharFala(q) {
  ctx.font = "500 9px Fredoka, sans-serif";
  ctx.textAlign = "left";
  const maxW = 96, linhas = [];
  let atual = "";
  q.falaTexto.split(" ").forEach((p) => {
    const t = atual ? atual + " " + p : p;
    if (ctx.measureText(t).width > maxW && atual) { linhas.push(atual); atual = p; } else atual = t;
  });
  linhas.push(atual);
  const w = Math.ceil(Math.max(...linhas.map((l) => ctx.measureText(l).width))) + 8;
  const h = linhas.length * 9 + 6;
  const x = Math.max(2, Math.min(LARGURA - w - 2, Math.round(q.x - w / 2)));
  const y = Math.max(2, Math.round(q.y - 34 - h));
  ctx.fillStyle = "#2a1a0e"; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = "#fff8e0"; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#2a1a0e";
  linhas.forEach((l, i) => ctx.fillText(l, x + 4, y + 9 + i * 9));
  ctx.fillRect(Math.round(q.x) - 1, y + h + 1, 3, 3);   // bico do balão
}

/* linha da folha de sprites: 0 baixo, 1 esquerda, 2 direita */
function direcaoDe(dx, dy) {
  if (Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : 2;
}

function velocidadeDe(emConflito, passeando) {
  if (emConflito) return 0.08;
  return passeando ? 0.022 : 0.035;
}

/* quem já chegou dá uma volta pela areia (dentro da zona de praia) */
function novoPasseio(q) {
  const yMin = 925 * praia.escala + praia.oy, yMax = 1055 * praia.escala + praia.oy;
  q.alvoX = Math.max(16, Math.min(LARGURA - 16, q.x + (sorte() - 0.5) * 140));
  q.alvoY = yMin + sorte() * (yMax - yMin);
  q.passeando = true;
  q.pausaAte = 0;
}

function atualizarChegada(tp, dt) {
  const agoraMs = performance.now();
  pessoas.forEach((q) => {
    if (tp < q.atraso) return;
    if (q.morto || q.exilado || q.desmaiado) { q.andando = false; return; }
    const emConflito = q.irPara && agoraMs < q.irAte;
    const dx = (emConflito ? q.irPara.x : q.alvoX) - q.x, dy = (emConflito ? q.irPara.y : q.alvoY) - q.y, d = Math.hypot(dx, dy);
    if (d > 0.8) {
      const passo = Math.min(velocidadeDe(emConflito, q.passeando) * dt, d);
      q.x += dx / d * passo;
      q.y += dy / d * passo;
      q.andando = true;
      q.linha = direcaoDe(dx, dy);
    } else {
      if (q.andando) {                       // acabou de chegar: olha para um lado e faz uma pausa
        q.andando = false;
        q.passeando = false;
        q.linha = [0, 0, 1, 2][Math.floor(sorte() * 4)];
        q.pausaAte = 0;
      }
      if (!q.pausaAte) q.pausaAte = agoraMs + 800 + sorte() * 3500;
      if (tp >= CHEGADA_FIM && agoraMs > q.pausaAte) novoPasseio(q);   // depois da chegada, vai dar outra volta
    }
  });
}

function desenharPraia(agora) {
  ctx.fillStyle = "#8fe3f0"; ctx.fillRect(0, 0, LARGURA, ALTURA);
  const c = praia.cache, ox = praia.ox, oy = praia.oy;
  if (!c.sky && !c.land) {                     // cenário de emergência (faltam as imagens)
    ctx.fillStyle = "#4fc9cf"; ctx.fillRect(0, Math.round(ALTURA * 0.45), LARGURA, Math.round(ALTURA * 0.4));
    ctx.fillStyle = "#e8f8f8"; ctx.fillRect(0, Math.round(ALTURA * 0.82), LARGURA, 2);
    ctx.fillStyle = "#f0d890"; ctx.fillRect(0, Math.round(ALTURA * 0.83), LARGURA, ALTURA);
  }
  if (c.sky)   ctx.drawImage(c.sky, ox, oy);
  if (c.cloud) ctx.drawImage(c.cloud, ox + Math.round(Math.sin(agora / 5000) * 10), oy);   // nuvens a flutuar
  if (c.sea)   ctx.drawImage(c.sea, ox, oy + Math.round(Math.sin(agora / 900) * 1.5));      // mar a balançar
  if (c.land)  ctx.drawImage(c.land, ox, oy);
  if (c.decor) ctx.drawImage(c.decor, ox, oy);
}

function desenharCruz(q) {
  const x = Math.round(q.x), y = Math.round(q.y);
  ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(x - 6, y - 1, 12, 2);
  ctx.fillStyle = "#6b4224"; ctx.fillRect(x - 1, y - 14, 3, 14); ctx.fillRect(x - 5, y - 11, 11, 3);
  ctx.fillStyle = "#9a6a3a"; ctx.fillRect(x - 1, y - 14, 1, 14);
}

function desenharChegada(tp, agora) {
  const lista = pessoas.filter((q) => q.img && !q.exilado && tp >= q.atraso).sort((a, b) => a.y - b.y);
  lista.forEach((q) => {
    ctx.globalAlpha = Math.min(1, (tp - q.atraso) / 400);
    if (q.morto) { desenharCruz(q); return; }
    const frame = q.andando ? ORDEM_ANIM[Math.floor(agora / 130 + q.off) % 4] : 1;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(Math.round(q.x - (q.desmaiado ? 14 : 7)), Math.round(q.y - 1), q.desmaiado ? 28 : 14, 2);   // sombra
    if (q.desmaiado) {                                   // deitado no chão
      ctx.save();
      ctx.translate(Math.round(q.x - 4), Math.round(q.y - 2));
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(q.img, SPRITE, 0, SPRITE, SPRITE, -16, -30, SPRITE, SPRITE);
      ctx.restore();
      ctx.font = "500 9px Fredoka, sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.fillText("Zzz", Math.round(q.x + 8), Math.round(q.y - 16 - (agora / 400 + q.off) % 4));
      return;
    }
    let dx = 0, dy = 0;
    const ativo = q.animTipo && agora < q.animAte;
    if (ativo) {
      if (q.animTipo === "apoio") dy = -Math.abs(Math.sin(agora / 130 + q.off)) * 4;       // salta de contente
      else if (q.animTipo === "revolta") dx = Math.sin(agora / 40) * 1.2;                  // treme de raiva
      else if (q.animTipo === "discussao") dx = Math.sin(agora / 45) * 1.3;
      else if (q.animTipo === "luta") dx = Math.sin(agora / 30) * 2.2;
      else dy = -Math.abs(Math.sin(agora / 200 + q.off)) * 2;                              // confuso
    }
    ctx.drawImage(q.img, frame * SPRITE, q.linha * SPRITE, SPRITE, SPRITE,
                  Math.round(q.x - 16 + dx), Math.round(q.y - 30 + dy), SPRITE, SPRITE);
    if (ativo && (q.animTipo === "discussao" || q.animTipo === "luta")) {                 // "!" de zanga
      ctx.fillStyle = "#e22";
      ctx.fillRect(Math.round(q.x + 9), Math.round(q.y - 38), 2, 5);
      ctx.fillRect(Math.round(q.x + 9), Math.round(q.y - 32), 2, 2);
    }
    if (ativo && q.animTipo === "luta") {                                                 // nuvem de pó
      ctx.fillStyle = "rgba(235,235,225,0.85)";
      for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(q.x - 12 + sorte() * 24), Math.round(q.y - 20 + sorte() * 18), 3, 3);
    }
  });
  ctx.globalAlpha = 1;
  lista.filter((q) => q.falaTexto && agora < q.falaAte).forEach(desenharFala);

  // o nome aparece quando passas o rato por cima de alguém
  const alvo = [...lista].reverse().find((q) => Math.abs(rato.x - q.x) < 9 && rato.y > q.y - 30 && rato.y < q.y + 1);
  if (alvo) {
    ctx.font = "600 9px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2a1a0e";
    ctx.fillStyle = "#fff";
    ctx.strokeText(alvo.nome, Math.round(alvo.x), Math.round(alvo.y - 34));
    ctx.fillText(alvo.nome, Math.round(alvo.x), Math.round(alvo.y - 34));
  }
}

canvas.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  rato.x = (e.clientX - r.left) / r.width * LARGURA;
  rato.y = (e.clientY - r.top) / r.height * ALTURA;
});
canvas.addEventListener("mouseleave", () => { rato.x = -99; rato.y = -99; });

/* ========== CICLO PRINCIPAL ========== */
function terminarIntro() {
  introAtiva = false;
  document.querySelector(".jogo").classList.remove("intro");   // a caixa de resposta aparece
  el.campo.disabled = false;
  el.botao.disabled = false;
  mostrarPergunta();
}

function narrar(lista, t, idx, titulo) {
  for (let i = lista.length - 1; i > idx; i--) {
    if (t >= lista[i].t) {
      el.titulo.textContent = titulo;
      el.texto.textContent = lista[i].texto;
      return i;
    }
  }
  return idx;
}

/* ========== TEMPESTADE: chuva, escuridão, relâmpagos e o raio que cai no barco ========== */
const T_RAIO = 6100;   // momento em que o raio atinge o barco
const CHUVA = Array.from({ length: 220 }, () => ({ x: sorte(), y: sorte() * SUPERFICIE, v: 5 + sorte() * 4 }));
const FLASHES = [{ t: 3900, a: 0.25, d: 140 }, { t: 5000, a: 0.3, d: 160 }, { t: T_RAIO, a: 0.85, d: 380 }];
let raio = null;       // pontos do raio (criado quando cai)
let faiscas = [];

function intensidadeTempestade(t) {
  if (t < 2000) return 0;
  if (t < 5000) return (t - 2000) / 3000;
  if (t < 9500) return 1;
  return Math.max(0, 1 - (t - 9500) / 1500);
}

function criarRaio(xAlvo, yAlvo) {
  const x0 = xAlvo + (sorte() - 0.5) * 40;
  const pts = [{ x: x0, y: 0 }];
  for (let i = 1; i < 9; i++) {
    const k = i / 9;
    pts.push({ x: x0 + (xAlvo - x0) * k + (sorte() - 0.5) * 22, y: yAlvo * k });
  }
  pts.push({ x: xAlvo, y: yAlvo });
  return pts;
}

function tracarRaio(pts) {
  ctx.beginPath();
  pts.forEach((p, i) => { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
  ctx.stroke();
}

function desenharTempestade(t, agora, dt, b) {
  const inten = intensidadeTempestade(t);

  // céu escuro
  if (inten > 0) { ctx.fillStyle = `rgba(8,14,40,${0.5 * inten})`; ctx.fillRect(0, 0, LARGURA, ALTURA); }

  // chuva (só cai até à água, onde faz pequenas ondas)
  const n = Math.round(CHUVA.length * inten);
  for (let i = 0; i < n; i++) {
    const g = CHUVA[i];
    g.y += g.v * dt / 16;
    const x = Math.round(g.x * LARGURA + g.y * 0.15);
    if (g.y > SUPERFICIE) {
      ctx.fillStyle = "rgba(210,230,250,0.6)";
      ctx.fillRect(x - 2, SUPERFICIE, 4, 1);
      g.y = -5; g.x = sorte();
    } else {
      ctx.fillStyle = "rgba(190,215,240,0.75)";
      ctx.fillRect(x, Math.round(g.y), 1, 4);
    }
  }

  // o raio cai no mastro
  if (t >= T_RAIO && !raio) {
    const alvo = aMundo(b, barcoCv.width / 2, 10);
    raio = criarRaio(alvo.x, alvo.y);
    for (let i = 0; i < 16; i++) {
      faiscas.push({ x: alvo.x, y: alvo.y, vx: (sorte() - 0.5) * 0.18, vy: -0.05 - sorte() * 0.14, vida: 500 + sorte() * 300 });
    }
  }
  if (raio && t < T_RAIO + 260) {
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(170,195,255,0.55)"; ctx.lineWidth = 4; tracarRaio(raio);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; tracarRaio(raio);
  }
  faiscas.forEach((f) => { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 0.0004 * dt; f.vida -= dt; });
  faiscas = faiscas.filter((f) => f.vida > 0);
  faiscas.forEach((f, i) => { ctx.fillStyle = i % 2 ? "#ffd45a" : "#ff9a3c"; ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 2); });

  // clarões
  let flash = 0;
  FLASHES.forEach((f) => { if (t >= f.t && t < f.t + f.d) flash = Math.max(flash, f.a * (1 - (t - f.t) / f.d)); });
  if (flash > 0) { ctx.fillStyle = `rgba(235,240,255,${flash})`; ctx.fillRect(0, 0, LARGURA, ALTURA); }
}

function desenharMar(t, agora, dt) {
  ctx.fillStyle = "#1d4f8a"; ctx.fillRect(0, 0, LARGURA, ALTURA);
  if (!imagens.back && !imagens.meio) {        // cenário de emergência (faltam as imagens do mar)
    ctx.fillStyle = "#4a7fb8"; ctx.fillRect(0, 0, LARGURA, SUPERFICIE);
    ctx.fillStyle = "#7a6a5a"; ctx.fillRect(0, 215, LARGURA, ALTURA - 215);
  }
  desenharCamada(imagens.back, 0);
  desenharCamada(imagens.nuvens, 0, agora / 90);
  desenharCamada(imagens.meio, 0);

  prepararBarco();
  const b = posicaoBarco(t);
  atualizarPessoas(t, agora, dt, b);
  atualizarBolhas(t, agora, dt, b);
  desenharBarco(t);
  ctx.save();
  ctx.translate(Math.round(b.cx), Math.round(b.cy));
  ctx.rotate(b.rot);
  ctx.drawImage(barcoCv, -Math.round(barcoCv.width / 2), -100);
  ctx.restore();
  desenharSobreviventes(agora);
  ctx.fillStyle = "rgba(220,245,255,0.8)";
  bolhas.forEach((o) => ctx.fillRect(Math.round(o.x), Math.round(o.y), o.r, o.r));
  desenharTempestade(t, agora, dt, b);
}

function ciclo(agora) {
  const dt = Math.min(agora - ultimoFrame, 50);
  ultimoFrame = agora;
  let alfa = 0;   // escurecimento da transição

  if (fase === "mar") {
    const t = Math.min(agora - t0, INTRO_FIM);
    narracaoIdx = narrar(NARRACAO, t, narracaoIdx, "O naufrágio");
    desenharMar(t, agora, dt);
    if (t > INTRO_FIM - 700) alfa = (t - (INTRO_FIM - 700)) / 700;
    if (t >= INTRO_FIM) iniciarPraia(agora);
  } else {
    prepararPraia();
    const tp = agora - tPraia;
    narracaoPraiaIdx = narrar(NARRACAO_PRAIA, tp, narracaoPraiaIdx, "A ilha");
    atualizarChegada(tp, dt);
    desenharPraia(agora);
    desenharChegada(tp, agora);
    alfa = Math.max(0, 1 - tp / 700);
    if (introAtiva && tp >= CHEGADA_FIM) terminarIntro();
  }

  if (alfa > 0) { ctx.fillStyle = `rgba(0,0,0,${alfa})`; ctx.fillRect(0, 0, LARGURA, ALTURA); }
  requestAnimationFrame(ciclo);
}

/* Clicar na cena (ou Esc) salta a fase atual */
function saltarIntro() {
  if (!introAtiva) return;
  if (fase === "mar") {
    t0 = performance.now() - INTRO_FIM;
    pessoas.forEach((q) => {            // quem ainda não saltou já está na água
      if (q.estado !== "agua") { q.estado = "agua"; q.x = nxAgua(q); }
    });
  } else {
    pessoas.forEach((q) => { q.atraso = 0; q.x = q.alvoX; q.y = q.alvoY; });
    tPraia = performance.now() - CHEGADA_FIM;
  }
}
/* Clicar numa pessoa na praia abre a ficha dela */
canvas.addEventListener("click", (e) => {
  if (introAtiva) { saltarIntro(); return; }
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * LARGURA;
  const y = (e.clientY - r.top) / r.height * ALTURA;
  const alvo = pessoas.filter((q) => q.img && q.estado === "praia")
    .sort((a, b) => b.y - a.y)
    .find((q) => Math.abs(x - q.x) < 9 && y > q.y - 30 && y < q.y + 1);
  if (alvo) abrirMenu(pessoas.indexOf(alvo));
});

/* ========== MENU DOS SOBREVIVENTES ========== */
const menu = {
  caixa: document.getElementById("menu"),
  lista: document.getElementById("menu-lista"),
  ficha: document.getElementById("menu-ficha")
};

function novo(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function icone(i, grande) {
  const d = novo("div", grande ? "icone grande" : "icone");
  d.style.backgroundImage = `url("${pessoas[i].iconeUrl}")`;
  return d;
}

function estadoDe(q) {
  if (q.morto) return "Morreu";
  if (q.exilado) return "Expulso da ilha";
  if (q.desmaiado) return "Desmaiado de fome";
  if (q.vida < 30) return "Muito debilitado";
  if (q.fome >= 70) return "Faminto";
  if (q.moralInd < 25) return "Revoltado";
  if (q.moralInd > 75) return "Radiante";
  return "Aguenta-se";
}

function barra(rotulo, valor, tipo) {
  const linha = novo("div", "linha-barra");
  const fundo = novo("div", "barra");
  const dentro = novo("div", "enchimento " + tipo);
  dentro.style.width = Math.round(valor) + "%";
  fundo.append(dentro);
  linha.append(novo("span", "", rotulo), fundo, novo("span", "", String(Math.round(valor))));
  return linha;
}

function rotuloNome(n, de) {
  const o = porNome(n);
  const t = estado.tensao[chaveTensao(de, n)] || 0;
  return n + (o && o.morto ? " (morreu)" : "") + (t ? ` (${t} ${t === 1 ? "briga" : "brigas"})` : "");
}

function linhaInfo(rotulo, itens) {
  const p = novo("p", "linha-info");
  p.append(novo("b", "", rotulo + " "), document.createTextNode(itens.length ? itens.join(", ") : "ninguém (ainda)"));
  return p;
}

function renderMenu(sel) {
  menu.lista.replaceChildren();
  pessoas.forEach((q, i) => {
    const b = novo("button", "cartao" + (i === sel ? " ativo" : "") + (q.fome >= 70 || q.vida < 30 ? " alerta" : "") + (q.morto ? " morto" : ""));
    b.type = "button";
    b.append(icone(i), novo("span", "", q.nome));
    b.addEventListener("click", () => renderMenu(i));
    menu.lista.append(b);
  });
  const q = pessoas[sel];
  const p = PERFIS[q.nome] || { gosta: [], odeia: [] };
  const r = RELACOES[q.nome] || { amigos: [], rivais: [] };
  menu.ficha.replaceChildren(
    icone(sel, true), novo("h3", "", q.nome), novo("p", "traco", q.traco), novo("p", "chip", estadoDe(q)),
    barra("Vida", q.vida, "vida"), barra("Fome", q.fome, "fome"), barra("Humor", q.moralInd, "humor"),
    linhaInfo("Gosta de:", p.gosta.map((t) => NOME_TEMA[t])),
    linhaInfo("Odeia:", p.odeia.map((t) => NOME_TEMA[t])),
    linhaInfo("Amigos:", r.amigos.map((n) => rotuloNome(n, q.nome))),
    linhaInfo("Rivais:", r.rivais.map((n) => rotuloNome(n, q.nome))),
    linhaInfo("Constituição:", [descricaoSatisfacao(q)]),
    ...(estado.lider === q.nome ? [linhaInfo("Papel:", ["Líder da ilha"])] : [])
  );
}

function abrirMenu(sel = 0) {
  if (!pessoas.length) return;
  menu.caixa.hidden = false;
  renderMenu(sel);
}
function fecharMenu() { menu.caixa.hidden = true; }

document.getElementById("btn-menu").addEventListener("click", () => abrirMenu(0));
document.getElementById("menu-fechar").addEventListener("click", fecharMenu);
menu.caixa.addEventListener("click", (e) => { if (e.target === menu.caixa) fecharMenu(); });
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!menu.caixa.hidden) fecharMenu(); else saltarIntro();
});

/* ========== FICHEIROS TOLERANTES ==========
   O jogo procura cada imagem em várias pastas possíveis (maiúsculas, nomes alternativos) e, se não
   encontrar, usa um desenho de emergência. Assim funciona em qualquer PC, desde que a pasta rpg-ilha
   seja copiada inteira (todos os caminhos são relativos ao index.html). */
const faltas = [];
const PASTAS_PERSONAGENS = ["assets/characters", "assets/personagens", "assets"];
const PASTAS_MAR = ["assets/mar/Layers/", "assets/mar/layers/", "assets/mar/", "assets/Ocean View Files/Ocean View Files/Layers/", "assets/Ocean View Files/Layers/"];
const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function tentarImagem(caminho) {
  return new Promise((resolve) => {
    const img = new Image();
    const limite = setTimeout(() => resolve(null), 5000);   // nunca fica preso à espera de uma imagem
    img.onload = () => { clearTimeout(limite); resolve(img); };
    img.onerror = () => { clearTimeout(limite); resolve(null); };
    img.src = encodeURI(caminho);
  });
}

async function carregarPrimeira(candidatos) {
  for (const c of candidatos) {
    const img = await tentarImagem(c);
    if (img) return img;
  }
  return null;
}

function candidatosMar(nome) {
  const lista = [];
  PASTAS_MAR.forEach((b) => { lista.push(`${b}${TEMPO}/${nome}.png`, `${b}${TEMPO.toLowerCase()}/${nome}.png`); });
  return lista;
}

function candidatosPraia(nome) {
  const lista = [];
  PASTAS_PRAIA.forEach((b) => { lista.push(`${b}${nome}.png`, `${b}${maiuscula(nome)}.png`); });
  return lista;
}

let pastaPersonagensOK = null;   // a pasta que funcionou à primeira fica à frente para os restantes
function candidatosPersonagem(caminho) {
  const nome = caminho.split("/").pop();
  const genero = caminho.includes("/female/") ? "female" : "male";
  const lista = [caminho];
  PASTAS_PERSONAGENS.forEach((b) => {
    [genero, maiuscula(genero)].forEach((p) => lista.push(`${b}/${p}/${nome}`));
    lista.push(`${b}/${nome}`);
  });
  if (pastaPersonagensOK) lista.sort((x, y) => (y.startsWith(pastaPersonagensOK) ? 1 : 0) - (x.startsWith(pastaPersonagensOK) ? 1 : 0));
  return [...new Set(lista)];
}

/* Personagem de emergência: boneco desenhado em código, com a mesma folha de 96x128 (3 passos x 4 direções) */
function criarSpriteGerado(i) {
  const cv = document.createElement("canvas");
  cv.width = 96; cv.height = 128;
  const g = cv.getContext("2d");
  const pele = ["#f2c9a0", "#d9a577", "#b9805a", "#8d5a3b"][i % 4];
  const cabelo = ["#2a1a0e", "#6b4224", "#c8a15a", "#a63a2a", "#555555", "#3a2a6a"][(i * 7) % 6];
  const roupa = ["#3f7fc4", "#4f9a3a", "#d9822b", "#b0402c", "#8a4fc4", "#2a9aa0", "#d4b02a"][(i * 5) % 7];
  for (let linha = 0; linha < 4; linha++) {
    for (let col = 0; col < 3; col++) {
      const x = col * 32, y = linha * 32;
      const passo = [0, 2, -2][col];                                   // pernas a andar
      g.fillStyle = "#2a1a0e";
      g.fillRect(x + 11, y + 24 + Math.max(0, passo), 4, 6 - Math.max(0, passo));
      g.fillRect(x + 17, y + 24 + Math.max(0, -passo), 4, 6 - Math.max(0, -passo));
      g.fillStyle = roupa; g.fillRect(x + 10, y + 14, 12, 11);        // corpo
      g.fillStyle = pele; g.fillRect(x + 8, y + 15, 3, 8); g.fillRect(x + 21, y + 15, 3, 8);   // braços
      g.fillRect(x + 11, y + 4, 10, 10);                              // cabeça
      g.fillStyle = cabelo; g.fillRect(x + 10, y + 2, 12, linha === 3 ? 11 : 5);
      g.fillStyle = "#2a1a0e";
      if (linha === 0) { g.fillRect(x + 13, y + 9, 2, 2); g.fillRect(x + 17, y + 9, 2, 2); }
      if (linha === 1) g.fillRect(x + 12, y + 9, 2, 2);
      if (linha === 2) g.fillRect(x + 18, y + 9, 2, 2);
    }
  }
  return cv;
}

async function carregarPersonagem(caminho, i) {
  const img = await carregarPrimeira(candidatosPersonagem(caminho));
  if (img) {
    if (!pastaPersonagensOK) pastaPersonagensOK = decodeURI(img.src).includes("/characters/") ? "assets/characters" : null;
    return img;
  }
  faltas.push(`personagem: ${caminho.split("/").pop()}`);
  return criarSpriteGerado(i);
}

function urlDoSprite(img) {
  if (img && img.src) return img.src;
  return img && typeof img.toDataURL === "function" ? img.toDataURL() : "";
}

function mostrarAviso(lista) {
  console.warn("Ficheiros em falta:", lista);
  const caixa = document.getElementById("aviso");
  if (!caixa) return;
  caixa.textContent = `Não encontrei ${lista.length} ficheiro(s) e usei desenhos de emergência. Confirma que copiaste a pasta assets inteira. (clica para fechar)`;
  caixa.hidden = false;
  caixa.addEventListener("click", () => { caixa.hidden = true; });
}

/* Os erros aparecem num aviso no ecrã (não só na consola) */
function mostrarErro(msg, ficheiro, linha) {
  const onde = ficheiro ? ` (${String(ficheiro).split("/").pop()}:${linha})` : "";
  console.error("Erro no jogo:", msg, onde);
  const caixa = document.getElementById("aviso");
  if (!caixa) return;
  caixa.textContent = `Erro no jogo: ${msg}${onde}. (clica para fechar)`;
  caixa.hidden = false;
  caixa.addEventListener("click", () => { caixa.hidden = true; }, { once: true });
}
window.addEventListener("error", (e) => mostrarErro(e.message, e.filename, e.lineno));
window.addEventListener("unhandledrejection", (e) => mostrarErro(e.reason?.message ?? String(e.reason)));

/* ========== ARRANQUE ========== */
async function iniciar() {
  ajustarCanvas();
  atualizarEstado();
  el.campo.disabled = true;
  el.botao.disabled = true;
  el.titulo.textContent = "O naufrágio";
  el.texto.textContent = "A carregar o mar...";

  [imagens.back, imagens.nuvens, imagens.meio] = await Promise.all([
    carregarPrimeira(candidatosMar("Back")),
    carregarPrimeira(candidatosMar("Clouds")),
    carregarPrimeira(candidatosMar("Middle"))
  ]);
  ["Back", "Clouds", "Middle"].forEach((n, i) => {
    if (![imagens.back, imagens.nuvens, imagens.meio][i]) faltas.push(`mar: ${n}.png`);
  });

  el.texto.textContent = "A carregar as personagens...";
  imagens.pessoas = await Promise.all(FICHEIROS.map((f, i) => carregarPersonagem(f, i)));
  el.texto.textContent = "A carregar a praia...";
  await carregarPraia();
  criarPessoas();

  const salvo = lerSave();
  if (salvo && window.confirm(`Encontrei um jogo guardado (dia ${salvo.estado.dia}, ${salvo.estado.gente} sobreviventes). Queres continuar? (Cancelar = novo jogo)`)) {
    restaurarSave(salvo);
    atualizarEstado();
    entrarPraiaDireto();
    ultimoFrame = performance.now();
    requestAnimationFrame(ciclo);
    retomarModo(salvo);
    if (faltas.length) mostrarAviso(faltas);
    return;
  }
  apagarSave();

  t0 = performance.now();
  ultimoFrame = t0;
  requestAnimationFrame(ciclo);
  if (faltas.length) mostrarAviso(faltas);
}
iniciar().catch((e) => mostrarErro(e.message));