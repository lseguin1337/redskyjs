import { NNode } from "./component";
import { contextManager, getCurrentContext } from "./context";
import { onDestroy } from "./hook";
import { Reactive, Writable, derived, of, reactive } from "./reactive";

export function toNode(value: NNode) {
  if (typeof value === "string") return document.createTextNode(value);
  return "el" in value ? value.el : value;
}

export function ifBlock(
  condition: Reactive<boolean>,
  block: () => NNode,
  elseBlock: () => NNode = () => comment("if block")
) {
  const { wrap } = contextManager();
  return derived(
    condition,
    wrap((isActive) => {
      if (isActive) return block();
      return elseBlock();
    })
  );
}

export function forBlock() {
  // TODO: for block
}

export function switchBlock<T>($: Reactive<T> | T) {
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

export function awaitBlock<T>($: Reactive<Promise<T>> | Promise<T>) {
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

function react<T>(readable: Reactive<T> | T, render: (value: T) => void) {
  const fn = render;
  if (typeof readable === "object" && readable && "subscribe" in readable)
    return onDestroy(readable.subscribe(fn));
  fn(readable);
}

export function el(localName: string) {
  const ctx = getCurrentContext();
  const node = document.createElement(localName);

  if (ctx.options?.styleScopeId)
    node.setAttribute(`component-${ctx.options.styleScopeId}`, "");

  function El(...children: (Reactive<NNode> | NNode | (() => NNode))[]) {
    for (const childComponent of children) {
      const reactiveChild = of<NNode>(
        typeof childComponent === "function" ? childComponent() : childComponent
      );
      const childNode = derived(reactiveChild, (c) => toNode(c as NNode));
      let prevNode: Element | Comment | Text | null = null;
      react(childNode, (cnode) => {
        if (prevNode) {
          prevNode.replaceWith(cnode);
        } else {
          node.append(cnode);
        }
        prevNode = cnode as any;
      });
    }
    return node;
  }

  El.class = (classes: { [name: string]: Reactive<boolean> | boolean }) => {
    for (const className in classes) {
      react(classes[className], (isActive) => {
        if (isActive) node.classList.add(className);
        else node.classList.remove(className);
      });
    }
    return El;
  };

  El.attr = (attrs: { [name: string]: Reactive<string> | string }) => {
    for (const attrName in attrs) {
      react(attrs[attrName], (attrValue) => {
        node.setAttribute(attrName, attrValue);
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
    directiveFn(node);
    return El;
  };

  return El;
}

export function text(text: Reactive<string | number> | string | number) {
  const textNode = document.createTextNode("");
  react(text, (value) => {
    textNode.data = `${value}`;
  });
  return textNode;
}

export function comment(data: string) {
  return document.createComment(data);
}
