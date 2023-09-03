import { ComponentOptions } from "./component";
import { Hook } from "./hook";

export interface VmContext {
  rootNode?: Node & { head?: HTMLHeadElement; body?: HTMLBodyElement };
  options: ComponentOptions;
  lifeCycle: {
    destroy: Hook[];
    mount: Hook[];
  };
  params: {
    props?: any;
    on?: any;
  };
  on: (name: string, handler: (data: any) => void) => VmContext;
  $mount: () => void;
  $destroy: () => void;
  el: Node;
  parent?: VmContext;
}

let currentContext: VmContext | undefined;

function callEvery(hooks: Hook[]) {
  for (const hook of hooks) hook();
}

export function createContext<T>(init: (context: Partial<VmContext>) => T): T {
  try {
    const self: Partial<VmContext> = {
      lifeCycle: {
        mount: [],
        destroy: [],
      },
      parent: currentContext,
      $destroy() {
        // TODO: find a better way
        if (self.parent)
          self.parent.lifeCycle.destroy = self.parent.lifeCycle.destroy.filter(
            (v) => v !== self.$destroy
          );
        callEvery(self.lifeCycle!.destroy);
      },
      $mount() {
        callEvery(self.lifeCycle!.mount);
      },
    };
    currentContext?.lifeCycle.destroy.push(self.$destroy!);
    currentContext = self as any;
    return init(self);
  } finally {
    currentContext = currentContext!.parent!;
  }
}

export function chainContext<T extends (...args: any[]) => any>(fn: T): T {
  const oldCtx = currentContext;
  let prevCtx: VmContext;
  return ((...args) => {
    let tmp = currentContext;
    try {
      currentContext = oldCtx;
      prevCtx?.$destroy();
      return createContext((newCtx) => {
        prevCtx = newCtx as any;
        return fn(...args);
      });
    } finally {
      currentContext = tmp;
    }
  }) as T;
}

export function getCurrentContext() {
  return currentContext!;
}
