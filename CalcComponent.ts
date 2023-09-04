import { createComponent } from "./lib/component";
import { el, text } from "./lib/dom";
import { derived, writable } from "./lib/reactive";

export const CalcComponent = createComponent({
  style: [
    "div { display: flex; padding: 5px; }",
    "div.isNaN { background-color: red; }",
    "input, button { margin-right: 5px; margin-left: 5px; }",
  ],
  setup() {
    const left = writable("0");
    const right = writable("0");
    const result = derived([left, right], ([a, b]) => +a + +b);

    const reset = () => {
      left.value = "0";
      right.value = "0";
    };

    return el("div").class({
      isNaN: derived(result, isNaN),
    })(
      el("input").bind(left).attr({ name: "left-input" }),
      "+",
      el("input").bind(right).attr({ name: "right-input" }),
      "= ",
      text(result),
      el("button").on("click", reset)("reset")
    );
  },
});
