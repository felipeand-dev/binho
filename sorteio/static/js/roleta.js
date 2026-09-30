/*
 * Animação do sorteio (tela de sorteio).
 *
 * Regra de ouro (RN-10): quem escolhe o aluno é o servidor. Este arquivo só pede o
 * sorteio, recebe o resultado e faz a fita de nomes parar exatamente nele. A ordem
 * embaralhada dos nomes que passam na fita é apenas visual.
 *
 * Linha do tempo (docs/diretrizes-visuais.md):
 *   0 s      botão "Sorteando…", holofote intensifica, fita começa a girar
 *   ~0,1 s   resposta do servidor → a fita desacelera (power4.out) até o nome
 *   ~4,3 s   parada com leve quique (back.out); nome gigante letra a letra (SplitText)
 *   +0,1 s   confete verde e ouro (canvas-confetti)
 *   +0,5 s   o nome voa para "Já sorteados" (Flip); contadores sobem
 */
(function () {
  'use strict';

  const palco = document.getElementById('palco');
  if (!palco || !window.Sorteio) return;

  const S = window.Sorteio;
  const temGsap = Boolean(window.gsap);
  const temFlip = temGsap && Boolean(window.Flip);
  const temSplit = temGsap && Boolean(window.SplitText);
  if (temFlip) gsap.registerPlugin(Flip);
  if (temSplit) gsap.registerPlugin(SplitText);
  const semMovimento = S.REDUZIR_MOVIMENTO || !temGsap;

  const formSortear = document.getElementById('form-sortear');
  const botao = document.getElementById('botao-sortear');
  const textoBotao = botao?.querySelector('.botao-sortear-texto');
  const fitaEl = document.getElementById('roleta-fita');
  const revelacao = document.getElementById('revelacao');
  const ordemEl = document.getElementById('revelacao-ordem');
  const nomeEl = document.getElementById('revelacao-nome');
  const anuncio = document.getElementById('anuncio');
  const listaDisponiveis = document.getElementById('lista-disponiveis');
  const listaSorteados = document.getElementById('lista-sorteados');

  const VELOCIDADE = 16;          // nomes por segundo enquanto espera o servidor
  const PARADA_ALVO = 4.0;        // segundos do clique até a fita parar (SC-005: 3–6 s)
  const DESACELERACAO_MINIMA = 2.6;
  const QUIQUE = 0.35;
  const TEMPO_LIMITE = 8000;      // ms; depois disso o sorteio é abandonado com erro

  let emAndamento = false;
  let pularPedido = false;   // o professor pediu para pular antes da resposta chegar
  let pulando = false;       // o professor pulou durante a desaceleração
  let linhaDoTempo = null;
  let divisao = null;

  /* ------------------------------------------------------------------------
   * Fita virtual: 7 linhas reaproveitadas; a posição `pos` é contínua e a
   * linha do meio é sempre o nome em `nomeEm(Math.round(pos))`.
   * ---------------------------------------------------------------------- */

  function embaralharParaExibir(nomes) {
    const copia = nomes.slice();
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function criarFita() {
    const nomesDisponiveis = [...listaDisponiveis.querySelectorAll('[data-nome]')].map((li) => li.dataset.nome);
    let nomes = nomesDisponiveis;
    if (nomes.length < 4) {
      // Poucos disponíveis: completa a fita com nomes já sorteados só para dar ritmo.
      const extras = [...listaSorteados.querySelectorAll('[data-nome]')].map((li) => li.dataset.nome);
      nomes = nomes.concat(extras);
    }
    if (!nomes.length) nomes = ['…'];
    nomes = embaralharParaExibir(nomes);

    fitaEl.replaceChildren();
    const linhas = [];
    for (let j = -3; j <= 3; j += 1) {
      const linha = document.createElement('div');
      linha.className = 'fita-item';
      fitaEl.append(linha);
      linhas.push({ j, el: linha, texto: '' });
    }
    const altura = linhas[0].el.offsetHeight || 80;
    const fixos = new Map();
    const estado = { pos: 0 };

    const nomeEm = (indice) => fixos.get(indice)
      ?? nomes[((indice % nomes.length) + nomes.length) % nomes.length];

    function desenhar() {
      const base = Math.floor(estado.pos);
      const fracao = estado.pos - base;
      for (const linha of linhas) {
        const texto = nomeEm(base + linha.j);
        if (texto !== linha.texto) {
          linha.el.textContent = texto;
          linha.texto = texto;
        }
        const distancia = linha.j - fracao;
        const afastamento = Math.min(Math.abs(distancia), 3);
        linha.el.style.transform =
          `translate3d(0, ${distancia * altura}px, 0) scale(${1 - afastamento * 0.14})`;
        linha.el.style.opacity = String(Math.max(0, 1 - afastamento * 0.4));
      }
    }

    desenhar();
    return {
      estado,
      desenhar,
      fixar(indice, nome) { fixos.set(indice, nome); },
    };
  }

  /* ------------------------------------------------------------------------
   * Versão do estado (RN-06): a tela envia a versão que conhece; o servidor
   * recusa ações sobre um estado antigo (ex.: outra aba).
   * ---------------------------------------------------------------------- */

  function dadosComVersao() {
    return { versao: palco.dataset.versao };
  }

  /** Atualiza a versão da tela; devolve true se a tela estava desatualizada. */
  function sincronizarVersao(dados) {
    if (!dados || !Number.isFinite(dados.versao)) return false;
    const desatualizada = String(dados.versao) !== palco.dataset.versao;
    palco.dataset.versao = String(dados.versao);
    document.querySelectorAll('input[name="versao"]').forEach((campo) => { campo.value = dados.versao; });
    return desatualizada;
  }

  function recarregarDepois() {
    setTimeout(() => window.location.reload(), 1800);
  }

  /* ------------------------------------------------------------------------
   * Estado da tela (a partir dos números enviados pelo servidor)
   * ---------------------------------------------------------------------- */

  function definirTextoBotao(texto) {
    if (textoBotao) textoBotao.textContent = texto;
  }

  function atualizarEstado(disponiveis, sorteados) {
    if (disponiveis === 0) {
      palco.dataset.estado = disponiveis + sorteados === 0 ? 'vazio' : 'completo';
    } else {
      palco.dataset.estado = 'pronto';
    }
    if (botao) botao.disabled = disponiveis === 0;
    document.querySelectorAll('[data-contador="disponiveis"]').forEach((el) => S.animarNumero(el, disponiveis));
    document.querySelectorAll('[data-contador="sorteados"]').forEach((el) => S.animarNumero(el, sorteados));
    // Botões que só fazem sentido com alguém sorteado na rodada (reiniciar, desfazer).
    document.querySelectorAll('[data-requer-sorteados]').forEach((el) => { el.disabled = sorteados === 0; });
  }

  function anunciar(texto) {
    if (!anuncio) return;
    anuncio.textContent = '';
    setTimeout(() => { anuncio.textContent = texto; }, 50);
  }

  /* ------------------------------------------------------------------------
   * Revelação e movimentação nas listas
   * ---------------------------------------------------------------------- */

  function prepararRevelacao(dados) {
    if (divisao) {
      divisao.revert();
      divisao = null;
    }
    revelacao.classList.remove('vencedor');
    nomeEl.classList.remove('revelacao-convite');
    ordemEl.textContent = `${dados.ordem}º sorteado`;
    nomeEl.textContent = dados.nome;
  }

  function criarItemSorteado(dados) {
    const li = document.createElement('li');
    li.className = 'item-aluno item-sorteado recente';
    li.dataset.alunoId = dados.id;
    li.dataset.nome = dados.nome;
    const ordem = document.createElement('span');
    ordem.className = 'item-aluno-ordem numero';
    ordem.textContent = `${dados.ordem}º`;
    const nome = document.createElement('span');
    nome.className = 'item-aluno-nome';
    nome.textContent = dados.nome;
    li.append(ordem, nome);
    return li;
  }

  function visivelNaLista(item, lista) {
    if (!item) return false;
    const a = item.getBoundingClientRect();
    const b = lista.getBoundingClientRect();
    return a.height > 0 && a.bottom > b.top && a.top < b.bottom;
  }

  function moverParaSorteados(dados, instantaneo) {
    const origem = listaDisponiveis.querySelector(`[data-aluno-id="${dados.id}"]`);
    listaSorteados.querySelectorAll('.recente').forEach((li) => li.classList.remove('recente'));
    const destino = criarItemSorteado(dados);
    listaSorteados.append(destino);
    listaSorteados.scrollTop = listaSorteados.scrollHeight;

    const podeVoar = !instantaneo && !semMovimento && temFlip && visivelNaLista(origem, listaDisponiveis)
      && visivelNaLista(destino, listaSorteados);
    if (podeVoar) {
      // Uma cópia fixa na tela voa até o lugar do item novo (sem ser cortada pelas listas).
      const inicio = origem.getBoundingClientRect();
      const fantasma = origem.cloneNode(true);
      fantasma.classList.add('item-voando');
      Object.assign(fantasma.style, {
        top: `${inicio.top}px`, left: `${inicio.left}px`, width: `${inicio.width}px`, height: `${inicio.height}px`,
      });
      document.body.append(fantasma);
      destino.style.opacity = '0';
      origem.remove();
      Flip.fit(fantasma, destino, {
        duration: 0.6,
        ease: 'power2.inOut',
        absolute: true,
        onComplete: () => {
          fantasma.remove();
          destino.style.opacity = '';
        },
      });
    } else if (origem) {
      origem.remove();
    }
  }

  function soltarConfete() {
    if (semMovimento || typeof window.confetti !== 'function') return;
    const base = {
      particleCount: 70,
      spread: 62,
      startVelocity: 48,
      ticks: 220,
      colors: ['#1F8A4C', '#F5B83D', '#FFFFFF'],
      disableForReducedMotion: true,
      zIndex: 1080,
    };
    window.confetti({ ...base, angle: 60, origin: { x: 0.12, y: 0.8 } });
    window.confetti({ ...base, angle: 120, origin: { x: 0.88, y: 0.8 } });
  }

  function concluir(dados) {
    delete palco.dataset.ocupado;
    emAndamento = false;
    pularPedido = false;
    pulando = false;
    linhaDoTempo = null;
    definirTextoBotao('Sortear');
    atualizarEstado(dados.disponiveis, dados.sorteados);
    anunciar(`Sorteado: ${dados.nome}`);
  }

  /* Sem movimento (prefers-reduced-motion, sem GSAP ou quando o professor pula). */
  function revelarDireto(dados) {
    if (linhaDoTempo) linhaDoTempo.kill();
    prepararRevelacao(dados);
    revelacao.classList.add('vencedor');
    palco.dataset.estado = 'pronto';
    if (temGsap && !S.REDUZIR_MOVIMENTO) {
      gsap.fromTo(revelacao, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none', clearProps: 'opacity' });
    } else if (S.REDUZIR_MOVIMENTO) {
      revelacao.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    }
    moverParaSorteados(dados, true);
    concluir(dados);
  }

  function falhar(mensagem, dados) {
    delete palco.dataset.ocupado;
    if (linhaDoTempo) linhaDoTempo.kill();
    linhaDoTempo = null;
    emAndamento = false;
    pularPedido = false;
    definirTextoBotao('Sortear');
    palco.dataset.estado = 'pronto';
    const desatualizada = sincronizarVersao(dados);
    if (dados && Number.isFinite(dados.disponiveis)) {
      atualizarEstado(dados.disponiveis, dados.sorteados);
    } else if (botao) {
      botao.disabled = false;
    }
    S.mostrarToast(mensagem, 'erro');
    if (desatualizada) recarregarDepois();
  }

  /* ------------------------------------------------------------------------
   * O sorteio
   * ---------------------------------------------------------------------- */

  function pular() {
    if (linhaDoTempo && linhaDoTempo.data === 'revelacao') {
      pulando = true;
      linhaDoTempo.progress(1);
    } else {
      pularPedido = true;
    }
  }

  async function sortear() {
    if (emAndamento) {
      pular();
      return;
    }
    if (!botao || botao.disabled) return;
    emAndamento = true;
    pularPedido = false;
    palco.dataset.ocupado = '1';
    botao.disabled = true;
    definirTextoBotao('Sorteando…');

    const inicio = performance.now();
    let fita = null;
    if (!semMovimento) {
      palco.dataset.estado = 'sorteando';
      fita = criarFita();
      linhaDoTempo = gsap.to(fita.estado, {
        pos: '+=10000',
        duration: 10000 / VELOCIDADE,
        ease: 'none',
        onUpdate: fita.desenhar,
      });
    }

    let resposta;
    try {
      resposta = await S.enviarPost(palco.dataset.urlSortear, dadosComVersao(), { tempoLimite: TEMPO_LIMITE });
    } catch (erro) {
      falhar('Não foi possível sortear. Confira a conexão e tente de novo.');
      return;
    }
    const dados = resposta.dados || {};
    if (resposta.status !== 200 || !dados.ok) {
      falhar(dados.mensagem || 'Não foi possível sortear. Tente de novo.', dados);
      return;
    }

    sincronizarVersao(dados);
    if (semMovimento || pularPedido) {
      revelarDireto(dados);
      return;
    }

    // Desaceleração com a mesma velocidade de saída do giro (power4.out começa a 4×).
    linhaDoTempo.kill();
    const decorrido = (performance.now() - inicio) / 1000;
    const desaceleracao = Math.max(DESACELERACAO_MINIMA, PARADA_ALVO - decorrido - QUIQUE);
    const alvo = Math.round(fita.estado.pos) + Math.max(8, Math.round((VELOCIDADE * desaceleracao) / 4));
    fita.fixar(alvo, dados.nome);
    prepararRevelacao(dados);

    const tl = gsap.timeline({ data: 'revelacao', onComplete: () => concluir(dados) });
    linhaDoTempo = tl;
    tl.to(fita.estado, { pos: alvo + 0.08, duration: desaceleracao, ease: 'power4.out', onUpdate: fita.desenhar })
      .to(fita.estado, { pos: alvo, duration: QUIQUE, ease: 'back.out(3)', onUpdate: fita.desenhar })
      .call(() => {
        palco.dataset.estado = 'pronto';
        revelacao.classList.add('vencedor');
      })
      .from(ordemEl, { opacity: 0, y: 8, duration: 0.3, ease: 'power2.out' }, '<');

    if (temSplit) {
      divisao = SplitText.create(nomeEl, { type: 'words,chars', aria: 'auto' });
      tl.from(divisao.chars, {
        yPercent: 70,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: { amount: Math.min(0.6, divisao.chars.length * 0.03) },
      }, '<');
    } else {
      tl.from(nomeEl, { opacity: 0, y: 16, duration: 0.4, ease: 'power3.out' }, '<');
    }

    tl.call(soltarConfete, null, '<0.1')
      .call(() => moverParaSorteados(dados, pulando), null, '+=0.25');
  }

  /* ------------------------------------------------------------------------
   * Desfazer último (aluno ausente): o item volta para "Disponíveis".
   * ---------------------------------------------------------------------- */

  const formDesfazer = document.getElementById('form-desfazer');

  function devolverParaDisponiveis(dados) {
    const item = listaSorteados.querySelector(`[data-aluno-id="${dados.id}"]`)
      || [...listaSorteados.children].reverse().find((li) => li.dataset.nome === dados.nome);
    if (!dados.id) {
      item?.remove();
      return;
    }
    const novo = document.createElement('li');
    novo.className = 'item-aluno';
    novo.dataset.alunoId = dados.id;
    novo.dataset.nome = dados.nome;
    const nome = document.createElement('span');
    nome.className = 'item-aluno-nome';
    nome.textContent = dados.nome;
    novo.append(nome);
    // Volta para a posição original da lista colada (o id é a posição na lista).
    const depois = [...listaDisponiveis.children]
      .find((li) => Number(li.dataset.alunoId) > Number(dados.id));
    listaDisponiveis.insertBefore(novo, depois || null);

    if (!semMovimento && temFlip && item && visivelNaLista(item, listaSorteados)) {
      novo.scrollIntoView({ block: 'nearest' });
      const inicio = item.getBoundingClientRect();
      const fantasma = item.cloneNode(true);
      fantasma.classList.add('item-voando');
      Object.assign(fantasma.style, {
        top: `${inicio.top}px`, left: `${inicio.left}px`, width: `${inicio.width}px`, height: `${inicio.height}px`,
      });
      document.body.append(fantasma);
      novo.style.opacity = '0';
      item.remove();
      Flip.fit(fantasma, novo, {
        duration: 0.45,
        ease: 'power2.inOut',
        absolute: true,
        onComplete: () => {
          fantasma.remove();
          novo.style.opacity = '';
        },
      });
    } else {
      item?.remove();
    }
  }

  function mostrarUltimoDaLista() {
    const ultimo = listaSorteados.lastElementChild;
    if (divisao) {
      divisao.revert();
      divisao = null;
    }
    revelacao.classList.remove('vencedor');
    if (ultimo) {
      ordemEl.textContent = ultimo.querySelector('.item-aluno-ordem')?.textContent.replace('º', 'º sorteado') || '';
      nomeEl.textContent = ultimo.dataset.nome;
      nomeEl.classList.remove('revelacao-convite');
    } else {
      ordemEl.textContent = '';
      nomeEl.textContent = 'Quem será?';
      nomeEl.classList.add('revelacao-convite');
    }
  }

  async function desfazer() {
    if (emAndamento || !formDesfazer) return;
    const botaoDesfazer = formDesfazer.querySelector('button');
    if (botaoDesfazer.disabled) return;
    botaoDesfazer.disabled = true;
    let resposta;
    try {
      resposta = await S.enviarPost(palco.dataset.urlDesfazer, dadosComVersao());
    } catch (erro) {
      botaoDesfazer.disabled = false;
      S.mostrarToast('Não foi possível desfazer agora. Tente de novo.', 'erro');
      return;
    }
    const dados = resposta.dados || {};
    if (resposta.status !== 200 || !dados.ok) {
      const desatualizada = sincronizarVersao(dados);
      S.mostrarToast(dados.mensagem || 'Não foi possível desfazer.', 'erro');
      if (Number.isFinite(dados.disponiveis)) atualizarEstado(dados.disponiveis, dados.sorteados);
      if (desatualizada) recarregarDepois();
      return;
    }
    sincronizarVersao(dados);
    devolverParaDisponiveis(dados);
    mostrarUltimoDaLista();
    atualizarEstado(dados.disponiveis, dados.sorteados);
    S.mostrarToast(dados.mensagem, 'sucesso');
  }

  formDesfazer?.addEventListener('submit', (evento) => {
    evento.preventDefault();
    desfazer();
  });

  /* ------------------------------------------------------------------------
   * Modo apresentação: tela cheia só com o palco e o botão (projetor).
   * ---------------------------------------------------------------------- */

  const botaoApresentacao = document.getElementById('botao-apresentacao');

  function emTelaCheia() {
    return Boolean(document.fullscreenElement);
  }

  function aplicarModoApresentacao(ativo) {
    document.body.classList.toggle('modo-apresentacao', ativo);
    botaoApresentacao?.setAttribute('aria-pressed', String(ativo));
    const icone = botaoApresentacao?.querySelector('.bi');
    if (icone) icone.className = `bi ${ativo ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`;
  }

  async function alternarApresentacao() {
    try {
      if (emTelaCheia()) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else aplicarModoApresentacao(!document.body.classList.contains('modo-apresentacao'));
    } catch (erro) {
      // Sem permissão para tela cheia: aplica só o layout de apresentação.
      aplicarModoApresentacao(!document.body.classList.contains('modo-apresentacao'));
    }
  }

  document.addEventListener('fullscreenchange', () => aplicarModoApresentacao(emTelaCheia()));
  botaoApresentacao?.addEventListener('click', alternarApresentacao);

  /* ------------------------------------------------------------------------
   * Eventos
   * ---------------------------------------------------------------------- */

  formSortear?.addEventListener('submit', (evento) => {
    evento.preventDefault();
    sortear();
  });

  function campoDeTexto(alvo) {
    return alvo.closest('input, textarea, select, [contenteditable="true"]');
  }

  function modalAberto() {
    return Boolean(document.querySelector('.modal.show'));
  }

  document.addEventListener('keydown', (evento) => {
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if (campoDeTexto(evento.target) || modalAberto()) return;

    if (emAndamento && ['Space', 'Enter', 'Escape'].includes(evento.code)) {
      evento.preventDefault();
      pular();
      return;
    }
    if (evento.code === 'KeyF') {
      evento.preventDefault();
      alternarApresentacao();
      return;
    }
    if (evento.code === 'KeyZ') {
      evento.preventDefault();
      desfazer();
      return;
    }
    if (evento.code === 'Space') {
      // Em outros botões/links o Espaço mantém o comportamento normal do navegador.
      const outroControle = evento.target.closest('a, button') && evento.target !== botao;
      if (outroControle) return;
      evento.preventDefault();
      sortear();
    }
  });

  /* Celular: alterna entre as listas Disponíveis e Já sorteados. */
  document.querySelectorAll('[data-mostrar-lista]').forEach((alternar) => {
    alternar.addEventListener('click', () => {
      palco.dataset.listaAtiva = alternar.dataset.mostrarLista;
      document.querySelectorAll('[data-mostrar-lista]').forEach((outro) => {
        outro.setAttribute('aria-pressed', String(outro === alternar));
      });
    });
  });

})();
