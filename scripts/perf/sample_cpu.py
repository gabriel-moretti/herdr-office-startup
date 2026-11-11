#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Sample CPU and memory of running processes for the performance gates.

Development tool only: it is never part of a mod and nothing in the product calls it.
CPU is derived from the change in accumulated CPU time between samples, so each row is
the true average over that interval, in percentage points of one core (100 = one core).
It measures only the named processes; work done on their behalf by WindowServer is not
included, so compare runs against a baseline taken the same way.
"""
import argparse
import csv
import statistics
import subprocess
import sys
import time


def ps(*args):
    return subprocess.run(["ps", *args], capture_output=True, text=True).stdout


def find_pids(name):
    """PIDs whose executable basename is exactly `name`."""
    pids = []
    for line in ps("-axo", "pid=,comm=").splitlines():
        pid, _, comm = line.strip().partition(" ")
        if comm.strip().rsplit("/", 1)[-1] == name:
            pids.append(int(pid))
    return pids


def cpu_seconds(text):
    """Parse ps cputime: [[D-]HH:]MM:SS[.ss]."""
    days, _, rest = text.rpartition("-")
    seconds = 0.0
    for part in rest.split(":"):
        seconds = seconds * 60 + float(part)
    return seconds + (int(days) * 86400 if days else 0)


def read(pid):
    """(cpu seconds, rss MiB) or None when the process is gone."""
    fields = ps("-o", "cputime=,rss=", "-p", str(pid)).split()
    if len(fields) != 2:
        return None
    return cpu_seconds(fields[0]), int(fields[1]) / 1024


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--name", action="append", default=[], help="executable basename, repeatable (default: Herdr)")
    parser.add_argument("--pid", action="append", type=int, default=[], help="explicit PID, repeatable")
    parser.add_argument("--label", required=True, help="scenario label written to every row, e.g. baseline-main-run1")
    parser.add_argument("--warmup", type=float, default=60, help="seconds to wait before sampling (default 60)")
    parser.add_argument("--duration", type=float, default=300, help="seconds to sample (default 300)")
    parser.add_argument("--interval", type=float, default=10, help="seconds between samples (default 10)")
    parser.add_argument("--out", help="CSV path to append to (default: stdout)")
    args = parser.parse_args()

    targets = {}
    for name in args.name or ([] if args.pid else ["Herdr"]):
        found = find_pids(name)
        if not found:
            sys.exit(f"no running process named {name!r}")
        for pid in found:
            targets[pid] = name
    for pid in args.pid:
        targets[pid] = f"pid{pid}"

    print(f"sampling {targets} — warm-up {args.warmup:g}s, then {args.duration:g}s every {args.interval:g}s", file=sys.stderr)
    time.sleep(args.warmup)

    out = open(args.out, "a", newline="") if args.out else sys.stdout
    writer = csv.writer(out)
    if not args.out or out.tell() == 0:
        writer.writerow(["label", "elapsed_s", "pid", "name", "cpu_pp", "rss_mib"])

    start = time.monotonic()
    previous = {pid: (start, read(pid)) for pid in targets}
    cpu, rss = [], []
    while time.monotonic() - start < args.duration:
        time.sleep(args.interval)
        now = time.monotonic()
        total_cpu = total_rss = 0.0
        for pid, name in targets.items():
            then, before = previous[pid]
            after = read(pid)
            if before is None or after is None:
                sys.exit(f"process {pid} ({name}) exited during the run; discard this run")
            pp = (after[0] - before[0]) / (now - then) * 100
            writer.writerow([args.label, f"{now - start:.1f}", pid, name, f"{pp:.2f}", f"{after[1]:.1f}"])
            previous[pid] = (now, after)
            total_cpu += pp
            total_rss += after[1]
        cpu.append(total_cpu)
        rss.append(total_rss)
        out.flush()

    print(
        f"{args.label}: {len(cpu)} samples, CPU mean {statistics.mean(cpu):.2f} pp, "
        f"median {statistics.median(cpu):.2f}, min {min(cpu):.2f}, max {max(cpu):.2f}; "
        f"RSS first {rss[0]:.1f} MiB, last {rss[-1]:.1f} MiB, growth {rss[-1] - rss[0]:+.1f} MiB",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
