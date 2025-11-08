/**
 * Jest テストセットアップファイル
 * すべてのテスト実行前に実行される共通設定
 */

// グローバル設定
global.console = {
  ...console,
  // テスト中のログ出力を抑制（必要に応じて）
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// テストタイムアウトの設定（必要に応じて）
jest.setTimeout(10000);
