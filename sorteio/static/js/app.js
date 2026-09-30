/*
 * Interações gerais do Sorteio de Alunos.
 *
 * Regra: este arquivo só exibe e envia dados. Nenhuma regra de negócio mora aqui —
 * quem decide (sortear, detectar duplicados, contar) é o servidor.
 */
(function () {
  'use strict';

  const REDUZIR_MOVIMENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lerCookie(nome) {
    const par = document.cookie.split('; ').find((item) => item.startsWith(nome + '='));
    return par ? decodeURIComponent(par.split('=')[1]) : '';
  }

  /** POST com CSRF; devolve {status, dados}. Lança erro em falha de rede ou tempo. */
  async function enviarPost(url, dados, opcoes = {}) {
    const corpo = dados instanceof FormData ? dados : new FormData();
    if (!(dados instanceof FormData) && dados) {
      Object.entries(dados).forEach(([chave, valor]) => corpo.append(chave, valor));
    }
    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), opcoes.tempoLimite || 8000);
    try {
      const resposta = await fetch(url, {
        method: 'POST',
        body: corpo,
        headers: {
          'X-CSRFToken': lerCookie('csrftoken'),
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        signal: controle.signal,
      });
      const json = await resposta.json().catch(() => ({}));
      return { status: resposta.status, dados: json };
    } finally {
      clearTimeout(limite);
    }
  }

  /* ---------------------------------------------------------------------------
   * Toasts
   * ------------------------------------------------------------------------- */

  const ICONES = {
    sucesso: 'bi-check2-circle',
    info: 'bi-info-circle',
    aviso: 'bi-exclamation-triangle',
    erro: 'bi-exclamation-octagon',
  };

  function fecharToast(toast) {
    toast.classList.remove('visivel');
    setTimeout(() => toast.remove(), 320);
  }

  function ativarToast(toast) {
    toast.querySelector('.toast-fechar')?.addEventListener('click', () => fecharToast(toast));
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('visivel')));
    const duracao = toast.classList.contains('erro') ? 7000 : 4500;
    setTimeout(() => fecharToast(toast), duracao);
  }

  function mostrarToast(mensagem, tipo = 'sucesso') {
    const area = document.getElementById('toasts');
    if (!area || !mensagem) return;
    const toast = document.createElement('div');
    toast.className = 'toast-msg ' + tipo;
    toast.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    const icone = document.createElement('i');
    icone.className = 'bi ' + (ICONES[tipo] || ICONES.info);
    icone.setAttribute('aria-hidden', 'true');
    const texto = document.createElement('p');
    texto.className = 'toast-texto';
    texto.textContent = mensagem;
    const fechar = document.createElement('button');
    fechar.type = 'button';
    fechar.className = 'toast-fechar';
    fechar.setAttribute('aria-label', 'Fechar mensagem');
    fechar.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
    toast.append(icone, texto, fechar);
    area.append(toast);
    ativarToast(toast);
  }

  /* ---------------------------------------------------------------------------
   * Confirmação antes de ações destrutivas (form[data-confirmar])
   * ------------------------------------------------------------------------- */

  function configurarConfirmacoes() {
    const elemento = document.getElementById('modal-confirmacao');
    if (!elemento || !window.bootstrap) return;
    const modal = bootstrap.Modal.getOrCreateInstance(elemento);
    const titulo = document.getElementById('modal-confirmacao-titulo');
    const texto = document.getElementById('modal-confirmacao-texto');
    const botao = document.getElementById('modal-confirmacao-botao');
    let formularioPendente = null;

    document.addEventListener('submit', (evento) => {
      const form = evento.target;
      if (!form.matches('form[data-confirmar]') || form.dataset.confirmado === '1') return;
      evento.preventDefault();
      evento.stopImmediatePropagation();
      formularioPendente = form;
      titulo.textContent = form.dataset.confirmarTitulo || 'Tem certeza?';
      texto.textContent = form.dataset.confirmar;
      botao.textContent = form.dataset.confirmarBotao || 'Confirmar';
      modal.show();
    }, true);

    botao.addEventListener('click', () => {
      if (!formularioPendente) return;
      const form = formularioPendente;
      formularioPendente = null;
      form.dataset.confirmado = '1';
      modal.hide();
      form.requestSubmit ? form.requestSubmit() : form.submit();
    });

    elemento.addEventListener('shown.bs.modal', () => botao.focus());
  }

  /* ---------------------------------------------------------------------------
   * Contadores animados
   * ------------------------------------------------------------------------- */

  function animarNumero(elemento, valor) {
    if (!elemento) return;
    const destino = Number(valor);
    const atual = Number(elemento.textContent) || 0;
    if (REDUZIR_MOVIMENTO || !window.gsap || atual === destino) {
      elemento.textContent = destino;
      return;
    }
    const proxy = { n: atual };
    gsap.to(proxy, {
      n: destino,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => { elemento.textContent = Math.round(proxy.n); },
    });
  }

  /* ---------------------------------------------------------------------------
   * Prévia da importação ao vivo (textarea[data-url-previa])
   * A leitura e a detecção de duplicados acontecem no servidor; aqui só desenhamos.
   * ------------------------------------------------------------------------- */

  const AVISOS_PREVIA = {
    inicial: 'Cole a lista abaixo para ver os nomes aqui.',
    vazio: 'Nenhum nome encontrado. Confira se copiou a lista de alunos do SUAP ou digite um nome por linha.',
    suap: 'Lista do SUAP reconhecida: só os nomes serão usados.',
    lista: 'Lista simples: um nome por linha, só com letras.',
  };

  function desenharPrevia(area, dados) {
    const campo = (nome) => area.querySelector(`[data-previa="${nome}"]`);
    animarNumero(campo('encontrados'), dados.encontrados);
    if (campo('novos')) animarNumero(campo('novos'), dados.novos);
    if (campo('ja_na_lista')) animarNumero(campo('ja_na_lista'), dados.ja_na_lista);

    const aviso = campo('aviso');
    const tipo = dados.inicial ? 'inicial' : (dados.encontrados ? dados.formato : 'vazio');
    aviso.textContent = AVISOS_PREVIA[tipo];
    if (dados.descartadas) {
      // RN-15: linhas sem nome (números, traços, símbolos) foram ignoradas pelo servidor.
      aviso.textContent += dados.descartadas === 1
        ? ' 1 linha sem nome foi ignorada.'
        : ` ${dados.descartadas} linhas sem nome foram ignoradas.`;
    }
    if (tipo === 'vazio') aviso.dataset.tipo = 'vazio';
    else delete aviso.dataset.tipo;

    // Tela de abertura: rótulo no singular/plural, estado da contagem e "Ver os N nomes".
    const rotulo = campo('rotulo');
    if (rotulo) {
      rotulo.textContent = dados.encontrados === 1 ? 'nome pronto' : 'nomes prontos';
      rotulo.closest('.contagem').dataset.estado = tipo === 'vazio' ? 'erro' : (dados.encontrados ? 'pronto' : 'vazio');
      const resumo = area.querySelector('.abertura-nomes summary');
      if (resumo) resumo.textContent = dados.encontrados === 1 ? 'Ver o nome' : `Ver os ${dados.encontrados} nomes`;
    }

    const itens = (dados.nomes || []).map((item) => {
      const li = document.createElement('li');
      const nome = document.createElement('span');
      nome.className = 'previa-nome';
      if (item.ja_na_lista) {
        li.className = 'duplicado';
        const riscado = document.createElement('s');
        riscado.textContent = item.nome;
        nome.append(riscado);
      } else {
        nome.textContent = item.nome;
      }
      li.append(nome);
      if (item.ja_na_lista) {
        const selo = document.createElement('span');
        selo.className = 'selo selo-sorteado';
        selo.textContent = 'já na lista';
        li.append(selo);
      }
      return li;
    });
    campo('lista').replaceChildren(...itens);
    area.dispatchEvent(new CustomEvent('previa:nomes', {
      bubbles: true,
      detail: { nomes: (dados.nomes || []).map((item) => item.nome), encontrados: dados.encontrados },
    }));
  }

  function configurarPreviaAoVivo() {
    document.querySelectorAll('textarea[data-url-previa]').forEach((campo) => {
      const area = document.querySelector(campo.dataset.previaAlvo);
      if (!area) return;
      let espera = null;
      let pedido = 0;

      async function atualizar() {
        const texto = campo.value;
        const meu = ++pedido;
        if (!texto.trim()) {
          desenharPrevia(area, { inicial: true, encontrados: 0, novos: 0, ja_na_lista: 0, nomes: [] });
          return;
        }
        try {
          const { status, dados } = await enviarPost(campo.dataset.urlPrevia, { texto });
          if (meu !== pedido) return; // chegou uma resposta mais nova
          if (status === 200) desenharPrevia(area, dados);
          else mostrarToast(dados.mensagem || 'Não foi possível ler a lista.', 'erro');
        } catch (erro) {
          if (meu === pedido) mostrarToast('Não foi possível atualizar a prévia agora.', 'aviso');
        }
      }

      campo.addEventListener('input', () => {
        clearTimeout(espera);
        espera = setTimeout(atualizar, 350);
      });
      if (campo.value.trim()) atualizar(); // texto que voltou numa recusa do servidor
    });
  }

  /* ---------------------------------------------------------------------------
   * Tela de abertura: botão "Começar" só com nomes; Ctrl+Enter começa.
   * (O servidor valida de novo ao receber: isto é só a apresentação.)
   * ------------------------------------------------------------------------- */

  function configurarAbertura() {
    const form = document.getElementById('form-abertura');
    if (!form) return;
    const campo = form.querySelector('textarea');
    const botao = document.getElementById('abertura-comecar');
    const atualizarBotao = (encontrados) => { botao.disabled = !encontrados; };
    atualizarBotao(campo.value.trim() ? 1 : 0);
    form.addEventListener('previa:nomes', (evento) => atualizarBotao(evento.detail.encontrados));
    campo.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey) && !botao.disabled) {
        evento.preventDefault();
        form.requestSubmit ? form.requestSubmit() : form.submit();
      }
    });
    if (!campo.value) campo.focus({ preventScroll: true });
  }

  /* ---------------------------------------------------------------------------
   * Letreiro de ensaio: miniatura da roleta. Gira devagar com nomes de exemplo;
   * ao colar a lista, dá um giro curto e passa a mostrar os nomes da turma.
   * Com "reduzir movimento" (ou sem GSAP), fica parado.
   * ------------------------------------------------------------------------- */

  function configurarEnsaio() {
    const ensaio = document.getElementById('ensaio');
    if (!ensaio) return;
    const fita = ensaio.querySelector('.ensaio-fita');
    const exemplos = ensaio.dataset.nomesExemplo.split('|');
    const animar = Boolean(window.gsap) && !REDUZIR_MOVIMENTO;
    let nomes = exemplos;
    let indice = 0;
    let girando = false;
    let assinaturaAtual = '';

    const nomeEm = (i) => nomes[((i % nomes.length) + nomes.length) % nomes.length];
    const altura = () => fita.firstElementChild?.offsetHeight || 48;

    // Monta as linhas de (indice - 2) até (indice + 2 + extra); a 2ª linha fica no topo visível.
    function montar(extra = 0) {
      const linhas = [];
      for (let d = -2; d <= 2 + extra; d += 1) {
        const li = document.createElement('li');
        li.textContent = nomeEm(indice + d);
        linhas.push(li);
      }
      fita.replaceChildren(...linhas);
      if (animar) gsap.set(fita, { y: -altura() });
      else fita.style.transform = `translateY(${-altura()}px)`;
    }

    function avancar(passos, duracao, ease) {
      if (!animar || girando) return;
      girando = true;
      montar(passos);
      gsap.to(fita, {
        y: -altura() * (1 + passos),
        duration: duracao,
        ease,
        onComplete: () => {
          indice += passos;
          montar();
          girando = false;
        },
      });
    }

    montar();
    if (animar) {
      setInterval(() => { if (!document.hidden) avancar(1, 0.45, 'power3.out'); }, 2200);
    }

    document.addEventListener('previa:nomes', (evento) => {
      const novos = evento.detail.nomes.length ? evento.detail.nomes : exemplos;
      const assinatura = novos.join('|');
      if (assinatura === assinaturaAtual) return;
      assinaturaAtual = assinatura;
      nomes = novos;
      indice = 0;
      if (animar) {
        gsap.killTweensOf(fita);
        girando = false;
        avancar(Math.min(10, Math.max(3, nomes.length)), 0.9, 'power4.out');
      } else {
        montar();
      }
    });
  }

  /* ---------------------------------------------------------------------------
   * Inicialização
   * ------------------------------------------------------------------------- */

  function iniciar() {
    document.querySelectorAll('#toasts .toast-msg').forEach(ativarToast);
    configurarConfirmacoes();
    configurarAbertura();
    configurarEnsaio();
    configurarPreviaAoVivo();
  }

  window.Sorteio = {
    REDUZIR_MOVIMENTO,
    lerCookie,
    enviarPost,
    mostrarToast,
    animarNumero,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
