import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { consola } from "consola";
import { getProject } from "../compiler";

import { SourceFile, SourceFileStructure, Structure, forEachStructureChild } from "ts-morph";

export function verifyWalnutConfig(cfgPath: string){
    const cfgSrc: SourceFile = getProject().addSourceFileAtPath(cfgPath);
    const keyExp = lookForWalnutKeyExport(cfgSrc);
    modifyInternalWalnutKey(keyExp, cfgSrc);
}

function lookForWalnutKeyExport(cfgSrc: SourceFile): boolean {
    consola.info('Checking for WalnutKey export.');
    let found: boolean = false;

    const srcStruct: SourceFileStructure = cfgSrc.getStructure();

    forEachStructureChild(srcStruct, child => {
        if(!Structure.isTypeAlias(child)) return;
        if(child.name == "WalnutKey" && child.isExported){
            found = true;
            return;
        }
    });

    return found;
}

// This is probably super naughty.
function modifyInternalWalnutKey(keyExp: boolean, cfgSrc: SourceFile): void {
    const __filename = fileURLToPath(import.meta.url);
    const curDir = path.dirname(__filename);
    const coreDir = path.resolve(curDir, "./core");

    // Assign the paths for the d.ts and d.mts files
    const wfkTS = path.resolve(coreDir, "./walnut-key.d.ts");
    const wfkMTS = path.resolve(coreDir, "./walnut-key.d.mts");

    // Make sure nothing has caught on fire at some point
    if(fs.existsSync(wfkTS) && fs.existsSync(wfkMTS)){
        let contentToWrite: string;
        if(!keyExp) contentToWrite = DEFAULT_WALNUT_KEY_FILE;
        else contentToWrite = createImportString(coreDir, cfgSrc);

        consola.info("Writing internals.");
        fs.writeFileSync(wfkTS, contentToWrite, "utf-8");
        fs.writeFileSync(wfkMTS, contentToWrite, "utf-8");
    } else {
        consola.error(new Error("Unable to locate internal WalnutKey files!"));
    }
}

function createImportString(coreDir: string, cfgSrc: SourceFile): string {
    let rel = path.relative(coreDir, cfgSrc.getFilePath());
    rel = rel.substring(0, rel.length - 3);

    const importString = `import type { WalnutKey } from "${rel}";
    
export type { WalnutKey };`;

    return importString;
}

const DEFAULT_WALNUT_KEY_FILE: string = `type WalnutKey = "dev" | "test" | "prod";

export type { WalnutKey };`;