# static/

- `css/estilo.css` — design system (variáveis de cor, fontes, componentes). Seguir
  `docs/diretrizes-visuais.md`.
- `js/app.js` — interações gerais (toasts, confirmações, prévia ao vivo da lista).
- `js/roleta.js` — animação do sorteio: chama o POST `sortear`, recebe o nome escolhido
  pelo servidor, gira os nomes desacelerando e para exatamente nele; confete ao final; envia a versão
  do estado em cada ação; modo apresentação e atalhos; respeita `prefers-reduced-motion`.
- `img/` — logo, ícones, ilustrações.
