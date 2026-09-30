# Sorteio de Alunos — IF Baiano

Ferramenta web para o professor sortear alunos em sala de aula. Cole a lista copiada do
SUAP (ou um nome por linha), clique em **Sortear** e os nomes giram até parar no
sorteado. Ninguém sai duas vezes até você reiniciar.

- **Sem cadastro e sem login:** é só abrir o link.
- **Nada fica guardado:** a lista vive num cookie da sessão do seu navegador e some
  quando você fecha o navegador. Só os nomes são usados; as matrículas são descartadas.
- **Justo:** quem escolhe o sorteado é o servidor (módulo `secrets` do Python); a
  animação apenas revela o resultado.

## Como usar

1. Abra o site e cole a lista (no SUAP: abra a turma, selecione a lista de alunos,
   `Ctrl+C`, e cole com `Ctrl+V`).
2. Confira a prévia e clique em **Usar esta lista**.
3. Clique em **Sortear** ou aperte `Espaço`. `F` liga a tela cheia para o projetor e
   `Z` desfaz o último sorteio (aluno ausente).
4. **Reiniciar sorteio** começa uma nova rodada; **Adicionar nomes** e **Limpar lista**
   ficam no topo.

## Rodar no computador

```bash
.venv/bin/pip install -r requirements.txt   # Django + WhiteNoise
.venv/bin/python manage.py runserver
```

Abra <http://127.0.0.1:8000/>. Não há `migrate`: o projeto não usa banco de dados.

## Publicar (GitHub + Vercel)

1. **GitHub:** crie um repositório e envie o projeto (`git init`, `git add .`,
   `git commit`, `git push`). O `.gitignore` já deixa de fora a `.venv/`.
2. **Vercel:** em <https://vercel.com/new>, importe o repositório. O `vercel.json` já
   configura o Django (`config/wsgi.py`) e o WhiteNoise serve os arquivos estáticos.
3. Em **Settings → Environment Variables**, crie `DJANGO_SECRET_KEY` com um valor longo
   e aleatório (por exemplo, a saída de
   `python -c "import secrets; print(secrets.token_urlsafe(50))"`). Sem essa variável
   o site não sobe, porque a chave assina o cookie do sorteio.
4. Faça o deploy e envie o link `https://<projeto>.vercel.app` para o professor.

Na Vercel o modo de produção é automático (`DEBUG` desligado, cookies seguros, HTTPS).
Variáveis opcionais: `DJANGO_ALLOWED_HOSTS` e `DJANGO_CSRF_TRUSTED_ORIGINS` (para um
domínio próprio).

## Processo (Spec Kit)

| Etapa | Versão 1 (turmas + banco) | Versão 2 (atual, sem cadastro) |
|---|---|---|
| Constituição | 1.0.0 | 2.0.0 — `.specify/memory/constitution.md` |
| Spec, plano, tarefas | `specs/001-sorteio-alunos/` | `specs/002-sorteio-rapido/` |
| Validação | `specs/001-sorteio-alunos/validacao.md` | `specs/002-sorteio-rapido/validacao.md` |

A versão 1 fica como histórico do processo. Documentos de apoio:

- `docs/regras-de-negocio.md` — regras RN-01 a RN-14 (versão 2)
- `docs/importacao-suap.md` — formato do SUAP + lista de 32 alunos para teste
- `docs/diretrizes-visuais.md` — interface (conceito "Palco", animação)
- `docs/prompts-speckit.md` — prompts usados em cada etapa

## Estrutura

```
Sorteio/
├── config/              settings (sem banco, sessão em cookie), urls, wsgi (Vercel)
├── sorteio/
│   ├── sorteios/        importador.py (lê a lista), servico.py (regras), views, templates
│   ├── templates/       base.html, toasts, modal de confirmação
│   └── static/          css/estilo.css, js/app.js, js/roleta.js
├── specs/               specs do Spec Kit (001 = versão 1, 002 = versão atual)
├── docs/                regras de negócio, SUAP, diretrizes visuais
├── vercel.json          configuração da Vercel
└── requirements.txt     Django + WhiteNoise
```
