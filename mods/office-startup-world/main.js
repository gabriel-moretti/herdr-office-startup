// SPDX-License-Identifier: Apache-2.0
// office-startup-world: one desk per agent of the current space. The seated clip follows
// the agent's real status and plays natively; idle agents take a coffee sip now and then.
// Click desk or actor to focus its terminal. Renders on host data, panel size, or a sip
// starting/ending.
import { View, div } from "gpui-kit";
import { v_flex } from "gpui-base";
import { agents, focused, props, run, theme } from "herdr";
import { computeLayout } from "./layout.js";
import { renderScene } from "./scene.js";
import { selectAgent } from "./select.js";
import { assignSlots } from "./slots.js";
import { characterForSlot } from "./cast.js";
import { stepCoffee } from "./coffee.js";

// Integer sprite scale. image() smooths and the app zoom applies; 2 keeps the 48 px cast readable
// in a 360 px panel (one desk per row). Revisit once art is pre-scaled.
const SCALE = 2;
const PRESET = "nordic-day";
const MAX_DESKS = 8;

export default class OfficeWorld extends View {
  init(props, cx) {
    this.width = 360;
    this.slots = new Map();
    this.coffee = new Map();
    // Deadlines only: redraw when a sip starts or ends, never per frame (the clip plays natively).
    cx.timer.every(1000, (cx) => {
      if (this.tick(Date.now())) cx.notify();
    });
  }

  /** Advance every present agent's coffee state; true when anything visible changed. */
  tick(now) {
    let changed = false;
    const next = new Map();
    for (const a of this.present()) {
      const prev = this.coffee.get(a.address);
      const s = stepCoffee(prev, { status: a.status, now, rng: Math.random });
      if (s.sipping !== (prev?.sipping ?? false)) changed = true;
      next.set(a.address, s);
    }
    this.coffee = next;
    return changed;
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
      actors[slot] = {
        address: a.address, status: a.status, label: a.title || a.app || a.address,
        character: characterForSlot(slot), sipping: this.coffee.get(a.address)?.sipping ?? false,
      };
    }
    const desks = this.slots.size ? Math.max(...this.slots.values()) + 1 : 0;
    const layout = computeLayout({ width: this.width, stations: desks, scale: SCALE });

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
      .when(!desks, (el) => el.child(div().p(8).text_size(11).text_color(t.muted).child("No agent in this space")))
      .when(list.length > MAX_DESKS, (el) => el.child(div().p(8).text_size(11).text_color(t.muted)
        .child(`${list.length - MAX_DESKS} more agents not shown`)));
  }
}
