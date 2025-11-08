/**
 * エディタアダプター関連の型定義
 * エディタ非依存の抽象化層
 */

import { Diagnostic, QuickFix, TextEdit } from './diagnostics';

/**
 * エディタアダプター（抽象化層）
 */
export interface IEditorAdapter {
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
export interface IFileSystemAdapter {
  /** ファイルを読み取る */
  readFile(path: string): Promise<Uint8Array>;
  /** ファイルに書き込む */
  writeFile(path: string, content: Uint8Array): Promise<void>;
  /** ファイルを削除する */
  delete(path: string): Promise<void>;
  /** ディレクトリを作成する */
  createDirectory(path: string): Promise<void>;
  /** ファイルが存在するか確認する */
  exists(path: string): Promise<boolean>;
}

/**
 * テキストエディタアダプター
 */
export interface ITextEditorAdapter {
  /** ドキュメントを開く */
  openDocument(path: string): Promise<ITextDocument>;
  /** 編集を適用する */
  applyEdit(edit: TextEdit): Promise<boolean>;
  /** ドキュメントをフォーマットする */
  formatDocument(path: string): Promise<void>;
  /** インデント設定を取得する */
  getIndentSettings(): IndentSettings;
}

/**
 * テキストドキュメント
 */
export interface ITextDocument {
  /** ファイルパス */
  path: string;
  /** 行数 */
  lineCount: number;
  /** テキストを取得する */
  getText(range?: Range): string;
  /** 指定行のテキストを取得する */
  getLineAt(line: number): string;
}

/**
 * 範囲
 */
export interface Range {
  /** 開始位置 */
  start: { line: number; column: number };
  /** 終了位置 */
  end: { line: number; column: number };
}

/**
 * インデント設定
 */
export interface IndentSettings {
  /** タブを使用するか */
  useTabs: boolean;
  /** タブサイズ */
  tabSize: number;
}

/**
 * ターミナルアダプター
 */
export interface ITerminalAdapter {
  /** コマンドを実行する */
  execute(command: string, args: string[], options: ExecuteOptions): Promise<ExecuteResult>;
}

/**
 * 実行オプション
 */
export interface ExecuteOptions {
  /** 作業ディレクトリ */
  cwd?: string;
  /** タイムアウト（ミリ秒） */
  timeout?: number;
  /** バックグラウンド実行 */
  background?: boolean;
}

/**
 * 実行結果
 */
export interface ExecuteResult {
  /** 終了コード */
  exitCode: number;
  /** 標準出力 */
  stdout: string;
  /** 標準エラー出力 */
  stderr: string;
}

/**
 * 診断情報アダプター
 */
export interface IDiagnosticsAdapter {
  /** 診断情報を取得する */
  getDiagnostics(path: string): Promise<Diagnostic[]>;
  /** コードアクション（クイックフィックス）を取得する */
  getCodeActions(diagnostic: Diagnostic): Promise<QuickFix[]>;
}
