/**
 * ファイル操作関連の型定義
 */

/**
 * ファイル操作マネージャー
 */
export interface IFileOperationManager {
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
export interface ReadFileRequest {
  /** ファイルパス */
  path: string;
  /** エンコーディング: 'utf-8' | 'shift-jis' | 'euc-jp' | 'auto' */
  encoding?: string;
  /** 最大読み取りサイズ（バイト） */
  maxSize?: number;
}

/**
 * ファイル読み取りレスポンス
 */
export interface ReadFileResponse {
  /** ファイル内容 */
  content: string;
  /** 検出されたエンコーディング */
  encoding: string;
  /** ファイルサイズ（バイト） */
  size: number;
  /** 切り詰められたかどうか */
  isTruncated: boolean;
}

/**
 * ファイル書き込みリクエスト
 */
export interface WriteFileRequest {
  /** ファイルパス */
  path: string;
  /** 書き込む内容 */
  content: string;
  /** エンコーディング */
  encoding?: string;
  /** バックアップを作成するか */
  createBackup?: boolean;
  /** ディレクトリを自動作成するか */
  createDirectories?: boolean;
}

/**
 * ファイル書き込みレスポンス
 */
export interface WriteFileResponse {
  /** 書き込んだファイルパス */
  path: string;
  /** 書き込んだバイト数 */
  bytesWritten: number;
  /** バックアップファイルパス（作成された場合） */
  backupPath?: string;
}
