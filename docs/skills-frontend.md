# Skills de front-end (pesquisa de setembro/2026)

Skills são pacotes de instruções que ensinam o agente de IA (Claude Code, Copilot,
Cursor, Codex…) a fazer algo bem. Para interface, elas atacam o problema da
"cara de IA": fonte Inter, gradiente roxo, cards genéricos, animação nenhuma.

## Recomendadas para este projeto

| Skill | Para quê | Instalação |
|---|---|---|
| **frontend-design** (Anthropic, oficial) | Gosto visual: obriga a escolher uma direção estética antes de codar, proíbe fontes batidas. A skill de design mais instalada (~860 mil). Funciona com HTML/CSS puro. | `npx skills add https://github.com/anthropics/skills --skill frontend-design` |
| **emilkowalski/skill** (Emil Kowalski, criador do Sonner/Vaul) | Animação com critério: easing, duração, interrupção, reduced-motion. Traz `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`. | `npx skills add emilkowalski/skill` |
| **gsap-skills** (GreenSock, oficial) | Ensina a usar o GSAP corretamente: timelines, Flip, SplitText, performance a 60 fps. | `npx skills add greensock/gsap-skills` |
| **impeccable** (Paul Bakaus) | Comandos de acabamento: `audit`, `critique`, `polish`, `animate`, `bolder`, `quieter`… Ideal para a etapa final. | `npx skills add pbakaus/impeccable` |

## Opcionais

| Skill | Para quê | Instalação |
|---|---|---|
| **ui-ux-pro-max** | Banco de paletas (190+), pares de fontes (70+) e estilos. Bom para escolher paleta/tipografia. | `npx -y skills add nextlevelbuilder/ui-ux-pro-max-skill --agent claude-code` |
| **Playwright / webapp-testing** | Abre o site num navegador e tira prints, para o agente conferir o próprio visual. | ver ComposioHQ/awesome-codex-skills |

## Como combinar com o Spec Kit

1. Instalar as skills na pasta do projeto (precisa de Node.js para o `npx`).
2. `/speckit-constitution` → `/speckit-specify` → `/speckit-plan` (o Prompt 3 já cita as skills).
3. `/speckit-tasks` → `/speckit-implement`.
4. Acabamento: `/impeccable audit`, depois `/impeccable polish`; `review-animations` na roleta.

## Bibliotecas usadas (todas via CDN, sem build)

- **GSAP** — desde 2025 é 100% gratuito, inclusive SplitText, Flip e ScrollTrigger.
  `https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js` (+ `Flip.min.js`, `SplitText.min.js`)
- **canvas-confetti** — confete na revelação do sorteado.
- **Bootstrap 5 + Bootstrap Icons** — grid, modais, toasts.

## Fontes

- [9 Best UI Skills for Claude Code in 2026 — Medium](https://medium.com/@hii_mohit/9-best-ui-skills-for-claude-code-in-2026-i-tested-them-all-58fe42809376)
- [10 best design skills for Claude Code and Codex — Composio](https://composio.dev/content/top-design-skills)
- [anthropics/skills — frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
- [Emil Kowalski — skill](https://emilkowal.ski/skill)
- [greensock/gsap-skills](https://github.com/greensock/gsap-skills)
- [pbakaus/impeccable](https://github.com/pbakaus/impeccable)
- [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [GSAP 100% gratuito — npm](https://www.npmjs.com/package/gsap)
