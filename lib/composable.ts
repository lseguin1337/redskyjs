import { getCurrentContext } from "./context";
import { of, reactive } from "./reactive";

export function useEventEmitter<T = any>(eventName: string) {
  const ctx = getCurrentContext();
  return (detail: T) => {
    ctx.params.on?.[eventName]?.(detail);
  };
}

export function useProp<T>(propName: string) {
  const ctx = getCurrentContext();
  return reactive<T>((push) => {
    const value = ctx.params.props?.[propName];
    return of(value).subscribe(push);
  });
}
