import { parse as babelParse } from "@babel/parser";
import ts from "typescript";
export function parseImportsTS(sourceText, filePath) {
    const sf = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
    const imports = [];
    function visit(node) {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
            imports.push(node.moduleSpecifier.text);
        }
        if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            imports.push(node.moduleSpecifier.text);
        }
        if (ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === "require" &&
            node.arguments.length === 1 &&
            ts.isStringLiteral(node.arguments[0])) {
            imports.push(node.arguments[0].text);
        }
        ts.forEachChild(node, visit);
    }
    visit(sf);
    return imports;
}
export function parseImportsJS(sourceText) {
    const ast = babelParse(sourceText, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript", "decorators-legacy"]
    });
    const imports = [];
    const stack = [ast];
    while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== "object")
            continue;
        if (node.type === "ImportDeclaration" && node.source?.value) {
            imports.push(String(node.source.value));
        }
        if (node.type === "ExportNamedDeclaration" && node.source?.value) {
            imports.push(String(node.source.value));
        }
        if (node.type === "ExportAllDeclaration" && node.source?.value) {
            imports.push(String(node.source.value));
        }
        if (node.type === "CallExpression" &&
            node.callee?.type === "Identifier" &&
            node.callee.name === "require" &&
            node.arguments?.length === 1 &&
            node.arguments[0]?.type === "StringLiteral") {
            imports.push(String(node.arguments[0].value));
        }
        for (const k of Object.keys(node)) {
            const v = node[k];
            if (Array.isArray(v))
                for (const child of v)
                    stack.push(child);
            else if (v && typeof v === "object")
                stack.push(v);
        }
    }
    return imports;
}
