# Side panels and optional metrics

## Integration map

| Capability | Destination | MVP behavior |
|---|---|---|
| file-icons | Tree tab of office-startup-git | static licensed icons/name resolver; not a second full file browser |
| better-changes | Changes tab + central readonly diff | adopt licensed parsing/rendering; no staging/actions |
| branch-pr | PR tab | consultations only; no Go runtime helper unless justified and packaged separately |
| branch-issue | excluded | GitHub Issues reader written for selected provider, not Linear |
| ci-dash | CI tab | runs/jobs/logs readonly, no forms or mutation commands |
| office world | office-startup-world | independent of Git queries and network |
| metrics / Pulse-style ideas | optional later panel | source-labeled estimates; not blocker for MVP |

## Metrics after MVP

Original implementation only, unless a valid license is later obtained for borrowed code. Brutal Metrics research indicates Python/session-file collection, estimated token/context/cost tables and avatar generation; no permission to copy implementation is established. Do not reproduce by renaming its files. A metric collector must specify supported agent/version/session format, where files live, cache retention, costs as estimates, unknown coverage and privacy.

Only read session files with explicit feature opt-in and path scope, no content upload. Never treat a paid subscription as actual per-token invoice cost. Report sample timestamp/coverage and remote-machine limitations. Unknown data stays unavailable rather than fabricated. No `/clear`, agent input or context-discard action in MVP. No need for user credentials in collector config.

## Shared UX

One context controller for Git tabs, one deduplicated request/cache queue per repo/host/account; no CI/PR independent refresh loops targeting different branches. World uses its own identity/status data and persists visual preferences only. Source labels, truncation, offline and stale states are textual. Click-through opens details, not operational side effects. No Slack/music/automation dashboard scope creep.

## Tests

Name/extension/folder icon mapping with case/unusual paths and missing icon fallback. CI fixture run/job/step alignment by SHA and pagination. Metrics later require parser format fixtures, partial records, rotation, late data and price-version traceability; these do not exist yet. [Roadmap](ROADMAP.md) and [Git spec](GIT-PANEL-SPEC.md) govern the read-only frontier.
