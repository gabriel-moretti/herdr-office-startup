// SPDX-License-Identifier: Apache-2.0
// office-startup-world: PoC static scene. One station for the selected agent; click desk
// or actor to focus its terminal. Renders only when host data or the panel size changes.
import { View, div } from "gpui-kit";
import { v_flex } from "gpui-base";
import { agents, focused, props, run, theme } from "herdr";
import { computeLayout } from "./layout.js";
import { renderScene } from "./scene.js";
import { selectAgent } from "./select.js";

// Integer sprite scale. Stays 1 until the milestone 01 spike shows how image() scales.
const SCALE = 1;
const PRESET = "nordic-day";

export default class OfficeWorld extends View {
  init() {
    this.width = 360;
  }

  render(cx) {
    const t = theme();
    const agent = selectAgent({ address: props()?.address, focused: focused(), agents: agents() });
    // Tab names are often just "1"; the terminal title says what the agent is.
    const actors = agent ? [{ address: agent.address, label: agent.title || agent.app || agent.address, character: "nico" }] : [];
    const layout = computeLayout({ width: this.width, stations: actors.length, scale: SCALE });

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
      .when(!agent, (el) => el.child(div().p(8).text_size(11).text_color(t.muted).child("No agent in this space")));
  }
}
