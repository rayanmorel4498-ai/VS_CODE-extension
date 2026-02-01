/**
 * Captage des événements de gestion de fichiers
 */

import * as vscode from 'vscode';
import { IEngineSocket, FileSaveEvent } from '../types';

export function activateFileTracking(socket: IEngineSocket): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  /**
   * Capture la sauvegarde de fichiers
   */
  disposables.push(
    vscode.workspace.onDidSaveTextDocument(doc => {
      const payload: FileSaveEvent = {
        type: 'file_save',
        file: doc.fileName,
        languageId: doc.languageId,
        lineCount: doc.lineCount
      };

      socket.send(payload);
    })
  );

  /**
   * Capture la création de fichiers (via FileSystemWatcher)
   */
  const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*', false, true, false);

  disposables.push(
    fileWatcher.onDidCreate(uri => {
      socket.send({
        type: 'file_create',
        file: uri.fsPath,
        folder: vscode.workspace.getWorkspaceFolder(uri)?.name
      });
    })
  );

  /**
   * Capture la suppression de fichiers
   */
  disposables.push(
    fileWatcher.onDidDelete(uri => {
      socket.send({
        type: 'file_delete',
        file: uri.fsPath
      });
    })
  );

  /**
   * Capture le renommage de fichiers
   */
  const renameWatcher = vscode.workspace.createFileSystemWatcher('**/*', true, true, false);
  const createdFiles = new Map<string, number>();
  const threshold = 100; // ms

  disposables.push(
    renameWatcher.onDidCreate(uri => {
      const timestamp = Date.now();
      createdFiles.set(uri.fsPath, timestamp);

      // Nettoyer les anciens fichiers
      for (const [file, time] of createdFiles.entries()) {
        if (timestamp - time > 5000) {
          createdFiles.delete(file);
        }
      }
    })
  );

  disposables.push(
    renameWatcher.onDidDelete(uri => {
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
    })
  );

  disposables.push(fileWatcher, renameWatcher);

  return disposables;
}
