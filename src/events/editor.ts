/**
 * Captage des événements de l'éditeur VS Code
 */

import * as vscode from 'vscode';
import { IEngineSocket, EditorChangeEvent, CursorChangeEvent, ActiveEditorChangeEvent } from '../types';

export function activateEditorTracking(socket: IEngineSocket): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  /**
   * Capture les modifications du texte dans les documents ouverts
   */
  disposables.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      const document = event.document;

      const payload: EditorChangeEvent = {
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
    })
  );

  /**
   * Capture l'ouverture de fichiers
   */
  disposables.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
      socket.send({
        type: 'file_open',
        file: doc.fileName,
        languageId: doc.languageId,
        size: doc.getText().length,
        lineCount: doc.lineCount
      });
    })
  );

  /**
   * Capture la fermeture de fichiers
   */
  disposables.push(
    vscode.workspace.onDidCloseTextDocument(doc => {
      socket.send({
        type: 'file_close',
        file: doc.fileName
      });
    })
  );

  /**
   * Capture les changements de curseur et sélections
   */
  disposables.push(
    vscode.window.onDidChangeTextEditorSelection(event => {
      const payload: CursorChangeEvent = {
        type: 'cursor_change',
        file: event.textEditor.document.fileName,
        selections: event.selections.map(sel => ({
          start: { line: sel.start.line, character: sel.start.character },
          end: { line: sel.end.line, character: sel.end.character },
          isReversed: sel.isReversed
        }))
      };

      socket.send(payload);
    })
  );

  /**
   * Capture le changement d'éditeur actif
   */
  disposables.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        let tabIndex = 0;
        const tabs = vscode.window.tabGroups.all.flatMap(g => g.tabs);
        const index = tabs.findIndex(tab => 
          tab.input instanceof vscode.TabInputText && 
          tab.input.uri.fsPath === editor.document.fileName
        );
        tabIndex = index >= 0 ? index : 0;

        const payload: ActiveEditorChangeEvent = {
          type: 'active_editor_change',
          file: editor.document.fileName,
          languageId: editor.document.languageId,
          tabIndex
        };

        socket.send(payload);
      }
    })
  );

  return disposables;
}
