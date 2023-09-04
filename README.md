# RedSky JS README

Welcome to RedSky JS, a declarative approach to building web applications that makes your code clean, easy to read, and incredibly dynamic. Dive right into the details below.

## Introduction

RedSky JS brings a fresh perspective to modern web development, focusing on easy component creation, powerful reactivity, and intuitive templating structures. No more overwhelming class structures or confusing component lifecycles.

## Installation

TBD

## Usage

### Components

To create a component, simply use the `createComponent` method:

```typescript
import { createComponent } from "./lib/component";

const MyComponent = createComponent({
  setup() {
    return el("div")("Hello World");
  },
});
```

### Templating

#### Element Creation

Use the `el` function to create a new DOM element:

```typescript
el("tagname")(...children);
```

For adding attributes:

```typescript
el("a").class({ active: reactiveActiveState }).attr({ href: reactiveHref })(
  ...children
);
```

#### Control Structures

RedSky JS provides out-of-the-box control structures for handling promises, conditional rendering, and switch-case like logic:

- _Await Block_ - Handles the different states of a Promise:

```typescript
awaitBlock(promise)
  .pending(() => "loading...")
  .then((value) => `result: ${value}`)
  .catch((error) => `error: ${error.message}`);
```

- _If Block_ - Conditional rendering:

```typescript
ifBlock(condition, () => "Rendered when true");
```

- _Switch Block_ - A declarative way to handle multiple cases:

```typescript
switchBlock(variable)
  .case(true, () => "is true")
  .case(false, () => "is false")
  .default(() => "something else");
```

### Reactivity

To create a reactive value, utilize the `writable` function. This will give you a reactive variable that can be updated and watched:

```typescript
const count = writable(0);
```

To change the value:

```typescript
count.value = 10;
```

## Bootstrap the App

Once your components are set up, you can bootstrap the app using:

```typescript
MyComponent(
  {}, // props
  { target: document.body } // target destination
);
```

## Contributing

Want to make RedSky JS even better? We're open to contributions! Check out our guidelines TBD.

## License

TBD

With RedSky JS, crafting modern, efficient, and reactive web applications has never been easier. Dive in and enjoy the flexibility it offers!
