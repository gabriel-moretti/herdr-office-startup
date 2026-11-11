# Performance sampling

`sample_cpu.py` records CPU and memory of the running Herdr app for the performance gates in [POC-PLAN](../../docs/POC-PLAN.md). It is a development tool: it is not part of any mod, and the product never runs it. Python standard library only.

CPU is computed from the change in accumulated CPU time between samples, so each row is the real average over the interval in percentage points of one core (100 = one full core). This avoids the smoothed `%CPU` that `ps` and Activity Monitor show.

## One run

```sh
python3 scripts/perf/sample_cpu.py --label baseline-main-run1 --out local/perf/01-baseline.csv
```

Defaults follow the protocol: 60 s warm-up, 300 s of sampling, one sample every 10 s, process `Herdr`. A summary line (mean, median, min, max, memory growth) goes to stderr; rows are appended to the CSV. `local/` is git-ignored, so raw samples stay on the machine; copy the summary into `docs/performance.md`.

Useful options: `--name herdr-core` (repeatable, to add the core processes), `--pid`, `--warmup`, `--duration`, `--interval`. For the memory gate use `--duration 600`.

## Protocol reminders

- Three runs per scenario, same window size, display, power state and layout; terminals quiet. Do not measure while an agent is working in the same app: on 2026-11-11 the app alone showed about 20 pp with an agent active in the `pixel-hq` layout.
- Always take a baseline (layout `main`, no World) in the same session and report the difference in percentage points, not a ratio.
- The script counts only the named processes. Compositing done by WindowServer is not included, which is one more reason to compare against a baseline rather than quote absolute numbers.
- If a sampled process exits, the run aborts; discard it.
- Frame times are a separate measurement (`show_fps_monitor()` or Instruments). This script makes no FPS claim.
