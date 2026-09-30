# Contrato: `sorteio/sorteios/importador.py`

Funções puras (sem sessão, sem rede). Reaproveita o importador validado na versão 1,
devolvendo **só nomes** (a matrícula do SUAP é lida pela expressão regular e descartada).

## `extrair_nomes(texto: str) -> list[str]`

| Entrada | Saída |
|---|---|
| Exemplo de 32 alunos de `docs/importacao-suap.md` | 32 nomes, iguais ao texto, sem matrículas |
| O mesmo com `\r\n` | os mesmos 32 nomes |
| `"Foto de \n  JOÃO   DA  SILVA \nMatrícula:\n 2026ABC01 "` | `["JOÃO DA SILVA"]` |
| `"Maria da Silva\n\n  João Pereira  \n"` | `["Maria da Silva", "João Pereira"]` |
| `"Maria\nMARIA\nmária"` | `["Maria"]` |
| `""` ou só espaços | `[]` |
| linha com mais de 150 caracteres | descartada |
| `"1. Maria Silva - 2026ABC"` | `["Maria Silva"]` |
| `"Ana-Maria Souza"` | `["Ana Maria Souza"]` |
| `"João D'Ávila"` | `["João D'Ávila"]` |
| `"12345\n---\n###\nX\nBia"` | `["Bia"]` (4 linhas descartadas) |
| `"Foto de\nMatrícula:\nBia"` (rótulos soltos, lista simples) | `["Bia"]` |

## `limpar_nome(texto: str) -> str`

Mantém só letras (qualquer alfabeto, com acento), espaços e apóstrofo entre letras; traços,
pontos, barras e sublinhados viram espaço; o resto (números, símbolos, emojis) é removido.
Devolve `""` se sobrarem menos de 2 letras (RN-15).

## `contar_descartadas(texto: str) -> int`

Quantas linhas com conteúdo foram ignoradas por não conterem um nome (RN-15). Informado na
prévia como `descartadas`.

## Demais funções

- `detectar_formato(texto) -> "suap" | "lista"`
- `normalizar_espacos(texto) -> str` — `"  Ana   Luísa "` → `"Ana Luísa"`
- `chave_nome(nome) -> str` — sem acentos, `casefold()`, espaços normalizados; dois nomes
  são o mesmo aluno quando têm a mesma chave.
