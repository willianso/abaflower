# ABAFlower

Demo: https://willianso.github.io/abaflower/ (deploy automático via GitHub Actions a cada push na `main`).

Protótipo de acompanhamento ABA para crianças, mobile-first (PWA). Sem backend por enquanto: dados ficam no `localStorage` do aparelho.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173 (também exposto na rede local p/ testar no celular)
npm run build && npm run preview   # testa PWA/offline
```

## Estrutura

```
src/
  domain/      regras puras: tipos, trilha ABA (journey.ts), idade
  data/        repositório (children.ts) + sessão mock (session.ts)
  components/  Plant (flor que cresce por fase), ChildCard
  pages/       Home, ChildForm (criar/editar), ChildDetail (trilha)
```

- **Trilha como dado**: as 11 etapas ficam em `src/domain/journey.ts`, agrupadas em 4 fases
  (Semente/Avaliação → Broto/Intervenção → Botão/Manutenção → Flor/Reavaliação). Mudar o fluxo = editar esse arquivo.
- **Multi-tenant desde já**: toda entidade tem `clinicId`; storage é separado por clínica. A sessão mock
  (`data/session.ts`) vira o usuário autenticado no MVP.
- **Repositório**: as telas só usam `ChildRepository`; trocar `localStorage` por API não muda a UI.
- **Sem dados sensíveis**: só nome ou iniciais, mês de nascimento aproximado (derivado da idade) e infos clínicas não identificáveis.
