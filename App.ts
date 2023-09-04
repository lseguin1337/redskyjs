import { CalcComponent } from "./CalcComponent";
import { createComponent } from "./lib/component";
import { awaitBlock, ifBlock, el } from "./lib/dom";
import { writable } from "./lib/reactive";

export const AppComponent = createComponent({
  style: [],
  setup() {
    const promise = new Promise<string>((resolve) =>
      setTimeout(() => resolve("my result"), 1000)
    );

    const isOpen = writable(true);
    const toggle = () => (isOpen.value = !isOpen.value);

    // component template
    return el("main")(
      // create h1 title
      el("h1")("Calc App"),

      // create subcomponent
      CalcComponent(),

      // example of await block:
      awaitBlock(
        promise,
        () => "loading...",
        (value) => `result: ${value}`,
        (err) => `error: ${err.message}`
      ),

      el("div")(
        // example of conditional block
        el("button").on("click", toggle)("toggle"),
        // example of if block:
        ifBlock(isOpen, () => "is open")
      )
    );
  },
});
