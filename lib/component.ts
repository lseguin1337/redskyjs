import { VmContext, createContext, getCurrentContext } from "./context";
import { el, toNode } from "./dom";

export type NNode = Node | string | VmContext;

export interface ComponentOptions {
  styleScopeId?: string;
  style?: string[] | string;
  setup: () => NNode;
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

function compileStyle(options: ComponentOptions) {
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

export function createComponent(options: ComponentOptions) {
  compileStyle(options);
  return (props = {}, opts: { target?: HTMLElement } = {}) => {
    return createContext((ctx) => {
      ctx.rootNode = opts.target?.getRootNode();
      ctx.options = options;
      ctx.params = { props, on: {} };
      ctx.on = (name: string, handler: (data: any) => void) => {
        ctx.params!.on[name] = handler;
        return ctx as VmContext;
      };
      installStyle();
      ctx.el = toNode(options.setup());
      ctx.$mount!();
      if (opts.target) {
        opts.target.append(ctx.el!);
      }
      return ctx;
    });
  };
}
