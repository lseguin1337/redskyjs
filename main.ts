import { CalcComponent } from "./CalcComponent";

const calcComponent = CalcComponent(
  {}, // empty props
  {
    target: document.body, // component injection
  }
);

console.log("calc", calcComponent);
