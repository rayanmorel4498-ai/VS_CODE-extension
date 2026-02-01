import * as vscode from 'vscode';
import { EngineSocket } from './transport/socket';
import { activateEditorTracking } from './events/editor';
import { activateFileTracking } from './events/files';
import { activateTerminalTracking } from './events/terminal';
import { activateDiagnosticsTracking } from './events/diagnostics';
import { CommandExecutor } from './commands/executor';
import { AICommand, ExtensionConfig } from './types';

let socket: EngineSocket | null = null;
let commandExecutor: CommandExecutor | null = null;
let outputChannel: vscode.OutputChannel | null = null;

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('CodeIA');

  const config = getConfig();

  socket = new EngineSocket(config.serverUrl);
  commandExecutor = new CommandExecutor();

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

export function deactivate() {
  log('Deactivating CodeIA extension...');
  socket?.disconnect();
  outputChannel?.dispose();
}

function getConfig(): ExtensionConfig {
  const vsConfig = vscode.workspace.getConfiguration('codeIA');
  return {
    serverUrl: vsConfig.get<string>('serverUrl') || 'ws://localhost:3000',
    enabled: vsConfig.get<boolean>('enabled') ?? false,
    captureTerminal: vsConfig.get<boolean>('captureTerminal') ?? true,
    logLevel: (vsConfig.get<string>('logLevel') as any) || 'info',
  };
}

function startTracking() {
  if (!socket) return;

  activateEditorTracking({
    send: (event: any) => {
      log(`Editor event: ${event.type}`);
      socket?.send(event);
    }
  } as any);

  activateFileTracking({
    send: (event: any) => {
      log(`File event: ${event.type}`);
      socket?.send(event);
    }
  } as any);

  activateTerminalTracking({
    send: (event: any) => {
      log(`Terminal event: ${event.type}`);
      socket?.send(event);
    }
  } as any);

  activateDiagnosticsTracking({
    send: (event: any) => {
      log(`Diagnostic event: ${event.type}`);
      socket?.send(event);
    }
  } as any);

  socket.send({
    type: 'connection',
    status: 'connected',
    workspace: vscode.workspace.rootPath || 'unknown',
    vscodeVersion: vscode.version,
    timestamp: Date.now(),
  });

  log('Tracking started');
}

async function handleServerMessage(message: unknown) {
  const msg = message as any;

  if (msg.type === 'command') {
    log(`Received command: ${msg.command}`);
    try {
      if (!commandExecutor) {
        throw new Error('CommandExecutor not initialized');
      }
      const response = await commandExecutor.execute(msg as AICommand);
      socket?.send(response);
      log(`Command executed: ${msg.command} (id: ${response.id})`);
    } catch (err) {
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
  } else if (msg.type === 'ping') {
    socket?.send({ type: 'ack', success: true, timestamp: Date.now() } as any);
  }
}

function log(message: string, level: 'info' | 'error' | 'warn' = 'info') {
  if (!outputChannel) return;
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  outputChannel.appendLine(`${prefix} ${message}`);
  if (level === 'error') {
    console.error(message);
  }
}
