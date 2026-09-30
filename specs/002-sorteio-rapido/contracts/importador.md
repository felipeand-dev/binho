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

## Demais funções

- `detectar_formato(texto) -> "suap" | "lista"`
- `normalizar_espacos(texto) -> str` — `"  Ana   Luísa "` → `"Ana Luísa"`
- `chave_nome(nome) -> str` — sem acentos, `casefold()`, espaços normalizados; dois nomes
  são o mesmo aluno quando têm a mesma chave.
