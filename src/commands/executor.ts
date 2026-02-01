import * as vscode from 'vscode';
import { AICommand, CommandResponseMessage } from '../types';

export class CommandExecutor {
  constructor() {}

  async execute(command: AICommand): Promise<CommandResponseMessage> {
    const id = command.id || `cmd_${Date.now()}`;
    
    try {
      let result: unknown;
      const cmd = (command as any).command;

      if (cmd === 'edit_text') result = await this.editText(command as any);
      else if (cmd === 'create_file') result = await this.createFile(command as any);
      else if (cmd === 'delete_file') result = await this.deleteFile(command as any);
      else if (cmd === 'create_directory') result = await this.createDirectory(command as any);
      else if (cmd === 'delete_directory') result = await this.deleteDirectory(command as any);
      else if (cmd === 'move_file') result = await this.moveFile(command as any);
      else if (cmd === 'move_directory') result = await this.moveDirectory(command as any);
      else if (cmd === 'copy_file') result = await this.copyFile(command as any);
      else if (cmd === 'copy_directory') result = await this.copyDirectory(command as any);
      else if (cmd === 'rename_file') result = await this.renameFile(command as any);
      else if (cmd === 'execute_command') result = await this.executeCommand(command as any);
      else if (cmd === 'set_cursor') result = await this.setCursor(command as any);
      else if (cmd === 'set_selection') result = await this.setSelection(command as any);
      else if (cmd === 'open_file') result = await this.openFile(command as any);
      else if (cmd === 'close_file') result = await this.closeFile(command as any);
      else if (cmd === 'save_file') result = await this.saveFile(command as any);
      else if (cmd === 'terminal_send') result = await this.sendTerminal(command as any);
      else if (cmd === 'create_terminal') result = await this.createTerminal(command as any);
      else if (cmd === 'show_message') result = await this.showMessage(command as any);
      else if (cmd === 'read_file') result = await this.readFile(command as any);
      else if (cmd === 'list_directory') result = await this.listDirectory(command as any);
      else if (cmd === 'get_file_info') result = await this.getFileInfo(command as any);
      else if (cmd === 'get_workspace_info') result = await this.getWorkspaceInfo();
      else if (cmd === 'search_files') result = await this.searchFiles(command as any);
      else if (cmd === 'run_task') result = await this.runTask(command as any);
      else if (cmd === 'get_settings') result = await this.getSettings(command as any);
      else if (cmd === 'set_settings') result = await this.setSettings(command as any);
      else if (cmd === 'get_diagnostics') result = await this.getDiagnostics(command as any);
      else if (cmd === 'clear_diagnostics') result = await this.clearDiagnostics(command as any);
      else throw new Error(`Commande inconnue: ${cmd}`);

      const response: CommandResponseMessage = {
        type: 'command_response',
        id,
        success: true,
        result,
        timestamp: Date.now()
      };

      return response;
    } catch (error) {
      const response: CommandResponseMessage = {
        type: 'command_response',
        id,
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: Date.now()
      };

      console.error('[CodeIA] Erreur commande:', error);
      return response;
    }
  }

  private async editText(command: any): Promise<{ linesChanged: number }> {
    const uri = vscode.Uri.file(command.file);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);
    let linesChanged = 0;

    const sortedEdits = [...command.edits].sort((a, b) => {
      if (a.range.startLine !== b.range.startLine) {
        return b.range.startLine - a.range.startLine;
      }
      return b.range.startCharacter - a.range.startCharacter;
    });

    for (const edit of sortedEdits) {
      const range = new vscode.Range(
        edit.range.startLine,
        edit.range.startCharacter,
        edit.range.endLine,
        edit.range.endCharacter
      );

      await editor.edit(editBuilder => {
        editBuilder.replace(range, edit.text);
      });

      linesChanged++;
    }

    return { linesChanged };
  }

  private async createFile(command: any): Promise<{ file: string; size: number }> {
    const uri = vscode.Uri.file(command.file);
    try {
      await vscode.workspace.fs.stat(uri);
      if (!command.overwrite) throw new Error('Fichier existe');
    } catch (error: any) {
      if (error.code !== 'FileNotFound') throw error;
    }

    const bytes = new TextEncoder().encode(command.content);
    await vscode.workspace.fs.writeFile(uri, bytes);
    return { file: command.file, size: bytes.length };
  }

  private async deleteFile(command: any): Promise<{ file: string }> {
    const uri = vscode.Uri.file(command.file);
    await vscode.workspace.fs.delete(uri, { recursive: false });
    return { file: command.file };
  }

  private async createDirectory(command: any): Promise<{ path: string; created: boolean }> {
    const uri = vscode.Uri.file(command.path);
    try {
      await vscode.workspace.fs.stat(uri);
      throw new Error('Repertoire existe');
    } catch (error: any) {
      if (error.code !== 'FileNotFound') throw error;
    }
    await vscode.workspace.fs.createDirectory(uri);
    return { path: command.path, created: true };
  }

  private async deleteDirectory(command: any): Promise<{ path: string; deleted: boolean }> {
    const uri = vscode.Uri.file(command.path);
    await vscode.workspace.fs.delete(uri, { recursive: command.recursive !== false });
    return { path: command.path, deleted: true };
  }

  private async moveFile(command: any): Promise<{ source: string; destination: string }> {
    const sourceUri = vscode.Uri.file(command.source);
    const destUri = vscode.Uri.file(command.destination);
    const destDir = destUri.fsPath.substring(0, destUri.fsPath.lastIndexOf('/'));
    const destDirUri = vscode.Uri.file(destDir);
    
    try {
      await vscode.workspace.fs.stat(destDirUri);
    } catch {
      await vscode.workspace.fs.createDirectory(destDirUri);
    }
    
    await vscode.workspace.fs.rename(sourceUri, destUri);
    return { source: command.source, destination: command.destination };
  }

  private async moveDirectory(command: any): Promise<{ source: string; destination: string }> {
    const sourceUri = vscode.Uri.file(command.source);
    const destUri = vscode.Uri.file(command.destination);
    const parentDir = destUri.fsPath.substring(0, destUri.fsPath.lastIndexOf('/'));
    const parentDirUri = vscode.Uri.file(parentDir);
    
    try {
      await vscode.workspace.fs.stat(parentDirUri);
    } catch {
      await vscode.workspace.fs.createDirectory(parentDirUri);
    }
    
    await vscode.workspace.fs.rename(sourceUri, destUri);
    return { source: command.source, destination: command.destination };
  }

  private async copyFile(command: any): Promise<{ source: string; destination: string; copied: boolean }> {
    const sourceUri = vscode.Uri.file(command.source);
    const destUri = vscode.Uri.file(command.destination);
    
    try {
      await vscode.workspace.fs.stat(destUri);
      if (!command.overwrite) throw new Error('Destination existe');
    } catch (error: any) {
      if (error.code !== 'FileNotFound') throw error;
    }

    const destDir = destUri.fsPath.substring(0, destUri.fsPath.lastIndexOf('/'));
    const destDirUri = vscode.Uri.file(destDir);
    
    try {
      await vscode.workspace.fs.stat(destDirUri);
    } catch {
      await vscode.workspace.fs.createDirectory(destDirUri);
    }
    
    const content = await vscode.workspace.fs.readFile(sourceUri);
    await vscode.workspace.fs.writeFile(destUri, content);
    return { source: command.source, destination: command.destination, copied: true };
  }

  private async copyDirectory(command: any): Promise<{ source: string; destination: string; recursive: boolean }> {
    const sourceUri = vscode.Uri.file(command.source);
    const destUri = vscode.Uri.file(command.destination);

    const copyRecursive = async (src: vscode.Uri, dst: vscode.Uri) => {
      const entries = await vscode.workspace.fs.readDirectory(src);
      
      try {
        await vscode.workspace.fs.stat(dst);
      } catch {
        await vscode.workspace.fs.createDirectory(dst);
      }

      for (const [name, fileType] of entries) {
        const srcPath = vscode.Uri.joinPath(src, name);
        const dstPath = vscode.Uri.joinPath(dst, name);

        if (fileType === vscode.FileType.Directory) {
          await copyRecursive(srcPath, dstPath);
        } else {
          const content = await vscode.workspace.fs.readFile(srcPath);
          await vscode.workspace.fs.writeFile(dstPath, content);
        }
      }
    };

    if (command.recursive !== false) {
      await copyRecursive(sourceUri, destUri);
    }

    return { source: command.source, destination: command.destination, recursive: command.recursive !== false };
  }

  private async renameFile(command: any): Promise<{ oldFile: string; newFile: string }> {
    const oldUri = vscode.Uri.file(command.oldFile);
    const newUri = vscode.Uri.file(command.newFile);
    await vscode.workspace.fs.rename(oldUri, newUri);
    return { oldFile: command.oldFile, newFile: command.newFile };
  }

  private async executeCommand(command: any): Promise<unknown> {
    const result = await vscode.commands.executeCommand(
      command.commandId,
      ...(command.arguments || [])
    );
    return result;
  }

  private async setCursor(command: any): Promise<{ file: string; line: number; character: number }> {
    const uri = vscode.Uri.file(command.file);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);
    const position = new vscode.Position(command.line, command.character);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position));
    return { file: command.file, line: command.line, character: command.character };
  }

  private async setSelection(command: any): Promise<{ file: string; count: number }> {
    const uri = vscode.Uri.file(command.file);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);
    const selections = command.selections.map((sel: any) =>
      new vscode.Selection(sel.startLine, sel.startCharacter, sel.endLine, sel.endCharacter)
    );
    editor.selections = selections;
    if (selections.length > 0) {
      editor.revealRange(new vscode.Range(selections[0].start, selections[0].start));
    }
    return { file: command.file, count: selections.length };
  }

  private async openFile(command: any): Promise<{ file: string }> {
    const document = await vscode.workspace.openTextDocument(command.file);
    await vscode.window.showTextDocument(document, command.viewColumn || undefined, command.preview !== false);
    return { file: command.file };
  }

  private async closeFile(command: any): Promise<{ file: string }> {
    const tabs = vscode.window.tabGroups.all.flatMap(g => g.tabs);
    const tab = tabs.find(t => t.input instanceof vscode.TabInputText && t.input.uri.fsPath === command.file);
    if (tab) {
      await vscode.window.tabGroups.close(tab);
    }
    return { file: command.file };
  }

  private async saveFile(command: any): Promise<{ saved: string[] }> {
    const saved: string[] = [];
    if (command.file) {
      const document = vscode.workspace.textDocuments.find(d => d.uri.fsPath === command.file);
      if (document) {
        await document.save();
        saved.push(command.file);
      }
    } else {
      await vscode.workspace.saveAll();
      saved.push('all');
    }
    return { saved };
  }

  private async sendTerminal(command: any): Promise<{ name: string; sent: boolean }> {
    let terminal: vscode.Terminal | undefined;
    if (command.name) {
      terminal = vscode.window.terminals.find(t => t.name === command.name);
    } else {
      terminal = vscode.window.activeTerminal || vscode.window.terminals[0];
    }
    if (!terminal) throw new Error('Terminal non trouve');
    terminal.sendText(command.text);
    return { name: terminal.name, sent: true };
  }

  private async createTerminal(command: any): Promise<{ name: string }> {
    const terminal = vscode.window.createTerminal({
      name: command.name,
      cwd: command.cwd
    });
    terminal.show();
    return { name: terminal.name };
  }

  private async showMessage(command: any): Promise<{ shown: boolean }> {
    const message = command.message;
    switch (command.level) {
      case 'error':
        await vscode.window.showErrorMessage(message);
        break;
      case 'warning':
        await vscode.window.showWarningMessage(message);
        break;
      case 'info':
      default:
        await vscode.window.showInformationMessage(message);
        break;
    }
    return { shown: true };
  }

  private async readFile(command: any): Promise<{ file: string; content: string; size: number; lines: number }> {
    const uri = vscode.Uri.file(command.file);
    const bytes = await vscode.workspace.fs.readFile(uri);
    const content = new TextDecoder().decode(bytes);
    const lines = content.split('\n').length;
    return { file: command.file, content, size: bytes.length, lines };
  }

  private async listDirectory(command: any): Promise<{path: string; entries: Array<{ name: string; type: string; size?: number }>}> {
    const uri = vscode.Uri.file(command.path);
    const entries: Array<{ name: string; type: string; size?: number }> = [];
    const readDir = async (dirUri: vscode.Uri, depth: number = 0) => {
      const items = await vscode.workspace.fs.readDirectory(dirUri);
      for (const [name, fileType] of items) {
        const itemUri = vscode.Uri.joinPath(dirUri, name);
        const stat = await vscode.workspace.fs.stat(itemUri);
        entries.push({
          name,
          type: fileType === vscode.FileType.Directory ? 'directory' : 'file',
          size: fileType === vscode.FileType.File ? stat.size : undefined
        });
        if (command.recursive && fileType === vscode.FileType.Directory && depth < 5) {
          await readDir(itemUri, depth + 1);
        }
      }
    };
    await readDir(uri);
    return { path: command.path, entries };
  }

  private async getFileInfo(command: any): Promise<any> {
    const uri = vscode.Uri.file(command.file);
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      let lines: number | undefined;
      if (stat.type === vscode.FileType.File) {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const content = new TextDecoder().decode(bytes);
        lines = content.split('\n').length;
      }
      return {
        file: command.file,
        exists: true,
        size: stat.size,
        type: stat.type === vscode.FileType.Directory ? 'directory' : 'file',
        created: stat.ctime,
        modified: stat.mtime,
        lines
      };
    } catch {
      return {
        file: command.file,
        exists: false,
        size: 0,
        type: 'unknown',
        created: 0,
        modified: 0
      };
    }
  }

  private async getWorkspaceInfo(): Promise<any> {
    const folders = vscode.workspace.workspaceFolders || [];
    return {
      rootPath: vscode.workspace.rootPath,
      workspaceFolders: folders.map(f => ({ name: f.name, path: f.uri.fsPath })),
      openFiles: vscode.workspace.textDocuments.map(doc => ({
        path: doc.fileName,
        isDirty: doc.isDirty,
        languageId: doc.languageId
      }))
    };
  }

  private async searchFiles(command: any): Promise<any> {
    const results: any[] = [];
    const maxResults = command.maxResults || 100;
    let totalMatches = 0;
    const regex = command.isRegex
      ? new RegExp(command.query, 'gi')
      : new RegExp(command.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    for (const doc of vscode.workspace.textDocuments) {
      if (totalMatches >= maxResults) break;
      const lines = doc.getText().split('\n');
      const matches: any[] = [];
      lines.forEach((text, lineNum) => {
        if (regex.test(text)) {
          matches.push({ line: lineNum + 1, text });
          totalMatches++;
        }
      });
      if (matches.length > 0) {
        results.push({
          file: doc.fileName,
          matches: matches.length,
          lines: matches
        });
      }
    }
    return { query: command.query, results };
  }

  private async runTask(command: any): Promise<{ task: string; executed: boolean }> {
    const tasks = await vscode.tasks.fetchTasks();
    const task = tasks.find(t => t.name === command.task);
    if (!task) throw new Error('Tache non trouvee');
    await vscode.tasks.executeTask(task);
    return { task: command.task, executed: true };
  }

  private async getSettings(command: any): Promise<any> {
    const config = vscode.workspace.getConfiguration(command.section || '');
    return { section: command.section, settings: config.toJSON() };
  }

  private async setSettings(command: any): Promise<{ section: string; value: unknown; set: boolean }> {
    const config = vscode.workspace.getConfiguration();
    const target = command.global ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace;
    await config.update(command.section, command.value, target);
    return { section: command.section, value: command.value, set: true };
  }

  private async getDiagnostics(command: any): Promise<any> {
    const diagnostics: any[] = [];
    if (command.file) {
      const uri = vscode.Uri.file(command.file);
      const diags = vscode.languages.getDiagnostics(uri);
      diags.forEach(diag => {
        diagnostics.push({
          file: command.file,
          line: diag.range.start.line,
          character: diag.range.start.character,
          message: diag.message,
          severity: this.getSeverityString(diag.severity)
        });
      });
    } else {
      vscode.workspace.textDocuments.forEach(doc => {
        const diags = vscode.languages.getDiagnostics(doc.uri);
        diags.forEach(diag => {
          diagnostics.push({
            file: doc.fileName,
            line: diag.range.start.line,
            character: diag.range.start.character,
            message: diag.message,
            severity: this.getSeverityString(diag.severity)
          });
        });
      });
    }
    return { file: command.file, diagnostics };
  }

  private async clearDiagnostics(command: any): Promise<{ file?: string; cleared: boolean }> {
    return { file: command.file, cleared: true };
  }

  private getSeverityString(severity: vscode.DiagnosticSeverity | undefined): string {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error: return 'error';
      case vscode.DiagnosticSeverity.Warning: return 'warning';
      case vscode.DiagnosticSeverity.Information: return 'information';
      case vscode.DiagnosticSeverity.Hint: return 'hint';
      default: return 'information';
    }
  }
}
