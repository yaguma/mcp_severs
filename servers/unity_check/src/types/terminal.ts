/**
 * ターミナル実行とビルド関連の型定義
 */

/**
 * ターミナル実行マネージャー
 */
export interface ITerminalExecutor {
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
export interface ExecuteCommandRequest {
  /** 実行するコマンド */
  command: string;
  /** コマンド引数 */
  args?: string[];
  /** 作業ディレクトリ */
  cwd?: string;
  /** タイムアウト（ミリ秒）デフォルト: 60000 */
  timeout?: number;
  /** バックグラウンド実行 */
  background?: boolean;
}

/**
 * コマンド実行レスポンス
 */
export interface ExecuteCommandResponse {
  /** 終了コード */
  exitCode: number;
  /** 標準出力 */
  stdout: string;
  /** 標準エラー出力 */
  stderr: string;
  /** 実行時間（ミリ秒） */
  executionTime: number;
  /** バックグラウンドプロセスのプロセスID */
  processId?: string;
}

/**
 * ビルドリクエスト
 */
export interface BuildRequest {
  /** プロジェクトパス */
  projectPath: string;
  /** ビルドタイプ */
  buildType?: 'npm' | 'yarn' | 'pnpm' | 'maven' | 'gradle' | 'msbuild' | 'auto';
  /** ビルドターゲット（例: 'build', 'test', 'prod'） */
  target?: string;
}

/**
 * ビルドレスポンス
 */
export interface BuildResponse {
  /** ビルドが成功したか */
  success: boolean;
  /** ビルドログ */
  buildLog: string;
  /** ビルドエラーのリスト */
  errors: BuildError[];
  /** ビルド警告のリスト */
  warnings: BuildWarning[];
  /** 生成されたアーティファクトのパス */
  artifacts?: string[];
}

/**
 * ビルドエラー
 */
export interface BuildError {
  /** ファイルパス */
  file: string;
  /** 行番号 */
  line: number;
  /** 列番号 */
  column: number;
  /** エラーメッセージ */
  message: string;
  /** 重大度 */
  severity: 'error';
}

/**
 * ビルド警告
 */
export interface BuildWarning {
  /** ファイルパス */
  file: string;
  /** 行番号 */
  line: number;
  /** 列番号 */
  column: number;
  /** 警告メッセージ */
  message: string;
  /** 重大度 */
  severity: 'warning';
}
