
export function reset() { return { type: 'reset' }; }
export function regen() { return { type: 'regen' }; }
export function setLevel({ world, level }) {
  return { type: 'setLevel', world, level };
}
export function nextLevel() { return { type: 'nextLevel' }; }
export function start() { return { type: 'start' }; }
export function pause() { return { type: 'pause' }; }
export function step() { return { type: 'step' }; }
export function setCode(code) { return { type: 'setCode', code }; }
export function resetCodeToDefault() { return { type: 'resetCodeToDefault' }; }

