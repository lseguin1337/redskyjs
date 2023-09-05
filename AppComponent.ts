import { CalcComponent } from "./CalcComponent";
import { createComponent } from "./lib/component";
import { awaitBlock, ifBlock, el, switchBlock, forBlock } from "./lib/dom";
import { writable } from "./lib/reactive";

export const AppComponent = createComponent({
  style: ["main { margin: 0; padding: 0; }"],
  setup() {
    const promise = new Promise<string>((resolve) =>
      setTimeout(() => resolve("my result"), 1000)
    );

    const isOpen = writable(true);
    const numbers = writable<number[]>([]);

    const action = () => {
      isOpen.value = !isOpen.value;
      numbers.value = numbers.value.concat([numbers.value.length + 1]);
    };

    // component template
    return el("main")(
      // h1 title
      el("h1")("Calc App"),

      // subcomponent
      CalcComponent(),

      el("button").on("click", action)("do something"),

      // for block
      el("pre")(forBlock(numbers, (value) => `value: ${value}\n`)),

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
        // conditional block:
        ifBlock(isOpen, () => "is open")
      )
    );
  },
});
