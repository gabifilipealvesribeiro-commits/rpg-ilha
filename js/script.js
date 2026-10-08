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
  perguntaAtual: 0,
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
  titulo: document.getElementById("pergunta-titulo"),
  texto: document.getElementById("pergunta-texto"),
  campo: document.getElementById("resposta-campo"),
  botao: document.getElementById("btn-responder")
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
  el.comida.textContent = estado.comida;
  el.moral.textContent = estado.moral;
}

function mostrarPergunta() {
  const i = estado.perguntaAtual;
  el.titulo.textContent = `Pergunta ${i + 1} de ${PERGUNTAS.length}`;
  el.texto.textContent = PERGUNTAS[i];
  el.campo.value = "";
  el.campo.focus();
}

/* Fome, vida e humor de cada um mudam ao passar o dia */
function atualizarPessoasDoDia(resultado) {
  const reagiu = {};
  (resultado.reacoes || []).forEach((r) => { reagiu[r.nome] = r.tipo; });
  const ganhoFome = estado.comida > 60 ? 5 : estado.comida > 30 ? 10 : 18;
  pessoas.forEach((q) => {
    q.fome = Math.min(100, q.fome + ganhoFome);
    q.vida = q.fome >= 80 ? Math.max(0, q.vida - 10) : Math.min(100, q.vida + 3);
    const t = reagiu[q.nome];
    const delta = (t === "apoio" ? 8 : t === "revolta" ? -10 : t === "duvida" ? -2 : 0)
                + Math.round(resultado.moral / 3) - (q.fome >= 70 ? 5 : 0);
    q.moralInd = Math.max(0, Math.min(100, q.moralInd + delta));
  });
}

/* Passo 5: aqui vai ligar à IA. Por agora devolve um resultado de teste. */
async function interpretarResposta(pergunta, resposta) {
  return interpretarComRegras(pergunta, resposta, SOBREVIVENTES);   // depois: tentar a IA e usar isto como reserva
}

async function responder() {
  if (introAtiva) return;
  const resposta = el.campo.value.trim();
  if (!resposta) {
    el.campo.placeholder = "Tens de escrever alguma coisa, a ilha não adivinha!";
    return;
  }
  el.botao.disabled = true;
  el.campo.disabled = true;
  const pergunta = PERGUNTAS[estado.perguntaAtual];
  const resultado = await interpretarResposta(pergunta, resposta);

  estado.constituicao.push({ pergunta, resposta, resultado });
  estado.comida = Math.max(0, Math.min(100, estado.comida + resultado.comida - 4));   // -4: o que comem todos os dias
  estado.moral = Math.max(0, Math.min(100, estado.moral + resultado.moral));
  estado.dia += 1;
  atualizarEstado();
  atualizarPessoasDoDia(resultado);

  mostrarReacoes(resultado);
  el.titulo.textContent = "A ilha reage";
  el.texto.textContent = resultado.resumo;
  await new Promise((r) => setTimeout(r, 5000));

  if (estado.perguntaAtual < PERGUNTAS.length - 1) {
    estado.perguntaAtual += 1;
    el.campo.disabled = false;
    mostrarPergunta();
  } else {
    el.titulo.textContent = "Fim!";
    el.texto.textContent = "A Constituição da Ilha está pronta (Passo 6).";
    el.campo.disabled = true;
    return;
  }
  el.botao.disabled = false;
}

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
    nome: SOBREVIVENTES[i].nome,
    traco: SOBREVIVENTES[i].traco,
    fila: i < 13 ? 0 : 1,          // 0 = fila da frente (13), 1 = fila de trás (12)
    col: i % 13,
    off: Math.random() * 6,        // desfasamento para não andarem todos em sincronia
    saida: 6500 + Math.random() * 2200, // momento em que salta do barco
    estado: "barco",               // "barco" | "voo" | "agua"
    x: 0, y: 0, vx: 0, vy: 0,
    vida: 100, fome: 10, moralInd: 50   // estado individual, mostrado no menu
  }));
  const ordem = pessoas.map((_, i) => i).sort(() => Math.random() - 0.5);
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
      q.vx = (Math.random() - 0.5) * 0.08 + (w.x < LARGURA / 2 ? -0.03 : 0.03);
      q.vy = -0.16 - Math.random() * 0.1;
      q.estado = "voo";
    } else if (q.estado === "voo") {
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.0004 * dt;
      if (q.y >= SUPERFICIE && q.vy > 0) {                 // cai à água
        q.estado = "agua";
        for (let i = 0; i < 5; i++) bolhas.push({ x: q.x + Math.random() * 12 - 6, y: SUPERFICIE + 4, v: 0.4 + Math.random() * 0.6, r: 1 });
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
    bolhas.push({ x: b.cx + (Math.random() - 0.5) * BW * 0.6, y: b.cy, v: 0.3 + Math.random() * 0.5, r: 1 + Math.floor(Math.random() * 2) });
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
const PASTA_PRAIA = "assets/Beach-2D-Backgrounds/game_background_2/layers/"; // muda aqui se mudares a pasta
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
  const lista = await Promise.all(CAMADAS_PRAIA.map((n) => carregarImagem(`${PASTA_PRAIA}${n}.png`)));
  CAMADAS_PRAIA.forEach((n, i) => { praia.img[n] = lista[i]; });
}

/* Ajusta as camadas (1920x1080) à altura da cena. Se o ecrã for mais largo que a imagem,
   os lados são preenchidos com cópias espelhadas, para nunca cortar o céu nem a ilhota. */
const PAD_PRAIA = 20; // margem extra para as nuvens e o mar se mexerem sem mostrar falhas

function prepararPraia() {
  const ref = praia.img.sky || praia.img.land;
  if (!ref || praia.chave === LARGURA) return;
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
  const ordem = pessoas.map((_, i) => i).sort(() => Math.random() - 0.5);
  pessoas.forEach((q, i) => {
    q.estado = "praia";
    q.lug = ordem[i];
    q.jx = Math.random() * 8 - 4;
    q.jy = Math.random() * 4 - 2;
    q.x = LARGURA * (0.05 + Math.random() * 0.9);
    q.y = (790 + Math.random() * 50) * praia.escala + praia.oy;   // começam no mar pouco fundo
    q.atraso = Math.random() * 4500;
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
  ctx.font = "8px 'Pixelify Sans', monospace";
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

function atualizarChegada(tp, dt) {
  pessoas.forEach((q) => {
    if (tp < q.atraso) return;
    const dx = q.alvoX - q.x, dy = q.alvoY - q.y, d = Math.hypot(dx, dy);
    if (d > 0.8) {
      const passo = Math.min(0.035 * dt, d);
      q.x += dx / d * passo;
      q.y += dy / d * passo;
      q.andando = true;
      q.linha = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : 0;
    } else {
      q.andando = false;
      q.linha = 0;
    }
  });
}

function desenharPraia(agora) {
  ctx.fillStyle = "#8fe3f0"; ctx.fillRect(0, 0, LARGURA, ALTURA);
  const c = praia.cache, ox = praia.ox, oy = praia.oy;
  if (c.sky)   ctx.drawImage(c.sky, ox, oy);
  if (c.cloud) ctx.drawImage(c.cloud, ox + Math.round(Math.sin(agora / 5000) * 10), oy);   // nuvens a flutuar
  if (c.sea)   ctx.drawImage(c.sea, ox, oy + Math.round(Math.sin(agora / 900) * 1.5));      // mar a balançar
  if (c.land)  ctx.drawImage(c.land, ox, oy);
  if (c.decor) ctx.drawImage(c.decor, ox, oy);
}

function desenharChegada(tp, agora) {
  const lista = pessoas.filter((q) => q.img && tp >= q.atraso).sort((a, b) => a.y - b.y);
  lista.forEach((q) => {
    const frame = q.andando ? ORDEM_ANIM[Math.floor(agora / 130 + q.off) % 4] : 1;
    ctx.globalAlpha = Math.min(1, (tp - q.atraso) / 400);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(Math.round(q.x - 7), Math.round(q.y - 1), 14, 2);                         // sombra
    let dx = 0, dy = 0;
    const ativo = q.animTipo && agora < q.animAte;
    if (ativo) {
      if (q.animTipo === "apoio") dy = -Math.abs(Math.sin(agora / 130 + q.off)) * 4;     // salta de contente
      else if (q.animTipo === "revolta") dx = Math.sin(agora / 40) * 1.2;                // treme de raiva
      else dy = -Math.abs(Math.sin(agora / 200 + q.off)) * 2;                            // confuso
    }
    ctx.drawImage(q.img, frame * SPRITE, q.linha * SPRITE, SPRITE, SPRITE,
                  Math.round(q.x - 16 + dx), Math.round(q.y - 30 + dy), SPRITE, SPRITE);
  });
  ctx.globalAlpha = 1;
  lista.filter((q) => q.falaTexto && agora < q.falaAte).forEach(desenharFala);

  // o nome aparece quando passas o rato por cima de alguém
  const alvo = [...lista].reverse().find((q) => Math.abs(rato.x - q.x) < 9 && rato.y > q.y - 30 && rato.y < q.y + 1);
  if (alvo) {
    ctx.font = "9px 'Pixelify Sans', monospace";
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

function desenharMar(t, agora, dt) {
  ctx.fillStyle = "#1d4f8a"; ctx.fillRect(0, 0, LARGURA, ALTURA);
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
  d.style.backgroundImage = `url("${encodeURI(FICHEIROS[i])}")`;
  return d;
}

function estadoDe(q) {
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

function linhaInfo(rotulo, itens) {
  const p = novo("p", "linha-info");
  p.append(novo("b", "", rotulo + " "), document.createTextNode(itens.length ? itens.join(", ") : "ninguém (ainda)"));
  return p;
}

function renderMenu(sel) {
  menu.lista.replaceChildren();
  pessoas.forEach((q, i) => {
    const b = novo("button", "cartao" + (i === sel ? " ativo" : "") + (q.fome >= 70 || q.vida < 30 ? " alerta" : ""));
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
    linhaInfo("Amigos:", r.amigos),
    linhaInfo("Rivais:", r.rivais)
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

/* ========== ARRANQUE ========== */
async function iniciar() {
  ajustarCanvas();
  atualizarEstado();
  el.campo.disabled = true;
  el.botao.disabled = true;
  el.titulo.textContent = "O naufrágio";
  el.texto.textContent = "A carregar o mar...";

  const base = `assets/mar/Layers/${TEMPO}/`;
  [imagens.back, imagens.nuvens, imagens.meio] = await Promise.all([
    carregarImagem(base + "Back.png"),
    carregarImagem(base + "Clouds.png"),
    carregarImagem(base + "Middle.png")
  ]);

  imagens.pessoas = await Promise.all(FICHEIROS.map((f) => carregarImagem(f)));
  await carregarPraia();
  criarPessoas();

  t0 = performance.now();
  ultimoFrame = t0;
  requestAnimationFrame(ciclo);
}
iniciar().catch(console.error);