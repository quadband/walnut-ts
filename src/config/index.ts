import * as path from "path";
import * as fs from "fs";

export function findConfig(cwd: string): string {
    // We will add some search capabilities later on
    const cur = path.resolve(cwd, "./walnut.config.ts");
    return fs.existsSync(cur) ? cur : null;
}

export function createConfig(cfgPath: string): void {
    fs.writeFileSync(cfgPath, NEW_CONFIG, "utf-8");
}

const NEW_CONFIG: string = `import { Walnut } from "walnut-ts";

export type WalnutKey = "test" | "dev" | "prod" | "other";

// Set your condition however you'd like.
Walnut.setCondition("dev");

export const exampleResolver = Walnut.makeResolver<number>("uniqueLabel", ()=>{
    // Do stuff
    return 10
});
`;