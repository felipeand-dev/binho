# Importação da lista do SUAP

O professor abre a turma no SUAP, seleciona a lista de alunos, copia (Ctrl+C) e cola
(Ctrl+V) no campo de importação do sistema. **Não é usada IA**: o texto é lido por
expressão regular, o que é mais rápido, gratuito, funciona offline e nunca altera
um nome.

## Formato 1 — Texto copiado do SUAP

Cada aluno ocupa 4 linhas:

```
Foto de                          ← marcador (ignorado)
ADRIANO MOREIRA DA COSTA     ← NOME
Matrícula:                       ← marcador (ignorado)
20261FICTEX0027                 ← MATRÍCULA
```

Expressão regular sugerida (Python, flags `re.IGNORECASE`):

```python
PADRAO_SUAP = re.compile(
    r'Foto de\s*\n\s*(?P<nome>[^\n]+?)\s*\n\s*Matr[íi]cula:\s*(?P<matricula>\w+)',
    re.IGNORECASE,
)
```

Antes de aplicar: trocar `\r\n` por `\n` (texto colado no Windows).

## Formato 2 — Lista simples

Se o padrão do SUAP não encontrar ninguém, cada linha não vazia vira um aluno sem
matrícula:

```
Maria da Silva
João Pereira
```

## Onde fica o código

`sorteio/sorteios/importador.py` — funções puras, sem sessão e sem rede:

```python
def extrair_nomes(texto: str) -> list[str]:
    """Nomes sem repetidos; a matrícula do SUAP é lida e descartada (RN-01, RN-03)."""
```

O serviço (`servico.py`) usa essa função na prévia, ao usar a lista e ao adicionar nomes.

## Exemplo para teste (32 alunos fictícios)

Nomes e matrículas **fictícios** (mesmo formato do SUAP; nenhum aluno real, por causa da LGPD).
Resultado esperado: **32 alunos encontrados, 0 duplicados**. Colando de novo na mesma
turma: **32 encontrados, 0 novos, 32 duplicados**.

```
Foto de 
ADRIANO MOREIRA DA COSTA
Matrícula:
20261FICTEX0027
Foto de 
Beatriz Almeida Fontes
Matrícula:
20261FICTEX0013
Foto de 
Caio Henrique de Souza
Matrícula:
20261FICTEX0006
Foto de 
DANIELA RIBEIRO LOPES
Matrícula:
20261FICTEX0015
Foto de 
EDUARDO MARTINS SILVA
Matrícula:
20261FICTEX0040
Foto de 
FLÁVIA CRISTINA NOGUEIRA
Matrícula:
20261FICTEX0042
Foto de 
GUILHERME AUGUSTO PRADO
Matrícula:
20261FICTEX0026
Foto de 
HELENA DIAS TEIXEIRA
Matrícula:
20261FICTEX0001
Foto de 
IGOR SANTANA FERREIRA
Matrícula:
20261FICTEX0028
Foto de 
Juliana Pires Campos
Matrícula:
20261FICTEX0037
Foto de 
KAUÃ BARBOSA LIMA
Matrícula:
20261FICTEX0030
Foto de 
LARISSA MENDES ROCHA
Matrícula:
20261FICTEX0033
Foto de 
MATHEUS OLIVEIRA ARAÚJO
Matrícula:
20261FICTEX0037
Foto de 
NATÁLIA GOMES PEREIRA
Matrícula:
20261FICTEX0016
Foto de 
OTÁVIO FREITAS CASTRO
Matrícula:
20261FICTEX0002
Foto de 
PAULA REGINA DUARTE
Matrícula:
20261FICTEX0019
Foto de 
Rafael Tavares Moura
Matrícula:
20261FICTEX0017
Foto de 
SABRINA COELHO VIANA
Matrícula:
20261FICTEX0024
Foto de 
TIAGO ANDRADE CORREIA
Matrícula:
20261FICTEX0025
Foto de 
ÚRSULA MACHADO BRITO
Matrícula:
20261FICTEX0003
Foto de 
VITOR HUGO CARVALHO
Matrícula:
20261FICTEX0036
Foto de 
WESLEY CARDOSO PINTO
Matrícula:
20261FICTEX0004
Foto de 
YASMIN RODRIGUES MELO
Matrícula:
20261FICTEX0009
Foto de 
ZÉLIA MONTEIRO REIS
Matrícula:
20261FICTEX0027
Foto de 
ALICE NASCIMENTO CRUZ
Matrícula:
20261FICTEX0032
Foto de 
BRENO FARIAS LEAL
Matrícula:
20261FICTEX0024
Foto de 
CECÍLIA ARAGÃO SOARES
Matrícula:
20261FICTEX0028
Foto de 
DIEGO MARQUES VIEIRA
Matrícula:
20261FICTEX0013
Foto de 
ESTER LACERDA BORGES
Matrícula:
20261FICTEX0010
Foto de 
FERNANDO QUEIROZ MOTA
Matrícula:
20261FICTEX0031
Foto de 
GABRIELA SIQUEIRA LIMA
Matrícula:
20261FICTEX0012
Foto de 
HUGO BATISTA FONSECA
Matrícula:
20261FICTEX0035
```
