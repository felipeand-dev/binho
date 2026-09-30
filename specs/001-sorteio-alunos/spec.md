# Especificação da Funcionalidade: Sorteio de Alunos por Turma

**Diretório da feature**: `specs/001-sorteio-alunos`

**Criada em**: 2026-09-30

**Status**: Rascunho

**Entrada**: Descrição do usuário: "Turmas: cadastrar, listar, renomear e excluir; nome
obrigatório e único; cada turma com sua própria lista, sorteio e histórico. Alunos e
importação do SUAP: colar a lista copiada do SUAP ("Foto de" / nome / "Matrícula:" /
número) ou uma lista simples com um nome por linha; prévia antes de salvar (encontrados,
novos, já existentes); sem duplicar aluno na mesma turma; colar mais listas a qualquer
momento; adicionar aluno manualmente; remover aluno e limpar a lista. Sorteio: sortear
entre os disponíveis; nomes giram, desaceleram e param no sorteado; sem repetição;
listas 'Disponíveis' e 'Já sorteados' com contadores; botão desabilitado quando todos
foram sorteados, com sugestão de reiniciar; reiniciar sorteio; histórico (aluno, ordem,
horário); desfazer o último sorteio; confirmação para excluir turma, limpar lista e
reiniciar sorteio."

Referências: regras de negócio RN-01 a RN-20 em `docs/regras-de-negocio.md`, formato
de entrada em `docs/importacao-suap.md` e interface em `docs/diretrizes-visuais.md`.

## Cenários de Usuário e Testes *(obrigatório)*

### História de Usuário 1 - Criar turma e importar a lista do SUAP (Prioridade: P1)

O professor cria uma turma (ex.: "Informática 2º A"), cola o texto copiado do SUAP e o
sistema identifica nome e matrícula de cada aluno, mostrando uma prévia com quantos
alunos foram encontrados, quantos são novos e quantos já existiam. Só depois da
confirmação os alunos são salvos.

**Por que esta prioridade**: sem turma e sem alunos cadastrados não existe sorteio. É a
porta de entrada do sistema.

**Teste independente**: criar a turma "Teste", colar o exemplo de 32 alunos de
`docs/importacao-suap.md`, conferir a prévia ("32 encontrados, 32 novos, 0 duplicados"),
confirmar e ver os 32 alunos na lista da turma.

**Cenários de aceitação**:

1. **Dado** o texto no formato do SUAP, **Quando** o professor cola e pede a prévia,
   **Então** o sistema lista nome e matrícula de cada aluno encontrado, com os
   contadores de encontrados, novos e duplicados.
2. **Dado** uma lista simples com um nome por linha, **Quando** o professor cola e pede
   a prévia, **Então** cada linha não vazia vira um aluno sem matrícula.
3. **Dado** uma turma que já tem os 32 alunos do exemplo, **Quando** o professor cola a
   mesma lista de novo, **Então** a prévia mostra "32 encontrados, 0 novos,
   32 duplicados" e confirmar não cadastra ninguém.
4. **Dado** um texto sem nenhum aluno reconhecível (vazio ou só espaços), **Quando** o
   professor pede a prévia, **Então** o sistema avisa que nenhum aluno foi encontrado e
   não salva nenhum aluno.
5. **Dado** a prévia aberta, **Quando** o professor desiste sem confirmar, **Então**
   nenhum aluno é salvo.

---

### História de Usuário 2 - Sortear um aluno (Prioridade: P1)

Na tela da turma, o professor clica em "Sortear". Os nomes giram na tela, desaceleram e
param no aluno sorteado, que é anunciado em destaque e passa da lista "Disponíveis" para
a lista "Já sorteados", com os contadores atualizados.

**Por que esta prioridade**: é a função principal do sistema e o motivo de ele existir.

**Teste independente**: em uma turma com 3 alunos, sortear 3 vezes; conferir que os três
sorteados são diferentes e que, em seguida, o botão "Sortear" fica desabilitado com a
sugestão de reiniciar.

**Cenários de aceitação**:

1. **Dado** uma turma com alunos disponíveis, **Quando** o professor clica em "Sortear",
   **Então** a animação gira, desacelera e para em um aluno disponível, que passa para
   "Já sorteados" com sua ordem na rodada (1º, 2º, 3º…).
2. **Dado** um aluno já sorteado na rodada, **Quando** novos sorteios acontecem,
   **Então** esse aluno nunca é sorteado de novo até o sorteio ser reiniciado.
3. **Dado** que todos os alunos da turma já foram sorteados, **Quando** o professor
   abre a tela de sorteio, **Então** o botão "Sortear" está desabilitado e o sistema
   mostra "Todos os alunos já foram sorteados. Reinicie o sorteio."
4. **Dado** uma turma sem nenhum aluno, **Quando** o professor abre a tela de sorteio,
   **Então** o botão "Sortear" está desabilitado e o sistema sugere importar a lista.
5. **Dado** um sorteio em andamento (animação rodando), **Quando** o professor clica de
   novo em "Sortear" ou dá um duplo clique, **Então** apenas um sorteio é registrado.
6. **Dado** duas turmas, **Quando** o professor sorteia na turma A, **Então** a lista,
   os contadores e o histórico da turma B não mudam.

---

### História de Usuário 3 - Reiniciar o sorteio (Prioridade: P1)

Quando a rodada termina (ou quando quiser), o professor clica em "Reiniciar sorteio",
confirma, e todos os alunos voltam a ficar disponíveis em uma nova rodada. O histórico
das rodadas anteriores é mantido.

**Por que esta prioridade**: sem reinício a turma só poderia ser sorteada uma única vez.

**Teste independente**: sortear 2 alunos, clicar em "Reiniciar sorteio" e confirmar;
conferir que todos voltaram para "Disponíveis", que "Já sorteados" está vazio e que o
histórico ainda mostra os 2 sorteios da rodada anterior.

**Cenários de aceitação**:

1. **Dado** alunos já sorteados, **Quando** o professor confirma o reinício, **Então**
   todos ficam disponíveis, uma nova rodada começa (rodada anterior + 1) e a ordem volta
   a contar a partir de 1º.
2. **Dado** a confirmação de reinício aberta, **Quando** o professor cancela, **Então**
   nada muda.
3. **Dado** uma rodada anterior registrada no histórico, **Quando** o sorteio é
   reiniciado, **Então** o histórico da rodada anterior continua visível.

---

### História de Usuário 4 - Gerenciar turmas e a lista de alunos (Prioridade: P2)

O professor vê todas as suas turmas, renomeia ou exclui uma turma, adiciona um aluno
manualmente, remove um aluno, cola mais uma lista na mesma turma ou limpa a lista
inteira.

**Por que esta prioridade**: turmas mudam ao longo do semestre (transferências, alunos
novos, erros de digitação), mas o sorteio já funciona sem essas operações.

**Teste independente**: adicionar "Aluno Novo" manualmente e vê-lo em "Disponíveis";
remover um aluno e vê-lo sumir das listas; limpar a lista (com confirmação) e ver a
turma vazia, mas ainda existente; renomear a turma; excluir outra turma (com
confirmação) e vê-la sumir da tela inicial.

**Cenários de aceitação**:

1. **Dado** a tela inicial, **Quando** o professor abre o sistema, **Então** vê todas as
   turmas com o total de alunos e quantos já foram sorteados na rodada atual.
2. **Dado** uma turma, **Quando** o professor tenta criar ou renomear outra turma com o
   mesmo nome (ignorando maiúsculas e espaços extras) ou com nome vazio, **Então** o
   sistema recusa e explica o motivo.
3. **Dado** um sorteio em andamento, **Quando** o professor adiciona um aluno à mão ou
   cola mais uma lista, **Então** os alunos novos entram como disponíveis na rodada
   atual.
4. **Dado** um aluno que já foi sorteado, **Quando** o professor o remove, **Então** ele
   sai das listas, mas o histórico continua mostrando o nome dele.
5. **Dado** uma turma com alunos, **Quando** o professor confirma "Limpar lista",
   **Então** todos os alunos da turma são removidos e a turma continua existindo.
6. **Dado** uma turma, **Quando** o professor confirma a exclusão, **Então** a turma,
   seus alunos e seu histórico são apagados; se cancelar, nada muda.
7. **Dado** um aluno já cadastrado, **Quando** o professor tenta adicioná-lo de novo à
   mão (mesma matrícula ou mesmo nome sem matrícula), **Então** o sistema avisa que o
   aluno já existe e não o duplica.

---

### História de Usuário 5 - Histórico e desfazer o último sorteio (Prioridade: P3)

O professor consulta a ordem e o horário de cada sorteio, agrupados por rodada, e pode
desfazer o último sorteio quando o aluno sorteado está ausente.

**Por que esta prioridade**: melhora o uso em sala de aula, mas o sorteio funciona sem
isso.

**Teste independente**: sortear 3 alunos, abrir o histórico e conferir a ordem e os
horários; clicar em "Desfazer último" e conferir que o 3º sorteado voltou para
"Disponíveis" e saiu do histórico.

**Cenários de aceitação**:

1. **Dado** 3 alunos sorteados, **Quando** o professor abre o histórico, **Então** vê os
   sorteios agrupados por rodada, com ordem (1º, 2º, 3º) e data/hora.
2. **Dado** um último sorteado na rodada atual, **Quando** o professor clica em
   "Desfazer último", **Então** o aluno volta a ficar disponível, o registro sai do
   histórico e o próximo sorteio recebe a mesma ordem que o desfeito.
3. **Dado** uma rodada atual sem nenhum sorteio (ex.: logo após reiniciar), **Quando**
   o professor olha a tela, **Então** "Desfazer último" está indisponível.

---

### História de Usuário 6 - Sortear com a turma assistindo no projetor (Prioridade: P3)

O professor projeta a tela de sorteio, ativa o modo apresentação em tela cheia e sorteia
com o teclado, com o nome sorteado em tamanho grande e legível do fundo da sala.

**Por que esta prioridade**: é o que transforma o sorteio num momento coletivo, mas o
sorteio funciona na tela normal.

**Teste independente**: ativar o modo apresentação, sortear pelo teclado e conferir de
longe que o nome é legível; ativar a preferência de "reduzir movimento" do sistema
operacional e conferir que o resultado aparece sem o giro.

**Cenários de aceitação**:

1. **Dado** a tela de sorteio, **Quando** o professor ativa o modo apresentação,
   **Então** a tela fica cheia mostrando só o palco do sorteio e o botão.
2. **Dado** o modo apresentação ou a tela de sorteio, **Quando** o professor usa os
   atalhos de teclado (sortear, tela cheia, desfazer), **Então** a ação correspondente
   acontece com as mesmas regras do clique.
3. **Dado** que o computador está com "reduzir movimento" ativado, **Quando** o
   professor sorteia, **Então** o nome sorteado aparece com uma transição suave, sem o
   giro, e o resultado é o mesmo que seria mostrado com a animação.

---

### Casos-limite

- Texto colado com espaços extras, linhas em branco ou quebras de linha do Windows →
  tratado normalmente; nomes são guardados sem espaços extras nas pontas e no meio.
- Nomes com acentos e caixa mista ("JOÃO", "Beatriz Almeida") → preservados como vieram,
  sem mudar maiúsculas.
- A mesma lista contém o mesmo aluno duas vezes → contado uma única vez na prévia.
- Dois alunos com o mesmo nome e matrículas diferentes → são alunos diferentes.
- A mesma matrícula em turmas diferentes → permitido; cada turma tem seu cadastro.
- Aluno removido depois de sorteado → o histórico mantém o nome registrado.
- Turma com 1 aluno → o sorteio funciona normalmente (com a animação).
- Duplo clique ou dois cliques quase simultâneos em "Sortear" → apenas um sorteio é
  registrado e nenhum aluno sai duas vezes.
- A página de sorteio está aberta em duas abas → o segundo sorteio considera o que o
  primeiro já marcou; nunca repete aluno.
- Falha de comunicação durante o sorteio → a animação não para em nenhum nome, o
  sistema avisa o erro e o botão volta a ficar disponível.
- Tentar desfazer depois de reiniciar → indisponível (desfazer vale só para a rodada
  atual).
- Texto que não segue o formato do SUAP mas tem linhas soltas (ex.: cabeçalhos
  copiados por engano) → cada linha vira um nome na prévia; o professor confere antes
  de confirmar.

## Requisitos *(obrigatório)*

### Requisitos Funcionais

**Turmas**

- **FR-001**: O sistema DEVE permitir cadastrar, listar, renomear e excluir turmas.
- **FR-002**: O nome da turma DEVE ser obrigatório e único, comparando sem diferenciar
  maiúsculas e ignorando espaços extras (RN-01).
- **FR-003**: A listagem de turmas DEVE mostrar, para cada turma, o total de alunos e
  quantos já foram sorteados na rodada atual.
- **FR-004**: Excluir uma turma DEVE pedir confirmação e apagar também seus alunos e
  seu histórico (RN-02).
- **FR-005**: Cada turma DEVE ter sua própria lista de alunos, sua própria rodada e seu
  próprio histórico; operações em uma turma NÃO DEVEM afetar outra (RN-03).

**Alunos e importação**

- **FR-006**: O sistema DEVE permitir colar em um campo de texto a lista copiada do
  SUAP no formato "Foto de" / nome / "Matrícula:" / número e extrair nome e matrícula
  de cada aluno (RN-05; `docs/importacao-suap.md`).
- **FR-007**: Quando o texto não estiver no formato do SUAP, o sistema DEVE tratá-lo
  como lista simples: cada linha não vazia vira um aluno sem matrícula (RN-05).
- **FR-008**: A leitura do texto colado DEVE ser feita localmente, por regras de
  leitura de texto, sem enviar o conteúdo a nenhum serviço externo (inclusive
  serviços de IA).
- **FR-009**: Antes de salvar, o sistema DEVE mostrar uma prévia com a lista de alunos
  encontrados e os contadores de encontrados, novos e duplicados, com os duplicados
  identificados visualmente (RN-06).
- **FR-010**: Os alunos só DEVEM ser salvos após o professor confirmar a prévia; se
  nenhum aluno for encontrado, o sistema DEVE avisar e não salvar nenhum aluno. Na
  criação de uma turma, a turma PODE ser salva sem alunos (a lista pode ser colada
  depois; ver FR-026).
- **FR-011**: O sistema NÃO DEVE cadastrar o mesmo aluno duas vezes na mesma turma:
  com matrícula, mesma matrícula é o mesmo aluno; sem matrícula, mesmo nome ignorando
  acentos, maiúsculas e espaços extras é o mesmo aluno. Duplicados são ignorados sem
  gerar erro (RN-07).
- **FR-012**: A mesma matrícula PODE existir em turmas diferentes (RN-08).
- **FR-013**: Os nomes DEVEM ser guardados como vieram, apenas sem espaços extras nas
  pontas e no meio (RN-09).
- **FR-014**: O sistema DEVE permitir colar mais listas na mesma turma a qualquer
  momento, inclusive com um sorteio em andamento.
- **FR-015**: O sistema DEVE permitir adicionar um aluno manualmente, com nome
  obrigatório e matrícula opcional, aplicando a mesma regra de duplicidade do FR-011.
- **FR-016**: Todo aluno novo (importado ou manual) DEVE entrar como disponível, mesmo
  com um sorteio em andamento (RN-10).
- **FR-017**: O sistema DEVE permitir remover um aluno da turma; se ele já tiver sido
  sorteado, o histórico DEVE continuar mostrando o nome dele (RN-11).
- **FR-018**: O sistema DEVE permitir limpar a lista inteira da turma, com
  confirmação, mantendo a turma (RN-12).

**Sorteio**

- **FR-019**: Ao clicar em "Sortear", o sistema DEVE sortear um aluno apenas entre os
  alunos disponíveis da turma (RN-13).
- **FR-020**: O aluno sorteado DEVE ser definido pelo sistema de forma aleatória e
  imprevisível antes do fim da animação; a animação apenas revela esse resultado e não
  pode alterá-lo (RN-14).
- **FR-021**: Durante o sorteio, os nomes DEVEM girar na tela, desacelerar e parar no
  aluno sorteado, que é então exibido em destaque com sua ordem na rodada.
- **FR-022**: Um aluno sorteado NÃO DEVE ser sorteado novamente até o professor
  reiniciar o sorteio da turma, mesmo com cliques simultâneos ou várias abas abertas
  (RN-15).
- **FR-023**: O botão "Sortear" DEVE ficar desabilitado enquanto a animação estiver em
  andamento.
- **FR-024**: O sistema DEVE exibir separadamente as listas "Disponíveis" e "Já
  sorteados" da rodada atual, cada uma com seu contador; os sorteados aparecem na
  ordem em que saíram.
- **FR-025**: Quando todos os alunos já tiverem sido sorteados, o botão "Sortear" DEVE
  ficar desabilitado e o sistema DEVE mostrar "Todos os alunos já foram sorteados.
  Reinicie o sorteio." (RN-17).
- **FR-026**: Quando a turma não tiver nenhum aluno, o botão "Sortear" DEVE ficar
  desabilitado e o sistema DEVE sugerir importar a lista (RN-18).
- **FR-027**: O sistema DEVE permitir reiniciar o sorteio, com confirmação, tornando
  todos os alunos da turma disponíveis e iniciando uma nova rodada; o histórico das
  rodadas anteriores é mantido (RN-19).

**Histórico e desfazer**

- **FR-028**: Cada sorteio DEVE gerar um registro no histórico com o nome do aluno, a
  rodada, a ordem na rodada (1º, 2º, 3º…) e a data/hora (RN-16).
- **FR-029**: O sistema DEVE exibir o histórico da turma agrupado por rodada, com
  ordem e horário.
- **FR-030**: O sistema DEVE permitir desfazer o último sorteio da rodada atual: o
  aluno volta a ficar disponível e o registro é apagado do histórico (RN-20).
  "Desfazer último" DEVE ficar indisponível quando a rodada atual não tiver sorteios.

**Confirmações, feedback e apresentação**

- **FR-031**: Excluir turma, limpar lista e reiniciar sorteio DEVEM pedir confirmação
  explícita; cancelar não altera nada.
- **FR-032**: Toda ação que altera dados DEVE dar um retorno visível ao professor
  (sucesso ou motivo da recusa), em Português do Brasil.
- **FR-033**: A tela de sorteio DEVE oferecer um modo apresentação em tela cheia, com o
  nome sorteado em tamanho grande e alto contraste.
- **FR-034**: A tela de sorteio DEVE oferecer atalhos de teclado para sortear, alternar
  a tela cheia e desfazer o último sorteio, com as mesmas regras dos botões.
- **FR-035**: Quando o computador estiver configurado para reduzir movimento, o
  sistema DEVE exibir o resultado do sorteio sem o giro, com uma transição suave.
- **FR-036**: O resultado do sorteio DEVE ser anunciado de forma acessível a leitores de
  tela ("Sorteado: nome do aluno").
- **FR-037**: Nomes e matrículas dos alunos NÃO DEVEM ser enviados a nenhum serviço
  externo; ficam apenas no armazenamento local do sistema.

### Entidades-chave

- **Turma**: grupo de alunos de uma disciplina/série. Atributos: nome (único), descrição
  (opcional), rodada atual (começa em 1), data de criação. Possui muitos alunos e muitos sorteios.
- **Aluno**: pessoa da turma que participa do sorteio. Atributos: nome, matrícula
  (opcional), situação na rodada atual (disponível ou já sorteado), data de cadastro.
  Pertence a uma única turma.
- **Sorteio** (registro do histórico): um resultado de sorteio. Atributos: turma,
  referência ao aluno (pode deixar de existir se o aluno for removido), cópia do nome
  do aluno, rodada, ordem na rodada e data/hora.

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **SC-001**: A lista de exemplo do SUAP (32 alunos, `docs/importacao-suap.md`) é
  importada com 32 alunos encontrados, nomes e matrículas idênticos ao original e
  nenhum aluno perdido.
- **SC-002**: Colar a mesma lista de exemplo de novo na mesma turma resulta em
  0 alunos novos e 32 duplicados, e a turma continua com 32 alunos.
- **SC-003**: Em uma turma com N alunos, N sorteios seguidos produzem N alunos
  diferentes (verificado com N = 32), e o (N+1)º sorteio não é possível sem reiniciar.
- **SC-004**: O professor vai da lista copiada no SUAP até o primeiro aluno sorteado
  em menos de 1 minuto.
- **SC-005**: Com a animação padrão, cada sorteio, do clique até o nome sorteado
  aparecer parado na tela, dura entre 3 e 6 segundos. Com "reduzir movimento" ativado
  (FR-035), o nome aparece em menos de 1 segundo.
- **SC-006**: No modo apresentação, o nome sorteado é lido corretamente por uma pessoa
  no fundo de uma sala de aula comum (cerca de 8 metros) quando projetado.
- **SC-007**: Em 10 tentativas de duplo clique rápido em "Sortear", cada tentativa
  registra exatamente 1 sorteio no histórico.
- **SC-008**: Sortear, reiniciar ou limpar a lista em uma turma não altera nenhum dado
  de outra turma (verificado com duas turmas).
- **SC-009**: Durante todo o uso (importar, sortear, consultar histórico), nenhum nome
  ou matrícula de aluno é transmitido para fora do computador que roda o sistema.

## Premissas

- O sistema é usado por um único professor, no próprio computador ou em um servidor
  local da escola; não há login nem perfis de usuário nesta versão.
- A integração com o SUAP é feita apenas por copiar e colar; não há acesso direto ao
  SUAP.
- Regra de duplicidade quando só um dos lados tem matrícula (ex.: aluno cadastrado por
  lista simples e depois colado pelo SUAP): se o nome normalizado for igual, é
  considerado o mesmo aluno e ignorado; o cadastro existente não é alterado.
- A detecção do formato é automática: se o padrão do SUAP encontrar pelo menos um
  aluno, o texto inteiro é lido como SUAP; caso contrário, como lista simples.
- O "desfazer" só vale para a rodada atual. Ele pode ser repetido: cada uso desfaz o
  sorteio mais recente que ainda existe na rodada, até a rodada ficar sem sorteios.
- "Reiniciar sorteio" fica indisponível enquanto nenhum aluno tiver sido sorteado na
  rodada atual (não há o que reiniciar).
- Renomear uma turma não altera seus alunos, sua rodada nem seu histórico.
- Os atalhos de teclado seguem `docs/diretrizes-visuais.md` (Espaço sorteia, F alterna
  tela cheia, Z desfaz o último).
- Fora do escopo desta versão: sortear vários alunos de uma vez, formar grupos/equipes,
  pesos ou prioridades no sorteio, exportar o histórico (PDF/planilha), importar
  arquivos (CSV/Excel) e editar o nome ou a matrícula de um aluno já cadastrado.
