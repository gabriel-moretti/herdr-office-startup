#!/bin/sh
# SPDX-License-Identifier: Apache-2.0
# Performance protocol over layouts: for each layout, switch to it and take N runs of
# sample_cpu.py (60 s warm-up + 300 s sampling each). Ends on the first layout given.
# Usage: scripts/perf/run_layouts.sh <tag> <layout> [<layout> ...]
#   e.g. scripts/perf/run_layouts.sh 01-baseline main office-startup-poc
# Keep the Herdr window visible and every terminal quiet (no agent working) while it runs.
set -eu
tag=$1; shift
runs=${RUNS:-3}
dir=$(cd "$(dirname "$0")/../.." && pwd)/local/perf
mkdir -p "$dir"
out="$dir/$tag.csv"
first=$1
for layout in "$@"; do
  herdr-app do layout.switch "{\"name\":\"$layout\"}" >/dev/null
  i=1
  while [ "$i" -le "$runs" ]; do
    python3 "$(dirname "$0")/sample_cpu.py" --label "$layout-run$i" --out "$out"
    i=$((i + 1))
  done
done
herdr-app do layout.switch "{\"name\":\"$first\"}" >/dev/null
echo "raw samples: $out"
