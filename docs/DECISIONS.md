# Decisions — ADR log

Dates: 11/11/2026, America/Sao_Paulo (BRT). “Accepted” records direction declared by the owner; technical proposal still requires host validation. The existence of this log does not authorize push, release or installation.

| ADR | Status | Decision and consequence |
|---|---|---|
|001|Accepted|Suite for Herdr Desktop, without forking the application; separate layout/theme/mods.|
|002|Accepted|Original modern top-down office world, instead of the earlier thematic alternatives.|
|003|Accepted|Coding + coffee sip, wander after more than 5 min of continuously observed idle; visual derivation, not a new core state.|
|004|Accepted|Office variation per space/group; same navigable structure, distinct palette/props.|
|005|Accepted|Public/open source project, personal GitHub repo. It is not a proprietary distribution; OSS does not prohibit commercial use.|
|006|Accepted|Desktop on macOS only; no TUI in parallel. hc remains a component of the Desktop.|
|007|Accepted|Git MVP strictly read; includes tree/diff/branches/PRs/Issues/CI without mutating operations, including fetch.|
|008|Accepted|GitHub Issues; Linear/branch-issue does not enter the product.|
|009|License direction of this delivery|Code Apache-2.0; own art CC BY 4.0 to the extent of the rights held; keep upstream MIT/Apache/ISC and provenance. Do not guarantee copyright/exclusivity of AI output.|
|010|Accepted|Gabriel will code locally with Claude Code and use gh; this agent prepares docs/plans/assets, not product implementation.|
|011|Accepted|Definitive name herdr-office-startup; target https://github.com/gabriel-moretti/herdr-office-startup . Monorepo; old aliases are not current IDs.|
|012|Reported by the owner|Mac Apple M5, Desktop 0.1.15, core 0.1.20. Contract read on 2026-11-11 ([compatibility.md](compatibility.md)); runtime behavior not yet exercised.|
|013|Superseded by 019|Installed IDs office-startup-world/git; source mods/world/git; layout office-startup-poc; build does the mapping.|
|014|Technical proposal|1s logical timer, native animation, internal orthogonal graph, max 2 wanderers. Do not cross real panes.|
|015|Technical proposal|FNV1a32 UTF-8 seed versioned per machine/space; group in own config until local API confirmed.|
|016|Accepted as constraint|No Pokémon asset or code without identified license. dhoaibao/Brutal only requirements/benchmark, without copying implementation.|
|017|Process proposal|One branch/PR per milestone, tests and gate on the Mac; no automatic push, no automatic merge.|
|018|Delivery status|Starter does not implement mods/layouts. Scripts are only art pipeline/validation and consistency. There was no init/push/PR/installation.|
|019|Accepted (2026-11-11)|Repo mod folders are the installable folders: `mods/office-startup-world`, `mods/office-startup-git`, folder name = installed ID, runtime assets inside the mod. The repository root is the shareable folder laid out like the app home (`layouts/`, `mods/`), with one RECIPE.md and one preview.png at the root at release, as the host's sharing convention defines. Staging is a plain copy of the layout file and mod folders. Root `assets/` remains the art pipeline output and a tested sync step copies the runtime subset. Supersedes the source→build mapping of 013; IDs and layout names from 013 stand.|
|020|Accepted (2026-11-11)|All repository documentation in English. Nothing is announced or promoted publicly until it has been tested and works locally.|

## Explicitly superseded

The old names, Linux vs Mac doubt, TUI maintenance, optional Linear, stage/commit in the MVP and promise of Git operations in v1 are superseded. The snapshot [product-page-source.txt](reference/product-page-source.txt) was mechanically renamed to the current name for reference, but contains old chronology/proposals: these ADRs and the Markdown specs prevail. The online Page is not runtime code nor does it automatically follow the repo.

## Before changing direction

Record an ADR with context, alternatives, choice, trade-offs, security and migration. Do not reopen already accepted choices without a concrete problem. Mutating operations, another OS or provider require their own scope and approval.
