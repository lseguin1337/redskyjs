import { getCurrentContext } from "./context";
import { of, reactive } from "./reactive";

export function useEmitter<T = any>(eventName: string) {
  const ctx = getCurrentContext();
  return (detail: T) => {
    ctx.params.on?.[eventName]?.(detail);
  };
}

export function useProp(propName: string) {
  const ctx = getCurrentContext();
  return reactive((push) => {
    const value = ctx.params.props?.[propName];
    return of(value).subscribe(push);
  });
}
