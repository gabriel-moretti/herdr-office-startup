// SPDX-License-Identifier: Apache-2.0
// Stable desk assignment: an agent keeps its desk while it exists, whatever the list order
// or its status. Pure; the view keeps the returned map between renders.

/**
 * @param {Map<string, number>} previous address -> desk index
 * @param {string[]} addresses agents present now, in host order
 * @param {number} [cap] maximum number of desks
 * @returns {Map<string, number>}
 */
export function assignSlots(previous, addresses, cap = Infinity) {
  const present = new Set(addresses);
  const next = new Map([...previous].filter(([address]) => present.has(address)));
  const used = new Set(next.values());
  let free = 0;
  for (const address of addresses) {
    if (next.has(address)) continue;
    while (used.has(free)) free++;
    if (free >= cap) break;
    next.set(address, free);
    used.add(free);
  }
  return next;
}
