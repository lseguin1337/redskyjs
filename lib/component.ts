/// <reference path="../typings/index.d.ts" />

import { ClassType, ReactElement } from "../typings/index";
import {
  VmContext,
  createContext,
  getCurrentContext,
  singleContextManager,
} from "./context";
import { comment, el, memo, toNode } from "./dom";
import { Reactive, ReactiveOrNot, of } from "./reactive";

export type NNode = Node | string | VmContext | ReactElement;

export type Props<T> = {
  [P in keyof T]: Reactive<T[P]>;
};

export type PropsInput<T> = {
  [P in keyof T]: ReactiveOrNot<T[P]>;
};

export interface ComponentOptions<T extends {}> {
  name?: string; 
  shadowMode?: boolean;
  styleScopeId?: string;
  style?: string[] | string;
  setup: (props: Props<T>) => NNode;
}

function hash(style: string) {
  // use a better hash
  var hash = 0;
  for (var i = 0; i < style.length; i++) {
    var char = style.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

function injectCssScope(rule: string, scope: string) {
  // very simple css transformer
  const chunks = rule.split("{");
  chunks[0] = chunks[0]
    .split(",")
    .map((selector) =>
      selector
        .trim()
        .split(/\s+/g)
        .map((part) => `${part}${scope}`)
        .join(" ")
    )
    .join(",");
  return chunks.join("{").trim();
}

export function getScopeSelector(id: string) {
  return `[component-${id}]`;
}

function compileStyle(options: ComponentOptions<any>) {
  if (options.styleScopeId) return;
  const cssRules = (options.style as string[]) || [];
  const id = hash(cssRules.join(""));
  const scope = getScopeSelector(id);
  options.style = cssRules.map((rule) => injectCssScope(rule, scope)).join("");
  options.styleScopeId = id;
}

function getRootNode() {
  for (
    let ctx: undefined | VmContext = getCurrentContext();
    ctx;
    ctx = ctx.parent
  ) {
    if (ctx.rootNode) return ctx.rootNode;
  }
}

function installStyle() {
  const ctx = getCurrentContext();
  const rootNode = getRootNode();
  if (!rootNode) {
    console.error("detached node can not install stylesheets");
    return;
  }
  const destNode = rootNode.head || rootNode.body || (rootNode as HTMLElement);
  const id = ctx.options.styleScopeId;
  if (!id || destNode.querySelector(getScopeSelector(id))) return;
  const cssText = ctx.options.style as string;
  destNode.appendChild(el("style")(cssText));
}

function toProps<T extends {}>(inputs?: PropsInput<T>): Props<T> {
  const props = {} as any;
  for (const key in inputs) props[key] = of(inputs[key]);
  return props;
}

function lifeCycleManager(el: HTMLElement & { keepAlive?: boolean, $mount: () => void, $destroy: () => void }) {
  let timer: any = null;
  let mounted = false;

  return {
    connect() {
      if (mounted) {
        clearTimeout(timer);
        timer = null;
      } else {
        mounted = true;
        el.$mount();
      }
    },
    disconnect() {
      if (el.keepAlive) return;
      timer = setTimeout(() => el.$destroy(), 20);
    },
  };
}

/**
 * WebElement life cycle
 */
function LifeCycle() {
  const instances = new WeakMap();
  const resolveManager = (instance: any) => {
    if (!instances.has(instance))
      instances.set(instance, lifeCycleManager(instance));
    return instances.get(instance);
  };
  return (cls: any, _: any) => {
    cls.prototype.connectedCallback = function () {
      resolveManager(this).connect();
    };
    cls.prototype.disconnectedCallback = function () {
      resolveManager(this).disconnect();
    };
  };
}

export function createComponent<T extends {}>(options: ComponentOptions<T>) {
  compileStyle(options);

  function component(props?: PropsInput<T>, opts: { target?: HTMLElement | ShadowRoot } = {}) {
    return createContext((ctx) => {
      ctx.rootNode = opts.target?.getRootNode();
      ctx.options = options;
      ctx.params = { props: props || {}, on: {} };
      ctx.on = (name: string, handler: (data: any) => void) => {
        ctx.params!.on[name] = handler;
        return ctx as VmContext;
      };
      installStyle();
      ctx.el = toNode(options.setup(toProps(props)));
      ctx.$mount!();
      if (opts.target) {
        opts.target.append(ctx.el!);
      }
      return ctx as VmContext;
    });
  };

  component.toElement = (opts: { shadowMode?: boolean, name?: string } = {}) => {
    @LifeCycle()
    class Element extends HTMLElement {
      vm?: VmContext;
      props?: PropsInput<T>;

      $mount() {
        // TODO: handle propety and attribute binding
        this.vm = component(this.props, { target: opts.shadowMode === false ? this : this.attachShadow({ mode: 'open' }) });
      }

      $destroy() {
        this.vm?.$destroy();
      }
    };

    if (opts.name)
      customElements.define(opts.name, Element);
    return Element;
  }

  if (options.name) {
    component.toElement(options);
  }

  return component;
}

export type ComponentType<T> = (props: PropsInput<T>) => VmContext;

export function dynComponent<T>(
  component: Reactive<ComponentType<T>>
): (Props: PropsInput<T>) => Reactive<NNode> {
  const { scope } = singleContextManager();
  const wrappedComponent = component.map(
    memo((fn) => (typeof fn === "function" ? scope(fn) : () => comment()))
  );
  return (props: PropsInput<T>) => {
    return wrappedComponent.map(memo((fn) => fn(props)));
  };
}
