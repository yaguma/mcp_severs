/**
 * 診断情報関連の型定義
 */

/**
 * 診断情報プロバイダー
 */
export interface IDiagnosticsProvider {
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
export interface Diagnostic {
  /** ファイルパス */
  file: string;
  /** 範囲 */
  range: {
    /** 開始位置 */
    start: { line: number; column: number };
    /** 終了位置 */
    end: { line: number; column: number };
  };
  /** 重大度 */
  severity: 'error' | 'warning' | 'info' | 'hint';
  /** メッセージ */
  message: string;
  /** エラーコード */
  code?: string;
  /** ソース（例: 'typescript', 'eslint'） */
  source?: string;
}

/**
 * クイックフィックス
 */
export interface QuickFix {
  /** 一意なID */
  id: string;
  /** タイトル */
  title: string;
  /** 説明 */
  description?: string;
  /** テキスト編集のリスト */
  edits: TextEdit[];
  /** 対象の診断情報 */
  diagnostic: Diagnostic;
}

/**
 * テキスト編集
 */
export interface TextEdit {
  /** ファイルパス */
  file: string;
  /** 編集範囲 */
  range: {
    /** 開始位置 */
    start: { line: number; column: number };
    /** 終了位置 */
    end: { line: number; column: number };
  };
  /** 新しいテキスト */
  newText: string;
}

/**
 * 修正適用レスポンス
 */
export interface ApplyFixResponse {
  /** 成功したか */
  success: boolean;
  /** 変更されたファイルのリスト */
  filesModified: string[];
  /** 差分（オプション） */
  diff?: string;
}
