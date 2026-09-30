# Feature Specification: Sorteio de Alunos por Turma

**Feature Branch**: `[001-sorteio-alunos]`

**Created**: 2026-09-30

**Status**: Draft

**Input**: Descrição do usuário: "Sistema de sorteio de alunos. O professor copia do
SUAP (IF Baiano) a lista de alunos da turma e cola em um campo. O sistema extrai os
nomes. Ao clicar em Sortear, os nomes ficam girando e param no nome de um aluno. Quem
já foi sorteado não pode ser sorteado de novo, a não ser que o professor clique em
Reiniciar sorteio, que volta a disponibilizar todos. O professor pode criar turmas,
adicionar nomes, remover alunos, adicionar mais listas e limpar a lista."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar turma e importar lista do SUAP (Priority: P1)

O professor cria uma turma (ex.: "Informática 2º A"), cola o texto copiado do SUAP e
o sistema identifica nome e matrícula de cada aluno, mostrando uma prévia antes de salvar.

**Why this priority**: Sem alunos cadastrados não há sorteio.

**Independent Test**:
- Criar a turma "Teste".
- Colar o exemplo de `docs/importacao-suap.md` (32 alunos).
- Verificar a prévia: "32 alunos encontrados".
- Confirmar e ver os 32 alunos na lista de disponíveis.

**Acceptance Scenarios**:

1. **Given** texto no formato do SUAP, **When** o professor cola e pede a prévia,
   **Then** o sistema lista nome e matrícula de cada aluno encontrado.
2. **Given** uma turma que já tem alunos, **When** o professor cola uma lista com
   matrículas repetidas, **Then** os repetidos são ignorados e a prévia informa quantos.
3. **Given** um texto sem nenhum aluno reconhecível, **When** o professor pede a
   prévia, **Then** o sistema avisa que nenhum aluno foi encontrado e não salva nada.

---

### User Story 2 - Sortear aluno (Priority: P1)

Na tela da turma, o professor clica em "Sortear". Os nomes giram na tela, desaceleram
e param no aluno sorteado, que passa para a lista de "Já sorteados".

**Why this priority**: É a função principal do sistema.

**Independent Test**:
- Em uma turma com 3 alunos, sortear 3 vezes.
- Verificar que os 3 nomes sorteados são diferentes.
- Verificar que o botão "Sortear" fica desabilitado com a mensagem de que todos já
  foram sorteados.

**Acceptance Scenarios**:

1. **Given** turma com alunos disponíveis, **When** o professor clica em "Sortear",
   **Then** a animação para em um aluno disponível e ele passa a "Já sorteados".
2. **Given** todos os alunos já sorteados, **When** o professor tenta sortear,
   **Then** o sistema não sorteia e sugere reiniciar o sorteio.
3. **Given** um aluno já sorteado, **When** novos sorteios acontecem, **Then** esse
   aluno nunca aparece como resultado até o sorteio ser reiniciado.

---

### User Story 3 - Reiniciar sorteio (Priority: P1)

O professor clica em "Reiniciar sorteio", confirma, e todos os alunos voltam a ficar
disponíveis.

**Why this priority**: Sem isso a turma só poderia ser sorteada uma vez.

**Independent Test**:
- Sortear 2 alunos; clicar em "Reiniciar sorteio" e confirmar.
- Verificar que todos voltaram para "Disponíveis" e "Já sorteados" está vazio.

**Acceptance Scenarios**:

1. **Given** alunos já sorteados, **When** o professor confirma o reinício, **Then**
   todos ficam disponíveis e uma nova rodada começa.
2. **Given** o modal de confirmação aberto, **When** o professor cancela, **Then**
   nada muda.

---

### User Story 4 - Gerenciar a lista de alunos (Priority: P2)

O professor adiciona um aluno manualmente, remove um aluno, cola mais uma lista na
mesma turma ou limpa a lista inteira.

**Why this priority**: Turmas mudam (transferências, alunos novos), mas o sorteio
funciona sem isso.

**Independent Test**:
- Adicionar "Aluno Novo" manualmente → aparece em "Disponíveis".
- Remover um aluno → some das listas.
- Limpar a lista (com confirmação) → turma fica sem alunos, mas continua existindo.

**Acceptance Scenarios**:

1. **Given** uma turma, **When** o professor adiciona um nome, **Then** o aluno entra
   como disponível, mesmo que um sorteio esteja em andamento.
2. **Given** uma turma com alunos, **When** o professor confirma "Limpar lista",
   **Then** todos os alunos da turma são removidos.

---

### User Story 5 - Histórico e desfazer (Priority: P3)

O professor vê a ordem dos sorteados (1º, 2º, 3º…) e pode desfazer o último sorteio
quando o aluno sorteado está ausente.

**Why this priority**: Melhora o uso em sala, mas não é essencial.

**Acceptance Scenarios**:

1. **Given** 3 alunos sorteados, **When** o professor abre a turma, **Then** vê os
   sorteados na ordem em que saíram.
2. **Given** um último sorteado, **When** o professor clica em "Desfazer último",
   **Then** o aluno volta a ficar disponível e sai do histórico da rodada.

---

### Edge Cases

- Texto colado com espaços extras, linhas em branco ou quebras de linha do Windows
  (`\r\n`) → devem ser tratados normalmente.
- Nomes com acentos e em caixa mista ("JOÃO", "Beatriz Almeida") → preservados como vieram.
- Dois alunos com o mesmo nome e matrículas diferentes → são alunos diferentes.
- Aluno removido depois de sorteado → o histórico mantém o nome registrado.
- Turma com 1 aluno → o sorteio funciona (a animação continua existindo).
- Duplo clique no botão "Sortear" → apenas um sorteio é registrado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir criar, listar, renomear e excluir turmas.
- **FR-002**: O sistema DEVE importar alunos a partir do texto copiado do SUAP
  (formato descrito em `docs/importacao-suap.md`).
- **FR-003**: O sistema DEVE aceitar também uma lista simples com um nome por linha.
- **FR-004**: O sistema DEVE mostrar uma prévia da importação (encontrados, novos e
  duplicados) antes de salvar.
- **FR-005**: O sistema NÃO DEVE cadastrar o mesmo aluno duas vezes na mesma turma
  (mesma matrícula ou, sem matrícula, mesmo nome desconsiderando acentos e maiúsculas).
- **FR-006**: O sistema DEVE permitir adicionar um aluno manualmente (nome obrigatório,
  matrícula opcional).
- **FR-007**: O sistema DEVE permitir remover um aluno e limpar a lista da turma.
- **FR-008**: O sistema DEVE sortear apenas entre os alunos disponíveis da turma.
- **FR-009**: A escolha do sorteado DEVE ser feita no servidor, de forma aleatória
  (`secrets`); a animação apenas exibe o resultado.
- **FR-010**: Um aluno sorteado NÃO DEVE ser sorteado novamente até o reinício.
- **FR-011**: O sistema DEVE exibir separadamente "Disponíveis" e "Já sorteados",
  com contadores.
- **FR-012**: O sistema DEVE permitir reiniciar o sorteio (com confirmação), tornando
  todos os alunos disponíveis.
- **FR-013**: O sistema DEVE registrar o histórico dos sorteios (aluno, ordem, data/hora).
- **FR-014**: O sistema DEVE permitir desfazer o último sorteio da rodada atual.
- **FR-015**: Ações destrutivas (excluir turma, limpar lista, reiniciar) DEVEM pedir
  confirmação.

### Key Entities

- **Turma**: nome, descrição (opcional), rodada atual, data de criação.
- **Aluno**: turma, nome, matrícula (opcional), sorteado (sim/não), data de cadastro.
- **Sorteio** (histórico): turma, aluno, nome do aluno (cópia), rodada, ordem na
  rodada, data/hora.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A lista de exemplo do SUAP (32 alunos) é importada sem erros e sem
  perder nenhum aluno.
- **SC-002**: Em uma turma com N alunos, N sorteios seguidos produzem N alunos
  diferentes.
- **SC-003**: O professor sai da lista colada até o primeiro sorteio em menos de 1 minuto.
- **SC-004**: A animação do sorteio dura entre 3 e 6 segundos e é legível em projetor.

## Assumptions

- O professor usa o sistema sozinho (sem login nesta versão).
- A integração com o SUAP é feita por copiar e colar; não há acesso à API do SUAP.
- Fora do escopo: sortear vários alunos de uma vez, grupos/equipes, exportar PDF.
