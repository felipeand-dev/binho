# Validação — Sorteio Rápido sem Cadastro (versão 2)

**Etapa 6 (constituição 2.0.0, Princípio V)** · Data: 2026-09-30 · Spec: [spec.md](spec.md) ·
Roteiro: [quickstart.md](quickstart.md)

## Como os testes foram executados

- Sistema rodando: `.venv/bin/python manage.py runserver` (Django 6.1.1, **sem banco**, sessão em
  cookie assinado). Modo produção também conferido localmente (`VERCEL=1`, `DEBUG` desligado,
  WhiteNoise servindo CSS/JS, `check --deploy` sem avisos).
- Google Chrome (sem janela) controlado pelo Playwright, em 1366×900, 1920×1080 e 375×812. Cada
  cenário executa as ações na interface e registra o que **realmente** apareceu na tela, na rede,
  nos cookies, no disco e no log do servidor. Nenhum item foi marcado sem execução.
- Executado com a lista **fictícia** de `docs/importacao-suap.md` (nenhum aluno real, LGPD).
- Resultado: **28 de 28 ✅** (rodada refeita após a roleta em bytes com decodificação do nome e o redesenho da tela de abertura: letreiro de
  ensaio, layout centralizado, botão "Começar o sorteio" ativo só com nomes). Todos os requisitos FR-001 a FR-026 e critérios SC-001 a SC-008
  têm ao menos um cenário.

## Resultados (cenário → esperado → obtido)

| # | Requisito | Cenário | Resultado esperado | Resultado obtido | OK? |
|---|---|---|---|---|---|
| 1 | FR-001, FR-026 | Abrir o site pela primeira vez | Campo para colar nomes com instrução do SUAP; sem login | campo visível=true; passos do SUAP visíveis=true; letreiro de ensaio=true; campos de senha=0 | ✅ |
| 2 | FR-002, FR-004, SC-001 | Colar os 32 alunos do SUAP | Prévia: 32 nomes iguais ao texto; nenhuma matrícula na tela | 32 nomes; iguais ao texto=true; matrículas na prévia=0 | ✅ |
| 3 | FR-003 | Colar "Maria da Silva" e "João Pereira" (um por linha) | Prévia: 2 nomes | 2 nomes; aviso "Lista simples: um nome por linha." | ✅ |
| 4 | FR-005 | Colar "Maria", "MARIA", "mária" | Prévia: 1 nome | nomes: ["Maria"] | ✅ |
| 5 | FR-006 | Campo só com espaços; e o mesmo texto enviado direto ao servidor (sem JavaScript) | Botão desabilitado; servidor recusa com "Nenhum nome encontrado"; continua sem lista | botão desabilitado=true; envio direto → 200 com toast "Nenhum nome encontrado. Cole a lista do SUAP ou um nome por linha."; campo de colar na resposta=true | ✅ |
| 6 | FR-007 | Colar 81 nomes e usar | Recusado com o limite de 80 | toast "A lista aceita até 80 nomes. Esta lista tem 81."; texto mantido no campo (81 linhas); ainda sem lista=true | ✅ |
| 7 | FR-004, FR-014 | Usar a lista de 32 | Palco com 32 em "Disponíveis"; contadores 32/0 | toast "Lista pronta com 32 nomes."; 32 em Disponíveis; contadores 32/0 | ✅ |
| 8 | FR-010, FR-011, FR-014, SC-004 | Clicar em "Sortear" | Roleta só com 0 e 1 (mesmo tamanho, linhas em direções opostas, nenhum nome), para em 3–6 s; bits viram o nome em até 2 s; "1º sorteado"; vai para "Já sorteados"; 31/1 | roleta girando=true; só 0 e 1=true; mesmo tamanho=true; direções=bits-para-direita e bits-para-esquerda; algum nome na roleta=false; parou em 4.07 s mostrando "00101110 00101001 10001010"; nome completo 1.81 s depois; revelado "ADRIANO MOREIRA DA COSTA" (1º sorteado); servidor escolheu "ADRIANO MOREIRA DA COSTA" → igual=true; confete=1; contadores 31/1 | ✅ |
| 9 | FR-012, FR-015, SC-002 | Sortear até acabar (32; os últimos pulando a animação com Esc) | 32 nomes diferentes; "Sortear" desabilitado com a mensagem de reiniciar; 33º recusado | 32 sorteados, 32 distintos, todos da lista=true; Sortear desabilitado=true; mensagem=true; "Turma completa!"=true; 33º → 409 "Todos os alunos já foram sorteados. Reinicie o sorteio." | ✅ |
| 10 | FR-016 | "Reiniciar sorteio" → cancelar; depois → confirmar | Cancelar: nada muda; confirmar: 32 disponíveis, "Rodada 2" | cancelar: sem mudança=true; confirmar: toast "Sorteio reiniciado. Rodada 2.", contadores 32/0, selo "Rodada 2" | ✅ |
| 11 | FR-017 | Sortear 3, "Desfazer último"; e olhar desfazer logo após reiniciar | 3º volta a Disponíveis; próximo sorteio recebe a ordem 3º; sem sorteios → desfazer indisponível | logo após reiniciar desfazer desabilitado=true; desfeito "TIAGO ANDRADE CORREIA" voltou=true; toast "Desfeito: TIAGO ANDRADE CORREIA voltou para os disponíveis."; próximo sorteio ordem 3º | ✅ |
| 12 | FR-013, SC-005 | Duplo clique em "Sortear" (10 vezes) | Cada vez, exatamente 1 nome sorteado | por tentativa: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; após recarregar: 13 sorteados, 13 distintos | ✅ |
| 13 | FR-012, RN-06 | Duas abas: sortear na aba A; depois clicar em "Sortear" na aba B (desatualizada) | Aba B recebe aviso para recarregar; nenhum nome repetido | aba B: toast "A lista mudou em outra aba. Recarregue a página."; recarregou e mostra 14 sorteados (aba A tinha 14); distintos=14; erros JS=0 | ✅ |
| 14 | FR-008 | "Adicionar nomes": "Aluno Novo" e um nome já existente | 1 adicionado, 1 já estava; "Aluno Novo" em Disponíveis | prévia marcou 1 como "já na lista"; toast "1 nome adicionado, 1 já estava na lista."; disponíveis 18→19; "Aluno Novo" em Disponíveis=true | ✅ |
| 15 | FR-009 | "Limpar lista" → cancelar; depois → confirmar | Cancelar: nada muda; confirmar: volta ao campo de colar nomes | cancelar manteve a lista=true; confirmar: toast "Lista apagada. Cole uma nova lista para sortear.", campo de colar visível=true; cookie da sessão com 85 caracteres (só a versão, sem nomes) | ✅ |
| 16 | FR-023, SC-007 | Recarregar a página com a lista em uso | Lista, sorteados e rodada continuam | sorteados antes=14 depois=14 (iguais=true); rodada "Rodada 2" (antes "Rodada 2") | ✅ |
| 17 | FR-023, SC-007 | Fechar o navegador e abrir de novo (simulado: novo navegador só com os cookies persistentes, como o Chrome faz ao fechar) | Sem lista | cookie da sessão é de sessão (expira ao fechar)=true; ao reabrir, campo de colar visível=true | ✅ |
| 18 | FR-025, SC-007 | Dois navegadores diferentes ao mesmo tempo | Cada um com a sua lista | navegador 2 começou sem lista=true e usa ["Zeca","Yara"]; navegador 1 continua com 33 nomes e sem "Zeca"=true | ✅ |
| 19 | FR-019, SC-006 | Modo apresentação em 1920×1080 (projeção estimada de 2 m) | Só palco e botões; nome grande (legível a ~8 m: altura ≥ 4 cm) | tela cheia=true; listas=none, cabeçalho=none; nome 170 px ≈ 12.4 cm (cálculo; não verificado presencialmente) | ✅ |
| 20 | FR-020 | Espaço, F e Z no palco; Z, Espaço e F digitados no campo do modal "Adicionar nomes" | Sorteia, tela cheia, desfaz; ignorados no campo | Espaço 14→15; F ligou/desligou=true/true; Z 15→14; no campo: 14→14, modo apresentação=false | ✅ |
| 21 | FR-021, SC-004 | "Reduzir movimento" ativado e sortear | Sem giro nem confete; nome em menos de 1 s | giro=false; linhas da fita=0; confete=0; "Bia" em 0.11 s | ✅ |
| 22 | FR-022 | Região aria-live após o sorteio | Anuncia "Sorteado: NOME" | aria-live="Sorteado: ADRIANO MOREIRA DA COSTA" | ✅ |
| 23 | FR-024, SC-008 | Rede do navegador durante o roteiro + disco e log do servidor | Nenhuma requisição externa com nomes; nenhum arquivo/banco criado; nomes fora do log | 160 requisições externas (fonts.googleapis.com, cdn.jsdelivr.net, fonts.gstatic.com, ), com nomes=0, não-GET=0; arquivos novos no projeto durante o roteiro=0; bancos .sqlite3=0; nomes no log do servidor=0 | ✅ |
| 24 | FR-018 | Ações ao longo do roteiro | Toasts em Português | 8 toasts conferidos (ex.: toast "Nenhum nome encontrado. Cole a lista do SUAP ou um nome por linha.", toast "A lista aceita até 80 nomes. Esta lista tem 81.", toast "Lista pronta com 32 nomes.") | ✅ |
| 25 | SC-003 | Do site aberto ao clique no 1º sorteio (roteiro automatizado, incluindo os cenários 2–7) | Menos de 30 s | 8.3 s (automatizado; tempo de uma pessoa não cronometrado) | ✅ |
| 26 | Constituição II | GET em /sortear/ | 405 | status 405 | ✅ |
| 27 | Constituição II | Cookie da sessão alterado à mão | Estado rejeitado (volta sem lista); nada é sorteado a partir dele | página com o cookie alterado mostra o campo de colar (sem lista)=true; POST /sortear/ com ele → 403 | ✅ |
| JS | — | Erros de JavaScript durante o roteiro | Nenhum erro de script | nenhum erro de script; 1 registro(s) de rede "409" das recusas esperadas | ✅ |

## Limitações declaradas

- **Requisições simultâneas forjadas (RN-06, risco residual já previsto em research.md §2).**
  10 requisições disparadas no mesmo instante fora da interface, com o mesmo cookie e a mesma
  versão, foram todas aceitas como "1º sorteado" (10 nomes diferentes; o navegador guardaria só
  a última resposta). Sem banco não há como travar o estado no servidor. Pela interface isso não
  ocorre: o botão fica travado durante o sorteio (cenário 12: 10 duplos cliques → 1 sorteio cada)
  e ações de uma aba desatualizada são recusadas (cenário 13).
- **SC-006 (legível a ~8 m):** calculado (170 px ≈ 12 cm numa projeção de 2 m), não conferido
  presencialmente.
- **SC-003:** 8,5 s no roteiro automatizado; tempo de uma pessoa não cronometrado.
- **Cenário 17 (fechar o navegador):** simulado como o Chrome faz ao fechar (descarta cookies de
  sessão). Navegadores configurados para "continuar de onde parou" podem restaurar a sessão; o
  botão "Limpar lista" apaga na hora.
- **Cenário 27:** a página com o cookie alterado volta sem lista (assinatura inválida descartada);
  o POST de teste foi recusado com 403 pelo CSRF, antes de chegar ao serviço.
- **Leitor de tela real** não foi usado (verificada a região `aria-live`).
- **Publicação na Vercel** não foi executada (requer a conta do usuário); o modo produção foi
  conferido localmente com as mesmas configurações.

## Capturas

| Cenário | Arquivo |
|---|---|
| Abertura (sem lista) — letreiro de ensaio com nomes de exemplo | [validacao/abertura-vazia.png](validacao/abertura-vazia.png) |
| 2 — lista colada: 32 nomes prontos, letreiro com os nomes da turma | [validacao/cenario-02-previa.png](validacao/cenario-02-previa.png) |
| 8 — roleta girando só bytes (0 e 1), linhas em direções opostas | [validacao/cenario-08-roleta-bits.png](validacao/cenario-08-roleta-bits.png) |
| 8 — decodificação: os bits viram o nome letra a letra | [validacao/cenario-08-decodificando.png](validacao/cenario-08-decodificando.png) |
| 8 — nome sorteado, confete, "Já sorteados" | [validacao/cenario-08-sorteio.png](validacao/cenario-08-sorteio.png) |
| 9 — todos sorteados | [validacao/cenario-09-todos-sorteados.png](validacao/cenario-09-todos-sorteados.png) |
| 19 — modo apresentação 1920×1080 | [validacao/cenario-19-apresentacao.png](validacao/cenario-19-apresentacao.png) |
| Celular (375 px) — colar nomes | [validacao/celular-colar-nomes.png](validacao/celular-colar-nomes.png) |

## Conclusão

28 de 28 cenários passaram, cobrindo os 26 requisitos funcionais e os 8 critérios de sucesso.
O sistema atende à [spec.md](spec.md); a única ressalva técnica é o risco residual de
requisições simultâneas forjadas fora da interface, inerente à decisão de não usar banco.
