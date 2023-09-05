import {
  createComponent,
  awaitBlock,
  ifBlock,
  el,
  switchBlock,
  forBlock,
  derived,
  writable,
} from "redsky2";

import { CalcComponent } from "./CalcComponent";

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

    const selectedListInput = writable("1");
    const selectedList = derived(selectedListInput, (v) => +v);

    const list1 = [
      el("div")("tutu 1"),
      el("div")("tutu 2"),
      el("div")("tutu 3"),
    ];
    const list2 = [list1[1], list1[0], list1[2]];
    const list3 = [list1[0], list1[1]];
    const list4 = [list1[2]];
    const list5 = [...list1, el("div")("tutu 4")];

    // component template
    return el("main")(
      // h1 title
      el("h1")("Calc App"),

      CalcComponent(),

      el("button").on("click", action)("do something"),

      // for block
      el("pre")(forBlock(numbers, (value) => `value: ${value}\n`)),

      // await block
      el("p")(
        awaitBlock(promise)
          .pending(() => "loading...")
          .then((value: string) => `result: ${value}`)
          .catch((error: Error) => `error: ${error.message}`)
      ),

      el("input").attr({ type: "number" }).bind(selectedListInput),

      // switch case block
      el("div")(
        switchBlock(selectedList)
          .case(1, () => list1 as any)
          .case(2, () => list2 as any)
          .case(3, () => list3 as any)
          .case(4, () => list4 as any)
          .case(5, () => list5 as any)
          .default(() => "not implemented yet")
      ),

      el("div")(
        // conditional block:
        ifBlock(
          isOpen,
          () => "if active",
          () => "else active"
        )
      )
    );
  },
});
