import { createComponent, derived, writable, ifBlock, switchBlock, h, Props } from "redsky2";

export const ChildComponent = createComponent({
  style: [
    "span { color: red; }"
  ],
  setup({ myValue }: Props<{ myValue: number }>) {
    return (<span>the value is: {myValue}</span>);
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

    const reset = () => {
      left.value = "0";
      right.value = "0";
    };

    return (
      <div class={{ isNaN: result.map(isNaN) }}>
        <input bind={left} type="number"></input>
        +
        <input bind={right} type="number"></input>
        = {result}
        <button onClick={reset}>reset</button>
        {ifBlock(result.map((v) => v > 10), () => (
          <div>{ChildComponent({ myValue: result })}</div>
        ))}
        <div>
          {switchBlock(result)
            .case(1, () => "woooow")
            .case(2, () => (
              <button onClick={() => alert('hello')}>hello</button>
            ))
            .case(3, () => "Yopi")
            .case(4, () => "toto")
            .case(10, () => "blablabalal")
            .default(() => "not implemented yet")}
        </div>
      </div>
    );
  },
});