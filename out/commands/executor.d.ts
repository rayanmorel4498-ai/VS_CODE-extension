import { AICommand, CommandResponseMessage } from '../types';
export declare class CommandExecutor {
    constructor();
    execute(command: AICommand): Promise<CommandResponseMessage>;
    private editText;
    private createFile;
    private deleteFile;
    private createDirectory;
    private deleteDirectory;
    private moveFile;
    private moveDirectory;
    private copyFile;
    private copyDirectory;
    private renameFile;
    private executeCommand;
    private setCursor;
    private setSelection;
    private openFile;
    private closeFile;
    private saveFile;
    private sendTerminal;
    private createTerminal;
    private showMessage;
    private readFile;
    private listDirectory;
    private getFileInfo;
    private getWorkspaceInfo;
    private searchFiles;
    private runTask;
    private getSettings;
    private setSettings;
    private getDiagnostics;
    private clearDiagnostics;
    private getSeverityString;
}
//# sourceMappingURL=executor.d.ts.map