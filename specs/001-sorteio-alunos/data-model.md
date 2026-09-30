# Modelo de Dados (Fase 1): Sorteio de Alunos por Turma

Três models, um por app. Todos os relacionamentos são `ForeignKey` com `related_name`
(constituição, Princípio II). Cada regra tem um único dono, indicado na coluna "Dono".

```text
Turma 1 ──< Aluno            (turma.alunos, CASCADE)
Turma 1 ──< Sorteio          (turma.sorteios, CASCADE)
Aluno 0..1 ──< Sorteio       (aluno.sorteios, SET_NULL — histórico sobrevive à remoção)
```

## Turma (`sorteio/turmas/models.py`)

| Campo | Tipo | Regras |
|---|---|---|
| `nome` | `CharField(max_length=80)` | obrigatório; espaços extras removidos ao salvar; único sem diferenciar maiúsculas (RN-01) |
| `descricao` | `CharField(max_length=200, blank=True)` | opcional (ex.: "Turno matutino") |
| `chave` | `CharField(max_length=80, unique=True, editable=False)` | nome com `casefold()` e espaços normalizados, preenchido no `save()`; garante o RN-01 também com acentos (o `LOWER()` do SQLite só trata ASCII) |
| `rodada_atual` | `PositiveIntegerField(default=1)` | só aumenta, via `Sorteio.reiniciar` (RN-19) |
| `criada_em` | `DateTimeField(auto_now_add=True)` | — |

- `Meta.ordering = [Lower('nome')]`
- Unicidade: `chave` com `unique=True` (garantia final no banco).
- `clean_fields()`: aplica `normalizar_espacos` e calcula a `chave` antes da validação
  (nome só com espaços conta como em branco: "Informe o nome da turma.").
- `clean()`: se já existir outra turma com a mesma `chave`, levanta `ValidationError`
  "Já existe uma turma com esse nome.".
- `TurmaQuerySet.com_contagens()`: anota `total_alunos` e `total_sorteados`
  (`Count('alunos')`, `Count('alunos', filter=Q(alunos__sorteado=True))`) para os cards
  da tela inicial (FR-003).
- `__str__` → `nome`.
- Excluir a turma apaga alunos e sorteios em cascata (RN-02).

## Aluno (`sorteio/alunos/models.py`)

| Campo | Tipo | Regras |
|---|---|---|
| `turma` | `ForeignKey(Turma, CASCADE, related_name='alunos')` | isolamento por turma (RN-03) |
| `nome` | `CharField(max_length=150)` | obrigatório; guardado como veio, só sem espaços extras (RN-09) |
| `matricula` | `CharField(max_length=30, blank=True, default='')` | opcional (RN-04); única por turma quando preenchida; pode repetir em outra turma (RN-08) |
| `sorteado` | `BooleanField(default=False, db_index=True)` | situação na rodada atual; começa `False` (RN-10) |
| `criado_em` | `DateTimeField(auto_now_add=True)` | — |

- `Meta.ordering = [Lower('nome')]` (ordem alfabética sem diferenciar maiúsculas)
- `Meta.constraints`: `UniqueConstraint(fields=['turma', 'matricula'],
  condition=~Q(matricula=''), name='aluno_matricula_unica_por_turma')`
- `AlunoQuerySet` (usado como `turma.alunos.<método>()`):

| Método | Dono de | O que faz |
|---|---|---|
| `disponiveis()` | RN-13 | `filter(sorteado=False)` |
| `sorteados()` | — | `filter(sorteado=True)` |
| `devolver_todos()` | RN-19 | `update(sorteado=False)` |
| `previa(itens, formato)` | RN-06, RN-07 | recebe a saída de `extrair_alunos` e devolve `PreviaImportacao` (lista com a marca `duplicado` em cada item + contadores `encontrados`, `novos`, `duplicados`) comparando com os alunos da turma via `importador.mesmo_aluno` |
| `importar(itens, formato)` (no manager, via `turma.alunos`) | RN-07, RN-10 | dentro de `transaction.atomic`: refaz a prévia e cria só os novos com `bulk_create`; devolve a prévia usada (para a mensagem "32 importados, 0 duplicados") |
| `adicionar(nome, matricula)` (no manager, via `turma.alunos`) | RN-07, RN-10 | normaliza; se for duplicado levanta `RegraNegocioError("Esse aluno já está na turma.")`; senão cria |

- Métodos de instância:

| Método | Dono de | O que faz |
|---|---|---|
| `marcar_como_sorteado() -> bool` | RN-15 | `Aluno.objects.filter(pk=self.pk, sorteado=False).update(sorteado=True) == 1` — UPDATE condicional atômico; `False` se outro sorteio chegou antes |
| `devolver()` | RN-20 | `filter(pk=self.pk).update(sorteado=False)` |

- `save()`/`clean()`: aplica `normalizar_espacos` em `nome` e `matricula`.
- Remover um aluno (`delete`) mantém os sorteios dele com `aluno=NULL` (RN-11).
- "Limpar lista" = `turma.alunos.all().delete()` (RN-12); a turma e o histórico ficam.

### Regra de duplicidade — `importador.mesmo_aluno(a, b)` (RN-07)

Dois registros `a` e `b` (dicionários ou alunos com `nome` e `matricula`) são o mesmo
aluno quando:

1. os dois têm matrícula **e** as matrículas são iguais; **ou**
2. pelo menos um dos dois está sem matrícula **e** `chave_nome(a) == chave_nome(b)`
   (sem acentos, sem diferenciar maiúsculas, espaços normalizados).

Dois alunos com o mesmo nome e matrículas diferentes são alunos diferentes. A mesma
função é usada para remover duplicados dentro do texto colado, na prévia, na importação e
no cadastro manual — não existe outra implementação dessa regra.

## Sorteio (`sorteio/sorteios/models.py`)

Registro do histórico: um resultado de sorteio.

| Campo | Tipo | Regras |
|---|---|---|
| `turma` | `ForeignKey(Turma, CASCADE, related_name='sorteios')` | — |
| `aluno` | `ForeignKey(Aluno, SET_NULL, null=True, related_name='sorteios')` | vira `NULL` se o aluno for removido (RN-11) |
| `nome_aluno` | `CharField(max_length=150)` | cópia do nome no momento do sorteio (RN-11, RN-16) |
| `rodada` | `PositiveIntegerField()` | `turma.rodada_atual` no momento do sorteio |
| `ordem` | `PositiveIntegerField()` | 1º, 2º, 3º… dentro da rodada |
| `data_hora` | `DateTimeField(default=timezone.now)` | — |

- `Meta.ordering = ['-rodada', 'ordem']` (histórico: rodada mais recente primeiro)
- `Meta.constraints`: `UniqueConstraint(fields=['turma', 'rodada', 'ordem'],
  name='sorteio_ordem_unica_na_rodada')`
- `SorteioQuerySet.da_rodada_atual(turma)`: `filter(turma=turma, rodada=turma.rodada_atual)`.

### Operações (métodos de classe — donos das regras RN-13..RN-20)

**`Sorteio.sortear(turma) -> Sorteio`** (RN-13..RN-16)

1. `transaction.atomic()` (modo IMMEDIATE no SQLite); recarrega a turma com
   `select_for_update()`.
2. Sem alunos na turma → `RegraNegocioError("A turma não tem alunos. Importe a lista
   para começar.")` (RN-18).
3. `ids = turma.alunos.disponiveis()` → vazio → `RegraNegocioError("Todos os alunos já
   foram sorteados. Reinicie o sorteio.")` (RN-17).
4. `escolhido = secrets.choice(ids)`; `aluno.marcar_como_sorteado()`; se devolver
   `False`, volta ao passo 3 (no máximo 3 tentativas) (RN-14, RN-15).
5. `ordem = (maior ordem da rodada atual ou 0) + 1`; cria o `Sorteio` com
   `nome_aluno=aluno.nome` (RN-16).

**`Sorteio.desfazer_ultimo(turma) -> Sorteio`** (RN-20)

1. `transaction.atomic()`; pega o sorteio de maior `ordem` da rodada atual.
2. Nenhum → `RegraNegocioError("Não há sorteio para desfazer nesta rodada.")`.
3. Se `aluno` ainda existe → `aluno.devolver()`; apaga o registro; devolve o registro
   apagado (para a mensagem "Desfeito: NOME").

**`Sorteio.reiniciar(turma)`** (RN-19)

1. `transaction.atomic()`; nenhum aluno sorteado na rodada atual →
   `RegraNegocioError("Nenhum aluno foi sorteado nesta rodada.")`.
2. `turma.alunos.devolver_todos()`; `rodada_atual = F('rodada_atual') + 1`. O histórico
   não é apagado.

## Invariantes

- **I-1**: para cada aluno existente, `aluno.sorteado == True` ⇔ existe um `Sorteio`
  com `aluno=aluno` na rodada atual da turma. Mantido por `sortear`, `desfazer_ultimo` e
  `reiniciar` (as únicas operações que mudam `sorteado`).
- **I-2**: `disponiveis + sorteados == total de alunos da turma` (contadores da tela).
- **I-3**: dentro de uma rodada, as ordens são únicas e crescentes; lacunas só aparecem
  quando um aluno já sorteado é removido (o histórico mostra a ordem real).
- **I-4**: nenhuma operação de uma turma lê ou altera alunos/sorteios de outra (todas as
  consultas partem de `turma.alunos` / `turma.sorteios`).

## Transições de estado do aluno

```text
          criado/importado (RN-10)
                  │
                  ▼
           ┌─────────────┐   sortear (RN-14, RN-15)   ┌───────────────┐
           │ disponível  │ ─────────────────────────▶ │ já sorteado   │
           │ sorteado=F  │ ◀───────────────────────── │ sorteado=T    │
           └─────────────┘  desfazer_ultimo (RN-20)   └───────────────┘
                  ▲          reiniciar (RN-19) — todos       │
                  └──────────────────────────────────────────┘
      remover / limpar lista (RN-11, RN-12): sai de qualquer estado; histórico fica
```

## Listas exibidas na tela de sorteio

- **Disponíveis**: `turma.alunos.disponiveis()` ordenados por nome.
- **Já sorteados**: `Sorteio.objects.da_rodada_atual(turma).filter(aluno__isnull=False)`
  ordenados por `ordem` (alunos removidos saem da tela, mas continuam no Histórico).
- **Histórico**: `turma.sorteios.all()` agrupado por `rodada` (inclui removidos, pelo
  `nome_aluno`).
