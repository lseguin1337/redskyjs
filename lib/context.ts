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

export function contextManager() {
  const oldCtx = getCurrentContext();
  let prevCtx: Partial<VmContext> | null = null;

  function wrap<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args) => create(() => fn(...args))) as T;
  }

  function create<T>(fn: (newCtx: Partial<VmContext>) => T) {
    const tmp = currentContext;
    try {
      currentContext = oldCtx;
      return createContext((newCtx) => {
        prevCtx?.$destroy?.();
        prevCtx = newCtx;
        return fn(newCtx);
      });
    } finally {
      currentContext = tmp;
    }
  }

  return {
    wrap,
    create,
  };
}

export function getCurrentContext() {
  return currentContext!;
}
