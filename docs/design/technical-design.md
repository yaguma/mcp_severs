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
 * ツール定義
 */
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

/**
 * JSONスキーマ型
 */
interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
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

## 9. 実装詳細

### 9.1 ビルドツール自動検出

プロジェクトタイプを自動検出するために、以下のファイルの存在をチェックするのだ：

```typescript
/**
 * ビルドツール検出器
 */
class BuildToolDetector {
  /**
   * プロジェクトタイプを自動検出する
   */
  async detect(projectPath: string): Promise<BuildToolType> {
    const fs = require('fs').promises;
    const path = require('path');

    // package.json の存在チェック (npm/yarn/pnpm)
    if (await this.fileExists(path.join(projectPath, 'package.json'))) {
      return await this.detectNodePackageManager(projectPath);
    }

    // pom.xml の存在チェック (Maven)
    if (await this.fileExists(path.join(projectPath, 'pom.xml'))) {
      return 'maven';
    }

    // build.gradle の存在チェック (Gradle)
    if (await this.fileExists(path.join(projectPath, 'build.gradle')) ||
        await this.fileExists(path.join(projectPath, 'build.gradle.kts'))) {
      return 'gradle';
    }

    // *.csproj の存在チェック (MSBuild/.NET)
    const files = await fs.readdir(projectPath);
    if (files.some((f: string) => f.endsWith('.csproj'))) {
      return 'msbuild';
    }

    // *.sln の存在チェック (MSBuild/Visual Studio)
    if (files.some((f: string) => f.endsWith('.sln'))) {
      return 'msbuild';
    }

    throw new Error('Unknown project type: No build configuration file found');
  }

  /**
   * Node.js パッケージマネージャーを検出する
   */
  private async detectNodePackageManager(projectPath: string): Promise<BuildToolType> {
    const path = require('path');

    // pnpm-lock.yaml の存在チェック
    if (await this.fileExists(path.join(projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }

    // yarn.lock の存在チェック
    if (await this.fileExists(path.join(projectPath, 'yarn.lock'))) {
      return 'yarn';
    }

    // package-lock.json の存在チェック (npm)
    if (await this.fileExists(path.join(projectPath, 'package-lock.json'))) {
      return 'npm';
    }

    // デフォルトはnpm
    return 'npm';
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await require('fs').promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

type BuildToolType = 'npm' | 'yarn' | 'pnpm' | 'maven' | 'gradle' | 'msbuild';
```

### 9.2 エンコーディング自動検出

ファイルのエンコーディングを自動検出する実装詳細なのだ：

```typescript
import * as chardet from 'chardet';
import * as Encoding from 'encoding-japanese';

/**
 * エンコーディング検出器
 */
class EncodingDetector {
  /**
   * ファイルのエンコーディングを自動検出する
   */
  async detect(filePath: string): Promise<string> {
    const fs = require('fs').promises;
    const buffer = await fs.readFile(filePath);

    // 1. BOM (Byte Order Mark) チェック
    const bomEncoding = this.detectBOM(buffer);
    if (bomEncoding) {
      return bomEncoding;
    }

    // 2. chardet による検出
    const detected = chardet.detect(buffer);
    if (detected && this.isValidEncoding(detected)) {
      return this.normalizeEncoding(detected);
    }

    // 3. 日本語エンコーディングの詳細検出
    const japaneseEncoding = Encoding.detect(buffer);
    if (japaneseEncoding) {
      return this.normalizeEncoding(japaneseEncoding);
    }

    // 4. デフォルトはUTF-8
    return 'utf-8';
  }

  /**
   * BOMを検出する
   */
  private detectBOM(buffer: Buffer): string | null {
    // UTF-8 BOM: EF BB BF
    if (buffer.length >= 3 &&
        buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      return 'utf-8';
    }

    // UTF-16 LE BOM: FF FE
    if (buffer.length >= 2 &&
        buffer[0] === 0xFF && buffer[1] === 0xFE) {
      return 'utf-16le';
    }

    // UTF-16 BE BOM: FE FF
    if (buffer.length >= 2 &&
        buffer[0] === 0xFE && buffer[1] === 0xFF) {
      return 'utf-16be';
    }

    return null;
  }

  /**
   * エンコーディング名を正規化する
   */
  private normalizeEncoding(encoding: string): string {
    const normalized = encoding.toLowerCase().replace(/[_-]/g, '');

    const encodingMap: Record<string, string> = {
      'shiftjis': 'shift-jis',
      'sjis': 'shift-jis',
      'eucjp': 'euc-jp',
      'utf8': 'utf-8',
      'utf16le': 'utf-16le',
      'utf16be': 'utf-16be',
    };

    return encodingMap[normalized] || encoding;
  }

  /**
   * サポートされているエンコーディングか確認する
   */
  private isValidEncoding(encoding: string): boolean {
    const supported = ['utf-8', 'shift-jis', 'euc-jp', 'utf-16le', 'utf-16be', 'ascii'];
    return supported.includes(this.normalizeEncoding(encoding));
  }
}
```

### 9.3 バックアップ管理

ファイル書き込み時のバックアップ戦略の詳細なのだ：

```typescript
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * バックアップマネージャー
 */
class BackupManager {
  private backupDir: string;
  private retentionDays: number;
  private maxGenerations: number;

  constructor(
    projectRoot: string,
    retentionDays: number = 7,
    maxGenerations: number = 10
  ) {
    this.backupDir = path.join(projectRoot, '.backup');
    this.retentionDays = retentionDays;
    this.maxGenerations = maxGenerations;
  }

  /**
   * ファイルのバックアップを作成する
   */
  async createBackup(filePath: string): Promise<string> {
    // バックアップディレクトリが存在しない場合は作成
    await fs.mkdir(this.backupDir, { recursive: true });

    // バックアップファイル名を生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const relativePath = path.relative(process.cwd(), filePath);
    const backupFileName = `${relativePath.replace(/\//g, '_')}.${timestamp}.bak`;
    const backupPath = path.join(this.backupDir, backupFileName);

    // バックアップディレクトリの親ディレクトリを作成
    await fs.mkdir(path.dirname(backupPath), { recursive: true });

    // ファイルをコピー
    await fs.copyFile(filePath, backupPath);

    // 古いバックアップを削除
    await this.cleanupOldBackups(filePath);

    return backupPath;
  }

  /**
   * 古いバックアップを削除する
   */
  private async cleanupOldBackups(originalFilePath: string): Promise<void> {
    const relativePath = path.relative(process.cwd(), originalFilePath);
    const pattern = `${relativePath.replace(/\//g, '_')}.`;

    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith(pattern))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f),
        }));

      // 1. 世代数による削除
      if (backupFiles.length > this.maxGenerations) {
        // 古い順にソート
        backupFiles.sort((a, b) => a.name.localeCompare(b.name));

        // 超過分を削除
        const toDelete = backupFiles.slice(0, backupFiles.length - this.maxGenerations);
        for (const file of toDelete) {
          await fs.unlink(file.path);
        }
      }

      // 2. 保存期間による削除
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      for (const file of backupFiles) {
        const stats = await fs.stat(file.path);
        if (stats.mtime < cutoffDate) {
          await fs.unlink(file.path);
        }
      }
    } catch (error) {
      // エラーが発生してもバックアップ作成は成功とする
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * バックアップから復元する
   */
  async restore(backupPath: string, targetPath: string): Promise<void> {
    await fs.copyFile(backupPath, targetPath);
  }

  /**
   * バックアップディレクトリの容量をチェックする
   */
  async checkDiskUsage(): Promise<number> {
    let totalSize = 0;

    try {
      const files = await fs.readdir(this.backupDir, { withFileTypes: true });

      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(this.backupDir, file.name);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.error('Failed to check disk usage:', error);
    }

    return totalSize;
  }
}
```

### 9.4 パフォーマンスモニタリング

レスポンスタイムを測定・記録するための実装なのだ：

```typescript
/**
 * パフォーマンスモニター
 */
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * 操作の実行時間を測定する
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric(operation, duration);

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric(`${operation}_error`, duration);

      throw error;
    }
  }

  /**
   * メトリクスを記録する
   */
  private recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    this.metrics.get(operation)!.push(duration);
  }

  /**
   * 統計情報を取得する
   */
  getStatistics(operation: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const durations = this.metrics.get(operation);
    if (!durations || durations.length === 0) {
      return null;
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: sorted.length,
      average: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }

  /**
   * すべてのメトリクスをクリアする
   */
  clear(): void {
    this.metrics.clear();
  }
}
```

---

## 10. テスト戦略

### 10.1 単体テスト

- **対象**: 各マネージャークラス、バリデーター、ユーティリティ関数
- **フレームワーク**: Jest
- **カバレッジ目標**: 80%以上

### 10.2 統合テスト

- **対象**: MCPサーバー ↔ エディタアダプター間の通信
- **手法**: モックエディタAPIを使用した統合テスト

### 10.3 E2Eテスト

- **対象**: 実際のVS Codeとの統合
- **手法**: VS Code Extension Test Runner

---

## 11. デプロイメント

### 11.1 パッケージ構成

**実装ディレクトリ**: `servers/unity_check/`

```
servers/unity_check/
├── src/
│   ├── server/
│   │   ├── MCPServer.ts
│   │   ├── RequestHandler.ts
│   │   └── ResponseFormatter.ts
│   ├── managers/
│   │   ├── FileOperationManager.ts
│   │   ├── CodeEditorManager.ts
│   │   ├── TerminalExecutor.ts
│   │   ├── DiagnosticsProvider.ts
│   │   └── BuildToolDetector.ts
│   ├── security/
│   │   ├── SecurityValidator.ts
│   │   ├── PathValidator.ts
│   │   ├── CommandSanitizer.ts
│   │   └── AuditLogger.ts
│   ├── adapters/
│   │   ├── EditorAdapter.ts
│   │   ├── VSCodeAdapter.ts
│   │   └── UnityEditorAdapter.ts (optional)
│   ├── utils/
│   │   ├── EncodingDetector.ts
│   │   ├── BackupManager.ts
│   │   └── PerformanceMonitor.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── logs/
│   └── .gitkeep
├── .backup/
│   └── .gitkeep
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
└── README.md
```

### 11.2 環境変数

| 変数名 | 説明 | デフォルト値 |
|-------|------|-----------|
| `PROJECT_ROOT` | プロジェクトのルートディレクトリ | `process.cwd()` |
| `LOG_PATH` | 監査ログの出力先 | `./logs/audit.log` |
| `MAX_CONCURRENT_REQUESTS` | 最大同時リクエスト数 | `10` |
| `DEFAULT_TIMEOUT` | デフォルトタイムアウト（ms） | `60000` |
| `MAX_FILE_SIZE` | 最大ファイルサイズ（バイト） | `10485760` (10MB) |
| `BACKUP_RETENTION_DAYS` | バックアップ保存期間（日） | `7` |
| `MAX_BACKUP_GENERATIONS` | ファイルあたりの最大バックアップ世代数 | `10` |

### 11.3 依存パッケージ

#### 11.3.1 本番依存関係 (dependencies)

```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "chardet": "^2.0.0",
  "encoding-japanese": "^2.0.0",
  "winston": "^3.11.0",
  "dotenv": "^16.3.1"
}
```

| パッケージ | 用途 |
|-----------|------|
| `@modelcontextprotocol/sdk` | MCPプロトコル実装 |
| `chardet` | 文字エンコーディング自動検出 |
| `encoding-japanese` | 日本語エンコーディング変換（Shift-JIS, EUC-JP） |
| `winston` | 構造化ロギング・ログローテーション |
| `dotenv` | 環境変数管理 |

#### 11.3.2 開発依存関係 (devDependencies)

```json
{
  "typescript": "^5.3.0",
  "jest": "^29.7.0",
  "@types/node": "^20.10.0",
  "@types/jest": "^29.5.0",
  "ts-jest": "^29.1.0",
  "ts-node": "^10.9.0",
  "eslint": "^8.55.0",
  "@typescript-eslint/parser": "^6.14.0",
  "@typescript-eslint/eslint-plugin": "^6.14.0",
  "prettier": "^3.1.0"
}
```

### 11.4 package.json 例

```json
{
  "name": "@mcp-servers/unity-check",
  "version": "1.0.0",
  "description": "MCP server for editor integration with VS Code and Unity",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "keywords": ["mcp", "editor", "vscode", "unity", "ai-agent"],
  "author": "ずんだもん",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "chardet": "^2.0.0",
    "encoding-japanese": "^2.0.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "jest": "^29.7.0",
    "@types/node": "^20.10.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "prettier": "^3.1.0"
  }
}
```

### 11.5 tsconfig.json 例

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 11.6 jest.config.js 例

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

## 12. 今後の拡張

### 12.1 フェーズ2の機能

- **Git統合**: コミット、プッシュ、プルなどのGit操作
- **デバッガー統合**: ブレークポイント設定、ステップ実行
- **リファクタリングツール**: シンボルのリネーム、メソッド抽出

### 12.2 追加エディタサポート

- JetBrains IDEs (IntelliJ, PyCharm, WebStorm)
- Vim/Neovim
- Emacs

---

## 13. 変更履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0 | 2025-11-08 | 初版作成 | ずんだもん |
| 1.1 | 2025-11-08 | レビュー反映: 実装ディレクトリ、依存パッケージ、実装詳細を追加 | ずんだもん |

---

## 14. 承認

この技術設計書は、以下の関係者によるレビューと承認が必要なのだ。

- [ ] テクニカルアーキテクト
- [ ] シニアエンジニア
- [ ] セキュリティエンジニア
- [ ] QAエンジニア
