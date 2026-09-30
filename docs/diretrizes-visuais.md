# Diretrizes Visuais e Interface

Documento usado pelo `/speckit-plan` e pelo `/speckit-implement` para construir as telas.

## Conceito: "Palco"

Atmosfera:

- **Tela de sorteio** (a única): escura e teatral, como um programa de auditório — holofote,
  suspense e revelação. O sorteio é um **show** que prende a atenção da turma no projetor.

## Identidade

### Cores

| Token | Valor | Uso |
|---|---|---|
| `--verde` | `#1F8A4C` | Cor principal (inspirada no verde dos Institutos Federais): botões, destaques |
| `--ouro` | `#F5B83D` | O sorteado: brilho, confete, borda do vencedor |
| `--palco` | `#0E1512` | Fundo da tela de sorteio (verde quase preto) |
| `--papel` | `#F7F6F1` | Fundo das telas de gestão |
| `--tinta` | `#17201B` | Texto principal |
| `--cinza` | `#8A948E` | Alunos já sorteados, textos secundários |

### Tipografia (Google Fonts)

- **Bricolage Grotesque** — títulos e o nome sorteado (expressiva, enorme no projetor).
- **Figtree** — textos, botões e listas.
- **JetBrains Mono** — apenas matrículas.
- Proibido: Inter, Roboto, Arial, Space Grotesk.

### Forma

- Cantos arredondados de 16–24 px, sombras suaves, bastante espaço em branco.
- Ícones Bootstrap Icons em traço fino.
- Transições de 150–300 ms; easing `cubic-bezier(.2,.8,.2,1)`.

## Tela (versão 2: uma tela só, sem cadastro)

Tudo acontece no palco escuro; não há telas de gestão, abas, turmas nem histórico.

### Sem lista — colar os nomes (tela de abertura)

Uma coluna, **tudo centralizado** (largura máxima ~46rem), dentro do palco com holofote.

```
                 ◉ Sorteio
        Quem vai ser sorteado hoje?
   ┌──────── letreiro de ensaio ────────┐
   │          ANA BEATRIZ SOUZA         │
   │ ━━━━━━━━━━ BRUNO ALVES ━━━━━━━━━━━ │   ← miniatura da roleta do palco
   │            CARLA MENDES            │
   └────────────────────────────────────┘
              32 nomes prontos
   ┌────────────────────────────────────┐
   │ Cole aqui a lista copiada do SUAP  │
   └────────────────────────────────────┘
     1 Copie no SUAP  2 Cole aqui  3 Sorteie
          [ ▶ Começar o sorteio ]
   🔒 Nada fica salvo: fechou o navegador, a lista some.
```

- **Letreiro de ensaio** (o elemento memorável da tela): 3 linhas, a do meio entre linhas
  douradas, igual à roleta do palco. Antes de colar, gira devagar com nomes de exemplo
  (fictícios); ao colar, dá um giro rápido e passa a mostrar os nomes da turma. Com
  `prefers-reduced-motion`, fica parado.
- Contador grande em ouro ("32 nomes prontos"); a lista completa fica em "Ver os 32 nomes"
  (recolhível). Texto sem nenhum nome → aviso em vermelho claro.
- "Começar o sorteio" (ouro, pílula grande) só fica ativo quando há nomes; `Ctrl+Enter`
  também começa.
- Linha de confiança no rodapé: nada é guardado; matrículas são ignoradas.
- Matrículas nunca aparecem.

### Com lista — sortear

Mesmo layout da versão 1: **Disponíveis | palco | Já sorteados**, botão SORTEAR, Desfazer
último, Reiniciar sorteio, modo apresentação (⛶) e atalhos (`Espaço`, `F`, `Z`).
No cabeçalho: **"+ Adicionar nomes"** (modal com o mesmo campo e prévia, marcando quem já
está na lista) e **"Limpar lista"** (confirmação).

- Todos sorteados: "Turma completa! 🎉" e o botão principal vira "Reiniciar sorteio".
- No celular: palco no topo, listas Disponíveis / Já sorteados em abas.

## Animação do sorteio (GSAP)

| Tempo | O que acontece |
|---|---|
| 0 s | Botão afunda (escala 0,97) e vira "Sorteando…"; o holofote intensifica |
| 0–0,3 s | O navegador pede o resultado ao servidor e os nomes **já começam a girar** |
| 0,3–4 s | Desaceleração natural (`power4.out`) até o nome escolhido; "tic" sonoro opcional a cada nome |
| 4,0 s | O nome para com leve "quique" (`back.out`); linhas douradas acendem |
| 4,2 s | Nome **gigante, letra por letra** (SplitText) + "12º sorteado" |
| 4,3 s | **Confete** dourado e verde dos dois lados (canvas-confetti) |
| 4,8 s | O nome **voa** de "Disponíveis" para "Sorteados" (GSAP Flip); contadores sobem animados |

- O botão fica desabilitado durante a animação.
- Com `prefers-reduced-motion`: sem giro; o nome aparece com fade suave.
- `aria-live` anuncia "Sorteado: Nome do aluno" para leitores de tela.

## Micro-interações

- Toasts deslizando no canto para as mensagens do Django.
- Modal de confirmação para excluir turma, limpar lista e reiniciar sorteio.
- Estados vazios com ícone e texto convidativo, nunca tela em branco.
- Foco visível em todos os botões (navegação por teclado).

## Responsividade

- **Celular**: palco no topo, listas Disponíveis/Sorteados viram abas.
- **Notebook**: layout de 3 colunas.
- **Projetor**: modo apresentação.
