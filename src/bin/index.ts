#!/usr/bin/env node

import { runInit } from "../init";

// TODO: Actually have options some day. For right now we do nothing with the args
const [,, ...args] = process.argv;

function runCLI(): void {
    runInit();
}

runCLI();