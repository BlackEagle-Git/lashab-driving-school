export { signs, categories } from "./signs";
export type { Sign, Category, Language } from "./signs";
export { scenarios, scenariosByLevel } from "./scenarios";
export type { Scenario, SceneConfig, Actor, Layout } from "./scenarios";

import { signs, type Sign } from "./signs";

/** Builds four plausible answers (same family as the sign) with a rotating correct slot. */
export function getOptions(current: Sign, index: number): Sign[] {
  const family = signs.filter(s => s.category === current.category && s.id !== current.id);
  const pool = family.length >= 3 ? family : signs.filter(s => s.id !== current.id);
  const picked: Sign[] = [current];
  for (let i = 0; picked.length < 4 && i < pool.length * 2; i++) {
    const candidate = pool[(index * 7 + i * 5 + 3) % pool.length];
    if (!picked.some(p => p.id === candidate.id)) picked.push(candidate);
  }
  const shift = (index * 3 + 1) % picked.length;
  return [...picked.slice(shift), ...picked.slice(0, shift)];
}
