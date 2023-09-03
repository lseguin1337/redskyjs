import { getCurrentContext } from "./context";

export type Hook = () => void;

export function onMount(fn: Hook) {
  const ctx = getCurrentContext();
  ctx.lifeCycle.mount.push(fn);
}

export function onDestroy(fn: Hook) {
  const ctx = getCurrentContext();
  ctx.lifeCycle.destroy.push(fn);
}
