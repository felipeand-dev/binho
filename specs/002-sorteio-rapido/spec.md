# Especificação da Funcionalidade: Sorteio Rápido sem Cadastro

**Diretório da feature**: `specs/002-sorteio-rapido`

**Criada em**: 2026-09-30

**Status**: Rascunho

**Substitui**: `specs/001-sorteio-alunos` (versão com turmas e banco de dados), conforme a
constituição 2.0.0.

**Entrada**: Descrição do usuário: "Sorteio rápido sem cadastro: uma única tela (o palco de
sorteio atual, com as listas 'Disponíveis' e 'Já sorteados') onde o professor cola os nomes
dos alunos e sorteia. Não existe criação de turma, login, histórico salvo nem banco de
dados. Campo para colar os nomes (SUAP ou um por linha; a matrícula é descartada), mostrando
quantos foram encontrados; repetidos entram uma vez; adicionar mais nomes ou limpar a
lista; sortear com os nomes girando e parando no sorteado, que aparece grande com a ordem;
sem repetição até 'Reiniciar sorteio' (com confirmação); 'Desfazer último'; botão
desabilitado quando todos saírem; modo apresentação e atalhos; respeita 'reduzir
movimento'; os dados valem só enquanto o navegador estiver aberto e nada é guardado no
servidor; cada visitante tem a sua lista; publicável na Vercel (código no GitHub)."

## Cenários de Usuário e Testes *(obrigatório)*

### História de Usuário 1 - Colar os nomes e sortear (Prioridade: P1) 🎯

O professor abre o link do site, cola a lista de alunos copiada do SUAP (ou digita um nome
por linha), vê quantos nomes foram encontrados e começa. Ao clicar em "Sortear", os nomes
giram, desaceleram e param no sorteado, que aparece em destaque com a ordem ("1º
sorteado") e passa de "Disponíveis" para "Já sorteados".

**Por que esta prioridade**: é a ferramenta inteira; sem isso não existe produto.

**Teste independente**: abrir o site, colar os 32 alunos de `docs/importacao-suap.md`,
conferir "32 nomes encontrados", usar a lista, sortear e ver o nome parar, em destaque, e
ir para "Já sorteados" com os contadores 31 / 1.

**Cenários de aceitação**:

1. **Dado** o site aberto sem lista, **Quando** o professor cola o texto do SUAP, **Então**
   o sistema informa quantos nomes encontrou e mostra os nomes, sem as matrículas.
2. **Dado** uma lista simples com um nome por linha, **Quando** o professor a cola,
   **Então** cada linha não vazia vira um nome.
3. **Dado** um texto com o mesmo nome repetido (com diferença só de acentos, maiúsculas ou
   espaços), **Quando** o professor cola, **Então** o nome entra uma vez só.
4. **Dado** um texto vazio ou sem nomes, **Quando** o professor tenta usar a lista,
   **Então** o sistema avisa que nenhum nome foi encontrado e continua sem lista.
5. **Dado** a lista em uso, **Quando** o professor clica em "Sortear", **Então** os nomes
   giram, desaceleram e param em um nome disponível, exibido em destaque com a ordem, que
   passa para "Já sorteados".
6. **Dado** um nome já sorteado, **Quando** novos sorteios acontecem, **Então** esse nome
   não sai de novo até o professor reiniciar.
7. **Dado** que todos já foram sorteados, **Quando** o professor olha a tela, **Então** o
   botão "Sortear" está desabilitado e o sistema mostra "Todos os alunos já foram
   sorteados. Reinicie o sorteio."

---

### História de Usuário 2 - Reiniciar e desfazer (Prioridade: P1)

O professor reinicia o sorteio (com confirmação) para uma nova rodada com todos os nomes,
ou desfaz o último sorteio quando o aluno sorteado está ausente.

**Por que esta prioridade**: sem reiniciar, a lista só serviria uma vez; sem desfazer, um
aluno ausente "gasta" a vez de alguém.

**Teste independente**: sortear 3 nomes; "Desfazer último" devolve o 3º a "Disponíveis";
"Reiniciar sorteio" → confirmar devolve todos e mostra "Rodada 2".

**Cenários de aceitação**:

1. **Dado** nomes já sorteados, **Quando** o professor confirma "Reiniciar sorteio",
   **Então** todos voltam para "Disponíveis", a rodada aumenta em 1 e a ordem recomeça em 1º.
2. **Dado** a confirmação de reinício aberta, **Quando** o professor cancela, **Então**
   nada muda.
3. **Dado** um último sorteado, **Quando** o professor clica em "Desfazer último",
   **Então** esse nome volta para "Disponíveis" e o próximo sorteio recebe a mesma ordem.
4. **Dado** uma rodada sem sorteios, **Quando** o professor olha a tela, **Então**
   "Desfazer último" e "Reiniciar sorteio" estão indisponíveis.

---

### História de Usuário 3 - Mudar a lista durante a aula (Prioridade: P2)

Com a lista em uso, o professor adiciona nomes que faltaram (entram como disponíveis) ou
limpa a lista para colar outra turma.

**Por que esta prioridade**: acontece (aluno que chegou depois, troca de turma), mas o
sorteio funciona sem isso.

**Teste independente**: com a lista em uso, adicionar "Aluno Novo" → aparece em
"Disponíveis"; adicionar um nome que já está na lista → avisa e não duplica; "Limpar
lista" → confirmar volta à tela de colar nomes.

**Cenários de aceitação**:

1. **Dado** um sorteio em andamento, **Quando** o professor adiciona nomes, **Então** os
   novos entram como disponíveis e os que já estavam na lista são ignorados, com aviso de
   quantos entraram e quantos já estavam.
2. **Dado** uma lista em uso, **Quando** o professor confirma "Limpar lista", **Então** a
   lista, os sorteados e a rodada são apagados e a tela volta ao campo de colar nomes.

---

### História de Usuário 4 - Projetar para a turma (Prioridade: P3)

O professor projeta o sorteio em tela cheia e usa o teclado; quem prefere menos movimento
vê o resultado sem giro.

**Por que esta prioridade**: torna o sorteio um momento coletivo, mas não é essencial.

**Teste independente**: ativar o modo apresentação, sortear com Espaço, desfazer com Z e
sair com F; ativar "reduzir movimento" no sistema e sortear.

**Cenários de aceitação**:

1. **Dado** a tela de sorteio, **Quando** o professor ativa o modo apresentação, **Então**
   só o palco e os botões aparecem, em tela cheia, com o nome em tamanho grande.
2. **Dado** a tela de sorteio, **Quando** o professor aperta Espaço, F ou Z fora de campos
   de texto, **Então** o sistema sorteia, alterna a tela cheia ou desfaz o último.
3. **Dado** "reduzir movimento" ativado no computador, **Quando** o professor sorteia,
   **Então** o nome aparece com uma transição suave, sem giro e sem confete.

---

### História de Usuário 5 - Privacidade e acesso por link (Prioridade: P1)

Qualquer professor abre o link publicado e usa a sua própria lista; ao fechar o navegador,
os nomes somem; nada fica guardado no servidor.

**Por que esta prioridade**: é a condição para publicar o site sem login respeitando a
LGPD.

**Teste independente**: abrir o site em dois navegadores diferentes e conferir que cada um
tem a sua lista; fechar o navegador, abrir de novo e ver o campo de colar nomes vazio.

**Cenários de aceitação**:

1. **Dado** dois visitantes usando o site ao mesmo tempo, **Quando** um deles sorteia,
   **Então** a lista do outro não muda.
2. **Dado** uma lista em uso, **Quando** o professor fecha o navegador e abre o site de
   novo, **Então** a lista não existe mais.
3. **Dado** a lista em uso, **Quando** o professor recarrega a página, **Então** a lista,
   os sorteados e a rodada continuam.

---

### Casos-limite

- Texto do SUAP colado com quebras de linha do Windows e espaços extras → lido
  normalmente; a matrícula nunca aparece na tela.
- Lista com apenas 1 nome → o sorteio funciona.
- Duplo clique em "Sortear" ou cliques repetidos durante a animação → apenas um sorteio.
- Página aberta em duas abas do mesmo navegador → as duas usam a mesma lista; uma ação
  feita a partir de uma aba desatualizada é recusada com aviso para recarregar, nunca
  repete um nome.
- Lista acima do limite de nomes → o sistema recusa e informa o limite.
- Nome com mais de 150 caracteres → ignorado (não é nome).
- Falha de comunicação durante o sorteio → a animação não para em nenhum nome, o sistema
  avisa o erro e o botão volta a ficar disponível.

## Requisitos *(obrigatório)*

### Requisitos Funcionais

**Lista de nomes**

- **FR-001**: Sem lista em uso, a tela DEVE mostrar um campo para colar os nomes, com a
  explicação de como copiar do SUAP.
- **FR-002**: O sistema DEVE ler o texto copiado do SUAP ("Foto de" / nome /
  "Matrícula:" / número) e usar apenas os nomes, descartando as matrículas.
- **FR-003**: Quando o texto não estiver no formato do SUAP, o sistema DEVE tratar cada
  linha não vazia como um nome.
- **FR-004**: Antes de usar a lista, o sistema DEVE mostrar quantos nomes encontrou e
  quais são.
- **FR-005**: Nomes repetidos (ignorando acentos, maiúsculas e espaços extras) DEVEM
  entrar uma vez só; os nomes DEVEM ser exibidos como vieram, sem espaços extras.
- **FR-006**: Texto sem nenhum nome DEVE gerar o aviso "Nenhum nome encontrado" sem
  começar o sorteio.
- **FR-007**: A lista DEVE aceitar até 80 nomes; acima disso, o sistema DEVE recusar e
  informar o limite.
- **FR-008**: Com a lista em uso, o professor DEVE poder adicionar mais nomes; os novos
  entram como disponíveis, os já existentes são ignorados e o sistema informa quantos
  entraram e quantos já estavam.
- **FR-009**: O professor DEVE poder limpar a lista (com confirmação), apagando nomes,
  sorteados e rodada.

**Sorteio**

- **FR-010**: Ao clicar em "Sortear", o sistema DEVE sortear um nome apenas entre os
  disponíveis, de forma aleatória e imprevisível, definido antes do fim da animação; a
  animação apenas revela o resultado.
- **FR-011**: Durante o sorteio, os nomes DEVEM girar, desacelerar e parar no sorteado,
  exibido em destaque com a ordem na rodada ("3º sorteado").
- **FR-012**: Um nome sorteado NÃO DEVE sair de novo até o sorteio ser reiniciado,
  inclusive com cliques repetidos ou duas abas abertas.
- **FR-013**: O botão "Sortear" DEVE ficar desabilitado durante a animação.
- **FR-014**: A tela DEVE exibir as listas "Disponíveis" e "Já sorteados" (em ordem de
  saída), cada uma com seu contador.
- **FR-015**: Com todos sorteados, o botão "Sortear" DEVE ficar desabilitado com a
  mensagem "Todos os alunos já foram sorteados. Reinicie o sorteio."
- **FR-016**: "Reiniciar sorteio" (com confirmação) DEVE devolver todos os nomes para
  disponíveis e iniciar a rodada seguinte.
- **FR-017**: "Desfazer último" DEVE devolver o último sorteado da rodada para
  disponíveis; DEVE ficar indisponível quando a rodada não tiver sorteios.
- **FR-018**: Toda ação DEVE dar retorno visível ao professor (sucesso ou motivo da
  recusa), em Português do Brasil.

**Apresentação e acessibilidade**

- **FR-019**: A tela DEVE oferecer modo apresentação em tela cheia, só com o palco e os
  botões, com o nome sorteado em tamanho grande e alto contraste.
- **FR-020**: A tela DEVE oferecer os atalhos Espaço (sortear), F (tela cheia) e Z
  (desfazer), ignorados dentro de campos de texto.
- **FR-021**: Com "reduzir movimento" ativado, o resultado DEVE aparecer sem giro e sem
  confete, com transição suave.
- **FR-022**: O resultado DEVE ser anunciado a leitores de tela ("Sorteado: NOME").

**Privacidade e acesso**

- **FR-023**: A lista e o andamento do sorteio DEVEM durar apenas enquanto o navegador
  estiver aberto, sobrevivendo a recarregar a página.
- **FR-024**: Nenhum nome DEVE ser guardado no servidor nem enviado a serviços externos.
- **FR-025**: Cada navegador DEVE ter a sua própria lista; um visitante NUNCA vê nem
  altera a lista de outro.
- **FR-026**: O site DEVE funcionar sem cadastro e sem login, acessado por um link público.

### Entidades-chave

- **Sorteio da sessão** (temporário, no navegador do professor): lista de nomes; nomes
  já sorteados na rodada, em ordem; número da rodada; versão (muda a cada ação, para
  recusar ações feitas sobre um estado antigo).

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **SC-001**: A lista de exemplo do SUAP (32 alunos) é lida com 32 nomes, idênticos ao
  texto e sem nenhuma matrícula na tela.
- **SC-002**: Em uma lista com N nomes, N sorteios seguidos produzem N nomes diferentes
  (verificado com N = 32).
- **SC-003**: O professor vai do site aberto ao primeiro sorteado em menos de 30 segundos.
- **SC-004**: Com a animação padrão, cada sorteio leva de 3 a 6 segundos do clique até o
  nome parar; com "reduzir movimento", menos de 1 segundo.
- **SC-005**: Em 10 tentativas de duplo clique rápido em "Sortear", cada tentativa sorteia
  exatamente 1 nome.
- **SC-006**: No modo apresentação, o nome sorteado é legível do fundo de uma sala comum
  (cerca de 8 metros).
- **SC-007**: Depois de fechar e reabrir o navegador, nenhum nome da sessão anterior
  aparece; com dois navegadores ao mesmo tempo, as listas não se misturam.
- **SC-008**: Durante todo o uso, nenhum nome é gravado no servidor nem enviado a
  terceiros.

## Premissas

- O uso é individual: cada professor abre o link no próprio navegador; não há login nem
  compartilhamento de listas.
- "Apagar ao sair" significa ao fechar o navegador; fechar só a aba pode manter a lista
  se o navegador continuar aberto (e alguns navegadores restauram a sessão). O botão
  "Limpar lista" apaga na hora.
- O limite de 80 nomes cobre turmas do IF Baiano (em geral até 45 alunos) e garante que o
  estado caiba no armazenamento temporário do navegador.
- A matrícula não é necessária para sortear e, por minimização de dados (LGPD), é
  descartada; dois alunos com nomes idênticos na mesma lista entram uma vez só (o
  professor pode diferenciá-los ao digitar, ex.: "João Silva (2)").
- Sem histórico entre sessões: a ordem dos sorteados da rodada atual aparece na lista "Já
  sorteados"; rodadas anteriores não são guardadas.
- Fora do escopo: turmas salvas, login, histórico, exportar resultados, sortear vários de
  uma vez, grupos.
