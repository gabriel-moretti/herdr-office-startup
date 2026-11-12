// SPDX-License-Identifier: Apache-2.0
// Which agent the PoC scene shows. Pure: callers pass host data in.

/**
 * @param {{ address?: string, focused: { agent: string | null, space: string } | null,
 *           agents: { address: string, space: string }[] }} input
 */
export function selectAgent({ address, focused, agents }) {
  if (address) return agents.find((a) => a.address === address) ?? null;
  if (focused?.agent) {
    const a = agents.find((x) => x.address === focused.agent);
    if (a) return a;
  }
  if (focused?.space) return agents.find((a) => a.space === focused.space) ?? null;
  return null;
}
