# herdr-office-startup

An original animated top-down office and a unified **read-only** Git workspace for Herdr Desktop.

Repository target: https://github.com/gabriel-moretti/herdr-office-startup

**Status: pre-implementation starter kit.** This folder contains specifications, Claude Code briefs, milestone prompts and PoC artwork tooling. It does NOT contain a working Herdr mod, installed layout, Git panel, installer or CI pipeline. Feature lists below are planned, not shipped. The host contract has been read on Gabriel's Mac; nothing has been run in Herdr yet.

## Product

- Original office workers represent real Desktop agents. Coding means `working`; attention means `blocked`; `done` follows the host; unknown/offline never pretend to be busy.
- Nico can sip coffee in `idle` and wander to coffee/window/sofa after **more than five observed idle minutes**. Any state change interrupts the excursion.
- Three deterministic office presets per space: Nordic Day, Botanical and Blue Hour.
- One Git panel: file tree, changes/diffs, branches/history, PRs, GitHub Issues and CI/Actions. **No mutations**, including fetch, checkout, stage, commit, push, comments, dispatch or merge.
- Reduced-motion mode, still-image fallback, stable agent identity and a reserved desk.

## Start on Gabriel's Mac

Target reported by Gabriel: **Apple M5, Herdr Desktop 0.1.15, herdr-core 0.1.20**, Desktop only. The installed contract was read and recorded in [compatibility](docs/compatibility.md); runtime behavior is not verified yet.

1. Read [CLAUDE.md](CLAUDE.md).
2. Review [compatibility](docs/compatibility.md), [decisions](docs/DECISIONS.md), [PoC plan](docs/POC-PLAN.md) and [API notes](docs/HERDR-API-NOTES.md).
3. Run Claude Code locally in the folder. Paste [00-bootstrap-repo](plans/00-bootstrap-repo.md), then execute one milestone prompt at a time from [plans](plans/README.md). Do not implement the entire roadmap at once.
4. Bootstrap commands are instructions for Gabriel, not commands already executed. Check the remote and existing history before initializing or pushing.
5. Before writing host integration code, recheck the installed versions and contract hashes against [compatibility](docs/compatibility.md).

## Installation (after the PoC is implemented)

There is **nothing installable yet** in `mods/office-startup-world/`, `mods/office-startup-git/` or `layouts/`; they are documentation-only placeholders. Each mod folder in the repo is the installable folder itself: its name is the installed ID and it will carry its own runtime assets (ADR-019).

Review capabilities, make a backup, then copy only new project-owned files into `~/.config/herdr-app/`. Never overwrite defaults, user preferences or `keys.json`. Expected validation after implementation:

```sh
herdr-app check ~/.config/herdr-app/mods/office-startup-world
herdr-app status
```

Select the new `office-startup-poc` layout using the Desktop selector; retain the old layout for rollback. Do not modify the signed app bundle or use `sudo`. A future ZIP will contain ready JS/JSON and local art: no Node/Python/Go/ImageMagick/Chrome required by the end user. Git features will require already installed/authenticated `git` and `gh`; World will need neither.

## Artwork included now

See [ASSETS](docs/ASSETS.md), [asset status](assets/STATUS.md), [concept provenance](art/concept/README.md) and [asset scripts](scripts/assets/README.md). The Nico pack is a transparent, correctly sized **starter placeholder**, not release-quality animation. Generated keyframes plus deterministic Pillow variations are labeled; repeated/derived frames are not advertised as newly drawn art. The full planned MVP is 260 body frame slots across four characters, not four completed characters in this starter.

## Roadmap

PoC scene → real states → idle/coffee/wander → presets/world MVP → local Git read-only → GitHub PRs/Issues/CI read-only → public MVP packaging. Metrics, more characters/polish, theme light mode and v1 enhancements follow separately. See [ROADMAP](docs/ROADMAP.md).

## Documentation map

[Compatibility](docs/compatibility.md) · [Product](docs/PRODUCT.md) · [Architecture](docs/ARCHITECTURE.md) · [API](docs/HERDR-API-NOTES.md) · [World](docs/WORLD-SPEC.md) · [Assets](docs/ASSETS.md) · [Git](docs/GIT-PANEL-SPEC.md) · [Panels](docs/PANELS-SPEC.md) · [PoC](docs/POC-PLAN.md) · [Licensing](docs/LICENSING.md) · [Decisions](docs/DECISIONS.md) · [Roadmap](docs/ROADMAP.md) · [Ideas](docs/IDEAS.md).

## Licenses

Original code/tooling: [Apache-2.0](LICENSE). Original artwork, to the extent rights are held: [CC BY 4.0](art/LICENSE); [assets/LICENSE](assets/LICENSE) points to the same license. AI-generation rights/provenance caveats and upstream exceptions are in [LICENSING](docs/LICENSING.md), [NOTICE](NOTICE) and [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md). No Pokémon artwork/audio, and no unlicensed upstream code, is included.
