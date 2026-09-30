# Pesquisa (Fase 0): Sorteio Rápido sem Cadastro

Formato: **Decisão** · **Justificativa** · **Alternativas consideradas**. Não restou nenhum
ponto "NEEDS CLARIFICATION".

## 1. Onde guardar o estado sem banco

- **Decisão**: sessão do Django com `SESSION_ENGINE =
  'django.contrib.sessions.backends.signed_cookies'` e `SESSION_EXPIRE_AT_BROWSER_CLOSE =
  True`. O estado fica num cookie assinado com `DJANGO_SECRET_KEY`; o servidor não guarda
  nada entre requisições.
- **Justificativa**: atende "sem banco" e "apaga ao fechar o navegador" (constituição
  II/III), mantém a regra de negócio em Python (o servidor lê e grava o estado) e funciona
  em hospedagem sem disco persistente (Vercel). A assinatura impede alterar o estado à mão
  (ex.: marcar um aluno como já sorteado).
- **Medição**: 80 nomes longos + sorteados + rodada + versão = **1.363 bytes** no cookie
  (compressão ativa do Django); 32 nomes do exemplo = 895 bytes. Limite dos navegadores:
  4.096 bytes. Mesmo assim, o serviço recusa estados acima de 3.500 bytes.
- **Alternativas**: sessão em banco (exige disco/banco externo); `localStorage` com a
  regra no JavaScript (proibido pela constituição); estado enviado inteiro pelo cliente a
  cada sorteio (o cliente poderia manipular quem está disponível).

## 2. Sem repetição sem transação de banco (FR-012, SC-005)

- **Decisão**: o estado tem um número `versao`, que aumenta a cada ação. A tela envia a
  versão que conhece em todo POST; o serviço recusa (409) se for diferente da versão da
  sessão: "A lista mudou em outra aba. Recarregue a página." Na interface, o botão fica
  travado durante o sorteio (como na versão 1).
- **Justificativa**: cobre duas abas com a mesma lista e cliques repetidos: qualquer ação
  feita sobre um estado antigo é recusada, então nenhum nome sai duas vezes.
- **Risco residual (documentado)**: duas requisições exatamente simultâneas com o mesmo
  cookie passariam na verificação e o navegador ficaria com a resposta da última; isso
  exige disparos fora da interface, que trava o botão. Sem banco não há como travar o
  estado no servidor.
- **Alternativas**: trava no servidor (impossível sem estado compartilhado); ignorar o
  problema (duas abas poderiam repetir nomes).

## 3. Justiça do sorteio

- **Decisão**: `secrets.choice(indices_disponiveis)` no serviço; a view devolve o nome e a
  ordem; `roleta.js` (reaproveitado) só anima até o nome recebido.
- **Justificativa**: constituição III, igual à versão 1.

## 4. Leitura da lista (importador)

- **Decisão**: reaproveitar o importador da versão 1 em `sorteio/sorteios/importador.py`,
  devolvendo só nomes: `extrair_nomes(texto) -> list[str]`, `detectar_formato(texto)`,
  `normalizar_espacos`, `chave_nome`. A matrícula do SUAP é lida pela expressão regular e
  descartada. Duplicados: mesma `chave_nome` (sem acentos, `casefold`, espaços).
- **Justificativa**: código já validado (32/32 no exemplo); só nomes = minimização de
  dados (LGPD).

## 5. Hospedagem na Vercel

- **Decisão**: `vercel.json` com o builder `@vercel/python` apontando para
  `config/wsgi.py` (que expõe `app = application`) e rota única `/(.*)` para ele.
  Estáticos pelo **WhiteNoise** (`whitenoise==6.12.*`) com `WHITENOISE_USE_FINDERS = True`
  (serve direto de `sorteio/static/`, sem precisar de `collectstatic` no deploy).
  Produção via variáveis de ambiente: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`,
  `DJANGO_ALLOWED_HOSTS=.vercel.app`, `DJANGO_CSRF_TRUSTED_ORIGINS=https://*.vercel.app`;
  com `DEBUG` desligado: `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` e
  `SECURE_PROXY_SSL_HEADER`.
- **Justificativa**: sem banco, a aplicação é sem estado e cabe numa função serverless;
  WhiteNoise é a forma padrão de servir estáticos do Django fora de um servidor web.
- **Alternativas**: PythonAnywhere/Render (funcionariam, mas o usuário escolheu Vercel);
  GitHub Pages (não executa Python).

## 6. Django sem banco

- **Decisão**: `DATABASES = {}`; `INSTALLED_APPS` só com `django.contrib.messages`,
  `django.contrib.staticfiles`, `sorteio` e `sorteio.sorteios`; sem `admin`, `auth`,
  `contenttypes` nem o app `sessions` (o backend de cookie não usa tabela). Mensagens do
  Django (toasts) continuam com o armazenamento padrão (cookie).
- **Justificativa**: nenhum componente tenta acessar banco; `manage.py check` passa.

## 7. Interface (uma tela)

- **Decisão**: a rota `/` é o palco da versão 1. Sem lista: o centro do palco mostra o
  campo para colar os nomes, a prévia ao vivo (contagem e nomes) e "Usar esta lista".
  Com lista: palco, "Disponíveis", "Já sorteados", Sortear/Desfazer/Reiniciar, e no topo
  "Adicionar nomes" (modal com o mesmo campo e prévia) e "Limpar lista" (confirmação).
  Saem abas, cartões de turmas, histórico e renomear.
- **Justificativa**: pedido do usuário ("pode até ser essa janela direto, só adicionar um
  campo para os nomes"); mantém o design aprovado.
