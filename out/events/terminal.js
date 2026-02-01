"use strict";
/**
 * Captage des événements du terminal VS Code
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
exports.activateTerminalTracking = activateTerminalTracking;
const vscode = __importStar(require("vscode"));
function activateTerminalTracking(socket, enabled = true) {
    if (!enabled) {
        return [];
    }
    const disposables = [];
    const terminalOutputWriters = new Map();
    /**
     * Capture l'ouverture de terminaux
     */
    disposables.push(vscode.window.onDidOpenTerminal(term => {
        const payload = {
            type: 'terminal_open',
            name: term.name,
            shellPath: term.creationOptions.shellPath,
            cwd: term.creationOptions.cwd ?
                (typeof term.creationOptions.cwd === 'string' ? term.creationOptions.cwd : term.creationOptions.cwd.fsPath)
                : undefined
        };
        socket.send(payload);
        terminalOutputWriters.set(term, null);
    }));
    /**
     * Capture la fermeture de terminaux
     */
    disposables.push(vscode.window.onDidCloseTerminal(term => {
        const payload = {
            type: 'terminal_close',
            name: term.name
        };
        socket.send(payload);
        // Nettoyer le writer
        const writer = terminalOutputWriters.get(term);
        if (writer) {
            writer.dispose();
            terminalOutputWriters.delete(term);
        }
    }));
    /**
     * Capture le changement du terminal actif
     */
    disposables.push(vscode.window.onDidChangeActiveTerminal(term => {
        if (term) {
            socket.send({
                type: 'terminal_active',
                name: term.name,
                timestamp: Date.now()
            });
        }
    }));
    return disposables;
}
//# sourceMappingURL=terminal.js.map