/**
 * Captage des événements du terminal VS Code
 */

import * as vscode from 'vscode';
import { IEngineSocket, TerminalOpenEvent, TerminalCloseEvent } from '../types';

export function activateTerminalTracking(socket: IEngineSocket, enabled: boolean = true): vscode.Disposable[] {
  if (!enabled) {
    return [];
  }

  const disposables: vscode.Disposable[] = [];
  const terminalOutputWriters = new Map<vscode.Terminal, any>();

  /**
   * Capture l'ouverture de terminaux
   */
  disposables.push(
    vscode.window.onDidOpenTerminal(term => {
      const payload: TerminalOpenEvent = {
        type: 'terminal_open',
        name: term.name,
        shellPath: (term.creationOptions as any).shellPath as string | undefined,
        cwd: (term.creationOptions as any).cwd ? 
          (typeof (term.creationOptions as any).cwd === 'string' ? (term.creationOptions as any).cwd : ((term.creationOptions as any).cwd as any).fsPath)
          : undefined
      };

      socket.send(payload);

      terminalOutputWriters.set(term, null);
    })
  );

  /**
   * Capture la fermeture de terminaux
   */
  disposables.push(
    vscode.window.onDidCloseTerminal(term => {
      const payload: TerminalCloseEvent = {
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
    })
  );

  /**
   * Capture le changement du terminal actif
   */
  disposables.push(
    vscode.window.onDidChangeActiveTerminal(term => {
      if (term) {
        socket.send({
          type: 'terminal_active',
          name: term.name,
          timestamp: Date.now()
        } as any);
      }
    })
  );

  return disposables;
}
