# A Ilha dos 25 — notas para o beta tester

Jogo de simulação social em HTML/CSS/JS (pixel art). 25 sobreviventes de um naufrágio chegam a uma ilha sem governo, polícia nem moeda. O jogador decide como organizar a sociedade; as decisões têm consequências e a **Constituição da Ilha** vai-se escrevendo ao longo do jogo.

*(Este documento é atualizado a cada passo do desenvolvimento. Última atualização: passo "A Constituição manda na ilha".)*

## Como jogar / arrancar
1. Copiar a pasta `rpg-ilha` **inteira** (com `assets`), para qualquer sítio.
2. Abrir `index.html` num browser (Chrome, Edge ou Firefox). Não precisa de instalar nada.
3. Se houver internet, a letra Fredoka carrega do Google Fonts; sem internet usa outra parecida.
4. Se faltar alguma imagem, o jogo não pára: usa desenhos de emergência e mostra um aviso no canto do ecrã.

## O que o jogo tem (por ordem de desenvolvimento)
1. **Interface** em madeira, pixel art, a ecrã inteiro, adaptável a qualquer resolução (em ecrãs estreitos as caixas empilham). Fonte Fredoka.
2. **Intro do naufrágio:** barco com os 25 a bordo, chuva e escuridão, relâmpagos, um raio que acerta no mastro, o barco afunda e os sobreviventes saltam para a água e nadam. Narração com humor. Clicar na cena ou Esc salta a intro. Durante a intro só se vê a caixa de narração (a de resposta fica escondida).
3. **Chegada à praia:** cenário com camadas (céu, nuvens, mar, areia, adereços), os 25 saem da água e andam até à areia; depois passam a **dar voltas** pela praia. Passar o rato por cima de alguém mostra o nome; clicar abre a ficha.
4. **Os 25 sobreviventes:** nome, personalidade, gostos, ódios, amigos e rivais. Menu "Sobreviventes" com a ficha de cada um (vida, fome, humor, gosta, odeia, amigos, rivais, opinião sobre a Constituição, papel).
5. **Respostas livres** interpretadas por regras (sem IA, sem custos): temas como democracia, autoridade, partilha, mérito, castigo, diálogo, violência, misticismo, mercado, conselho, festa. Cada sobrevivente reage (balão de fala e animação) conforme a personalidade.
6. **Vida na ilha:** fome, desmaios (ficam deitados com "Zzz"), amigos que partilham comida, discussões, lutas, mortes (cruz na areia), expulsões, mexericos.
7. **Ciclo de dias:** as 9 perguntas base (os 9 pontos do trabalho) são decisões; entre elas passam dias sozinhos (botão "Avançar dia"). Quando algo exige decisão aparece um **incidente** (briga, desmaio, roubo, mexerico) e o jogador escreve como reage. Os casos ficam guardados como jurisprudência.
8. **Constituição viva:** botão "Constituição" abre o documento (preâmbulo, 9 artigos, emendas, jurisprudência, como funciona na prática, estado da ilha, assinaturas). Exporta por Imprimir/PDF, Copiar texto ou Descarregar .txt.
9. **Jogo infinito:** depois das 9 perguntas a ilha cria situações novas conforme o estado (comida a acabar, moral baixa, mortos, divisão, doença, tempestade, moeda, eleições, cabana com bar, barco ao longe, lei nova, descrédito). Cada decisão vira uma **emenda**. O jogo só acaba se morrerem todos ou se aceitarem o resgate.
10. **Guardar e continuar:** guarda sozinho no browser (localStorage). Ao reabrir, pergunta se queres continuar. Botão "Novo jogo" apaga o guardado.
11. **Funciona em qualquer PC:** caminhos relativos, procura as imagens em várias pastas, desenhos de emergência, aviso de ficheiros em falta, tempo limite no carregamento, erros mostrados no ecrã.
12. **A Constituição manda na ilha (último passo):**
    - Cada sobrevivente gosta ou não do que ficou escrito, e isso mexe no humor dele todos os dias.
    - Castigos previstos reduzem as brigas, mediação acalma as brigas mais depressa, partilha deixa a ilha menos esfomeada, mérito aumenta a comida.
    - Se o artigo 1 nomear alguém ("a Marta manda"), essa pessoa é o líder. Se só falar de autoridade, é escolhido alguém que goste de autoridade.
    - Nos incidentes, o painel cita os artigos que se aplicam. Respeitar um deles sobe a **Lei** (legitimidade, no topo do ecrã); violar desce; ignorar desce um pouco.
    - Com a Lei abaixo de 25, há mais brigas e aparece a situação "A ilha deixou de acreditar nas regras".

## Lista de testes sugerida
**Arranque e intro**
- [ ] O jogo abre e a intro corre até ao fim (barco, chuva, raio, naufrágio, nado, chegada à praia).
- [ ] Clicar na cena (ou Esc) salta a intro e a caixa de resposta só aparece depois.
- [ ] Redimensionar a janela (e testar no telemóvel) não parte o ecrã.

**Perguntas e respostas**
- [ ] Responder às 9 perguntas com respostas normais (ex.: "votamos todos", "quem rouba é castigado", "dividimos a comida").
- [ ] Responder com uma frase sem sentido ("asdf") → a ilha fica confusa.
- [ ] Escrever um nome de sobrevivente no artigo 1 → essa pessoa é o líder (ver ficha).
- [ ] Os balões de fala são legíveis.

**Dias, incidentes e consequências**
- [ ] Os dias passam sozinhos; "Avançar dia" funciona.
- [ ] Aparecem incidentes e o painel cita o artigo da Constituição que se aplica.
- [ ] Reagir com "castigo", "diálogo", "partilha", "expulsa-o da ilha" → consequências diferentes.
- [ ] Alguém desmaia com fome, fica deitado; amigos ajudam; ao fim de tempo sem comida há mortes (cruz na areia).
- [ ] Brigas: os dois vão um ao encontro do outro e discutem/lutam.
- [ ] O valor "Lei" no topo sobe/desce conforme respeitas ou violas a Constituição.

**Menu, Constituição e guardar**
- [ ] Menu "Sobreviventes": fichas, estado, "Constituição: satisfeito/descontente", papel de líder.
- [ ] "Constituição": artigos, emendas, jurisprudência e secção "Como funciona na prática"; Imprimir/PDF, Copiar e Descarregar .txt funcionam.
- [ ] Fechar a página a meio e reabrir → pergunta se queres continuar e retoma no sítio certo.
- [ ] "Novo jogo" recomeça do zero.

**Longa duração**
- [ ] Jogar 50+ dias: situações variadas, sem erros, sem o jogo ficar parado.
- [ ] Final de resgate (responder à situação do barco com "pedir resgate/fazer uma fogueira") e final de extinção.

## Limitações conhecidas
- As respostas são interpretadas por **palavras-chave**: frases sem nenhuma palavra reconhecida contam como "ninguém percebeu". (A IA ainda não está ligada.)
- Os mortos continuam nas listas de amigos/rivais, marcados "(morreu)".
- O progresso guarda-se **por browser e computador**.
- Os balões e nomes na cena usam letra pequena (a cena é desenhada em píxeis).
- A ilhota com palmeiras da praia depende da camada `decor`; se não aparecer, é só visual.

## Como reportar um problema
Indicar: browser e versão, o que fizeste, o que esperavas, o que aconteceu, e uma captura de ecrã. Se aparecer um aviso de erro no canto do ecrã, copiar o texto. Se possível, abrir a consola (F12) e copiar a primeira linha vermelha.

## Notas técnicas
- Ficheiros: `index.html`, `style.css`, `js/` (`regras.js`, `eventos.js`, `regime.js`, `situacoes.js`, `guardar.js`, `script.js`, `constituicao.js`), `assets/`.
- Créditos: ler as licenças dos packs do itch.io usados (personagens, mar, praia) e incluir os autores na apresentação, se pedido.
