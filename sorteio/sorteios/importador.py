"""Leitura da lista de nomes colada pelo professor (RN-01 a RN-03, RN-15).

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

# Traços, pontos, barras, sublinhados e pontuação separam palavras: viram espaço.
SEPARADORES = re.compile(r"[\-\u2010-\u2015_.,;:/\\|()\[\]{}<>]+")
# Rótulos do SUAP que, soltos numa lista simples, não são nomes.
ROTULOS_SUAP = {'foto de', 'foto', 'matricula'}
MINIMO_DE_LETRAS = 2


def normalizar_espacos(texto):
    """Remove espaços nas pontas e reduz espaços internos a um só (RN-09).

    Não altera maiúsculas nem acentos: "  Ana   Luísa " → "Ana Luísa".
    """
    return ' '.join((texto or '').split())


def limpar_nome(texto):
    """Deixa só o nome: letras (com acento), espaços e apóstrofo entre letras (RN-15).

    - traços, pontos, barras e pontuação viram espaço ("Ana-Maria" → "Ana Maria");
    - palavras com números são descartadas (matrículas, códigos: "2026ABC");
    - demais símbolos e emojis são removidos.
    Devolve "" se sobrarem menos de 2 letras (a linha não tem um nome).
    """
    texto = unicodedata.normalize('NFC', texto or '').replace('\u2019', "'").replace('`', "'")
    palavras = []
    for palavra in SEPARADORES.sub(' ', texto).split():
        if any(caractere.isdigit() for caractere in palavra):
            continue
        palavra = ''.join(c for c in palavra if c.isalpha() or c == "'")
        palavra = re.sub(r"'{2,}", "'", palavra).strip("'")
        if palavra:
            palavras.append(palavra)
    nome = ' '.join(palavras)
    if sum(1 for c in nome if c.isalpha()) < MINIMO_DE_LETRAS:
        return ''
    return nome


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


def _ler(texto):
    """Lê o texto e devolve (nomes sem repetidos, linhas descartadas por não terem nome)."""
    texto = _unificar_quebras(texto)
    if detectar_formato(texto) == FORMATO_SUAP:
        encontrados = [bloco.group('nome') for bloco in PADRAO_SUAP.finditer(texto)]
    else:
        encontrados = [linha for linha in texto.split('\n') if linha.strip()]

    nomes = []
    chaves = set()
    descartadas = 0
    for bruto in encontrados:
        nome = limpar_nome(bruto)
        chave = chave_nome(nome)
        if not nome or len(nome) > TAMANHO_MAXIMO_NOME or chave in ROTULOS_SUAP:
            descartadas += 1
            continue
        if chave in chaves:
            continue  # repetido: entra uma vez só (não é lixo)
        chaves.add(chave)
        nomes.append(nome)
    return nomes, descartadas


def extrair_nomes(texto):
    """Lê o texto colado e devolve a lista de nomes, limpos e sem repetidos.

    - Texto do SUAP: o nome de cada bloco (a matrícula é descartada).
    - Lista simples (quando o padrão do SUAP não acha ninguém): cada linha não vazia.
    Cada nome passa por `limpar_nome` (só letras); linhas sem nome são ignoradas. Nomes com
    a mesma `chave_nome` (acentos, maiúsculas, espaços) entram uma vez só.
    """
    return _ler(texto)[0]


def contar_descartadas(texto):
    """Quantas linhas com conteúdo foram ignoradas por não conterem um nome (RN-15)."""
    return _ler(texto)[1]
