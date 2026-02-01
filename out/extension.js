"use strict";
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const socket_1 = require("./transport/socket");
const editor_1 = require("./events/editor");
const files_1 = require("./events/files");
const terminal_1 = require("./events/terminal");
const diagnostics_1 = require("./events/diagnostics");
const executor_1 = require("./commands/executor");
let socket = null;
let commandExecutor = null;
let outputChannel = null;
async function activate(context) {
    outputChannel = vscode.window.createOutputChannel('CodeIA');
    const config = getConfig();
    socket = new socket_1.EngineSocket(config.serverUrl);
    commandExecutor = new executor_1.CommandExecutor();
    socket.onMessage(handleServerMessage);
    vscode.commands.registerCommand('codeIA.start', async () => {
        log('Starting CodeIA extension...');
        socket?.connect();
        startTracking();
        vscode.window.showInformationMessage('CodeIA started');
    });
    vscode.commands.registerCommand('codeIA.stop', async () => {
        log('Stopping CodeIA extension...');
        socket?.disconnect();
        vscode.window.showInformationMessage('CodeIA stopped');
    });
    vscode.commands.registerCommand('codeIA.status', async () => {
        const isConnected = socket?.isConnected() ?? false;
        const status = isConnected ? 'connected' : 'disconnected';
        const msg = `CodeIA is ${status}`;
        log(msg);
        vscode.window.showInformationMessage(msg);
    });
    if (config.enabled) {
        socket.connect();
        startTracking();
        log('CodeIA activated and auto-connected');
    }
    context.subscriptions.push(outputChannel);
}
function deactivate() {
    log('Deactivating CodeIA extension...');
    socket?.disconnect();
    outputChannel?.dispose();
}
function getConfig() {
    const vsConfig = vscode.workspace.getConfiguration('codeIA');
    return {
        serverUrl: vsConfig.get('serverUrl') || 'ws://localhost:3000',
        enabled: vsConfig.get('enabled') ?? false,
        captureTerminal: vsConfig.get('captureTerminal') ?? true,
        logLevel: vsConfig.get('logLevel') || 'info',
    };
}
function startTracking() {
    if (!socket)
        return;
    (0, editor_1.activateEditorTracking)({
        send: (event) => {
            log(`Editor event: ${event.type}`);
            socket?.send(event);
        }
    });
    (0, files_1.activateFileTracking)({
        send: (event) => {
            log(`File event: ${event.type}`);
            socket?.send(event);
        }
    });
    (0, terminal_1.activateTerminalTracking)({
        send: (event) => {
            log(`Terminal event: ${event.type}`);
            socket?.send(event);
        }
    });
    (0, diagnostics_1.activateDiagnosticsTracking)({
        send: (event) => {
            log(`Diagnostic event: ${event.type}`);
            socket?.send(event);
        }
    });
    socket.send({
        type: 'connection',
        status: 'connected',
        workspace: vscode.workspace.rootPath || 'unknown',
        vscodeVersion: vscode.version,
        timestamp: Date.now(),
    });
    log('Tracking started');
}
async function handleServerMessage(message) {
    const msg = message;
    if (msg.type === 'command') {
        log(`Received command: ${msg.command}`);
        try {
            if (!commandExecutor) {
                throw new Error('CommandExecutor not initialized');
            }
            const response = await commandExecutor.execute(msg);
            socket?.send(response);
            log(`Command executed: ${msg.command} (id: ${response.id})`);
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            log(`Error executing command: ${error}`, 'error');
            socket?.send({
                type: 'command_response',
                id: msg.id || 'unknown',
                success: false,
                error: error,
                timestamp: Date.now(),
            });
        }
    }
    else if (msg.type === 'ping') {
        socket?.send({ type: 'ack', success: true, timestamp: Date.now() });
    }
}
function log(message, level = 'info') {
    if (!outputChannel)
        return;
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    outputChannel.appendLine(`${prefix} ${message}`);
    if (level === 'error') {
        console.error(message);
    }
}
//# sourceMappingURL=extension.js.map