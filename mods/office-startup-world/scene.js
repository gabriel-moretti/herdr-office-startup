// SPDX-License-Identifier: Apache-2.0
// Static office scene: draws a computed layout with native elements. No state, no timers.
import { div, image } from "gpui-kit";
import { propPath, stillPath } from "./paths.js";

// Copied from the art pipeline's environment manifest; tests/world/scene-data.test.mjs keeps them in sync.
export const PALETTES = {
  "nordic-day": { floor: "#C9AC85", line: "#AE8A65", wall: "#E8E4DA" },
  botanical: { floor: "#B87B63", line: "#97634F", wall: "#BED0B3" },
  "blue-hour": { floor: "#455565", line: "#34404F", wall: "#697C96" },
};

/**
 * @param {ReturnType<import("./layout.js").computeLayout>} layout
 * @param {{ preset: string, actors: { address: string, label: string, character: string }[],
 *           theme: Record<string, string>, onFocus: (address: string) => void }} opts
 *   actors[i] sits at layout.stations[i].
 */
export function renderScene(layout, { preset, actors, theme, onFocus }) {
  const s = layout.scale;
  const palette = PALETTES[preset];
  const at = (el, r) => el.absolute().left(r.x * s).top(r.y * s).w(r.w * s).h(r.h * s);
  const prop = (id, r) => at(image(propPath(preset, id)), r);

  const scene = div().relative().w(layout.width * s).h(layout.height * s).bg(palette.floor).overflow_hidden()
    .child(at(div().bg(palette.wall), layout.wall))
    .child(at(div().bg(palette.line), { ...layout.wall, y: layout.wall.h, h: 1 }));

  for (const d of layout.decor) scene.child(prop(d.id, d.rect));

  // Desk hit targets first, so clicks anywhere on a station land on its terminal.
  layout.stations.forEach((st, i) => {
    const a = actors[i];
    if (!a) return;
    scene.child(at(div().id(`desk-${a.address}`).cursor_pointer(), st.rect)
      .on_click(() => onFocus(a.address)));
    scene.child(prop("desk", st.desk)).child(prop("monitor", st.monitor)).child(prop("chair", st.chair));
  });

  // Actors back to front by feet, then labels on top. All stations face north, so y order is enough.
  const seated = layout.stations.map((st, i) => [st, actors[i]]).filter(([, a]) => a)
    .sort(([p], [q]) => p.feet.y - q.feet.y);
  for (const [st, a] of seated) {
    scene.child(at(image(stillPath(a.character, "north", "coding")).id(`actor-${a.address}`).cursor_pointer(), st.actor)
      .on_click(() => onFocus(a.address)));
  }
  for (const [st, a] of seated) {
    scene.child(div().absolute().left(st.rect.x * s).top((st.rect.y + st.rect.h - 12) * s).w(st.rect.w * s)
      .flex().justify_center()
      .child(div().px(4).rounded(3).bg(theme.popover ?? "#202936").text_color(theme.foreground ?? "#E8E4DA")
        .text_size(10).truncate().child(a.label)));
  }
  return scene;
}
