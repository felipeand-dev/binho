"""Regras do sorteio (docs/regras-de-negocio.md, RN-01 a RN-14).

O estado fica na sessão do Django, que é um cookie assinado no navegador do professor:
nada é gravado no servidor (constituição 2.0.0). Esta classe é a única dona das regras;
views e JavaScript apenas a usam.
"""
import json
import secrets
from dataclasses import dataclass

from sorteio.regras import RegraNegocioError

from .importador import chave_nome, detectar_formato, extrair_nomes

CHAVE_SESSAO = 'sorteio'
LIMITE_NOMES = 80
# O cookie da sessão tem limite de ~4 KB no navegador; o estado precisa caber com folga.
TAMANHO_MAXIMO_ESTADO = 3500

MENSAGEM_SEM_NOMES = 'Nenhum nome encontrado. Cole a lista do SUAP ou um nome por linha.'
MENSAGEM_LIMITE = f'A lista aceita até {LIMITE_NOMES} nomes.'
MENSAGEM_SEM_LISTA = 'Cole a lista de nomes para começar.'
MENSAGEM_VERSAO = 'A lista mudou em outra aba. Recarregue a página.'
MENSAGEM_TODOS_SORTEADOS = 'Todos os alunos já foram sorteados. Reinicie o sorteio.'
MENSAGEM_NADA_A_DESFAZER = 'Não há sorteio para desfazer nesta rodada.'
MENSAGEM_NADA_A_REINICIAR = 'Nenhum aluno foi sorteado nesta rodada.'


@dataclass
class Previa:
    """Resultado da leitura do texto colado, antes de usar (RN-04)."""

    formato: str
    nomes: list
    ja_na_lista: list

    @property
    def encontrados(self):
        return len(self.nomes)

    @property
    def novos(self):
        return self.encontrados - sum(self.ja_na_lista)

    def como_json(self):
        return {
            'ok': True,
            'formato': self.formato,
            'encontrados': self.encontrados,
            'novos': self.novos,
            'ja_na_lista': self.encontrados - self.novos,
            'nomes': [
                {'nome': nome, 'ja_na_lista': repetido}
                for nome, repetido in zip(self.nomes, self.ja_na_lista)
            ],
        }


@dataclass
class Resultado:
    """Resultado de um sorteio, para a animação e as mensagens."""

    id: int
    nome: str
    ordem: int
    rodada: int


class SorteioDaSessao:
    """Estado do sorteio de um navegador: nomes, sorteados (em ordem), rodada e versão."""

    def __init__(self, sessao):
        self.sessao = sessao

    # ------------------------------------------------------------------ leitura

    @property
    def _estado(self):
        return self.sessao.get(CHAVE_SESSAO)

    @property
    def tem_lista(self):
        estado = self._estado
        return bool(estado and estado.get('nomes'))

    @property
    def nomes(self):
        return list(self._estado['nomes']) if self.tem_lista else []

    @property
    def rodada(self):
        return self._estado['rodada'] if self.tem_lista else 1

    @property
    def versao(self):
        # A versão sobrevive ao "Limpar lista": uma aba antiga nunca coincide com a nova.
        estado = self._estado
        return estado.get('versao', 0) if estado else 0

    @property
    def _ids_sorteados(self):
        return list(self._estado['sorteados']) if self.tem_lista else []

    @property
    def disponiveis(self):
        """[(id, nome)] dos que ainda podem sair na rodada, na ordem da lista (RN-05)."""
        sorteados = set(self._ids_sorteados)
        return [(i, nome) for i, nome in enumerate(self.nomes) if i not in sorteados]

    @property
    def sorteados(self):
        """[(ordem, id, nome)] na ordem em que saíram."""
        nomes = self.nomes
        return [(ordem, i, nomes[i]) for ordem, i in enumerate(self._ids_sorteados, start=1)]

    @property
    def ultimo(self):
        sorteados = self.sorteados
        return sorteados[-1] if sorteados else None

    def contadores(self):
        return {
            'disponiveis': len(self.disponiveis),
            'sorteados': len(self._ids_sorteados),
            'versao': self.versao,
        }

    # ------------------------------------------------------------------ apoio

    def _exigir_lista(self):
        if not self.tem_lista:
            raise RegraNegocioError(MENSAGEM_SEM_LISTA)

    def _conferir_versao(self, versao):
        """Recusa ações feitas sobre um estado antigo, ex.: outra aba (RN-06)."""
        self._exigir_lista()
        try:
            versao = int(versao)
        except (TypeError, ValueError):
            versao = -1
        if versao != self.versao:
            raise RegraNegocioError(MENSAGEM_VERSAO)

    def _salvar(self, estado):
        estado['versao'] = estado.get('versao', 0) + 1
        if len(json.dumps(estado, ensure_ascii=False).encode()) > TAMANHO_MAXIMO_ESTADO:
            raise RegraNegocioError('A lista ficou grande demais. Use nomes mais curtos.')
        self.sessao[CHAVE_SESSAO] = estado
        self.sessao.modified = True

    # ------------------------------------------------------------------ lista

    def previa(self, texto):
        """Mostra o que seria usado, sem alterar nada (RN-04)."""
        existentes = {chave_nome(nome) for nome in self.nomes}
        nomes = extrair_nomes(texto)
        return Previa(
            formato=detectar_formato(texto),
            nomes=nomes,
            ja_na_lista=[chave_nome(nome) in existentes for nome in nomes],
        )

    def iniciar(self, texto):
        """Começa uma lista nova com os nomes do texto (RN-01 a RN-04, RN-08)."""
        if self.tem_lista:
            # Outra aba já começou uma lista: não substituir sem o professor ver.
            raise RegraNegocioError(MENSAGEM_VERSAO)
        nomes = extrair_nomes(texto)
        if not nomes:
            raise RegraNegocioError(MENSAGEM_SEM_NOMES)
        if len(nomes) > LIMITE_NOMES:
            raise RegraNegocioError(f'{MENSAGEM_LIMITE} Esta lista tem {len(nomes)}.')
        self._salvar({'nomes': nomes, 'sorteados': [], 'rodada': 1, 'versao': self.versao})
        return len(nomes)

    def adicionar(self, texto, versao):
        """Acrescenta só os nomes novos, como disponíveis (RN-03, RN-08, RN-09).

        Devolve (quantos entraram, quantos já estavam na lista).
        """
        self._conferir_versao(versao)
        previa = self.previa(texto)
        if not previa.nomes:
            raise RegraNegocioError(MENSAGEM_SEM_NOMES)
        novos = [nome for nome, repetido in zip(previa.nomes, previa.ja_na_lista) if not repetido]
        if len(self.nomes) + len(novos) > LIMITE_NOMES:
            raise RegraNegocioError(
                f'{MENSAGEM_LIMITE} A lista tem {len(self.nomes)} e entrariam {len(novos)}.'
            )
        estado = dict(self._estado)
        estado['nomes'] = self.nomes + novos
        self._salvar(estado)
        return len(novos), previa.encontrados - len(novos)

    def limpar(self, versao):
        """Apaga a lista, os sorteados e a rodada (RN-12)."""
        self._conferir_versao(versao)
        # Só o número da versão fica; nenhum nome permanece na sessão.
        self.sessao[CHAVE_SESSAO] = {'versao': self.versao + 1}
        self.sessao.modified = True

    # ------------------------------------------------------------------ sorteio

    def sortear(self, versao):
        """Sorteia um nome disponível; quem escolhe é o servidor (RN-05, RN-10)."""
        self._conferir_versao(versao)
        disponiveis = self.disponiveis
        if not disponiveis:
            raise RegraNegocioError(MENSAGEM_TODOS_SORTEADOS)
        escolhido, nome = secrets.choice(disponiveis)
        estado = dict(self._estado)
        estado['sorteados'] = self._ids_sorteados + [escolhido]
        self._salvar(estado)
        return Resultado(
            id=escolhido, nome=nome, ordem=len(estado['sorteados']), rodada=estado['rodada']
        )

    def desfazer(self, versao):
        """Devolve o último sorteado para os disponíveis (RN-11)."""
        self._conferir_versao(versao)
        ultimo = self.ultimo
        if ultimo is None:
            raise RegraNegocioError(MENSAGEM_NADA_A_DESFAZER)
        estado = dict(self._estado)
        estado['sorteados'] = self._ids_sorteados[:-1]
        self._salvar(estado)
        ordem, id_, nome = ultimo
        return Resultado(id=id_, nome=nome, ordem=ordem, rodada=estado['rodada'])

    def reiniciar(self, versao):
        """Todos voltam a ficar disponíveis numa nova rodada (RN-07)."""
        self._conferir_versao(versao)
        if not self._ids_sorteados:
            raise RegraNegocioError(MENSAGEM_NADA_A_REINICIAR)
        estado = dict(self._estado)
        estado['sorteados'] = []
        estado['rodada'] += 1
        self._salvar(estado)
        return estado['rodada']
