import { CalcComponent } from "./CalcComponent";
import { createComponent } from "./lib/component";
import { awaitBlock, ifBlock, el, switchBlock } from "./lib/dom";
import { writable } from "./lib/reactive";

export const AppComponent = createComponent({
  style: ["main { margin: 0; padding: 0; }"],
  setup() {
    const promise = new Promise<string>((resolve) =>
      setTimeout(() => resolve("my result"), 1000)
    );

    const isOpen = writable(true);
    const toggle = () => (isOpen.value = !isOpen.value);

    // component template
    return el("main")(
      // h1 title
      el("h1")("Calc App"),

      // subcomponent
      CalcComponent(),

      // await block
      el("p")(
        awaitBlock(promise)
          .pending(() => "loading...")
          .then((value) => `result: ${value}`)
          .catch((error) => `error: ${error.message}`)
      ),

      // switch case block
      el("p")(
        switchBlock(isOpen)
          .case(true, () => "is true")
          .case(false, () => "is false")
          .default(() => "something else")
      ),

      el("div")(
        el("button").on("click", toggle)("toggle"),
        // conditional block:
        ifBlock(isOpen, () => "is open")
      )
    );
  },
});

// bootstrap the app
AppComponent(
  {}, // empty props
  { target: document.body } // target destination
);
