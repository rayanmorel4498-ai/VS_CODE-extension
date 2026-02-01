"use strict";
/**
 * Captage des événements de l'éditeur VS Code
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateEditorTracking = activateEditorTracking;
const vscode = __importStar(require("vscode"));
function activateEditorTracking(socket) {
    const disposables = [];
    /**
     * Capture les modifications du texte dans les documents ouverts
     */
    disposables.push(vscode.workspace.onDidChangeTextDocument(event => {
        const document = event.document;
        const payload = {
            type: 'editor_change',
            file: document.fileName,
            content: document.getText(),
            languageId: document.languageId,
            version: document.version,
            isDirty: document.isDirty,
            eol: document.eol === vscode.EndOfLine.LF ? 'LF' : 'CRLF',
            changes: event.contentChanges.map(change => ({
                range: {
                    startLine: change.range.start.line,
                    startCharacter: change.range.start.character,
                    endLine: change.range.end.line,
                    endCharacter: change.range.end.character
                },
                text: change.text
            }))
        };
        socket.send(payload);
    }));
    /**
     * Capture l'ouverture de fichiers
     */
    disposables.push(vscode.workspace.onDidOpenTextDocument(doc => {
        socket.send({
            type: 'file_open',
            file: doc.fileName,
            languageId: doc.languageId,
            size: doc.getText().length,
            lineCount: doc.lineCount
        });
    }));
    /**
     * Capture la fermeture de fichiers
     */
    disposables.push(vscode.workspace.onDidCloseTextDocument(doc => {
        socket.send({
            type: 'file_close',
            file: doc.fileName
        });
    }));
    /**
     * Capture les changements de curseur et sélections
     */
    disposables.push(vscode.window.onDidChangeTextEditorSelection(event => {
        const payload = {
            type: 'cursor_change',
            file: event.textEditor.document.fileName,
            selections: event.selections.map(sel => ({
                start: { line: sel.start.line, character: sel.start.character },
                end: { line: sel.end.line, character: sel.end.character },
                isReversed: sel.isReversed
            }))
        };
        socket.send(payload);
    }));
    /**
     * Capture le changement d'éditeur actif
     */
    disposables.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            let tabIndex = 0;
            const tabs = vscode.window.tabGroups.all.flatMap(g => g.tabs);
            const index = tabs.findIndex(tab => tab.input instanceof vscode.TabInputText &&
                tab.input.uri.fsPath === editor.document.fileName);
            tabIndex = index >= 0 ? index : 0;
            const payload = {
                type: 'active_editor_change',
                file: editor.document.fileName,
                languageId: editor.document.languageId,
                tabIndex
            };
            socket.send(payload);
        }
    }));
    return disposables;
}
//# sourceMappingURL=editor.js.map