# Regras de Negócio — Sorteio de Alunos (versão 2, sem cadastro)

Cada regra tem um código (RN-XX) citado no `plan.md`, no `tasks.md` e nos testes manuais.
Constituição vigente: 2.0.0. A versão 1 (turmas e banco de dados) está em
`specs/001-sorteio-alunos/` apenas como histórico.

## Lista de nomes

- **RN-01** — A lista vem do texto colado: formato do SUAP (`Foto de` / nome /
  `Matrícula:` / código) ou lista simples (um nome por linha). Só o **nome** é usado; a
  matrícula é descartada.
- **RN-02** — Os nomes são mantidos como vieram (sem mudar maiúsculas); apenas espaços
  extras nas pontas e no meio são removidos.
- **RN-03** — Nomes repetidos (ignorando acentos, maiúsculas e espaços extras) entram uma
  vez só, tanto no texto colado quanto ao adicionar nomes a uma lista em uso.
- **RN-04** — Antes de usar, o sistema mostra quantos nomes encontrou e quais são.
- **RN-15** — Um nome só pode ter **letras** (com acento), espaços e apóstrofo entre letras
  (ex.: D'Ávila). Números, traços, pontuação e símbolos são removidos (traços e pontos viram
  espaço: "Ana-Maria" → "Ana Maria"; "1. Maria Silva" → "Maria Silva"). Linhas que ficam com
  menos de 2 letras, e rótulos do SUAP soltos ("Foto de", "Matrícula"), são **descartadas** e
  a prévia informa quantas foram ignoradas.
- **RN-08** — A lista aceita até **80 nomes**.
- **RN-09** — Nomes adicionados com a lista em uso entram como **disponíveis**.
- **RN-12** — "Limpar lista" (com confirmação) apaga nomes, sorteados e rodada.

## Sorteio

- **RN-05** — Só participam os nomes **disponíveis**; um nome sorteado não sai de novo até
  o sorteio ser reiniciado.
- **RN-06** — Toda ação informa a versão da lista que a tela conhece; ações feitas sobre
  uma versão antiga (ex.: outra aba) são recusadas com o aviso para recarregar.
- **RN-07** — "Reiniciar sorteio" (com confirmação) devolve todos para disponíveis e começa
  a rodada seguinte. Só é possível se alguém já foi sorteado na rodada.
- **RN-10** — Quem escolhe é o **servidor**, com `secrets`; a animação apenas revela.
- **RN-11** — "Desfazer último" devolve o último sorteado da rodada para disponíveis.
- **RN-13** — Sem disponíveis, o botão "Sortear" fica desabilitado com a mensagem "Todos os
  alunos já foram sorteados. Reinicie o sorteio."

## Privacidade

- **RN-14** — Tudo vale só enquanto o navegador estiver aberto: o estado fica num cookie
  assinado do próprio navegador, apagado ao fechá-lo. Nenhum nome é gravado no servidor
  nem enviado a terceiros; cada visitante tem a sua lista; não há login.

## Fluxo resumido

```
Abrir o site → Colar a lista → Prévia (N nomes) → Usar esta lista
     ↓
Palco: [Disponíveis: 32]  [Já sorteados: 0]
     ↓ "Sortear" (servidor escolhe → fita gira → para no nome)
Nome vai para "Já sorteados" … até acabar
     ↓
"Reiniciar sorteio" → todos disponíveis (rodada + 1)   ·   "Limpar lista" → nova lista
```
