/**
 * セキュリティ関連の型定義
 */

/**
 * セキュリティバリデーター
 */
export interface ISecurityValidator {
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
export interface ValidationResult {
  /** 検証が成功したか */
  valid: boolean;
  /** エラーメッセージ */
  error?: string;
  /** 理由 */
  reason?: string;
}

/**
 * 操作ログ
 */
export interface OperationLog {
  /** タイムスタンプ */
  timestamp: number;
  /** 操作名 */
  operation: string;
  /** パラメータ */
  params: Record<string, unknown>;
  /** 結果 */
  result: 'success' | 'error' | 'blocked';
  /** ユーザーID（オプション） */
  userId?: string;
  /** セッションID（オプション） */
  sessionId?: string;
}
