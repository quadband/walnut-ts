import * as path from "path";
import * as fs from "fs";

import { consola } from "consola";

import { findConfig, createConfig } from "../config";

export function runInit(): void {
    const cwd = process.cwd();
    let cfgPath = findConfig(cwd);

    if(!cfgPath) {
        cfgPath = path.resolve(cwd, "./walnut.config.ts");
        createConfig(cfgPath);
    }



}