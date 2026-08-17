# VBNB — project state

Hand-written section. Keep it above the generated blocks below: `next dev` and GitNexus
rewrite everything between their own markers.

## Orient before you work

Never assume the working tree matches `main`, and never assume the GitNexus index is fresh.
At the start of any non-trivial task, run these and report what you find:

```bash
git status --short          # uncommitted work in progress
git log --oneline -10       # recent intent
git log origin/main..HEAD   # committed but not deployed
npm run db:status           # migrations applied to production
```

Reported state beats remembered state: this file describes how the project works, not what
it currently contains. For "what changed" and "what exists", always measure.

## GitNexus index freshness

`impact`, `detect_changes`, and `api_impact` only see what the index has. If
`.gitnexus/meta.json` is older than the newest source file, the index is stale and those
tools will confidently report no impact for symbols they have never seen.

Check before trusting them, and re-run `node .gitnexus/run.cjs analyze` when stale.

## Environments

This project is **already deployed**. The local Supabase stack and the hosted Supabase
project both exist — never conflate them.

| | Local | Production |
|---|---|---|
| Database | Supabase CLI via `npm run local`, ports 58321+ (`supabase/config.toml`) | Hosted Supabase project |
| App | http://localhost:3000 | Vercel project `sangiaodich` |
| Env vars | `.env.local`, generated (see below) | Vercel → Settings → Environment Variables |

`.env.local` is **overwritten** with local Supabase keys every time `npm run local` runs
(`scripts/run-local.ps1`). Never store hosted credentials there — they get wiped. Production
values live only in Vercel.

Check live state instead of trusting anything written here:

- `npm run db:status` — migrations already applied to production
- `vercel env ls` — env vars that exist in production
- `git log origin/main..HEAD` — commits not yet deployed

## Deploy flow

`git commit` is local only. `git push` uploads to GitHub, and Vercel auto-builds from that
push: `main` deploys to production, any other branch or PR gets a preview URL.

**Migrations do not run on deploy.** Vercel builds Next.js and never touches the database.
Apply them to the hosted DB *before* the code that depends on them reaches `main`:

```bash
npm run db:link -- --project-ref <ref>   # once per machine; ref is in the Supabase dashboard URL
npm run db:status
npm run db:push
```

The Supabase CLI is not linked on a fresh clone (`supabase/.temp/project-ref` is absent), so
`db:push` fails until `db:link` has been run.

## Never do

- NEVER run `npm run db:reset` (or `supabase db reset`) against the hosted project — it drops
  all data. Only `db:link`, `db:push`, and `db:status` touch production; every other `db:*`
  script is local-only.
- NEVER write production secrets into `.env.local` or any committed file.
- NEVER treat a green Vercel build as a healthy release. A missing migration builds fine and
  then fails at runtime.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Sangiaodich** (3021 symbols, 6708 relationships, 249 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact analysis before editing.** Use `impact({target: "symbolName", direction: "upstream"})` (MCP) or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .` (CLI fallback); report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/Sangiaodich/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Sangiaodich/clusters` | All functional areas |
| `gitnexus://repo/Sangiaodich/processes` | All execution flows |
| `gitnexus://repo/Sangiaodich/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
