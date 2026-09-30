# config/

- `settings.py` — Django **sem banco** (`DATABASES = {}`), sessão em cookie assinado que
  expira ao fechar o navegador, WhiteNoise para os estáticos, `pt-br`. Produção por
  variáveis de ambiente (`DJANGO_SECRET_KEY` obrigatória; na Vercel `DEBUG` já vem desligado).
- `urls.py` — inclui as rotas do app `sorteio.sorteios`.
- `wsgi.py` — entrada WSGI; expõe `app` para a Vercel.
