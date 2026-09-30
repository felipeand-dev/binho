# Contrato: `sorteio/turmas/importador.py`

Módulo de funções puras (sem acesso ao banco e sem rede). É o único lugar onde ficam a
leitura do texto colado e a regra de duplicidade (RN-05, RN-07, RN-09).

## `extrair_alunos(texto: str) -> list[dict]`

Retorna `[{"nome": str, "matricula": str}, ...]` — `matricula` é `""` quando não existe.

| Entrada | Saída esperada |
|---|---|
| Exemplo de 32 alunos de `docs/importacao-suap.md` | 32 itens, nomes e matrículas idênticos ao texto |
| O mesmo exemplo com `\r\n` (colado no Windows) | os mesmos 32 itens |
| `"Foto de \n  JOÃO   DA  SILVA \nMatrícula:\n 2026ABC01 "` | `[{"nome": "JOÃO DA SILVA", "matricula": "2026ABC01"}]` |
| `"Maria da Silva\n\n  João Pereira  \n"` | `[{"nome": "Maria da Silva", "matricula": ""}, {"nome": "João Pereira", "matricula": ""}]` |
| `"Maria\nMARIA\nmária"` | um único item `"Maria"` (duplicados no próprio texto) |
| Mesmo bloco do SUAP colado duas vezes no mesmo texto | cada aluno uma vez |
| `""` ou só espaços/linhas vazias | `[]` |
| Linha com mais de 150 caracteres (lista simples) | linha descartada |

Detecção de formato: se `PADRAO_SUAP` encontrar pelo menos um aluno, só os blocos do SUAP
são considerados; senão, o texto é lido como lista simples.

## `detectar_formato(texto: str) -> str`

Devolve `"suap"` se `PADRAO_SUAP` encontrar pelo menos um aluno; senão `"lista"`. Usado
para preencher o campo `formato` do JSON da prévia.

## `normalizar_espacos(texto: str) -> str`

Remove espaços nas pontas e reduz espaços internos a um só. Não altera maiúsculas nem
acentos (RN-09). `"  Ana   Luísa "` → `"Ana Luísa"`.

## `chave_nome(nome: str) -> str`

Chave de comparação: sem acentos, `casefold()`, espaços normalizados.
`"JOÃO  da Silva"` e `"joao da silva"` → mesma chave.

## `mesmo_aluno(a, b) -> bool`

`a` e `b` têm `nome` e `matricula` (dicionário ou objeto). Verdadeiro quando:

1. ambos têm matrícula e elas são iguais; ou
2. pelo menos um não tem matrícula e `chave_nome(a.nome) == chave_nome(b.nome)`.

| a | b | Resultado |
|---|---|---|
| `("Ana", "001")` | `("ANA", "001")` | mesmo |
| `("Ana", "001")` | `("Ana", "002")` | diferente |
| `("Ana", "")` | `("ÁNA", "")` | mesmo |
| `("Ana", "")` | `("Ana", "001")` | mesmo |
| `("Ana", "001")` | `("Beatriz", "001")` | mesmo (matrícula manda) |
