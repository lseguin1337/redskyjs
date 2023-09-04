import { CalcComponent } from "./CalcComponent";
import { createComponent } from "./lib/component";
import { el } from "./lib/dom";

export const AppComponent = createComponent({
  style: [],
  setup() {
    return el("main")(el("h1")("Hello Calc 2"), CalcComponent());
  },
});
