/**
 * Captage des événements de diagnostics (erreurs, avertissements)
 */

import * as vscode from 'vscode';
import { IEngineSocket, DiagnosticEvent } from '../types';

export function activateDiagnosticsTracking(socket: IEngineSocket): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  /**
   * Capture les changements de diagnostics
   */
  disposables.push(
    vscode.languages.onDidChangeDiagnostics(event => {
      for (const uri of event.uris) {
        const diagnostics = vscode.languages.getDiagnostics(uri);
        
        if (diagnostics.length > 0) {
          const payload: DiagnosticEvent = {
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
              code: typeof diag.code === 'string' ? diag.code : (diag.code as any)?.value,
              source: diag.source
            }))
          };

          socket.send(payload);
        } else {
          // Envoyer un événement vide si tous les diagnostics sont résolus
          const payload: DiagnosticEvent = {
            type: 'diagnostic_change',
            file: uri.fsPath,
            diagnostics: []
          };

          socket.send(payload);
        }
      }
    })
  );

  /**
   * Envoyer les diagnostics existants à la connexion
   */
  setTimeout(() => {
    for (const uri of vscode.workspace.textDocuments.map(doc => doc.uri)) {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      
      if (diagnostics.length > 0) {
        const payload: DiagnosticEvent = {
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
            code: typeof diag.code === 'string' ? diag.code : (diag.code as any)?.value,
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
function getSeverityString(severity: vscode.DiagnosticSeverity | undefined): 'error' | 'warning' | 'information' | 'hint' {
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
