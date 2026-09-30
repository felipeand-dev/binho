/*
 * Animação do sorteio (tela de sorteio).
 *
 * Regra de ouro (RN-10): quem escolhe o aluno é o servidor. Este arquivo só pede o
 * sorteio, recebe o resultado e faz a fita de nomes parar exatamente nele. A ordem
 * embaralhada dos nomes que passam na fita é apenas visual.
 *
 * Linha do tempo (docs/diretrizes-visuais.md):
 *   0 s      botão "Sorteando…", holofote intensifica, a roleta começa a girar
 *            mostrando só bytes (0 e 1), todos do mesmo tamanho, em direções opostas
 *   ~0,1 s   resposta do servidor → a roleta desacelera (power4.out)
 *   ~4,3 s   parada com leve quique (back.out)
 *   +1,5 s   decodificação: os bits viram, letra a letra, o nome do sorteado
 *   depois   nome gigante em ouro, confete (canvas-confetti), voo para "Já sorteados"
 *
 * Os bits são só visuais (Math.random no navegador); não influenciam o resultado.
 */
(function () {
  'use strict';

  const palco = document.getElementById('palco');
  if (!palco || !window.Sorteio) return;

  const S = window.Sorteio;
  const temGsap = Boolean(window.gsap);
  const temFlip = temGsap && Boolean(window.Flip);
  if (temFlip) gsap.registerPlugin(Flip);
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
  const BYTES_POR_LINHA = 3;      // toda linha tem o mesmo tamanho: ninguém adivinha pelo comprimento
  const DECODIFICACAO = 1.5;      // segundos para os bits virarem o nome

  let emAndamento = false;
  let pularPedido = false;   // o professor pediu para pular antes da resposta chegar
  let pulando = false;       // o professor pulou durante a desaceleração
  let linhaDoTempo = null;

  /* ------------------------------------------------------------------------
   * Bytes de exibição: cada linha da roleta é uma sequência de 0 e 1.
   * Gerados a partir do número da linha, para a mesma linha não "piscar" ao
   * ser redesenhada. Só visual: o sorteado vem do servidor.
   * ---------------------------------------------------------------------- */

  function geradorDeBits(semente) {
    let x = semente >>> 0;
    return () => {
      x = (x + 0x6D2B79F5) >>> 0;
      let t = Math.imul(x ^ (x >>> 15), 1 | x);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) & 1;
    };
  }

  function bytes(quantidade, proximoBit) {
    const lista = [];
    for (let b = 0; b < quantidade; b += 1) {
      let byte = '';
      for (let i = 0; i < 8; i += 1) byte += proximoBit();
      lista.push(byte);
    }
    return lista.join(' ');
  }

  const bitAleatorio = () => (Math.random() < 0.5 ? '0' : '1');

  /* ------------------------------------------------------------------------
   * Fita virtual: 7 linhas reaproveitadas; a posição `pos` é contínua e a
   * linha do meio é sempre a de índice Math.round(pos). Cada linha é uma
   * faixa de bytes que corre na horizontal, alternando a direção.
   * ---------------------------------------------------------------------- */

  function criarFita() {
    const sal = Math.floor(Math.random() * 1e9);
    const bitsEm = (indice) => bytes(BYTES_POR_LINHA, geradorDeBits(sal + indice * 7919));

    fitaEl.replaceChildren();
    const linhas = [];
    for (let j = -3; j <= 3; j += 1) {
      const linha = document.createElement('div');
      linha.className = 'fita-item';
      const faixa = document.createElement('span');
      faixa.className = 'fita-bits';
      linha.append(faixa);
      fitaEl.append(linha);
      linhas.push({ j, el: linha, faixa, indice: null });
    }
    const altura = linhas[0].el.offsetHeight || 80;
    const estado = { pos: 0 };

    function desenhar() {
      const base = Math.floor(estado.pos);
      const fracao = estado.pos - base;
      for (const linha of linhas) {
        const indice = base + linha.j;
        if (indice !== linha.indice) {
          const trecho = bitsEm(indice);
          // A faixa repete o trecho para a rolagem horizontal não ter emenda.
          linha.faixa.textContent = `${trecho} ${trecho} ${trecho} ${trecho}`;
          linha.el.classList.toggle('para-direita', Math.abs(indice) % 2 === 1);
          linha.indice = indice;
        }
        const distancia = linha.j - fracao;
        const afastamento = Math.min(Math.abs(distancia), 3);
        linha.el.style.transform =
          `translate3d(0, ${distancia * altura}px, 0) scale(${1 - afastamento * 0.14})`;
        linha.el.style.opacity = String(Math.max(0, 1 - afastamento * 0.4));
      }
    }

    desenhar();
    return { estado, desenhar, bitsEm };
  }

  /* ------------------------------------------------------------------------
   * Decodificação: os bits viram o nome, letra a letra (esquerda → direita).
   * Posições ainda não reveladas mostram 0/1 trocando ~20 vezes por segundo.
   * ---------------------------------------------------------------------- */

  function misturarBitsENome(inicial, nome, progresso) {
    const FASE_TAMANHO = 0.18; // primeiro os bits encolhem/crescem até o tamanho do nome
    if (progresso < FASE_TAMANHO) {
      const t = progresso / FASE_TAMANHO;
      const tamanho = Math.round(inicial.length + (nome.length - inicial.length) * t);
      let texto = '';
      for (let i = 0; i < tamanho; i += 1) texto += inicial[i] === ' ' ? ' ' : bitAleatorio();
      return texto;
    }
    const revelados = Math.floor(((progresso - FASE_TAMANHO) / (1 - FASE_TAMANHO)) * nome.length);
    let texto = nome.slice(0, revelados);
    for (let i = revelados; i < nome.length; i += 1) texto += nome[i] === ' ' ? ' ' : bitAleatorio();
    return texto;
  }

  function adicionarDecodificacao(tl, inicial, nome) {
    const estado = { p: 0 };
    let ultimoQuadro = 0;
    tl.to(estado, {
      p: 1,
      duration: DECODIFICACAO,
      ease: 'none',
      onUpdate: () => {
        const agora = performance.now();
        if (agora - ultimoQuadro < 50 && estado.p < 1) return; // ~20 trocas por segundo
        ultimoQuadro = agora;
        nomeEl.textContent = misturarBitsENome(inicial, nome, estado.p);
      },
    });
    tl.call(() => {
      nomeEl.textContent = nome;
      nomeEl.classList.remove('decodificando');
      revelacao.classList.add('vencedor');
    });
    tl.fromTo(
      nomeEl,
      { opacity: 0.35, scale: 0.94 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'power3.out',
        immediateRender: false, // o estado inicial só vale na hora de assentar
        clearProps: 'opacity,transform',
      },
    );
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

  /* Com `bitsIniciais`, o nome só aparece na decodificação (nunca antes da hora). */
  function prepararRevelacao(dados, bitsIniciais = null) {
    revelacao.classList.remove('vencedor');
    nomeEl.classList.remove('revelacao-convite');
    ordemEl.textContent = `${dados.ordem}º sorteado`;
    if (bitsIniciais) {
      nomeEl.classList.add('decodificando');
      nomeEl.textContent = bitsIniciais;
    } else {
      nomeEl.classList.remove('decodificando');
      nomeEl.textContent = dados.nome;
    }
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
    prepararRevelacao(dados, fita.bitsEm(alvo));

    const tl = gsap.timeline({ data: 'revelacao', onComplete: () => concluir(dados) });
    linhaDoTempo = tl;
    tl.to(fita.estado, { pos: alvo + 0.08, duration: desaceleracao, ease: 'power4.out', onUpdate: fita.desenhar })
      .to(fita.estado, { pos: alvo, duration: QUIQUE, ease: 'back.out(3)', onUpdate: fita.desenhar })
      .call(() => {
        palco.dataset.estado = 'pronto';
      })
      .from(ordemEl, { opacity: 0, y: 8, duration: 0.3, ease: 'power2.out' }, '<');
    // Os bits da linha que parou no meio passam para o centro e viram o nome.
    adicionarDecodificacao(tl, fita.bitsEm(alvo), dados.nome);

    tl.call(soltarConfete, null, '<')
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
    nomeEl.classList.remove('decodificando');
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
