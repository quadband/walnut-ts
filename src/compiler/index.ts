import { Walnut } from "../index";
import { 
    Project, 
    SourceFile, 
    Node, 
    CallExpression, 
    VariableDeclaration, 
    PropertyDeclaration, 
    ObjectLiteralExpression, 
    PropertyAssignment,
    ImportDeclaration,
    JsxElement,
    Identifier,
    forEachStructureChild,
    JsxElementStructure
} from "ts-morph";

let __project: Project;

export function getProject(): Project {
    if(!__project) __project = new Project();
    return __project;
}

export function transformer(code: string, id: string): string {
    const src: SourceFile = getProject().createSourceFile(id, code, { overwrite: true});
    
    const toolDecs = getToolDecs(src);
    if(!toolDecs.length) return;
    
    toolDecs.forEach(dec => runTool(dec, src));
    toolDecs.forEach(dec => removeDec(dec));

    return src.getText();
}

function removeDec(dec: ImportDeclaration): void {
    dec.remove();
}

function getToolDecs(src: SourceFile): ImportDeclaration[] {
    const toolDecs = [];
    for(const dec of src.getImportDeclarations()){
        if(checkIfSelf(dec.getModuleSpecifierValue())) toolDecs.push(dec);
    }
    return toolDecs;
}

function runTool(dec: ImportDeclaration, src: SourceFile) {
    for(const namedImport of dec.getNamedImports()){
        const nameNode = namedImport.getNameNode();
        const name = nameNode.getText();

        if(name === "$Walnut") runJsxTool(nameNode, name, src);
        else runCallExpressionTool(nameNode, name, src);
    }
}

function runJsxTool(nameNode: Identifier, name: string, src: SourceFile){
    const refs = getReferenceNodes(nameNode, src);

    const jsxElements: Set<JsxElement> = new Set();

    for(const ref of refs){
        const jsxElement = extractJsxElement(ref);
        if(!jsxElements.has(jsxElement)) jsxElements.add(jsxElement);
    }

    jsxElements.forEach((jsxElement)=>{
        const jsxStruct = jsxElement.getStructure();

        const key = getJsxStructKey(jsxStruct);
        if((Array.isArray(key) && key.includes(Walnut.condition)) || key == Walnut.condition) 
            jsxElement.replaceWithText(jsxStruct.bodyText);
        else jsxElement.replaceWithText("");
    });

}

function runCallExpressionTool(nameNode: Identifier, name: string, src: SourceFile ){
    const refs = getReferenceNodes(nameNode, src);

    for(const ref of refs){
        const callExp = extractCallExpression(ref);
        const varDec = extractVariableOrPropertyDeclaration(ref);

        const args = callExp.getArguments();

        if(name == "$Val" || name == "$PVal") runVal(varDec, args);
        else if(name == "$Resolve") runResolve(varDec, args, src);
    }
}

function runVal(varDec: VariableDeclaration | PropertyDeclaration, args: Node[]){
    if(!Node.isObjectLiteralExpression(args[0])) return;

    const opts = args[0] as ObjectLiteralExpression;

    let condition = Walnut.condition;

    let assignProp;

    if(typeof condition === "string") assignProp = tryGetStringProp(condition, opts);
    else assignProp = opts.getProperty(condition) as PropertyAssignment;

    if(!assignProp){
        // Need to fallback
        const props = opts.getProperties();
        // For now we explicitly fall back to the first prop.
        if(props.length) assignProp = props[0];
    }

    // Probably need to throw a warning or maybe even error, here.
    if(!assignProp) varDec.setInitializer("undefined");
    else {
        const assignVal = assignProp.getInitializer();
        varDec.setInitializer(assignVal.getText());
    }
}

function runResolve(varDec: VariableDeclaration | PropertyDeclaration, args: Node[], src: SourceFile) {
    if(!Node.isIdentifier(args[0])) return;
    const node = args[0];

    const resolverRefs = node.findReferencesAsNodes()
        .filter(n => Node.isVariableDeclaration(n.getParentOrThrow()));
    
    // We need to remove these later on.
    const importRefs = node.findReferencesAsNodes()
        .filter(n => n.getSourceFile() === src
            && Node.isImportSpecifier(n.getParentOrThrow()));

    const res = handleResolver(resolverRefs);

    varDec.setInitializer(res);

    importRefs.forEach((ir)=>{
        const importDec = extractImportDeclaration(ir);
        removeDec(importDec);
    });
}

function handleResolver(refs: Node[]): string {
    let res;

    // There really shouldn't be more than one ref, but you never know.
    for(const ref of refs){
        const vDec = ref.getParent();
        if(!Node.isVariableDeclaration(vDec)) continue;

        const vInit = vDec.getInitializer();
        const callExp = extractCallExpression(vInit);

        const args = callExp.getArguments();

        const label = args[0];
        if(!Node.isStringLiteral(label)) continue;

        const fn = args[1];
        if(!Node.isFunctionLikeDeclaration(fn)) continue;

        const labelText: string = label.getLiteralValue();
        if(!Walnut.checkResolver(labelText)) continue;

        res = Walnut.runResolver(labelText);
    }

    const tor = typeof res;    
    switch(tor){
        case "string":
            res = `"${res}"`;
            break;
        case "number":
        case "bigint":
        case "boolean":
            res = String(res);
            break;
        case "object":
            res = JSON.stringify(res);
            break;
        case "function":
            res = res.toString();
    }

    if(typeof res != "string") {
        // WHY????
        try{
            String(res);
        } catch {
            // You get nothing.
            res = "undefined";
        }
    }

    return res;
}

function getJsxStructKey(jsxStruct: JsxElementStructure): string | string[] {
    let key;
    if(jsxStruct.attributes && Array.isArray(jsxStruct.attributes)){
        jsxStruct.attributes.forEach((att)=>{
            if(att.kind == 20 && att.name == "key"){
                key = att.initializer;
            } 
        })
    }
    if(!key) return null;
    key = checkAndStripBraces(key);
    key = checkAndConvertArrayInitializer(key);
    if(Array.isArray(key)) return key;
    else return sanitizeStringInitializer(key);
}

function checkAndConvertArrayInitializer(s: string): string | string[] {
    const fc = s.charAt(0);
    if(fc == "[") {
        const arr = [];
        let str = s.substring(1, s.length-1);
        const sArr = str.split(",").map((sA)=>{
            return sanitizeStringInitializer(sA.trim());
        });
        return sArr;
    } 
    return s;
}

function sanitizeStringInitializer(s: string): string {
    const fc = s.charAt(0);
    if(fc == '"' || fc == "'" || fc == "`") return s.substring(1, s.length-1);
    return s;
}

function checkAndStripBraces(s: string): string {
    const fc = s.charAt(0);
    if(fc == "{") return s.substring(1, s.length-1).trim();
    return s;
}

// This is done because TypeScript is looking for the exact expression
function tryGetStringProp(c: string, opts: ObjectLiteralExpression): PropertyAssignment {
    let prop;

    prop = opts.getProperty(`"${c}"`) as PropertyAssignment;
    if(prop) return prop;

    prop = opts.getProperty(`'${c}'`) as PropertyAssignment;
    if(prop) return prop;

    prop = opts.getProperty("`" + `${c}` + "`") as PropertyAssignment;
    if(prop) return prop;

    prop = opts.getProperty(c) as PropertyAssignment;
    if(prop) return prop;
}

// TODO: This needs to be made better
export function checkIfSelf(id: string): boolean {
    return id.includes("walnut-ts");
}

export function checkIfConfig(id: string): boolean {
    return id.includes("walnut.config");
}

// Helpers
// Should probably move this
function getReferenceNodes(nameNode: Identifier, src: SourceFile) {
    return nameNode.findReferencesAsNodes()
            .filter(n => n.getSourceFile() === src
            && !Node.isImportSpecifier(n.getParentOrThrow()));
}

export function extractCallExpression(node: Node): CallExpression {
	if(Node.isCallExpression(node)) return node;
	return extractCallExpression(node.getParentOrThrow());
}

export function extractVariableOrPropertyDeclaration(node: Node): VariableDeclaration | PropertyDeclaration {
	if(Node.isVariableDeclaration(node) || Node.isPropertyDeclaration(node)) return node;
	return extractVariableOrPropertyDeclaration(node.getParentOrThrow());
}

export function extractImportDeclaration(node: Node): ImportDeclaration {
    if(Node.isImportDeclaration(node)) return node;
    return extractImportDeclaration(node.getParentOrThrow());
}

export function extractJsxElement(node: Node): JsxElement {
    if(Node.isJsxElement(node)) return node;
    return extractJsxElement(node.getParentOrThrow());
}
