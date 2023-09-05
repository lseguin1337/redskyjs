import { createComponent, derived, writable, ifBlock, h } from "redsky2";

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
    const isGreater10 = derived(result, (value) => value > 10);

    const reset = () => {
      left.value = "0";
      right.value = "0";
    };

    return (
      <div className={derived(result, (v) => isNaN(v) ? 'isNaN' : '')}>
        <input bind={left}></input>
        +
        <input bind={right}></input>
        = {result}
        <button onClick={reset}>reset</button>
        {ifBlock(isGreater10, () => (<span>greater 10</span>)) as any}
      </div>
    );
  },
});

CalcComponent({}, { target: document.body });