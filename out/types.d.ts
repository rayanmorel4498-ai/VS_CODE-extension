export interface EditorChangeEvent {
    type: 'editor_change';
    file: string;
    content: string;
    languageId: string;
    version: number;
    isDirty: boolean;
    eol: 'CRLF' | 'LF';
    changes: Array<{
        range: {
            startLine: number;
            startCharacter: number;
            endLine: number;
            endCharacter: number;
        };
        text: string;
    }>;
}
export interface CursorChangeEvent {
    type: 'cursor_change';
    file: string;
    selections: Array<{
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
        isReversed: boolean;
    }>;
}
export interface ActiveEditorChangeEvent {
    type: 'active_editor_change';
    file: string;
    languageId: string;
    tabIndex: number;
}
export interface FileOpenEvent {
    type: 'file_open';
    file: string;
    languageId: string;
    size: number;
    lineCount: number;
}
export interface FileCloseEvent {
    type: 'file_close';
    file: string;
}
export interface FileSaveEvent {
    type: 'file_save';
    file: string;
    languageId: string;
    lineCount: number;
}
export interface FileCreateEvent {
    type: 'file_create';
    file: string;
    folder?: string;
}
export interface FileDeleteEvent {
    type: 'file_delete';
    file: string;
}
export interface FileRenameEvent {
    type: 'file_rename';
    oldFile: string;
    newFile: string;
}
export interface TerminalOpenEvent {
    type: 'terminal_open';
    name: string;
    shellPath?: string;
    cwd?: string;
}
export interface TerminalCloseEvent {
    type: 'terminal_close';
    name: string;
}
export interface TerminalCommandEvent {
    type: 'terminal_command';
    name: string;
    command: string;
}
export interface TerminalOutputEvent {
    type: 'terminal_output';
    name: string;
    output: string;
    timestamp: number;
}
export interface DiagnosticEvent {
    type: 'diagnostic_change';
    file: string;
    diagnostics: Array<{
        range: {
            startLine: number;
            startCharacter: number;
            endLine: number;
            endCharacter: number;
        };
        message: string;
        severity: 'error' | 'warning' | 'information' | 'hint';
        code?: string | number;
        source?: string;
    }>;
}
export interface CommandExecutionEvent {
    type: 'command_execute';
    command: string;
    arguments?: unknown[];
    timestamp: number;
}
export type EditorEvent = EditorChangeEvent | CursorChangeEvent | ActiveEditorChangeEvent;
export type FileEvent = FileOpenEvent | FileCloseEvent | FileSaveEvent | FileCreateEvent | FileDeleteEvent | FileRenameEvent;
export type TerminalEvent = TerminalOpenEvent | TerminalCloseEvent | TerminalCommandEvent | TerminalOutputEvent;
export type DiagnosticChangeEvent = DiagnosticEvent;
export type CodeIAEvent = EditorEvent | FileEvent | TerminalEvent | DiagnosticChangeEvent | CommandExecutionEvent;
export interface ConnectionMessage {
    type: 'connection';
    status: 'connected' | 'disconnected' | 'error';
    workspace?: string;
    vscodeVersion?: string;
    timestamp: number;
}
export interface CommandResponseMessage {
    type: 'command_response';
    id: string;
    success: boolean;
    result?: unknown;
    error?: string;
    timestamp: number;
}
export interface StatusMessage {
    type: 'status';
    active: boolean;
    filesOpenCount: number;
    activeDiagnosticsCount: number;
    timestamp: number;
}
export interface AckMessage {
    type: 'ack';
    messageId?: string;
    success: boolean;
}
export type ControlMessage = ConnectionMessage | StatusMessage | AckMessage | CommandResponseMessage;
export interface TextEditCommand {
    type: 'command';
    command: 'edit_text';
    file: string;
    edits: Array<{
        range: {
            startLine: number;
            startCharacter: number;
            endLine: number;
            endCharacter: number;
        };
        text: string;
    }>;
    id?: string;
}
export interface CreateFileCommand {
    type: 'command';
    command: 'create_file';
    file: string;
    content: string;
    overwrite?: boolean;
    id?: string;
}
export interface DeleteFileCommand {
    type: 'command';
    command: 'delete_file';
    file: string;
    id?: string;
}
export interface CreateDirectoryCommand {
    type: 'command';
    command: 'create_directory';
    path: string;
    id?: string;
}
export interface DeleteDirectoryCommand {
    type: 'command';
    command: 'delete_directory';
    path: string;
    recursive?: boolean;
    id?: string;
}
export interface MoveFileCommand {
    type: 'command';
    command: 'move_file';
    source: string;
    destination: string;
    id?: string;
}
export interface MoveDirectoryCommand {
    type: 'command';
    command: 'move_directory';
    source: string;
    destination: string;
    id?: string;
}
export interface CopyFileCommand {
    type: 'command';
    command: 'copy_file';
    source: string;
    destination: string;
    overwrite?: boolean;
    id?: string;
}
export interface CopyDirectoryCommand {
    type: 'command';
    command: 'copy_directory';
    source: string;
    destination: string;
    recursive?: boolean;
    id?: string;
}
export interface RenameFileCommand {
    type: 'command';
    command: 'rename_file';
    oldFile: string;
    newFile: string;
    id?: string;
}
export interface ExecuteCommandCommand {
    type: 'command';
    command: 'execute_command';
    commandId: string;
    arguments?: unknown[];
    id?: string;
}
export interface SetCursorCommand {
    type: 'command';
    command: 'set_cursor';
    file: string;
    line: number;
    character: number;
    id?: string;
}
export interface SetSelectionCommand {
    type: 'command';
    command: 'set_selection';
    file: string;
    selections: Array<{
        startLine: number;
        startCharacter: number;
        endLine: number;
        endCharacter: number;
    }>;
    id?: string;
}
export interface OpenFileCommand {
    type: 'command';
    command: 'open_file';
    file: string;
    viewColumn?: number;
    preview?: boolean;
    id?: string;
}
export interface CloseFileCommand {
    type: 'command';
    command: 'close_file';
    file: string;
    id?: string;
}
export interface SaveFileCommand {
    type: 'command';
    command: 'save_file';
    file?: string;
    id?: string;
}
export interface TerminalCommand {
    type: 'command';
    command: 'terminal_send';
    text: string;
    name?: string;
    id?: string;
}
export interface CreateTerminalCommand {
    type: 'command';
    command: 'create_terminal';
    name: string;
    cwd?: string;
    id?: string;
}
export interface ShowMessageCommand {
    type: 'command';
    command: 'show_message';
    level: 'info' | 'warning' | 'error';
    message: string;
    id?: string;
}
export interface ReadFileCommand {
    type: 'command';
    command: 'read_file';
    file: string;
    id?: string;
}
export interface ListDirectoryCommand {
    type: 'command';
    command: 'list_directory';
    path: string;
    recursive?: boolean;
    id?: string;
}
export interface GetFileInfoCommand {
    type: 'command';
    command: 'get_file_info';
    file: string;
    id?: string;
}
export interface GetWorkspaceInfoCommand {
    type: 'command';
    command: 'get_workspace_info';
    id?: string;
}
export interface SearchFilesCommand {
    type: 'command';
    command: 'search_files';
    query: string;
    includePattern?: string;
    excludePattern?: string;
    isRegex?: boolean;
    maxResults?: number;
    id?: string;
}
export interface RunTaskCommand {
    type: 'command';
    command: 'run_task';
    task: string;
    id?: string;
}
export interface GetSettingsCommand {
    type: 'command';
    command: 'get_settings';
    section?: string;
    id?: string;
}
export interface SetSettingsCommand {
    type: 'command';
    command: 'set_settings';
    section: string;
    value: unknown;
    global?: boolean;
    id?: string;
}
export interface GetDiagnosticsCommand {
    type: 'command';
    command: 'get_diagnostics';
    file?: string;
    id?: string;
}
export interface ClearDiagnosticsCommand {
    type: 'command';
    command: 'clear_diagnostics';
    file?: string;
    id?: string;
}
export type AICommand = TextEditCommand | CreateFileCommand | DeleteFileCommand | CreateDirectoryCommand | DeleteDirectoryCommand | MoveFileCommand | MoveDirectoryCommand | CopyFileCommand | CopyDirectoryCommand | RenameFileCommand | ExecuteCommandCommand | SetCursorCommand | SetSelectionCommand | OpenFileCommand | CloseFileCommand | SaveFileCommand | TerminalCommand | CreateTerminalCommand | ShowMessageCommand | ReadFileCommand | ListDirectoryCommand | GetFileInfoCommand | GetWorkspaceInfoCommand | SearchFilesCommand | RunTaskCommand | GetSettingsCommand | SetSettingsCommand | GetDiagnosticsCommand | ClearDiagnosticsCommand;
export interface IEngineSocket {
    connect(): void;
    disconnect(): void;
    send(event: CodeIAEvent | ControlMessage): void;
    onMessage(callback: (message: unknown) => void): void;
    isConnected(): boolean;
    getUrl(): string;
}
export interface ExtensionConfig {
    serverUrl: string;
    enabled: boolean;
    captureTerminal: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
//# sourceMappingURL=types.d.ts.map