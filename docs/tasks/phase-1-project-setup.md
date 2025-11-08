# Phase 1: プロジェクトセットアップ（約1ヶ月）

**期間**: 2025年11月 - 2025年12月
**目標**: MCPエディタ統合サーバーの基盤構築と開発環境の整備

---

## タスク一覧

### Week 1: プロジェクト構造と基本設定（5日間）

#### Day 1: プロジェクトディレクトリ構造の作成
- **タスク**: `servers/unity_check/` 配下のディレクトリ構造を作成する
- **成果物**:
  ```
  servers/unity_check/
  ├── src/
  │   ├── server/
  │   ├── managers/
  │   ├── security/
  │   ├── adapters/
  │   ├── utils/
  │   ├── types/
  │   └── index.ts
  ├── tests/
  │   ├── unit/
  │   ├── integration/
  │   └── e2e/
  ├── logs/
  └── .backup/
  ```
- **依存関係**: なし
- **所要時間**: 1日
- **担当者**: 開発者
- **受け入れ基準**:
  - [ ] 設計書通りのディレクトリ構造が作成されていること
  - [ ] `.gitkeep` ファイルが `logs/` と `.backup/` に配置されていること

---

#### Day 2: package.json の作成と依存パッケージの定義
- **タスク**: プロジェクトの `package.json` を作成し、必要な依存関係を定義する
- **成果物**:
  - `package.json` ファイル
  - 本番依存関係:
    - `@modelcontextprotocol/sdk`
    - `chardet`
    - `encoding-japanese`
    - `winston`
    - `dotenv`
  - 開発依存関係:
    - `typescript`
    - `jest`
    - `@types/node`
    - `@types/jest`
    - `ts-jest`
    - `ts-node`
    - `eslint`
    - `@typescript-eslint/parser`
    - `@typescript-eslint/eslint-plugin`
    - `prettier`
- **依存関係**: Day 1
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] package.json が設計書の仕様に従って作成されていること
  - [ ] すべての必要な依存パッケージが記載されていること
  - [ ] npm scripts が定義されていること（build, test, start, lint, format）

---

#### Day 3: TypeScript設定とビルド環境の構築
- **タスク**: `tsconfig.json` を作成し、TypeScriptのビルド設定を行う
- **成果物**:
  - `tsconfig.json` ファイル
  - コンパイラオプション設定:
    - target: ES2020
    - module: commonjs
    - strict: true
    - outDir: ./dist
    - rootDir: ./src
- **依存関係**: Day 2
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] tsconfig.json が設計書の仕様に従って作成されていること
  - [ ] `npm run build` でコンパイルが正常に実行できること
  - [ ] dist/ ディレクトリに成果物が出力されること

---

#### Day 4: コード品質ツールの設定（ESLint, Prettier）
- **タスク**: ESLintとPrettierの設定ファイルを作成する
- **成果物**:
  - `.eslintrc.json` ファイル
  - `.prettierrc.json` ファイル
  - `.eslintignore` ファイル
- **依存関係**: Day 3
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] `npm run lint` でLintチェックが実行できること
  - [ ] `npm run format` でコードフォーマットが実行できること
  - [ ] TypeScript推奨ルールが適用されていること

---

#### Day 5: テストフレームワークの設定（Jest）
- **タスク**: Jestのテスト環境を構築する
- **成果物**:
  - `jest.config.js` ファイル
  - `tests/setup.ts` ファイル（テストセットアップ）
  - サンプルテストファイル `tests/unit/sample.test.ts`
- **依存関係**: Day 4
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] `npm test` でテストが実行できること
  - [ ] カバレッジレポートが生成されること
  - [ ] カバレッジ閾値が80%に設定されていること

---

### Week 2: コア型定義とインターフェース設計（5日間）

#### Day 6: MCPプロトコル型定義の作成
- **タスク**: MCPサーバーの基本型を定義する
- **成果物**: `src/types/mcp.ts`
  - `IMCPServer` インターフェース
  - `ToolRequest` / `ToolResponse` 型
  - `ToolDefinition` 型
  - `ErrorResponse` 型
  - `ErrorCode` enum
- **依存関係**: Day 5
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] 設計書のインターフェース定義がすべて実装されていること
  - [ ] TypeScriptの型チェックが通ること
  - [ ] 型定義にドキュメントコメントが付与されていること

---

#### Day 7: ファイル操作の型定義
- **タスク**: ファイル操作に関する型を定義する
- **成果物**: `src/types/file-operations.ts`
  - `IFileOperationManager` インターフェース
  - `ReadFileRequest` / `ReadFileResponse` 型
  - `WriteFileRequest` / `WriteFileResponse` 型
- **依存関係**: Day 6
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] 設計書のインターフェース定義が実装されていること
  - [ ] すべてのプロパティにドキュメントコメントがあること

---

#### Day 8: コード編集の型定義
- **タスク**: コード編集機能の型を定義する
- **成果物**: `src/types/code-editor.ts`
  - `ICodeEditorManager` インターフェース
  - `InsertCodeRequest` / `InsertCodeResponse` 型
  - `DeleteCodeRequest` / `DeleteCodeResponse` 型
  - `ReplaceCodeRequest` / `ReplaceCodeResponse` 型
- **依存関係**: Day 7
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] すべてのコード編集操作の型が定義されていること
  - [ ] 型安全性が確保されていること

---

#### Day 9: ターミナル実行とビルドの型定義
- **タスク**: ターミナル・ビルド機能の型を定義する
- **成果物**: `src/types/terminal.ts`
  - `ITerminalExecutor` インターフェース
  - `ExecuteCommandRequest` / `ExecuteCommandResponse` 型
  - `BuildRequest` / `BuildResponse` 型
  - `BuildError` / `BuildWarning` 型
- **依存関係**: Day 8
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] ターミナル実行とビルドの型が定義されていること
  - [ ] エラーと警告が明確に区別されていること

---

#### Day 10: 診断情報とセキュリティの型定義
- **タスク**: 診断情報とセキュリティ関連の型を定義する
- **成果物**:
  - `src/types/diagnostics.ts`
    - `IDiagnosticsProvider` インターフェース
    - `Diagnostic` 型
    - `QuickFix` 型
  - `src/types/security.ts`
    - `ISecurityValidator` インターフェース
    - `ValidationResult` 型
    - `OperationLog` 型
- **依存関係**: Day 9
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] すべての診断・セキュリティ型が定義されていること
  - [ ] セキュリティログに必要なフィールドが含まれていること

---

### Week 3: エディタアダプター型定義と環境設定（5日間）

#### Day 11: エディタアダプターの型定義
- **タスク**: エディタアダプター層の型を定義する
- **成果物**: `src/types/editor-adapter.ts`
  - `IEditorAdapter` インターフェース
  - `IFileSystemAdapter` インターフェース
  - `ITextEditorAdapter` インターフェース
  - `ITerminalAdapter` インターフェース
  - `IDiagnosticsAdapter` インターフェース
- **依存関係**: Day 10
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] エディタ抽象化層のインターフェースが完成していること
  - [ ] VS Code固有のAPIに依存しない設計になっていること

---

#### Day 12: 型定義のエクスポート整理
- **タスク**: すべての型定義を `src/types/index.ts` からエクスポートする
- **成果物**: `src/types/index.ts`
  - すべての型定義のre-export
  - パブリックAPIの整理
- **依存関係**: Day 11
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] すべての型が適切にエクスポートされていること
  - [ ] 循環参照が発生していないこと
  - [ ] `import { XXX } from './types'` で型をインポートできること

---

#### Day 13: 環境変数設定ファイルの作成
- **タスク**: 環境変数のテンプレートと読み込み処理を作成する
- **成果物**:
  - `.env.example` ファイル
    - PROJECT_ROOT
    - LOG_PATH
    - MAX_CONCURRENT_REQUESTS
    - DEFAULT_TIMEOUT
    - MAX_FILE_SIZE
    - BACKUP_RETENTION_DAYS
    - MAX_BACKUP_GENERATIONS
  - `src/config/environment.ts` (環境変数読み込み処理)
- **依存関係**: Day 12
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] .env.example にすべての必要な環境変数が記載されていること
  - [ ] デフォルト値が設定書通りであること
  - [ ] 環境変数の型安全な読み込みができること

---

#### Day 14: ロギング設定の構築
- **タスク**: Winstonを使ったロギング設定を構築する
- **成果物**: `src/utils/logger.ts`
  - ログレベル設定
  - ログローテーション設定
  - ログフォーマット設定
- **依存関係**: Day 13
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] ログファイルが `logs/` ディレクトリに出力されること
  - [ ] ログレベル（debug, info, warn, error）が適切に設定されていること
  - [ ] ログローテーション（日次、最大ファイルサイズ）が設定されていること

---

#### Day 15: .gitignore と README の作成
- **タスク**: プロジェクトのドキュメントを作成する
- **成果物**:
  - `.gitignore` の更新
    - `node_modules/`
    - `dist/`
    - `logs/`
    - `.backup/`
    - `.env`
  - `servers/unity_check/README.md`
    - プロジェクト概要
    - インストール手順
    - 使用方法
    - 開発ガイド
- **依存関係**: Day 14
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] 不要なファイルが Git に含まれないこと
  - [ ] README にプロジェクトのセットアップ手順が記載されていること

---

### Week 4: 基本ユーティリティ実装（5日間）

#### Day 16: パス検証ユーティリティの実装
- **タスク**: セキュリティ用のパス検証を実装する
- **成果物**: `src/security/PathValidator.ts`
  - プロジェクトルート外へのアクセス防止
  - シンボリックリンクチェック
  - パスの正規化処理
- **依存関係**: Day 15
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] プロジェクト外のパスがブロックされること
  - [ ] シンボリックリンクが正しく解決されること
  - [ ] 単体テストが作成されていること

---

#### Day 17: コマンドサニタイゼーション実装
- **タスク**: 危険なコマンドの検出とブロック機能を実装する
- **成果物**: `src/security/CommandSanitizer.ts`
  - 危険なコマンドパターンのリスト
  - コマンド検証ロジック
- **依存関係**: Day 16
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] `rm -rf /`, `format` 等の危険なコマンドがブロックされること
  - [ ] 正常なコマンドは許可されること
  - [ ] 単体テストが作成されていること

---

#### Day 18: 監査ログ実装
- **タスク**: すべての操作をログに記録する機能を実装する
- **成果物**: `src/security/AuditLogger.ts`
  - 操作ログの記録
  - タイムスタンプ付きログ出力
  - ログストリームの管理
- **依存関係**: Day 17
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] 操作が JSON 形式でログファイルに記録されること
  - [ ] ログにタイムスタンプ、操作種別、パラメータ、結果が含まれること
  - [ ] 単体テストが作成されていること

---

#### Day 19: パフォーマンスモニター実装
- **タスク**: レスポンスタイム測定機能を実装する
- **成果物**: `src/utils/PerformanceMonitor.ts`
  - 操作時間の測定
  - 統計情報の収集（平均、最小、最大、P95）
  - メトリクスのクリア機能
- **依存関係**: Day 18
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] 各操作のレスポンスタイムが記録されること
  - [ ] 統計情報が正確に計算されること
  - [ ] 単体テストが作成されていること

---

#### Day 20: エンコーディング検出器の実装
- **タスク**: ファイルエンコーディング自動検出機能を実装する
- **成果物**: `src/utils/EncodingDetector.ts`
  - BOM検出
  - chardetによるエンコーディング検出
  - 日本語エンコーディング対応（Shift-JIS, EUC-JP）
- **依存関係**: Day 19
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] UTF-8, Shift-JIS, EUC-JP を正しく検出できること
  - [ ] BOM付きファイルを正しく処理できること
  - [ ] 単体テストが作成されていること

---

### Week 5: バックアップとエラーハンドリング（5日間）

#### Day 21: バックアップマネージャーの実装
- **タスク**: ファイルバックアップ機能を実装する
- **成果物**: `src/utils/BackupManager.ts`
  - バックアップファイルの作成
  - バックアップファイル名生成（タイムスタンプ付き）
  - バックアップの保存期間管理（7日間）
  - 世代管理（最大10世代）
- **依存関係**: Day 20
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] ファイル上書き時に自動でバックアップが作成されること
  - [ ] 古いバックアップが自動削除されること
  - [ ] 単体テストが作成されていること

---

#### Day 22: エラーハンドリングユーティリティの実装
- **タスク**: エラー処理の共通ユーティリティを実装する
- **成果物**: `src/utils/error-handler.ts`
  - エラーレスポンス生成関数
  - リトライ可能判定関数
  - エクスポネンシャルバックオフリトライ関数
- **依存関係**: Day 21
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] 統一されたエラーレスポンスが生成できること
  - [ ] リトライロジックが正しく動作すること
  - [ ] 単体テストが作成されていること

---

#### Day 23: 同時実行制御（セマフォ）の実装
- **タスク**: 並列リクエスト数を制限するセマフォを実装する
- **成果物**: `src/utils/Semaphore.ts`
  - セマフォクラス
  - acquire/release メソッド
  - 最大同時実行数の制御
- **依存関係**: Day 22
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] 最大10並列リクエストに制限できること
  - [ ] キューイング機能が正常に動作すること
  - [ ] 単体テストが作成されていること

---

#### Day 24: ビルドツール自動検出器の実装
- **タスク**: プロジェクトタイプ検出ロジックを実装する
- **成果物**: `src/managers/BuildToolDetector.ts`
  - package.json → npm/yarn/pnpm 検出
  - pom.xml → Maven 検出
  - build.gradle → Gradle 検出
  - *.csproj → MSBuild 検出
- **依存関係**: Day 23
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] 各プロジェクトタイプを正しく検出できること
  - [ ] package-lock.json → npm 等のロックファイルも判定できること
  - [ ] 単体テストが作成されていること

---

#### Day 25: Phase 1 総合テストと統合確認
- **タスク**: これまでの実装を統合し、動作確認する
- **成果物**:
  - 統合テストスイート `tests/integration/phase1.test.ts`
  - Phase 1 完了レポート
- **依存関係**: Day 24
- **所要時間**: 1日
- **受け入れ基準**:
  - [ ] すべてのユーティリティが正常に動作すること
  - [ ] 型定義がすべてエクスポートされていること
  - [ ] テストカバレッジが80%以上であること
  - [ ] ビルドエラーがないこと
  - [ ] Lintエラーがないこと

---

## Phase 1 完了基準

- [ ] プロジェクトディレクトリ構造が完成している
- [ ] package.json, tsconfig.json, jest.config.js が作成されている
- [ ] すべての型定義が完成している
- [ ] セキュリティユーティリティ（パス検証、コマンドサニタイゼーション、監査ログ）が実装されている
- [ ] バックアップマネージャーが実装されている
- [ ] エンコーディング検出器が実装されている
- [ ] ビルドツール検出器が実装されている
- [ ] パフォーマンスモニターが実装されている
- [ ] 単体テストカバレッジが80%以上
- [ ] README とドキュメントが整備されている

---

## Phase 1 成果物サマリー

| カテゴリ | 成果物 | 完了 |
|---------|--------|------|
| プロジェクト設定 | package.json, tsconfig.json, jest.config.js | ☐ |
| 型定義 | 6ファイル (mcp.ts, file-operations.ts, code-editor.ts, terminal.ts, diagnostics.ts, editor-adapter.ts) | ☐ |
| セキュリティ | PathValidator, CommandSanitizer, AuditLogger | ☐ |
| ユーティリティ | EncodingDetector, BackupManager, PerformanceMonitor, Semaphore, BuildToolDetector | ☐ |
| テスト | 単体テスト、統合テスト | ☐ |
| ドキュメント | README.md | ☐ |

---

**次のフェーズ**: [Phase 2: コア機能実装](./phase-2-core-implementation.md)
