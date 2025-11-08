/**
 * 環境変数設定モジュール
 *
 * アプリケーションで使用する環境変数を読み込み、デフォルト値を適用します。
 */

import dotenv from 'dotenv';
import path from 'path';

// .envファイルを読み込み
dotenv.config({ path: path.join(process.cwd(), '.env') });

/**
 * 環境変数設定インターフェース
 */
export interface EnvironmentConfig {
  /** プロジェクトのルートディレクトリ */
  projectRoot: string;

  /** 監査ログの出力先 */
  logPath: string;

  /** 最大同時リクエスト数 */
  maxConcurrentRequests: number;

  /** デフォルトタイムアウト（ミリ秒） */
  defaultTimeout: number;

  /** 最大ファイルサイズ（バイト） */
  maxFileSize: number;

  /** バックアップ保存期間（日） */
  backupRetentionDays: number;

  /** ファイルあたりの最大バックアップ世代数 */
  maxBackupGenerations: number;

  /** ログレベル */
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * 環境変数から数値を取得し、無効な場合はデフォルト値を返す
 *
 * @param key - 環境変数のキー
 * @param defaultValue - デフォルト値
 * @returns パースされた数値またはデフォルト値
 */
function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 環境変数から文字列を取得し、空の場合はデフォルト値を返す
 *
 * @param key - 環境変数のキー
 * @param defaultValue - デフォルト値
 * @returns 環境変数の値またはデフォルト値
 */
function getStringEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * ログレベルを取得し、バリデーションを行う
 *
 * @param key - 環境変数のキー
 * @param defaultValue - デフォルト値
 * @returns 有効なログレベル
 */
function getLogLevel(
  key: string,
  defaultValue: 'error' | 'warn' | 'info' | 'debug'
): 'error' | 'warn' | 'info' | 'debug' {
  const value = process.env[key];
  const validLevels: Array<'error' | 'warn' | 'info' | 'debug'> = [
    'error',
    'warn',
    'info',
    'debug',
  ];

  if (value && validLevels.includes(value as typeof validLevels[number])) {
    return value as typeof validLevels[number];
  }

  return defaultValue;
}

/**
 * 環境変数設定オブジェクト
 *
 * すべての環境変数を一元管理します。
 */
export const environment: EnvironmentConfig = {
  projectRoot: getStringEnv('PROJECT_ROOT', process.cwd()),
  logPath: getStringEnv('LOG_PATH', './logs/audit.log'),
  maxConcurrentRequests: getNumberEnv('MAX_CONCURRENT_REQUESTS', 10),
  defaultTimeout: getNumberEnv('DEFAULT_TIMEOUT', 60000),
  maxFileSize: getNumberEnv('MAX_FILE_SIZE', 10485760), // 10MB
  backupRetentionDays: getNumberEnv('BACKUP_RETENTION_DAYS', 7),
  maxBackupGenerations: getNumberEnv('MAX_BACKUP_GENERATIONS', 10),
  logLevel: getLogLevel('LOG_LEVEL', 'info'),
};

/**
 * 環境設定を取得する
 *
 * @returns 環境変数設定オブジェクト
 */
export function getEnvironment(): EnvironmentConfig {
  return environment;
}
