# Pesquisa (Fase 0): Sorteio de Alunos por Turma

Cada item registra a **Decisão**, a **Justificativa** e as **Alternativas consideradas**.
Não restou nenhum ponto "NEEDS CLARIFICATION" no Contexto Técnico; os pontos que dependem
de decisão do usuário estão no fim do `plan.md`.

## 1. Atomicidade do sorteio no SQLite (RN-15, FR-022, SC-007)

- **Decisão**: `Sorteio.sortear(turma)` roda dentro de `transaction.atomic()` e marca o
  aluno com UPDATE condicional (`Aluno.objects.filter(pk=id, sorteado=False)
  .update(sorteado=True)`), aceitando o resultado só se 1 linha foi alterada; senão
  escolhe de novo (até 3 tentativas). Além disso:
  - `DATABASES['default']['OPTIONS'] = {'transaction_mode': 'IMMEDIATE', 'timeout': 20}`
    (disponível desde o Django 5.1): cada bloco atômico pega a trava de escrita do SQLite
    logo no início, então dois sorteios simultâneos são executados em fila;
  - `UniqueConstraint(turma, rodada, ordem)` em `Sorteio` como rede de segurança: nunca
    existem dois "3º sorteado" na mesma rodada;
  - `select_for_update()` na turma (sem efeito no SQLite, mas correto se o banco mudar).
- **Justificativa**: o UPDATE condicional impede marcar o mesmo aluno duas vezes; o modo
  IMMEDIATE impede que duas requisições leiam a mesma "próxima ordem" e evita o erro
  "database is locked" no meio da transação (a espera acontece no começo, até 20 s).
- **Alternativas**: só `select_for_update` (ignorado pelo SQLite); trava em memória
  (`threading.Lock`, não vale com mais de um processo); bloquear o duplo clique só no
  JavaScript (não protege contra duas abas nem contra requisições diretas).

## 2. Fonte de aleatoriedade (RN-14, FR-020)

- **Decisão**: `secrets.choice(lista_de_ids_disponiveis)` no servidor. O navegador recebe
  apenas o resultado.
- **Justificativa**: `secrets` usa o gerador criptográfico do sistema operacional:
  imprevisível e sem viés; exigência da constituição (Princípio III).
- **Alternativas**: `random.choice` (previsível, proibido); `ORDER BY RANDOM()` no SQLite
  (não usa fonte criptográfica); escolher no JavaScript (proibido pela constituição).

## 3. Leitura do texto do SUAP (RN-05, RN-07, RN-09, FR-006..FR-008)

- **Decisão**: `sorteio/turmas/importador.py` com funções puras, sem banco:
  - `extrair_alunos(texto) -> list[dict]`: normaliza `\r\n`/`\r` para `\n`; aplica
    `PADRAO_SUAP` (de `docs/importacao-suap.md`, `re.IGNORECASE`); se achar pelo menos
    um aluno, o texto é SUAP; senão, cada linha não vazia vira um aluno sem matrícula;
    remove duplicados dentro do próprio texto; descarta linhas com mais de 150 caracteres.
  - `normalizar_espacos(nome)`: `" ".join(nome.split())` (RN-09, sem mudar maiúsculas).
  - `chave_nome(nome)`: remove acentos (`unicodedata.normalize('NFKD')` + descarta
    marcas combinantes), `casefold()` e normaliza espaços.
  - `mesmo_aluno(a, b)`: regra única de duplicidade (ver `data-model.md`).
- **Justificativa**: expressão regular é rápida, gratuita, funciona sem internet e nunca
  "inventa" nomes; funções puras podem ser conferidas no shell do Django sem banco.
  A regra de duplicidade fica num só lugar e é reutilizada pelo model `Aluno`.
- **Alternativas**: IA para extrair nomes (proibida pela LGPD/constituição); parser
  linha a linha com estados (mais código, mesmo resultado); aceitar arquivo CSV (fora do
  escopo).

## 4. Prévia da importação sem regra no JavaScript (RN-06, FR-009, FR-010)

- **Decisão**: dois caminhos para a mesma lógica do servidor:
  1. **Sem JavaScript**: o formulário tem os botões "Ver prévia" (`acao=previa`) e
     "Confirmar importação" (`acao=confirmar`). A prévia é renderizada no servidor; o
     texto volta no `<textarea>` e é lido de novo na confirmação.
  2. **Com JavaScript**: `app.js` envia o texto (com atraso de ~400 ms após parar de
     digitar/colar) por POST para o endpoint de prévia, que devolve JSON com contadores e
     lista; o JS só desenha o resultado.
- **Justificativa**: a constituição proíbe regra de negócio em JS; o contador "sobe
  enquanto o professor cola" (diretrizes visuais) sem duplicar a expressão regular no
  navegador. O texto nunca sai do servidor local.
- **Alternativas**: guardar a prévia na sessão (estado escondido, expira); repetir a
  regex em JS (duplicação de regra, proibida).

## 5. Resposta das ações: JSON para a roleta, redirecionamento para o resto

- **Decisão**: padrão do projeto de referência (`Trabalho02/restaurante/respostas.py`):
  `sorteio/respostas.py` com `e_ajax(request)` e `responder(...)`. Requisições com
  `X-Requested-With: XMLHttpRequest` recebem JSON; as demais recebem mensagem do Django
  (toast) e redirecionamento. Erros de regra usam a exceção `RegraNegocioError`
  (`sorteio/regras.py`) com mensagem pronta em Português.
- **Justificativa**: a roleta precisa do resultado sem recarregar a página; todas as
  ações continuam funcionando sem JS (melhoria progressiva). Mensagens de erro nascem
  no model, a view só repassa.
- **Alternativas**: Django REST Framework (dependência desnecessária); HTMX (mais uma
  biblioteca, sem ganho para 3 ações).

## 6. Animação do sorteio (GSAP) e o resultado já escolhido

- **Decisão**: `roleta.js`
  1. clique/Espaço → botão desabilitado, estado "Sorteando…", `fetch` POST;
  2. enquanto espera: loop linear rápido (`repeat: -1`) de uma "fita" vertical com os
     nomes disponíveis (lidos da lista "Disponíveis" no DOM) em ordem embaralhada só para
     exibição;
  3. resposta chega → o loop é encerrado, o nome devolvido pelo servidor é inserido
     na fita alguns itens à frente e uma timeline desacelera até ele (`power4.out`),
     completando 3 a 6 s desde o clique (SC-005); parada com `back.out`;
  4. revelação: `SplitText` (letra a letra), "Nº sorteado", confete (`canvas-confetti`,
     verde e ouro), `Flip` move o item de "Disponíveis" para "Já sorteados", contadores
     animados com os números vindos do JSON;
  5. `aria-live` anuncia "Sorteado: NOME".
  - **Interrupção**: Espaço/Enter/Esc durante a animação leva a timeline direto ao fim
    (`progress(1)`); nunca inicia outro sorteio.
  - **Erro/timeout (8 s)**: encerra o loop sem parar em nenhum nome, mostra toast de erro
    e reabilita o botão.
  - **`prefers-reduced-motion`**: sem fita, sem confete e sem Flip; o nome aparece com
    `opacity` 0→1 em ~200 ms; listas atualizadas sem voo.
- **Justificativa**: o resultado é decidido antes de a desaceleração começar, então a
  animação só pode revelar, nunca escolher (RN-14). Loop durante a espera esconde a
  latência. Timeline única facilita pular para o fim.
- **Alternativas**: CSS puro (difícil parar exatamente num item dinâmico); animar só
  depois da resposta (atraso perceptível); biblioteca de "slot machine" pronta
  (dependência extra, visual genérico).
- **Versões (jsDelivr)**: `gsap@3.13` (`gsap.min.js`, `Flip.min.js`, `SplitText.min.js`
  — gratuitos desde a 3.13), `canvas-confetti@1.9`. Versões fixadas no `base.html`.

## 7. Identidade visual e CSS

- **Decisão**: seguir `docs/diretrizes-visuais.md` sem mudanças: conceito "Palco"
  (gestão clara em `--papel`, sorteio escuro em `--palco`), tokens `--verde`, `--ouro`,
  `--palco`, `--papel`, `--tinta`, `--cinza`; fontes Bricolage Grotesque (títulos e nome
  sorteado), Figtree (texto) e JetBrains Mono (matrículas); raios 16–24 px; transições
  150–300 ms com `cubic-bezier(.2,.8,.2,1)`. Tudo como variáveis em `:root` de
  `sorteio/static/css/estilo.css`, que também sobrescreve as variáveis `--bs-*` do
  Bootstrap (botões, modais, toasts) para não parecer Bootstrap padrão.
- Tamanho do nome sorteado com `clamp()`, chegando a ~12vw no modo apresentação (SC-006).
- **Justificativa**: diretrizes já aprovadas pelo usuário; a constituição exige
  segui-las fielmente.
- **Alternativas**: tema pronto do Bootstrap (aparência de template, proibida).

## 8. Modo apresentação e atalhos (FR-033, FR-034)

- **Decisão**: Fullscreen API (`requestFullscreen` no contêiner do palco) + classe
  `modo-apresentacao` que esconde tudo além do palco e do botão. Atalhos em `roleta.js`:
  `Espaço` sorteia, `F` alterna tela cheia, `Z` desfaz (envia o mesmo formulário POST
  do botão "Desfazer último"; desfazer não está entre as ações que exigem confirmação).
  Atalhos ignorados quando o foco está num campo de texto ou com um modal aberto.
- **Alternativas**: abrir o palco em nova janela (duas páginas para manter em sincronia).

## 9. Configuração do Django

- **Decisão**: `config/settings.py` com `LANGUAGE_CODE='pt-br'`,
  `TIME_ZONE='America/Sao_Paulo'`, `USE_TZ=True`; apps `sorteio` (templates e estáticos
  globais, como no Trabalho02), `sorteio.turmas`, `sorteio.alunos`, `sorteio.sorteios`;
  `APP_DIRS=True`; `MESSAGE_TAGS` mapeando para as classes dos toasts; SQLite em
  `BASE_DIR / 'db.sqlite3'` (não listado no `.gitignore`, a pedido).
- **Justificativa**: mesmo padrão do projeto de referência; nada de pacote extra.
- **Alternativas**: WhiteNoise/Docker (necessários só em produção; fora do escopo).

## 10. Privacidade (LGPD) com recursos de CDN

- **Decisão**: CDNs (Bootstrap, Bootstrap Icons, Google Fonts, GSAP, canvas-confetti)
  são usados só para baixar arquivos estáticos; nenhuma URL, cabeçalho ou corpo de
  requisição externa contém dados de alunos. Sem analytics, sem fontes de ícones de
  terceiros além das listadas, sem logs remotos.
- **Justificativa**: Princípio III e seção "Restrições de Tecnologia e Privacidade".
- **Risco registrado**: sem internet na sala, as bibliotecas não carregam; o sistema
  continua funcionando (formulários e sorteio sem animação), mas sem o visual completo.
  Ver "Pontos para decisão" no `plan.md`.
