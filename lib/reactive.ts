export type Reactive<T> = {
  readonly value: T;
  subscribe: (fn: (v: T) => void) => () => void;
};
export type Writable<T> = Omit<Reactive<T>, "value"> & { value: T };

type DestroyHook = (() => void) | void;
type PushValue<T> = (value: T) => void;
type InitHook<T> = (push: PushValue<T>) => DestroyHook;

export function reactive<T>(init: InitHook<T>): Reactive<T> {
  const handlers = new Set<(v: T) => void>();
  let destroy: DestroyHook;
  let lastValue: T;

  function emit(data: T) {
    lastValue = data;
    for (const handler of handlers) handler(data);
  }

  return {
    get value() {
      return lastValue;
    },
    subscribe(fn: (v: T) => void) {
      const hook = (v: T) => fn(v);
      handlers.add(hook);
      if (handlers.size === 1) destroy = init(emit);
      else fn(lastValue);
      return () => {
        handlers.delete(hook);
        if (handlers.size === 0) destroy?.();
      };
    },
  };
}

export function of<T = any>(source: Reactive<T> | T): Reactive<T> {
  if (typeof source === "object" && source && "subscribe" in source)
    return source;
  return reactive<T>((push) => {
    push(source);
  });
}

export function writable<T = any>(value: T): Writable<T> {
  let push = (_v: T) => {};

  const { subscribe } = reactive<T>((_push) => {
    push = _push;
    push(value);
  });

  return {
    subscribe,
    get value() {
      return value;
    },
    set value(newValue: T) {
      value = newValue;
      push(value);
    },
  };
}

function combine<T>(...reactives: Reactive<T>[]): Reactive<T[]> {
  return reactive((update) => {
    let shouldUpdate = false;
    const tab: T[] = [];

    function notifyChange() {
      if (!shouldUpdate) return;
      shouldUpdate = false;
      queueMicrotask(() => {
        update(tab);
        shouldUpdate = true;
      });
    }

    const subscriptions = reactives.map((reactive, i) => {
      return of(reactive).subscribe((v) => {
        tab[i] = v;
        notifyChange();
      });
    });

    shouldUpdate = true;
    update(tab);
    return () => {
      for (const hook of subscriptions) hook();
    };
  });
}

// TODO: handle typing properly
export function derived<T, U>(
  $: Reactive<T>,
  predicate: (value: T) => U
): Reactive<U>;
export function derived<T, U>(
  $: Reactive<T>[],
  predicate: (value: T[]) => U
): Reactive<U>;
export function derived<T, U>(
  $: Reactive<T> | Reactive<T>[],
  predicate: (value: T | T[]) => U
): Reactive<U> {
  return reactive<U>((push) => {
    const source = $ instanceof Array ? combine(...$) : of($);
    return source.subscribe((value) => push(predicate(value)));
  });
}
