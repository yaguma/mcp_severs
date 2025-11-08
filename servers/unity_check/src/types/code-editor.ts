/**
 * コード編集関連の型定義
 */

/**
 * コード編集マネージャー
 */
export interface ICodeEditorManager {
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
export interface InsertCodeRequest {
  /** ファイルパス */
  path: string;
  /** 挿入位置の行番号（1始まり） */
  line: number;
  /** 挿入するコード */
  content: string;
  /** インデントを保持するか */
  preserveIndent?: boolean;
}

/**
 * コード挿入レスポンス
 */
export interface InsertCodeResponse {
  /** 変更された範囲 */
  modifiedRange: {
    /** 開始行 */
    start: number;
    /** 終了行 */
    end: number;
  };
  /** 挿入された行数 */
  linesInserted: number;
}

/**
 * コード削除リクエスト
 */
export interface DeleteCodeRequest {
  /** ファイルパス */
  path: string;
  /** 削除開始行（1始まり） */
  startLine: number;
  /** 削除終了行（inclusive） */
  endLine: number;
  /** 100行以上の場合、確認が必要か */
  requireConfirmation?: boolean;
}

/**
 * コード削除レスポンス
 */
export interface DeleteCodeResponse {
  /** 削除された行数 */
  linesDeleted: number;
  /** 確認されたか */
  confirmed: boolean;
}

/**
 * コード置換リクエスト
 */
export interface ReplaceCodeRequest {
  /** ファイルパス */
  path: string;
  /** 検索パターン */
  pattern: string;
  /** 置換後の文字列 */
  replacement: string;
  /** 正規表現を使用するか */
  isRegex?: boolean;
  /** プレビューモード */
  preview?: boolean;
}

/**
 * コード置換レスポンス
 */
export interface ReplaceCodeResponse {
  /** 置換された箇所の数 */
  replacementCount: number;
  /** 影響を受けた行番号のリスト */
  affectedLines: number[];
  /** プレビュー（diff形式） */
  preview?: string;
}
