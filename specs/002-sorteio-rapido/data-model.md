# Modelo de Dados (Fase 1): Sorteio Rápido sem Cadastro

Não há banco de dados nem models do Django. O único "dado" é o estado do sorteio de cada
navegador, guardado na sessão (cookie assinado) sob a chave `sorteio`.

## Estado da sessão — `request.session['sorteio']`

| Campo | Tipo | Regras |
|---|---|---|
| `nomes` | lista de texto | 1 a 80 nomes; cada um sem espaços extras (RN-02), até 150 caracteres; sem duplicados pela `chave_nome` (RN-03). A posição na lista é o **id** do nome. |
| `sorteados` | lista de inteiros | ids dos nomes sorteados na rodada atual, **na ordem de saída** (a posição + 1 é a ordem: 1º, 2º…). Nunca repete um id (RN-05). |
| `rodada` | inteiro ≥ 1 | começa em 1; +1 a cada reinício (RN-07). |
| `versao` | inteiro ≥ 1 | +1 a cada ação que altera o estado; usada para recusar ações sobre estado antigo (RN-06). |

Sem a chave `sorteio` na sessão = **sem lista** (tela de colar nomes).

Derivados (calculados pelo serviço, nunca guardados):

- **disponíveis** = ids de `nomes` que não estão em `sorteados`, na ordem da lista.
- **último** = `sorteados[-1]`, se existir.

## Serviço — `sorteio/sorteios/servico.py`

Classe `SorteioDaSessao(sessao)`: único dono das regras. Todas as ações que alteram o
estado recebem `versao` e levantam `RegraNegocioError` (mensagem pronta em Português)
quando ela não bate com a da sessão.

| Operação | Regra | Efeito |
|---|---|---|
| `previa(texto)` | RN-01..RN-04 | devolve nomes encontrados e, se houver lista, quantos são novos e quantos já estão nela (não altera nada) |
| `iniciar(texto)` | RN-01..RN-04, RN-08 | cria o estado com os nomes; sem nomes → erro "Nenhum nome encontrado."; acima de 80 → erro com o limite |
| `adicionar(texto, versao)` | RN-03, RN-08, RN-09 | acrescenta só os novos (disponíveis); informa quantos entraram e quantos já estavam; respeita o limite |
| `sortear(versao)` | RN-05, RN-10 | `secrets.choice(disponiveis)`; acrescenta o id a `sorteados`; sem disponíveis → "Todos os alunos já foram sorteados. Reinicie o sorteio." |
| `desfazer(versao)` | RN-11 | remove o último de `sorteados`; sem sorteios → "Não há sorteio para desfazer nesta rodada." |
| `reiniciar(versao)` | RN-07 | `sorteados = []`, `rodada += 1`; sem sorteios → "Nenhum aluno foi sorteado nesta rodada." |
| `limpar(versao)` | RN-12 | apaga a chave `sorteio` da sessão |

Toda operação que altera o estado incrementa `versao` e marca a sessão como modificada.

## Transições

```text
 (sem lista) ──iniciar──▶ (em uso, rodada 1) ──sortear──▶ … ──▶ (todos sorteados)
      ▲                        │   ▲   │                               │
      └──────── limpar ────────┘   │   └── desfazer (volta 1) ◀────────┘
                                   └────── reiniciar (rodada + 1) ◀────┘
 adicionar: em qualquer estado "em uso"; os novos entram como disponíveis
```

## Invariantes

- **I-1**: `sorteados` não tem ids repetidos e só contém ids válidos de `nomes`.
- **I-2**: `len(disponíveis) + len(sorteados) == len(nomes)`.
- **I-3**: nenhum nome duplicado (pela `chave_nome`) em `nomes`.
- **I-4**: nada disso existe no servidor fora da requisição em andamento.
