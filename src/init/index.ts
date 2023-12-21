import * as path from "path";
import * as fs from "fs";

import { consola } from "consola";

import { findConfig, createConfig, verifyConfig } from "../config";

export function runInit(): void {
    consola.start("Initializing Walnut-TS.");
    const cwd = process.cwd();
    let cfgPath = findConfig(cwd);

    if(!cfgPath) {
        consola.warn("No Config found.");
        cfgPath = path.resolve(cwd, "./walnut.config.ts");
        createConfig(cfgPath);
    }

    verifyConfig(cfgPath);

    consola.success("Done!");

}