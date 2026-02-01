"use strict";
/**
 * Captage des événements de gestion de fichiers
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
exports.activateFileTracking = activateFileTracking;
const vscode = __importStar(require("vscode"));
function activateFileTracking(socket) {
    const disposables = [];
    /**
     * Capture la sauvegarde de fichiers
     */
    disposables.push(vscode.workspace.onDidSaveTextDocument(doc => {
        const payload = {
            type: 'file_save',
            file: doc.fileName,
            languageId: doc.languageId,
            lineCount: doc.lineCount
        };
        socket.send(payload);
    }));
    /**
     * Capture la création de fichiers (via FileSystemWatcher)
     */
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*', false, true, false);
    disposables.push(fileWatcher.onDidCreate(uri => {
        socket.send({
            type: 'file_create',
            file: uri.fsPath,
            folder: vscode.workspace.getWorkspaceFolder(uri)?.name
        });
    }));
    /**
     * Capture la suppression de fichiers
     */
    disposables.push(fileWatcher.onDidDelete(uri => {
        socket.send({
            type: 'file_delete',
            file: uri.fsPath
        });
    }));
    /**
     * Capture le renommage de fichiers
     */
    const renameWatcher = vscode.workspace.createFileSystemWatcher('**/*', true, true, false);
    const createdFiles = new Map();
    const threshold = 100; // ms
    disposables.push(renameWatcher.onDidCreate(uri => {
        const timestamp = Date.now();
        createdFiles.set(uri.fsPath, timestamp);
        // Nettoyer les anciens fichiers
        for (const [file, time] of createdFiles.entries()) {
            if (timestamp - time > 5000) {
                createdFiles.delete(file);
            }
        }
    }));
    disposables.push(renameWatcher.onDidDelete(uri => {
        const now = Date.now();
        for (const [createdFile, createdTime] of createdFiles.entries()) {
            if (now - createdTime < threshold) {
                socket.send({
                    type: 'file_rename',
                    oldFile: uri.fsPath,
                    newFile: createdFile
                });
                createdFiles.delete(createdFile);
                return;
            }
        }
    }));
    disposables.push(fileWatcher, renameWatcher);
    return disposables;
}
//# sourceMappingURL=files.js.map