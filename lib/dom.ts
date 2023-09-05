import { NNode } from "./component";
import {
  VmContext,
  contextManager,
  createContext,
  getCurrentContext,
} from "./context";
import { onDestroy } from "./hook";
import {
  Reactive,
  ReactiveOrNot,
  Writable,
  derived,
  isReactive,
  of,
  reactive,
} from "./reactive";

type OneOrMany<T> = T[] | T;
type FactoryOrNot<T> = (() => T) | T;
type ElChild = FactoryOrNot<ReactiveOrNot<OneOrMany<NNode>>>;

export function toNode(value: NNode) {
  if (typeof value === "string") return document.createTextNode(value);
  return "el" in value ? value.el : value;
}

export function ifBlock(
  condition: ReactiveOrNot<any>,
  block: () => NNode,
  elseBlock: () => NNode = () => comment("if block")
) {
  const { wrap } = contextManager();
  const conditionBlock = derived(
    of(condition),
    wrap((isActive) => {
      if (isActive) return block();
      return elseBlock();
    })
  );

  return {
    ...conditionBlock,
    elseIf(elseIfCondition: Reactive<boolean>, elseIfTemplate: () => NNode) {
      // TODO: implement elseIf
      return this;
    },
    else(elseTemplate: () => NNode) {
      elseBlock = elseTemplate;
      return this;
    },
  };
}

export function forBlock<T>(
  list: ReactiveOrNot<T[]>,
  template: (item: T, index: number, items: T[]) => NNode,
  resolveKey: (item: T, index: number) => any = (_item, index) => index
) {
  const block = reactive<NNode[]>((push) => {
    const nodes = new Map<any, { node: Node; vm: VmContext }>();
    return of(list).subscribe((items) => {
      const usedKeys = new Set<any>();

      const compiledNodes = items.map((item, index) => {
        const key = resolveKey(item, index);
        usedKeys.add(key);
        const cache = nodes.get(key);
        if (cache) return cache.node;
        return createContext((vm) => {
          const node = toNode(template(item, index, items));
          nodes.set(key, { node, vm: vm as VmContext });
          return node;
        });
      });

      for (const storedKey of nodes.keys()) {
        if (!usedKeys.has(storedKey)) {
          nodes.get(storedKey)!.vm.$destroy();
          nodes.delete(storedKey);
        }
      }

      push(compiledNodes);
    });
  });
  return {
    ...block,
    empty(emptyTemplate: () => NNode) {
      // TODO: implement empty template
      return this;
    },
  };
}

export function switchBlock<T>($: ReactiveOrNot<T>) {
  const { wrap } = contextManager();
  let defaultFn: ((value: T) => NNode) | undefined;
  const cases = new Map<T, (value: T) => NNode>();

  const reactiveTemplate = reactive<NNode>((push) => {
    return of($).subscribe(
      wrap((value) => {
        const template = cases.get(value) || defaultFn;
        if (template) return push(template(value));
        return push(comment("switch case missing"));
      })
    );
  });

  return {
    ...reactiveTemplate,
    case(caseValue: T, fn: (value: T) => NNode) {
      cases.set(caseValue, fn);
      return this;
    },
    default(fn: (value: T) => NNode) {
      defaultFn = fn;
      return this;
    },
  };
}

export function awaitBlock<T>($: ReactiveOrNot<Promise<T>>) {
  const { wrap } = contextManager();
  const noop = () => comment("text");
  const templates = {
    pending: noop as () => NNode,
    then: noop as (value: T) => NNode,
    catch: noop as (err: Error) => NNode,
  };
  // TODO: handle the context destroy and creation
  const template = reactive<NNode>((push) => {
    let isPending = false;
    let current: Promise<T> | null = null;
    return of($).subscribe((promise) => {
      current = promise;
      if (!isPending) {
        isPending = true;
        push(templates.pending());
      }
      promise.then(
        (value) => {
          if (current !== promise) return;
          isPending = false;
          push(templates.then(value));
        },
        (err) => {
          if (current !== promise) return;
          isPending = false;
          push(templates.catch(err));
        }
      );
    });
  });

  return {
    ...template,
    then(fn: (value: T) => NNode) {
      templates.then = wrap(fn);
      return this;
    },
    catch(fn: (err: Error) => NNode) {
      templates.catch = wrap(fn);
      return this;
    },
    pending(fn: () => NNode) {
      templates.pending = wrap(fn);
      return this;
    },
  };
}

function react<T>(
  readable: ReactiveOrNot<T>,
  render: (newValue: T, oldValue: T | undefined) => void
) {
  let oldValue: T | undefined = undefined;
  const fn = (newValue: T) => {
    render(newValue, oldValue);
    oldValue = newValue;
  };
  if (isReactive(readable)) return onDestroy(readable.subscribe(fn));
  fn(readable);
}

export function el(localName: string) {
  const ctx = getCurrentContext();
  const node = document.createElement(localName);

  if (ctx.options?.styleScopeId)
    node.setAttribute(`component-${ctx.options.styleScopeId}`, "");

  function El(...children: ElChild[]) {
    for (const childComponent of children) {
      const reactiveChild = of(
        typeof childComponent === "function" ? childComponent() : childComponent
      );
      const childNodes = derived(reactiveChild, (value) => {
        if (value instanceof Array) {
          if (value.length === 0) return [comment("empty list")];
          return value.map(toNode);
        }
        return [toNode(value)];
      });
      react(childNodes, (nodes, prevNodes) => {
        if (prevNodes) {
          replaceWith(prevNodes, nodes);
        } else {
          node.append(...nodes);
        }
        prevNodes = nodes;
      });
    }
    return node;
  }

  El.class = (classes: { [name: string]: ReactiveOrNot<boolean> }) => {
    for (const className in classes) {
      react(classes[className], (isActive) => {
        if (isActive) node.classList.add(className);
        else node.classList.remove(className);
      });
    }
    return El;
  };

  El.attr = (attrs: { [name: string]: ReactiveOrNot<string> }) => {
    for (const attrName in attrs) {
      react(attrs[attrName], (attrValue) => {
        node.setAttribute(attrName, attrValue);
      });
    }
    return El;
  };

  El.props = (props: { [name: string]: ReactiveOrNot<any> }) => {
    for (const propName in props) {
      react(props[propName], (propValue) => {
        (node as any)[propName] = propValue;
      });
    }
    return El;
  };

  El.on = (
    eventName: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions | undefined
  ) => {
    node.addEventListener(eventName, handler, options);
    onDestroy(() => {
      node.removeEventListener(eventName, handler, options);
    });
    return El;
  };

  El.bind = (state: Writable<string>) => {
    const input = node as HTMLInputElement;
    react(state, (value) => {
      if (input.value !== value) input.value = value;
    });
    El.on("input", () => {
      if (input.value !== state.value) state.value = input.value;
    });
    return El;
  };

  El.plug = (directiveFn: (element: Element) => void) => {
    directiveFn.call(El, node);
    return El;
  };

  return El;
}

export function text(text: ReactiveOrNot<string | number>) {
  const textNode = document.createTextNode("");
  react(text, (value) => {
    textNode.data = `${value}`;
  });
  return textNode;
}

export function comment(data: string) {
  return document.createComment(data);
}

function replaceWith(oldValue: Node[], newValue: Node[]) {
  // TODO: avoid moving all nodes
  const oldNodes = oldValue.concat().reverse();
  const newNodes = newValue.concat().reverse();

  (oldNodes[0] as any).replaceWith(newNodes[0]);
  for (let i = 1; i < oldNodes.length; i++) (oldNodes[i] as any).remove();
  for (let i = 1; i < newNodes.length; i++) {
    const prev = newNodes[i - 1];
    const current = newNodes[i];
    prev.parentNode!.insertBefore(current, prev);
  }
}
