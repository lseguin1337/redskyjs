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

    const letters = ["a", "b", "c", "d"];

    const isOpen = writable(true);
    const numbers = writable<number[]>([]);
    const letter = writable<"a" | "b" | "c" | "d">("a");

    const action = () => {
      isOpen.value = !isOpen.value;
      numbers.value = numbers.value.concat([numbers.value.length + 1]);
      letter.value = letters[numbers.value.length % letters.length] as any;
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
        switchBlock(letter)
          .case("a", () => "first letter of the alphabet")
          .case("b", () => "first letter of hello in french")
          .case("c", () => "third letter of the alphabet")
          .default(() => "not implemented yet")
      ),

      el("div")(
        // conditional block:
        ifBlock(isOpen, () => "is open")
      )
    );
  },
});
