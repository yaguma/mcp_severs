# MCPエディタ統合サーバー 技術設計書

## 1. システム概要

### 1.1 設計の目的
本設計書は、MCPプロトコルを通じてエディタ（Visual Studio Code、Unity Editorなど）とAIエージェントを統合するサーバーの技術的な実装方針を定義するのだ。

### 1.2 技術スタック
- **言語**: TypeScript 5.0以降
- **ランタイム**: Node.js 18.0以降
- **プロトコル**: MCP (Model Context Protocol) v1.0、JSON-RPC 2.0
- **対象エディタ**: Visual Studio Code 1.80以降、Unity Editor 2021.3以降（オプション）
- **対応OS**: Windows 10/11、macOS 12以降、Ubuntu 20.04以降

---

## 2. システムアーキテクチャ

### 2.1 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                      AIエージェント                          │
│                    (Claude, GPT, etc.)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Protocol (JSON-RPC 2.0)
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    MCPサーバー層                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            MCP Request Handler                       │  │
│  │  - Tool Request Router                               │  │
│  │  - Response Formatter                                │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┼───────────────────────────────┐  │
│  │                      ↓                                │  │
│  │           Security Validator                          │  │
│  │  - Path Validation                                    │  │
│  │  - Command Sanitization                               │  │
│  │  - Permission Check                                   │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
┌────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ File Operation │ │ Code Editor  │ │Terminal Executor │
│    Manager     │ │   Manager    │ │    Manager       │
└────────┬───────┘ └──────┬───────┘ └────────┬─────────┘
         │                │                   │
         └────────────────┼───────────────────┘
                          ↓
         ┌────────────────────────────────┐
         │   Editor Adapter (抽象化層)    │
         │  - VS Code Adapter              │
         │  - Unity Editor Adapter         │
         └────────────────┬────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
┌─────────────────┐ ┌─────────────┐ ┌──────────────────┐
│   VS Code API   │ │ Unity API   │ │  Other Editor    │
└─────────────────┘ └─────────────┘ └──────────────────┘
```

### 2.2 レイヤー構造

#### 2.2.1 プロトコル層 (Protocol Layer)
- **責務**: MCPプロトコルの送受信、JSON-RPCメッセージのパース
- **主要コンポーネント**: `MCPServer`, `RequestHandler`, `ResponseFormatter`

#### 2.2.2 セキュリティ層 (Security Layer)
- **責務**: パス検証、危険なコマンドのブロック、監査ログ
- **主要コンポーネント**: `SecurityValidator`, `PathValidator`, `CommandSanitizer`, `AuditLogger`

#### 2.2.3 ビジネスロジック層 (Business Logic Layer)
- **責務**: ファイル操作、コード編集、ターミナル実行、診断情報の取得
- **主要コンポーネント**: `FileOperationManager`, `CodeEditorManager`, `TerminalExecutor`, `DiagnosticsProvider`

#### 2.2.4 アダプター層 (Adapter Layer)
- **責務**: エディタ固有のAPI呼び出しを抽象化
- **主要コンポーネント**: `EditorAdapter`, `VSCodeAdapter`, `UnityEditorAdapter`

---

## 3. データフロー図

### 3.1 ファイル読み取りフロー

```
AIエージェント
    │
    │ read_file(path: "/src/main.ts")
    ↓
MCPサーバー (Request Handler)
    │
    │ validate request
    ↓
Security Validator
    │
    │ check path safety
    │ ensure within project directory
    ↓
File Operation Manager
    │
    │ detect encoding
    │ check file size
    ↓
Editor Adapter (VS Code)
    │
    │ workspace.fs.readFile()
    ↓
VS Code API
    │
    │ return file content
    ↓
Response Formatter
    │
    │ format as MCP response
    ↓
AIエージェント
```

### 3.2 コード編集フロー

```
AIエージェント
    │
    │ insert_code(file, line, content)
    ↓
MCPサーバー (Request Handler)
    │
    ↓
Security Validator
    │ validate file path
    ↓
Code Editor Manager
    │
    │ open document
    │ calculate position
    │ preserve indentation
    ↓
Editor Adapter
    │
    │ apply text edit
    │ save document
    ↓
Response (modified line range)
    ↓
AIエージェント
```

### 3.3 ターミナルコマンド実行フロー

```
AIエージェント
    │
    │ execute_command(command: "npm test")
    ↓
Security Validator
    │
    │ check dangerous commands
    │ block: rm -rf /, format, etc.
    ↓
Terminal Executor
    │
    │ spawn process
    │ capture stdout/stderr
    │ monitor timeout
    ↓
Editor Terminal API
    │
    ↓
Response (exit_code, stdout, stderr)
    ↓
AIエージェント
```

---

## 4. TypeScriptインターフェース定義

### 4.1 コアインターフェース

#### 4.1.1 MCPサーバー

```typescript
/**
 * MCPサーバーのメインインターフェース
 */
interface IMCPServer {
  /**
   * サーバーを起動する
   */
  start(): Promise<void>;

  /**
   * サーバーを停止する
   */
  stop(): Promise<void>;

  /**
   * ツールリクエストを処理する
   */
  handleToolRequest(request: ToolRequest): Promise<ToolResponse>;

  /**
   * 利用可能なツールのリストを取得する
   */
  listTools(): ToolDefinition[];
}

/**
 * ツールリクエスト
 */
interface ToolRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
  timestamp: number;
}

/**
 * ツールレスポンス
 */
interface ToolResponse {
  id: string;
  result?: unknown;
  error?: ErrorResponse;
  timestamp: number;
}

/**
 * エラーレスポンス
 */
interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * エラーコード
 */
enum ErrorCode {
  INVALID_PARAMS = 'INVALID_PARAMS',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  COMMAND_BLOCKED = 'COMMAND_BLOCKED',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

#### 4.1.2 ファイル操作

```typescript
/**
 * ファイル操作マネージャー
 */
interface IFileOperationManager {
  /**
   * ファイルを読み取る
   */
  readFile(request: ReadFileRequest): Promise<ReadFileResponse>;

  /**
   * ファイルに書き込む
   */
  writeFile(request: WriteFileRequest): Promise<WriteFileResponse>;

  /**
   * ファイルを削除する
   */
  deleteFile(path: string): Promise<void>;

  /**
   * ディレクトリを作成する
   */
  createDirectory(path: string): Promise<void>;
}

/**
 * ファイル読み取りリクエスト
 */
interface ReadFileRequest {
  path: string;
  encoding?: string; // 'utf-8' | 'shift-jis' | 'euc-jp' | 'auto'
  maxSize?: number; // bytes
}

/**
 * ファイル読み取りレスポンス
 */
interface ReadFileResponse {
  content: string;
  encoding: string;
  size: number;
  isTruncated: boolean;
}

/**
 * ファイル書き込みリクエスト
 */
interface WriteFileRequest {
  path: string;
  content: string;
  encoding?: string;
  createBackup?: boolean;
  createDirectories?: boolean;
}

/**
 * ファイル書き込みレスポンス
 */
interface WriteFileResponse {
  path: string;
  bytesWritten: number;
  backupPath?: string;
}
```

#### 4.1.3 コード編集

```typescript
/**
 * コード編集マネージャー
 */
interface ICodeEditorManager {
  /**
   * コードを挿入する
   */
  insertCode(request: InsertCodeRequest): Promise<InsertCodeResponse>;

  /**
   * コードを削除する
   */
  deleteCode(request: DeleteCodeRequest): Promise<DeleteCodeResponse>;

  /**
   * コードを置換する
   */
  replaceCode(request: ReplaceCodeRequest): Promise<ReplaceCodeResponse>;

  /**
   * フォーマットを適用する
   */
  formatDocument(path: string): Promise<void>;
}

/**
 * コード挿入リクエスト
 */
interface InsertCodeRequest {
  path: string;
  line: number; // 1-indexed
  content: string;
  preserveIndent?: boolean;
}

/**
 * コード挿入レスポンス
 */
interface InsertCodeResponse {
  modifiedRange: {
    start: number;
    end: number;
  };
  linesInserted: number;
}

/**
 * コード削除リクエスト
 */
interface DeleteCodeRequest {
  path: string;
  startLine: number; // 1-indexed
  endLine: number;   // inclusive
  requireConfirmation?: boolean; // true if > 100 lines
}

/**
 * コード削除レスポンス
 */
interface DeleteCodeResponse {
  linesDeleted: number;
  confirmed: boolean;
}

/**
 * コード置換リクエスト
 */
interface ReplaceCodeRequest {
  path: string;
  pattern: string;
  replacement: string;
  isRegex?: boolean;
  preview?: boolean;
}

/**
 * コード置換レスポンス
 */
interface ReplaceCodeResponse {
  replacementCount: number;
  affectedLines: number[];
  preview?: string; // diff format
}
```

#### 4.1.4 ターミナル実行

```typescript
/**
 * ターミナル実行マネージャー
 */
interface ITerminalExecutor {
  /**
   * コマンドを実行する
   */
  executeCommand(request: ExecuteCommandRequest): Promise<ExecuteCommandResponse>;

  /**
   * ビルドを実行する
   */
  executeBuild(request: BuildRequest): Promise<BuildResponse>;

  /**
   * 実行中のプロセスを停止する
   */
  killProcess(processId: string): Promise<void>;
}

/**
 * コマンド実行リクエスト
 */
interface ExecuteCommandRequest {
  command: string;
  args?: string[];
  cwd?: string;
  timeout?: number; // milliseconds, default: 60000
  background?: boolean;
}

/**
 * コマンド実行レスポンス
 */
interface ExecuteCommandResponse {
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTime: number; // milliseconds
  processId?: string; // for background processes
}

/**
 * ビルドリクエスト
 */
interface BuildRequest {
  projectPath: string;
  buildType?: 'npm' | 'yarn' | 'pnpm' | 'maven' | 'gradle' | 'msbuild' | 'auto';
  target?: string; // e.g., 'build', 'test', 'prod'
}

/**
 * ビルドレスポンス
 */
interface BuildResponse {
  success: boolean;
  buildLog: string;
  errors: BuildError[];
  warnings: BuildWarning[];
  artifacts?: string[]; // output file paths
}

/**
 * ビルドエラー
 */
interface BuildError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error';
}

/**
 * ビルド警告
 */
interface BuildWarning {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'warning';
}
```

#### 4.1.5 診断情報

```typescript
/**
 * 診断情報プロバイダー
 */
interface IDiagnosticsProvider {
  /**
   * ファイルの診断情報を取得する
   */
  getDiagnostics(path: string): Promise<Diagnostic[]>;

  /**
   * プロジェクト全体の診断情報を取得する
   */
  getAllDiagnostics(): Promise<Map<string, Diagnostic[]>>;

  /**
   * クイックフィックスを取得する
   */
  getQuickFixes(diagnostic: Diagnostic): Promise<QuickFix[]>;

  /**
   * クイックフィックスを適用する
   */
  applyQuickFix(fix: QuickFix): Promise<ApplyFixResponse>;
}

/**
 * 診断情報
 */
interface Diagnostic {
  file: string;
  range: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  code?: string;
  source?: string; // e.g., 'typescript', 'eslint'
}

/**
 * クイックフィックス
 */
interface QuickFix {
  id: string;
  title: string;
  description?: string;
  edits: TextEdit[];
  diagnostic: Diagnostic;
}

/**
 * テキスト編集
 */
interface TextEdit {
  file: string;
  range: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  newText: string;
}

/**
 * 修正適用レスポンス
 */
interface ApplyFixResponse {
  success: boolean;
  filesModified: string[];
  diff?: string;
}
```

#### 4.1.6 セキュリティバリデーター

```typescript
/**
 * セキュリティバリデーター
 */
interface ISecurityValidator {
  /**
   * ファイルパスを検証する
   */
  validatePath(path: string): ValidationResult;

  /**
   * コマンドを検証する
   */
  validateCommand(command: string, args?: string[]): ValidationResult;

  /**
   * 操作をログに記録する
   */
  logOperation(operation: OperationLog): Promise<void>;
}

/**
 * 検証結果
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
  reason?: string;
}

/**
 * 操作ログ
 */
interface OperationLog {
  timestamp: number;
  operation: string;
  params: Record<string, unknown>;
  result: 'success' | 'error' | 'blocked';
  userId?: string;
  sessionId?: string;
}

/**
 * 危険なコマンドのリスト
 */
const DANGEROUS_COMMANDS = [
  'rm -rf /',
  'format',
  'del /f /s /q',
  'mkfs',
  'dd if=',
  ':(){:|:&};:',  // fork bomb
] as const;

/**
 * プロジェクトディレクトリ外へのアクセスを検証する
 */
function isPathSafe(requestPath: string, projectRoot: string): boolean {
  const resolvedPath = path.resolve(projectRoot, requestPath);
  return resolvedPath.startsWith(projectRoot);
}
```

#### 4.1.7 エディタアダプター

```typescript
/**
 * エディタアダプター（抽象化層）
 */
interface IEditorAdapter {
  /**
   * アダプターを初期化する
   */
  initialize(): Promise<void>;

  /**
   * ファイルシステム操作
   */
  fileSystem: IFileSystemAdapter;

  /**
   * テキストエディタ操作
   */
  textEditor: ITextEditorAdapter;

  /**
   * ターミナル操作
   */
  terminal: ITerminalAdapter;

  /**
   * 診断情報操作
   */
  diagnostics: IDiagnosticsAdapter;
}

/**
 * ファイルシステムアダプター
 */
interface IFileSystemAdapter {
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, content: Uint8Array): Promise<void>;
  delete(path: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

/**
 * テキストエディタアダプター
 */
interface ITextEditorAdapter {
  openDocument(path: string): Promise<ITextDocument>;
  applyEdit(edit: TextEdit): Promise<boolean>;
  formatDocument(path: string): Promise<void>;
  getIndentSettings(): IndentSettings;
}

/**
 * テキストドキュメント
 */
interface ITextDocument {
  path: string;
  lineCount: number;
  getText(range?: Range): string;
  getLineAt(line: number): string;
}

/**
 * インデント設定
 */
interface IndentSettings {
  useTabs: boolean;
  tabSize: number;
}

/**
 * ターミナルアダプター
 */
interface ITerminalAdapter {
  execute(command: string, args: string[], options: ExecuteOptions): Promise<ExecuteResult>;
}

/**
 * 実行オプション
 */
interface ExecuteOptions {
  cwd?: string;
  timeout?: number;
  background?: boolean;
}

/**
 * 実行結果
 */
interface ExecuteResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * 診断情報アダプター
 */
interface IDiagnosticsAdapter {
  getDiagnostics(path: string): Promise<Diagnostic[]>;
  getCodeActions(diagnostic: Diagnostic): Promise<QuickFix[]>;
}
```

---

## 5. MCPツール定義（APIエンドポイント）

### 5.1 ツール一覧

MCPサーバーは以下のツールを提供するのだ：

| ツール名 | 説明 | 入力 | 出力 |
|---------|------|------|------|
| `read_file` | ファイル内容を読み取る | `path`, `encoding?`, `maxSize?` | `content`, `encoding`, `size` |
| `write_file` | ファイルに書き込む | `path`, `content`, `encoding?`, `createBackup?` | `bytesWritten`, `backupPath?` |
| `insert_code` | コードを挿入する | `path`, `line`, `content` | `modifiedRange`, `linesInserted` |
| `delete_code` | コードを削除する | `path`, `startLine`, `endLine` | `linesDeleted` |
| `replace_code` | コードを置換する | `path`, `pattern`, `replacement`, `isRegex?` | `replacementCount`, `affectedLines` |
| `execute_command` | ターミナルコマンドを実行する | `command`, `args?`, `timeout?` | `exitCode`, `stdout`, `stderr` |
| `execute_build` | ビルドを実行する | `projectPath`, `buildType?`, `target?` | `success`, `errors`, `warnings` |
| `get_diagnostics` | 診断情報を取得する | `path?` | `diagnostics[]` |
| `get_quick_fixes` | クイックフィックスを取得する | `diagnostic` | `quickFixes[]` |
| `apply_quick_fix` | クイックフィックスを適用する | `fixId` | `success`, `filesModified` |
| `format_document` | ドキュメントをフォーマットする | `path` | `success` |

### 5.2 ツール詳細定義

#### 5.2.1 read_file

```json
{
  "name": "read_file",
  "description": "プロジェクト内のファイル内容を読み取る。エンコーディングを自動検出し、大容量ファイルの場合は警告を出す。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "読み取るファイルのパス（プロジェクトルートからの相対パス）"
      },
      "encoding": {
        "type": "string",
        "enum": ["utf-8", "shift-jis", "euc-jp", "auto"],
        "default": "auto",
        "description": "ファイルのエンコーディング"
      },
      "maxSize": {
        "type": "number",
        "default": 10485760,
        "description": "最大ファイルサイズ（バイト）、デフォルトは10MB"
      }
    },
    "required": ["path"]
  }
}
```

#### 5.2.2 write_file

```json
{
  "name": "write_file",
  "description": "ファイルに内容を書き込む。既存ファイルの場合は自動的にバックアップを作成する。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "書き込むファイルのパス"
      },
      "content": {
        "type": "string",
        "description": "書き込む内容"
      },
      "encoding": {
        "type": "string",
        "enum": ["utf-8", "shift-jis", "euc-jp"],
        "default": "utf-8",
        "description": "ファイルのエンコーディング"
      },
      "createBackup": {
        "type": "boolean",
        "default": true,
        "description": "既存ファイルのバックアップを作成するか"
      },
      "createDirectories": {
        "type": "boolean",
        "default": true,
        "description": "必要に応じて親ディレクトリを作成するか"
      }
    },
    "required": ["path", "content"]
  }
}
```

#### 5.2.3 insert_code

```json
{
  "name": "insert_code",
  "description": "指定された行番号にコードを挿入する。インデントは自動的に調整される。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "編集するファイルのパス"
      },
      "line": {
        "type": "number",
        "description": "挿入する行番号（1から始まる）"
      },
      "content": {
        "type": "string",
        "description": "挿入するコード"
      },
      "preserveIndent": {
        "type": "boolean",
        "default": true,
        "description": "既存のインデントレベルを維持するか"
      }
    },
    "required": ["path", "line", "content"]
  }
}
```

#### 5.2.4 delete_code

```json
{
  "name": "delete_code",
  "description": "指定された行範囲のコードを削除する。100行以上の削除の場合は確認が必要。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "編集するファイルのパス"
      },
      "startLine": {
        "type": "number",
        "description": "削除開始行（1から始まる）"
      },
      "endLine": {
        "type": "number",
        "description": "削除終了行（含む）"
      },
      "requireConfirmation": {
        "type": "boolean",
        "default": true,
        "description": "100行以上の削除時に確認を求めるか"
      }
    },
    "required": ["path", "startLine", "endLine"]
  }
}
```

#### 5.2.5 replace_code

```json
{
  "name": "replace_code",
  "description": "パターンに一致するコードを新しいコードで置換する。正規表現とプレビューをサポート。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "編集するファイルのパス"
      },
      "pattern": {
        "type": "string",
        "description": "検索パターン（文字列または正規表現）"
      },
      "replacement": {
        "type": "string",
        "description": "置換後の文字列"
      },
      "isRegex": {
        "type": "boolean",
        "default": false,
        "description": "パターンを正規表現として扱うか"
      },
      "preview": {
        "type": "boolean",
        "default": true,
        "description": "置換前にプレビューを表示するか"
      }
    },
    "required": ["path", "pattern", "replacement"]
  }
}
```

#### 5.2.6 execute_command

```json
{
  "name": "execute_command",
  "description": "エディタの統合ターミナルでコマンドを実行する。危険なコマンドは自動的にブロックされる。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "実行するコマンド"
      },
      "args": {
        "type": "array",
        "items": { "type": "string" },
        "description": "コマンド引数"
      },
      "cwd": {
        "type": "string",
        "description": "作業ディレクトリ（省略時はプロジェクトルート）"
      },
      "timeout": {
        "type": "number",
        "default": 60000,
        "description": "タイムアウト時間（ミリ秒）"
      },
      "background": {
        "type": "boolean",
        "default": false,
        "description": "バックグラウンドで実行するか"
      }
    },
    "required": ["command"]
  }
}
```

#### 5.2.7 execute_build

```json
{
  "name": "execute_build",
  "description": "プロジェクトをビルドする。プロジェクトタイプを自動検出し、適切なビルドツールを実行する。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectPath": {
        "type": "string",
        "default": ".",
        "description": "プロジェクトのパス"
      },
      "buildType": {
        "type": "string",
        "enum": ["npm", "yarn", "pnpm", "maven", "gradle", "msbuild", "auto"],
        "default": "auto",
        "description": "ビルドツールのタイプ"
      },
      "target": {
        "type": "string",
        "default": "build",
        "description": "ビルドターゲット（build, test, prod等）"
      }
    },
    "required": []
  }
}
```

#### 5.2.8 get_diagnostics

```json
{
  "name": "get_diagnostics",
  "description": "ファイルまたはプロジェクト全体の診断情報（エラー、警告）を取得する。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "対象ファイルのパス（省略時はプロジェクト全体）"
      }
    },
    "required": []
  }
}
```

#### 5.2.9 get_quick_fixes

```json
{
  "name": "get_quick_fixes",
  "description": "指定された診断情報に対するクイックフィックス（修正候補）を取得する。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "diagnostic": {
        "type": "object",
        "description": "診断情報オブジェクト"
      }
    },
    "required": ["diagnostic"]
  }
}
```

#### 5.2.10 apply_quick_fix

```json
{
  "name": "apply_quick_fix",
  "description": "クイックフィックスを適用してコードを修正する。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "fixId": {
        "type": "string",
        "description": "適用するクイックフィックスのID"
      }
    },
    "required": ["fixId"]
  }
}
```

#### 5.2.11 format_document

```json
{
  "name": "format_document",
  "description": "ドキュメントをエディタの設定に従ってフォーマットする。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "フォーマットするファイルのパス"
      }
    },
    "required": ["path"]
  }
}
```

---

## 6. セキュリティ設計

### 6.1 パス検証

#### 6.1.1 プロジェクトディレクトリ外へのアクセス防止

```typescript
class PathValidator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
  }

  /**
   * パスの安全性を検証する
   */
  validate(requestPath: string): ValidationResult {
    // 絶対パスに解決
    const resolvedPath = path.resolve(this.projectRoot, requestPath);

    // プロジェクトルート配下かチェック
    if (!resolvedPath.startsWith(this.projectRoot)) {
      return {
        valid: false,
        error: 'PERMISSION_DENIED',
        reason: 'Access outside project directory is not allowed'
      };
    }

    // シンボリックリンクのチェック
    const realPath = fs.realpathSync(resolvedPath);
    if (!realPath.startsWith(this.projectRoot)) {
      return {
        valid: false,
        error: 'PERMISSION_DENIED',
        reason: 'Symbolic link points outside project directory'
      };
    }

    return { valid: true };
  }
}
```

### 6.2 コマンドサニタイゼーション

#### 6.2.1 危険なコマンドのブロック

```typescript
class CommandSanitizer {
  private dangerousPatterns = [
    /rm\s+-rf\s+\//,           // rm -rf /
    /format\s+[a-z]:/i,         // format C:
    /del\s+\/[fFsS]\s+\/[qQ]/,  // del /f /s /q
    /mkfs/,                     // mkfs
    /dd\s+if=/,                 // dd if=
    /:\(\)\{:\|:&\};:/,         // fork bomb
    /sudo\s+rm/,                // sudo rm
    />\/dev\/sd[a-z]/,          // write to disk device
  ];

  /**
   * コマンドの安全性を検証する
   */
  validate(command: string, args: string[] = []): ValidationResult {
    const fullCommand = `${command} ${args.join(' ')}`;

    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(fullCommand)) {
        return {
          valid: false,
          error: 'COMMAND_BLOCKED',
          reason: `Dangerous command detected: ${fullCommand}`
        };
      }
    }

    return { valid: true };
  }
}
```

### 6.3 監査ログ

#### 6.3.1 すべての操作をログに記録

```typescript
class AuditLogger {
  private logStream: fs.WriteStream;

  constructor(logPath: string) {
    this.logStream = fs.createWriteStream(logPath, { flags: 'a' });
  }

  /**
   * 操作をログに記録する
   */
  async log(operation: OperationLog): Promise<void> {
    const logEntry = {
      timestamp: new Date(operation.timestamp).toISOString(),
      operation: operation.operation,
      params: JSON.stringify(operation.params),
      result: operation.result,
      userId: operation.userId || 'unknown',
      sessionId: operation.sessionId || 'unknown'
    };

    this.logStream.write(JSON.stringify(logEntry) + '\n');
  }

  /**
   * ログストリームを閉じる
   */
  close(): void {
    this.logStream.end();
  }
}
```

---

## 7. エラーハンドリング

### 7.1 エラー分類

| エラーコード | 説明 | HTTPステータス相当 |
|------------|------|------------------|
| `INVALID_PARAMS` | 不正なパラメータ | 400 Bad Request |
| `FILE_NOT_FOUND` | ファイルが存在しない | 404 Not Found |
| `PERMISSION_DENIED` | 権限がない | 403 Forbidden |
| `COMMAND_BLOCKED` | 危険なコマンドがブロックされた | 403 Forbidden |
| `TIMEOUT` | タイムアウト | 408 Request Timeout |
| `INTERNAL_ERROR` | 内部エラー | 500 Internal Server Error |

### 7.2 エラーレスポンス形式

```typescript
interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: {
    file?: string;
    line?: number;
    suggestion?: string;
  };
}

/**
 * エラーレスポンスを生成する
 */
function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    code,
    message,
    details
  };
}
```

### 7.3 リトライ戦略

```typescript
/**
 * リトライ可能なエラーか判定する
 */
function isRetryable(error: ErrorResponse): boolean {
  return [
    ErrorCode.TIMEOUT,
    ErrorCode.INTERNAL_ERROR
  ].includes(error.code);
}

/**
 * エクスポネンシャルバックオフでリトライする
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

---

## 8. パフォーマンス要件

### 8.1 レスポンスタイム目標

| 操作 | 目標レスポンスタイム | 備考 |
|-----|------------------|------|
| ファイル読み取り（<1MB） | < 500ms | キャッシュなし |
| ファイル書き込み | < 300ms | バックアップ含む |
| コード挿入 | < 200ms | インデント調整含む |
| コード削除 | < 200ms | - |
| コード置換 | < 500ms | プレビュー生成含む |
| コマンド実行 | 可変 | タイムアウト: 60s |
| ビルド実行 | 可変 | プロジェクトサイズによる |
| 診断情報取得 | < 1000ms | プロジェクト全体 |

### 8.2 同時実行制御

```typescript
/**
 * 同時実行数を制限するセマフォ
 */
class Semaphore {
  private queue: Array<() => void> = [];
  private currentCount: number;

  constructor(private maxConcurrent: number) {
    this.currentCount = 0;
  }

  async acquire(): Promise<void> {
    if (this.currentCount < this.maxConcurrent) {
      this.currentCount++;
      return;
    }

    return new Promise<void>(resolve => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.currentCount--;

    const next = this.queue.shift();
    if (next) {
      this.currentCount++;
      next();
    }
  }
}

// 最大10並列リクエストを処理
const requestSemaphore = new Semaphore(10);
```

### 8.3 大容量ファイル対策

```typescript
/**
 * ストリーミング読み取り
 */
async function readLargeFile(path: string, maxSize: number = 10 * 1024 * 1024): Promise<ReadFileResponse> {
  const stats = await fs.promises.stat(path);

  if (stats.size > maxSize) {
    // 最初の部分だけを読み取る
    const buffer = Buffer.alloc(maxSize);
    const fd = await fs.promises.open(path, 'r');
    await fd.read(buffer, 0, maxSize, 0);
    await fd.close();

    return {
      content: buffer.toString('utf-8'),
      encoding: 'utf-8',
      size: stats.size,
      isTruncated: true
    };
  }

  // 通常の読み取り
  const content = await fs.promises.readFile(path, 'utf-8');
  return {
    content,
    encoding: 'utf-8',
    size: stats.size,
    isTruncated: false
  };
}
```

---

## 9. テスト戦略

### 9.1 単体テスト

- **対象**: 各マネージャークラス、バリデーター、ユーティリティ関数
- **フレームワーク**: Jest
- **カバレッジ目標**: 80%以上

### 9.2 統合テスト

- **対象**: MCPサーバー ↔ エディタアダプター間の通信
- **手法**: モックエディタAPIを使用した統合テスト

### 9.3 E2Eテスト

- **対象**: 実際のVS Codeとの統合
- **手法**: VS Code Extension Test Runner

---

## 10. デプロイメント

### 10.1 パッケージ構成

```
mcp-editor-server/
├── src/
│   ├── server/
│   │   ├── MCPServer.ts
│   │   ├── RequestHandler.ts
│   │   └── ResponseFormatter.ts
│   ├── managers/
│   │   ├── FileOperationManager.ts
│   │   ├── CodeEditorManager.ts
│   │   ├── TerminalExecutor.ts
│   │   └── DiagnosticsProvider.ts
│   ├── security/
│   │   ├── SecurityValidator.ts
│   │   ├── PathValidator.ts
│   │   ├── CommandSanitizer.ts
│   │   └── AuditLogger.ts
│   ├── adapters/
│   │   ├── EditorAdapter.ts
│   │   ├── VSCodeAdapter.ts
│   │   └── UnityEditorAdapter.ts (optional)
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

### 10.2 環境変数

| 変数名 | 説明 | デフォルト値 |
|-------|------|-----------|
| `PROJECT_ROOT` | プロジェクトのルートディレクトリ | `process.cwd()` |
| `LOG_PATH` | 監査ログの出力先 | `./logs/audit.log` |
| `MAX_CONCURRENT_REQUESTS` | 最大同時リクエスト数 | `10` |
| `DEFAULT_TIMEOUT` | デフォルトタイムアウト（ms） | `60000` |
| `MAX_FILE_SIZE` | 最大ファイルサイズ（バイト） | `10485760` (10MB) |

---

## 11. 今後の拡張

### 11.1 フェーズ2の機能

- **Git統合**: コミット、プッシュ、プルなどのGit操作
- **デバッガー統合**: ブレークポイント設定、ステップ実行
- **リファクタリングツール**: シンボルのリネーム、メソッド抽出

### 11.2 追加エディタサポート

- JetBrains IDEs (IntelliJ, PyCharm, WebStorm)
- Vim/Neovim
- Emacs

---

## 12. 変更履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2025-11-08 | 初版作成 | ずんだもん |

---

## 13. 承認

この技術設計書は、以下の関係者によるレビューと承認が必要なのだ。

- [ ] テクニカルアーキテクト
- [ ] シニアエンジニア
- [ ] セキュリティエンジニア
- [ ] QAエンジニア
