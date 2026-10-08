"use strict";

/* ========== MOTOR DE REGRAS (sem IA, sem custos, funciona offline) ==========
   1. Procura temas na resposta do jogador (democracia, castigo, partilha...)
   2. Cada tema mexe na moral e na comida
   3. Cada sobrevivente gosta ou odeia certos temas, e reage em conformidade
   Mais tarde a IA pode substituir interpretarComRegras; isto fica como reserva. */

/* Cada tema é uma expressão regular aplicada ao texto sem acentos e em minúsculas */
const TEMAS = {
  democracia: "votac|votar|voto|maioria|democra|assembleia|consenso|referendo|todos (decidem|decidimos|escolhem|votam)",
  autoridade: "ditador|rei\\b|lider|chefe|manda|mando|obedec|autoridade|imperador|general|capitao|presidente",
  partilha:   "igual|partilh|dividir|dividid|racao|justo|justica|equit|todos comem|metade",
  merito:     "merito|trabalh|esforco|quem pesca|quem constroi|recompensa|produz|contribu",
  castigo:    "castigo|expuls|exilio|exilad|prisao|preso|punic|punir|multa|banir|pena|jaula|sem comida",
  dialogo:    "dialog|mediar|mediador|conversa|perdao|perdoar|aviso|advertencia|reuniao|acordo|negoci|ouvir",
  violencia:  "matar|lutar|luta|bater|violencia|guerra|armas|duelo|pancada|sangue",
  misticismo: "deus|reza|ritual|oraculo|sagrad|espirit|sorte|sorteio|palmeira",
  mercado:    "moeda|troca|trocar|comercio|pagar|pagamento|conchas|dinheiro|mercado|salario|imposto",
  conselho:   "conselho|representant|delegad|comite|comissao|equipa|assembleia de",
  festa:      "festa|festival|musica|danca|cantar|coco|sesta|dormir|diversao|jogo"
};

const NOME_TEMA = {
  democracia: "democracia", autoridade: "autoridade", partilha: "partilha", merito: "mérito",
  castigo: "castigo", dialogo: "diálogo", violencia: "violência", misticismo: "misticismo",
  mercado: "mercado", conselho: "conselho", festa: "festa"
};

/* efeito de cada tema: [moral, comida] */
const EFEITOS = {
  democracia: [4, -1], autoridade: [-3, 0], partilha: [5, -2], merito: [-1, 4],
  castigo: [-4, 0], dialogo: [4, 0], violencia: [-8, 0], misticismo: [1, -1],
  mercado: [-1, 1], conselho: [3, 0], festa: [6, -3]
};

/* o que cada sobrevivente gosta/odeia, e o que diz quando aprova ou reprova */
const PERFIS = {
  "Fernando":   { gosta: ["partilha", "festa"], odeia: ["merito"], apoio: "Isto parece-me ótimo. Acordem-me quando começar.", revolta: "Trabalhar?! Eu vim para o naufrágio descansar." },
  "Marta":      { gosta: ["autoridade"], odeia: ["democracia", "conselho"], apoio: "Finalmente alguém com visão. Já sei quem devia mandar.", revolta: "Votar? Para quê, se eu já tenho as respostas?" },
  "Rui":        { gosta: ["conselho", "mercado"], odeia: ["misticismo"], apoio: "Boa. Vou fazer uma folha de cálculo.", revolta: "Isso não tem lógica nenhuma. Zero dados." },
  "Inês":       { gosta: ["partilha", "dialogo"], odeia: ["violencia", "castigo"], apoio: "Assim todos ficam bem. Sobretudo de saúde.", revolta: "Isso acaba com alguém no chão. E sou eu que coso." },
  "Tiago":      { gosta: ["festa", "mercado"], odeia: ["castigo"], apoio: "Isto vai render stories brutais!", revolta: "Cancelado! Ninguém vai querer ver isto." },
  "Dona Alice": { gosta: ["democracia", "dialogo"], odeia: ["violencia", "mercado"], apoio: "No meu tempo era assim mesmo. Com juízo.", revolta: "Isso é um disparate. Não criei filhos para ver isto." },
  "Bruno":      { gosta: ["merito", "castigo"], odeia: ["festa"], apoio: "Isso! Disciplina e resultados!", revolta: "Fraqueza. Amanhã é treino às seis." },
  "Carla":      { gosta: ["conselho", "democracia"], odeia: ["autoridade", "violencia"], apoio: "Concordo, desde que fique por escrito.", revolta: "Isso viola todos os princípios. Vou recorrer." },
  "Zé":         { gosta: ["merito", "partilha"], odeia: ["autoridade"], apoio: "Quem apanha o peixe é que sabe. Concordo.", revolta: "Mandar em mim? O mar é que manda." },
  "Sofia":      { gosta: ["dialogo", "autoridade"], odeia: ["violencia", "castigo"], apoio: "Ok... isso até me acalma. Um bocadinho.", revolta: "Vamos morrer todos, eu sabia!" },
  "Paulo":      { gosta: ["mercado", "merito"], odeia: ["partilha"], apoio: "Bem pensado. A comida fica comigo, claro.", revolta: "A minha comida não se partilha. Está sob guarda." },
  "Beatriz":    { gosta: ["democracia", "conselho", "dialogo"], odeia: ["violencia"], apoio: "Bom! Proponho votação e ficha de trabalho.", revolta: "Isto não é nada pedagógico. Vão repetir a lição." },
  "Hugo":       { gosta: ["merito"], odeia: ["autoridade", "conselho", "mercado"], apoio: "Hmm... parece boa. Quem lucra com isto?", revolta: "Isto é um esquema! Eu sabia!" },
  "Joana":      { gosta: ["dialogo", "festa", "partilha"], odeia: ["violencia"], apoio: "Vai correr tudo lindamente!", revolta: "Oh... e se corre mal? Pronto, vai correr bem na mesma." },
  "Miguel":     { gosta: ["castigo"], odeia: ["democracia", "festa", "dialogo"], apoio: "Finalmente uma ideia que não é uma treta.", revolta: "Mais conversa? Já estou farto." },
  "Rita":       { gosta: ["merito", "festa"], odeia: ["autoridade"], apoio: "Boa! Já quero ir explorar o outro lado da ilha.", revolta: "Regras a mais. Eu vou explorar sozinha." },
  "Nuno":       { gosta: ["mercado", "merito"], odeia: ["festa"], apoio: "Tenho a contabilidade pronta. Cada coco conta.", revolta: "Isso desequilibra as contas. Inaceitável." },
  "Teresa":     { gosta: ["castigo", "autoridade"], odeia: ["festa"], apoio: "Regra é regra. Eu faço cumprir.", revolta: "Sem ordem isto vira uma balbúrdia." },
  "André":      { gosta: ["festa", "partilha"], odeia: ["castigo", "autoridade"], apoio: "Isso merece uma música!", revolta: "Que ambiente pesado... isto pede uma balada triste." },
  "Catarina":   { gosta: ["conselho", "dialogo"], odeia: ["misticismo"], apoio: "Hipótese aceite. Vou observar os resultados.", revolta: "Sem evidências? Não, obrigada." },
  "Sérgio":     { gosta: ["mercado", "autoridade"], odeia: ["partilha"], apoio: "Isso é que é visão. Vamos fazer negócio!", revolta: "Isso é péssimo para os negócios." },
  "Filipa":     { gosta: ["misticismo", "partilha"], odeia: ["mercado", "violencia"], apoio: "As palmeiras aprovam. Eu também.", revolta: "As palmeiras disseram que não. E eu também." },
  "Gonçalo":    { gosta: ["democracia"], odeia: ["autoridade", "castigo", "conselho"], apoio: "Se todos mandam, ninguém me manda. Gosto.", revolta: "Regras? Eu não obedeço a ninguém!" },
  "Lúcia":      { gosta: ["dialogo", "democracia"], odeia: ["violencia", "castigo"], apoio: "Calma, vamos resolver isto a conversar.", revolta: "Isso só vai dar mais problemas. Respirem fundo." },
  "Mariana":    { gosta: ["festa", "democracia"], odeia: ["merito"], apoio: "Boa! Mas há wifi na ilha?", revolta: "Trabalhar? Sem wifi? Nem pensar." }
};

const FALAS_DUVIDA = [
  "Hã? Isso era uma resposta ou um espirro?",
  "Pode repetir? Em português da ilha.",
  "Não percebi nada, mas parece importante.",
  "Hmm... e isso como se come?",
  "Estou perdido. E já estávamos perdidos."
];

function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function aleatorio(lista) { return lista[Math.floor(Math.random() * lista.length)]; }

/* Devolve { resumo, moral, comida, temas, reacoes: [{ nome, tipo, fala }] } */
function interpretarComRegras(pergunta, resposta, sobreviventes) {
  const txt = normalizar(resposta);
  const palavras = txt.split(/\s+/).filter(Boolean).length;
  const temas = Object.keys(TEMAS).filter((t) => new RegExp("\\b(" + TEMAS[t] + ")").test(txt));

  // resposta vazia de sentido: três pessoas ficam confusas
  if (!temas.length || palavras < 2) {
    const confusos = [...sobreviventes].sort(() => Math.random() - 0.5).slice(0, 3);
    return {
      resumo: "A ilha ficou a olhar para ti. Ninguém percebeu o que querias dizer (tenta ser mais concreto).",
      moral: -2, comida: 0, temas: [],
      reacoes: confusos.map((s) => ({ nome: s.nome, tipo: "duvida", fala: aleatorio(FALAS_DUVIDA) }))
    };
  }

  // quanto cada um gosta ou odeia o que foi dito
  const pontuados = sobreviventes.map((s) => {
    const p = PERFIS[s.nome] || { gosta: [], odeia: [] };
    const score = temas.filter((t) => p.gosta.includes(t)).length - temas.filter((t) => p.odeia.includes(t)).length;
    return { s, p, score, sorte: Math.random() };
  }).filter((x) => x.score !== 0)
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score) || a.sorte - b.sorte)
    .slice(0, 6);

  const reacoes = pontuados.map((x) => ({
    nome: x.s.nome,
    tipo: x.score > 0 ? "apoio" : "revolta",
    fala: x.score > 0 ? x.p.apoio : x.p.revolta
  }));
  const apoios = reacoes.filter((r) => r.tipo === "apoio").length;
  const revoltas = reacoes.length - apoios;

  let moral = apoios - revoltas, comida = 0;
  temas.forEach((t) => { moral += EFEITOS[t][0]; comida += EFEITOS[t][1]; });

  const lista = temas.map((t) => NOME_TEMA[t]).join(", ");
  return {
    resumo: `A ilha ouviu falar de ${lista}. ${apoios} ${apoios === 1 ? "aplaudiu" : "aplaudiram"} e ${revoltas} ${revoltas === 1 ? "torceu" : "torceram"} o nariz.`,
    moral, comida, temas, reacoes
  };
}

/* Quem se dá bem e quem se dá mal com quem (para o menu dos sobreviventes) */
const RELACOES = {
  "Fernando":   { amigos: ["André", "Joana"], rivais: ["Bruno", "Teresa"] },
  "Marta":      { amigos: ["Sérgio", "Teresa"], rivais: ["Gonçalo", "Carla"] },
  "Rui":        { amigos: ["Catarina", "Nuno"], rivais: ["Filipa", "Tiago"] },
  "Inês":       { amigos: ["Lúcia", "Joana"], rivais: ["Miguel"] },
  "Tiago":      { amigos: ["Mariana", "André"], rivais: ["Rui", "Miguel"] },
  "Dona Alice": { amigos: ["Beatriz", "Lúcia"], rivais: ["Tiago", "Gonçalo"] },
  "Bruno":      { amigos: ["Teresa", "Rita"], rivais: ["Fernando", "André"] },
  "Carla":      { amigos: ["Beatriz", "Catarina"], rivais: ["Marta", "Teresa"] },
  "Zé":         { amigos: ["Rita", "Fernando"], rivais: ["Sérgio", "Paulo"] },
  "Sofia":      { amigos: ["Inês", "Lúcia"], rivais: ["Gonçalo"] },
  "Paulo":      { amigos: ["Nuno", "Sérgio"], rivais: ["Zé", "Filipa"] },
  "Beatriz":    { amigos: ["Carla", "Dona Alice"], rivais: ["Miguel", "Marta"] },
  "Hugo":       { amigos: ["Gonçalo", "Zé"], rivais: ["Sérgio", "Marta"] },
  "Joana":      { amigos: ["Fernando", "Mariana"], rivais: ["Miguel"] },
  "Miguel":     { amigos: ["Teresa"], rivais: ["Joana", "Tiago", "Beatriz"] },
  "Rita":       { amigos: ["Zé", "Bruno"], rivais: ["Marta", "Teresa"] },
  "Nuno":       { amigos: ["Rui", "Paulo"], rivais: ["André", "Mariana"] },
  "Teresa":     { amigos: ["Bruno", "Marta"], rivais: ["Gonçalo", "Carla", "André"] },
  "André":      { amigos: ["Fernando", "Tiago", "Joana"], rivais: ["Teresa", "Bruno"] },
  "Catarina":   { amigos: ["Rui", "Carla"], rivais: ["Filipa"] },
  "Sérgio":     { amigos: ["Marta", "Paulo"], rivais: ["Zé", "Hugo", "Filipa"] },
  "Filipa":     { amigos: ["Joana", "Lúcia"], rivais: ["Sérgio", "Rui", "Catarina"] },
  "Gonçalo":    { amigos: ["Hugo", "Rita"], rivais: ["Marta", "Teresa"] },
  "Lúcia":      { amigos: ["Inês", "Beatriz"], rivais: [] },
  "Mariana":    { amigos: ["Tiago", "Joana"], rivais: ["Nuno"] }
};