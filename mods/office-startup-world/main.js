// SPDX-License-Identifier: Apache-2.0
// office-startup-world: one desk per agent of the current space. The seated clip follows
// the agent's real status and plays natively; idle agents take a coffee sip now and then,
// and after more than five minutes idle, characters with walk art take a walk.
// Click desk or actor to focus its terminal. Renders on host data, panel size, or a sip
// starting/ending.
import { View, div } from "gpui-kit";
import { v_flex } from "gpui-base";
import { agents, focused, props, run, theme } from "herdr";
import { computeLayout } from "./layout.js";
import { renderScene } from "./scene.js";
import { selectAgent } from "./select.js";
import { assignSlots } from "./slots.js";
import { characterForSlot, canWander } from "./cast.js";
import { stepCoffee } from "./coffee.js";
import { stepWander, poseOf, nextEventAt, visibleKey, IDLE_MS } from "./wander.js";

// Integer sprite scale. image() smooths and the app zoom applies; 2 keeps the 48 px cast readable
// in a 360 px panel (one desk per row). Revisit once art is pre-scaled.
const SCALE = 2;
const PRESET = "nordic-day";
const MAX_DESKS = 8;

// Only layouts/office-startup-dev.json sets `dev`: a short idle threshold and a visible
// diagnostics strip. A test keeps every other layout from setting it.
const devProps = () => (props()?.dev === true ? { idleMs: props().idleMs ?? 20000 } : null);

export default class OfficeWorld extends View {
  init(props, cx) {
    this.width = 360;
    this.slots = new Map();
    this.coffee = new Map();
    this.wander = new Map();
    this.pendingAt = null;
    // Deadlines only: redraw when a sip starts/ends or a walk reaches a corner, never per
    // frame. Clips and movement between waypoints are native (WebP, .transition).
    cx.timer.every(1000, (cx) => this.onTimer(cx));
  }

  onTimer(cx) {
    const now = Date.now();
    // Dev mode redraws every second so its idle counter is live; the product never does.
    if (this.tick(now) || devProps()) cx.notify();
    // Walk legs rarely end on a whole second: wake up exactly at the next corner or visit end.
    const due = [...this.wander.values()].map((s) => nextEventAt(s, now)).filter((t) => t !== null);
    const soonest = due.length ? Math.min(...due) : null;
    if (soonest !== null && soonest - now < 1000 && this.pendingAt !== soonest) {
      this.pendingAt = soonest;
      cx.timer.after(Math.max(0, soonest - now), (cx) => {
        this.pendingAt = null;
        if (this.tick(Date.now())) cx.notify();
      });
    }
  }

  /** Advance coffee and wander state for every present agent; true when anything visible changed. */
  tick(now) {
    let changed = false;
    const list = this.present();
    const coffee = new Map();
    for (const a of list) {
      const prev = this.coffee.get(a.address);
      const s = stepCoffee(prev, { status: a.status, now, rng: Math.random });
      if (s.sipping !== (prev?.sipping ?? false)) changed = true;
      coffee.set(a.address, s);
    }
    this.coffee = coffee;
    const actors = [];
    for (const a of list) {
      const slot = this.slots.get(a.address);
      if (slot === undefined) continue;
      actors.push({ address: a.address, slot, status: a.status, canWander: canWander(characterForSlot(slot)),
        sipping: coffee.get(a.address).sipping });
    }
    const idleMs = devProps()?.idleMs ?? IDLE_MS;
    const wander = stepWander(this.wander, { actors, now, rng: Math.random, layout: this.layout(), idleMs });
    for (const [address, s] of wander)
      if (visibleKey(s, now) !== visibleKey(this.wander.get(address), now)) changed = true;
    this.wander = wander;
    return changed;
  }

  layout() {
    const desks = this.slots.size ? Math.max(...this.slots.values()) + 1 : 0;
    return computeLayout({ width: this.width, stations: desks, scale: SCALE });
  }

  // An `address` prop pins one agent (testing); otherwise every agent of the focused space.
  present() {
    const all = agents();
    const address = props()?.address;
    if (address) {
      const one = selectAgent({ address, focused: null, agents: all });
      return one ? [one] : [];
    }
    const space = focused()?.space;
    return space ? all.filter((a) => a.space === space) : all;
  }

  render(cx) {
    const t = theme();
    const list = this.present();
    this.slots = assignSlots(this.slots, list.map((a) => a.address), MAX_DESKS);
    const actors = [];
    for (const a of list) {
      const slot = this.slots.get(a.address);
      if (slot === undefined) continue;
      // Terminal titles say what the agent is doing; tab names are often just "1".
      // A non-idle status wins over any acting state in this same render: no pose, no sip.
      const pose = a.status === "idle" ? poseOf(this.wander.get(a.address), Date.now()) : null;
      actors[slot] = {
        address: a.address, status: a.status, label: a.title || a.app || a.address,
        character: characterForSlot(slot), pose,
        sipping: !pose && (this.coffee.get(a.address)?.sipping ?? false),
      };
    }
    const layout = this.layout();
    const desks = layout.stations.length;

    return v_flex().id("root").size_full().bg(t.canvas).overflow_y_scrollbar()
      .on_size_change((size, cx) => {
        if (Math.round(size.width) === this.width) return;
        this.width = Math.round(size.width);
        cx.notify();
      })
      .child(renderScene(layout, {
        preset: PRESET,
        actors,
        theme: t,
        onFocus: (address) => run("pane.focus", { terminal: address }),
      }))
      .when(!!devProps(), (el) => el.child(this.diagnostics(list, t)))
      .when(!desks, (el) => el.child(div().p(8).text_size(11).text_color(t.muted).child("No agent in this space")))
      .when(list.length > MAX_DESKS, (el) => el.child(div().p(8).text_size(11).text_color(t.muted)
        .child(`${list.length - MAX_DESKS} more agents not shown`)));
  }

  /** Dev layout only: phase and observed idle time per agent, to see why someone stays put. */
  diagnostics(list, t) {
    const now = Date.now();
    const rows = list.map((a) => {
      const w = this.wander.get(a.address);
      const idle = w?.idleSince != null ? `${Math.floor((now - w.idleSince) / 1000)}s` : "-";
      const cool = w?.cooldownUntil > now ? ` cooldown ${Math.ceil((w.cooldownUntil - now) / 1000)}s` : "";
      const char = characterForSlot(this.slots.get(a.address) ?? 0);
      return `${a.address} ${char} ${a.status} · ${w?.phase ?? "-"}${w?.dest ? ` → ${w.dest}` : ""} · idle ${idle}${cool}${canWander(char) ? "" : " · no walk art"}`;
    });
    return v_flex().p(6).gap(2).bg(t.popover).text_size(10).text_color(t.foreground)
      .child(div().text_color(t.blocked).child(`DEV CLOCK: walks after ${devProps().idleMs / 1000}s idle (product: 300s)`))
      .children(rows.map((r) => div().child(r)));
  }
}
