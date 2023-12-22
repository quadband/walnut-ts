# walnut-ts
### A type safe pre-compiler tool for those who love TypeScript.

## Quick and dirty:

```typescript
// walnut.config.ts
import { Walnut } from "walnut-ts";

export type WalnutKey = "test" | "dev" | "prod" | "misc";

Walnut.setCondition("dev");

export const exampleResolver = Walnut.makeResolver<string>("uniqueLabel", ()=>{
    return "Here is the resolved value!";
});

// src/index.tsx
import { $Val, $PVal, $Resolve } from "walnut-ts";
import { $Walnut } from "walnut-ts/jsx";
import { exampleResolver } from "../walnut.config";

const someValue = $Val<string>({
  "test": "A test value.",
  "dev": "A dev value.",
  "prod": "A prod value.",
  "misc": "A misc value."
});

const somePartialVal = $PVal<Function>({
  test: ()=>{ console.log("Returned values can be functions, too!"); } 
});

somePartialVal();

const resolvedVal = $Resolve(exampleResolver);

export function App(){
    return(
        <>
            <div>
                <h1>{someValue}</h1>
                <$Walnut key="dev">
                    <p>
                        I will show up for Dev!
                    </p>
                </$Walnut>
                <$Walnut key="test">
                    <p>
                        I will show up for Test!
                    </p>
                </$Walnut>
                <$Walnut key={["dev", "test"]}>
                    <p>
                        I will show up for both Dev and Test!
                    </p>
                </$Walnut>
            </div>
        <>
    )
}
```

This will pre-compile down to the following:

```typescript
const someValue = "A dev value.";

const somePartialVal = () => { 
    console.log("Returned values can be functions, too!");
} 

somePartialVal();

const resolvedVal = "Here is the resolved value!";

export function App(){
    return(
        <>
            <div>
                <h1>{someValue}</h1>
                <p>
                    I will show up for Dev!
                </p>
                <p>
                    I will show up for both Dev and Test!
                </p>
            </div>
        <>
    )
}
```

## Usage:

`npm install --save-dev walnut-ts`

And then run

`npx wts`

This will instantiate a new walnut.config.ts file.

Currently the best way to use the transforms is through the Vite plugin. You must also perform an ambient import of walnut.config.
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import walnut from 'walnut-ts/vite-plugin';

import "./walnut.config";

export default defineConfig({
  plugins: [solid(), walnut()],
});
```
 
Changing the values of WalnutKey in walnut.config will change the allowable key values.
```typescript
// walnut.config.ts
import { Walnut } from "walnut-ts";

export type WalnutKey = "test" | "dev" | "prod" | "whatevs";

Walnut.setCondition("whatevs");
```

The $PVal function currently automatically has a fallback to the first listed value in the given object.

Better documentation forthcoming.