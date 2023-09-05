import { createComponent, derived, writable, ifBlock, switchBlock, h, useProp } from "redsky2";

export const ChildComponent = createComponent({
  style: [
    "span { color: red; }"
  ],
  setup() {
    const value = useProp<number>("myValue");
    return (<span>the value is: {value}</span>);
  }
});

export const CalcComponent = createComponent({
  style: [
    "div { display: flex; padding: 5px; color: #fff; }",
    "div.isNaN { background-color: red; }",
    "input, button { margin-right: 5px; margin-left: 5px; }",
  ],
  setup() {
    const left = writable("0");
    const right = writable("0");
    const result = derived([left, right], ([a, b]) => +a + +b);
    const isGreaterTo10 = derived(result, (value) => value > 10);

    const reset = () => {
      left.value = "0";
      right.value = "0";
    };

    return (
      <div class={{ isNaN: derived(result, isNaN) }}>
        <input bind={left}></input>
        +
        <input bind={right}></input>
        = {result}
        <button onClick={reset}>reset</button>
        {ifBlock(isGreaterTo10, () => (<div>{ChildComponent({ myValue: result })}</div>))}
        <div>
          {switchBlock(result)
            .case(1, () => "woooow")
            .case(2, () => (<button onClick={() => alert('hello')}>hello</button>))
            .case(3, () => "Yopi")
            .case(4, () => "toto")
            .case(10, () => "blablabalal")
            .default(() => "not implemented yet")}
        </div>
      </div>
    );
  },
});