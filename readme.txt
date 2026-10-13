A ILHA DOS 25 - como levar o jogo para outro computador
=========================================================

1. Copia a pasta "rpg-ilha" INTEIRA (com a pasta assets lá dentro) para o outro computador,
   por exemplo numa pen. Pode ficar em qualquer sítio: todos os caminhos são relativos.
2. Abre o ficheiro index.html com um browser (Chrome, Edge ou Firefox). Não precisa de instalar nada.
3. Se houver internet, a letra Fredoka carrega do Google Fonts. Sem internet usa outra letra parecida.

Estrutura da pasta (o jogo também aceita pequenas variações de maiúsculas e pastas):

  rpg-ilha/
    index.html
    style.css
    js/ (script.js, regras.js, eventos.js, constituicao.js)
    assets/
      characters/male/    Male 01-1.png ... Male 12-1.png
      characters/female/  Female 01-1.png ... Female 13-1.png
      mar/Layers/Day/     Back.png, Clouds.png, Middle.png
      Beach-2D-Backgrounds/game_background_2/layers/   sky.png, cloud.png, sea.png, land.png, decor.png

Se algum ficheiro faltar, o jogo NÃO pára: usa bonecos e cenários desenhados em código
e mostra um aviso no canto do ecrã com o número de ficheiros em falta (a consola, F12, diz quais).
