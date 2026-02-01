"use strict";
/**
 * Captage des événements de diagnostics (erreurs, avertissements)
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
exports.activateDiagnosticsTracking = activateDiagnosticsTracking;
const vscode = __importStar(require("vscode"));
function activateDiagnosticsTracking(socket) {
    const disposables = [];
    /**
     * Capture les changements de diagnostics
     */
    disposables.push(vscode.languages.onDidChangeDiagnostics(event => {
        for (const uri of event.uris) {
            const diagnostics = vscode.languages.getDiagnostics(uri);
            if (diagnostics.length > 0) {
                const payload = {
                    type: 'diagnostic_change',
                    file: uri.fsPath,
                    diagnostics: diagnostics.map(diag => ({
                        range: {
                            startLine: diag.range.start.line,
                            startCharacter: diag.range.start.character,
                            endLine: diag.range.end.line,
                            endCharacter: diag.range.end.character
                        },
                        message: diag.message,
                        severity: getSeverityString(diag.severity),
                        code: typeof diag.code === 'string' ? diag.code : diag.code?.value,
                        source: diag.source
                    }))
                };
                socket.send(payload);
            }
            else {
                // Envoyer un événement vide si tous les diagnostics sont résolus
                const payload = {
                    type: 'diagnostic_change',
                    file: uri.fsPath,
                    diagnostics: []
                };
                socket.send(payload);
            }
        }
    }));
    /**
     * Envoyer les diagnostics existants à la connexion
     */
    setTimeout(() => {
        for (const uri of vscode.workspace.textDocuments.map(doc => doc.uri)) {
            const diagnostics = vscode.languages.getDiagnostics(uri);
            if (diagnostics.length > 0) {
                const payload = {
                    type: 'diagnostic_change',
                    file: uri.fsPath,
                    diagnostics: diagnostics.map(diag => ({
                        range: {
                            startLine: diag.range.start.line,
                            startCharacter: diag.range.start.character,
                            endLine: diag.range.end.line,
                            endCharacter: diag.range.end.character
                        },
                        message: diag.message,
                        severity: getSeverityString(diag.severity),
                        code: typeof diag.code === 'string' ? diag.code : diag.code?.value,
                        source: diag.source
                    }))
                };
                socket.send(payload);
            }
        }
    }, 1000);
    return disposables;
}
/**
 * Convertit la sévérité VS Code en string
 */
function getSeverityString(severity) {
    switch (severity) {
        case vscode.DiagnosticSeverity.Error:
            return 'error';
        case vscode.DiagnosticSeverity.Warning:
            return 'warning';
        case vscode.DiagnosticSeverity.Information:
            return 'information';
        case vscode.DiagnosticSeverity.Hint:
            return 'hint';
        default:
            return 'information';
    }
}
//# sourceMappingURL=diagnostics.js.map