/**
 * ロギング設定モジュール
 *
 * Winstonを使用した構造化ロギングとログローテーションを提供します。
 */

import winston from 'winston';
import path from 'path';
import { environment } from '../config/environment';

/**
 * ログレベルの定義
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * ログフォーマットの設定
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * コンソール出力用のフォーマット
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...metadata } = info;
    let msg = `${String(timestamp)} [${String(level)}]: ${String(message)}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

/**
 * Winstonロガーインスタンス
 */
export const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: environment.logLevel,
  format: logFormat,
  transports: [
    // コンソール出力
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // エラーログファイル（日次ローテーション）
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // 警告ログファイル（日次ローテーション）
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'warn.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // 統合ログファイル（日次ローテーション）
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),

    // デバッグログファイル（開発環境のみ）
    ...(environment.logLevel === 'debug'
      ? [
          new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'debug.log'),
            level: 'debug',
            maxsize: 5242880, // 5MB
            maxFiles: 3,
          }),
        ]
      : []),
  ],
  exitOnError: false,
});

/**
 * ログディレクトリが存在しない場合は作成する
 */
import fs from 'fs';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * ログ出力のヘルパー関数
 */

/**
 * エラーログを出力する
 *
 * @param message - ログメッセージ
 * @param metadata - 追加のメタデータ
 */
export function error(message: string, metadata?: Record<string, unknown>): void {
  logger.error(message, metadata);
}

/**
 * 警告ログを出力する
 *
 * @param message - ログメッセージ
 * @param metadata - 追加のメタデータ
 */
export function warn(message: string, metadata?: Record<string, unknown>): void {
  logger.warn(message, metadata);
}

/**
 * 情報ログを出力する
 *
 * @param message - ログメッセージ
 * @param metadata - 追加のメタデータ
 */
export function info(message: string, metadata?: Record<string, unknown>): void {
  logger.info(message, metadata);
}

/**
 * デバッグログを出力する
 *
 * @param message - ログメッセージ
 * @param metadata - 追加のメタデータ
 */
export function debug(message: string, metadata?: Record<string, unknown>): void {
  logger.debug(message, metadata);
}

/**
 * ロガーをシャットダウンする
 *
 * アプリケーション終了時に呼び出します。
 * すべてのトランスポートを閉じ、バッファをフラッシュします。
 */
export function shutdown(): Promise<void> {
  return new Promise((resolve) => {
    logger.on('finish', () => {
      resolve();
    });
    logger.end();
  });
}

/**
 * デフォルトエクスポート
 */
export default logger;
