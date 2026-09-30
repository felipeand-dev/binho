"""Leitura da lista de nomes colada pelo professor (RN-01 a RN-03).

Funções puras: não acessam a sessão nem a rede. O texto é lido por expressão regular,
sem IA (constituição, Princípio III). Só os nomes são usados: a matrícula do SUAP é lida
e descartada (minimização de dados, LGPD). Formatos em docs/importacao-suap.md.
"""
import re
import unicodedata

# Cada aluno copiado do SUAP ocupa 4 linhas: "Foto de" / NOME / "Matrícula:" / código.
PADRAO_SUAP = re.compile(
    r'Foto de\s*\n\s*(?P<nome>[^\n]+?)\s*\n\s*Matr[íi]cula:\s*(?P<matricula>\w+)',
    re.IGNORECASE,
)

# Linhas maiores que isso não são nomes (ex.: parágrafos colados por engano).
TAMANHO_MAXIMO_NOME = 150

FORMATO_SUAP = 'suap'
FORMATO_LISTA = 'lista'


def normalizar_espacos(texto):
    """Remove espaços nas pontas e reduz espaços internos a um só (RN-09).

    Não altera maiúsculas nem acentos: "  Ana   Luísa " → "Ana Luísa".
    """
    return ' '.join((texto or '').split())


def chave_nome(nome):
    """Chave de comparação de nomes: sem acentos, sem caixa e com espaços normalizados."""
    decomposto = unicodedata.normalize('NFKD', nome or '')
    sem_acentos = ''.join(c for c in decomposto if not unicodedata.combining(c))
    return normalizar_espacos(sem_acentos).casefold()


def _unificar_quebras(texto):
    return (texto or '').replace('\r\n', '\n').replace('\r', '\n')


def detectar_formato(texto):
    """Devolve 'suap' se o padrão do SUAP encontrar pelo menos um aluno; senão 'lista'."""
    if PADRAO_SUAP.search(_unificar_quebras(texto)):
        return FORMATO_SUAP
    return FORMATO_LISTA


def extrair_nomes(texto):
    """Lê o texto colado e devolve a lista de nomes, sem matrículas e sem repetidos.

    - Texto do SUAP: o nome de cada bloco (a matrícula é descartada).
    - Lista simples (quando o padrão do SUAP não acha ninguém): cada linha não vazia.
    Nomes com a mesma `chave_nome` (acentos, maiúsculas, espaços) entram uma vez só.
    """
    texto = _unificar_quebras(texto)
    if detectar_formato(texto) == FORMATO_SUAP:
        encontrados = [bloco.group('nome') for bloco in PADRAO_SUAP.finditer(texto)]
    else:
        encontrados = texto.split('\n')

    nomes = []
    chaves = set()
    for bruto in encontrados:
        nome = normalizar_espacos(bruto)
        chave = chave_nome(nome)
        if not nome or len(nome) > TAMANHO_MAXIMO_NOME or chave in chaves:
            continue
        chaves.add(chave)
        nomes.append(nome)
    return nomes
