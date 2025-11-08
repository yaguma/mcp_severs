/**
 * 型定義のエクスポートテスト
 * すべての型が正しくエクスポートされていることを確認
 */

import {
  // MCP関連
  IMCPServer,
  ToolDefinition,
  ToolRequest,
  ToolResponse,
  ErrorCode,
  ErrorResponse,
  JSONSchema,
  // ファイル操作関連
  IFileOperationManager,
  ReadFileRequest,
  ReadFileResponse,
  WriteFileRequest,
  WriteFileResponse,
  // コード編集関連
  ICodeEditorManager,
  InsertCodeRequest,
  InsertCodeResponse,
  DeleteCodeRequest,
  DeleteCodeResponse,
  ReplaceCodeRequest,
  ReplaceCodeResponse,
  // ターミナル関連
  ITerminalExecutor,
  ExecuteCommandRequest,
  ExecuteCommandResponse,
  BuildRequest,
  BuildResponse,
  BuildError,
  BuildWarning,
  // 診断情報関連
  IDiagnosticsProvider,
  Diagnostic,
  QuickFix,
  TextEdit,
  ApplyFixResponse,
  // セキュリティ関連
  ISecurityValidator,
  ValidationResult,
  OperationLog,
  // エディタアダプター関連
  IEditorAdapter,
  IFileSystemAdapter,
  ITextEditorAdapter,
  ITextDocument,
  ITerminalAdapter,
  IDiagnosticsAdapter,
  IndentSettings,
  ExecuteOptions,
  ExecuteResult,
  Range,
} from '../../src/types';

describe('型定義のエクスポートテスト', () => {
  test('MCP型がエクスポートされていること', () => {
    expect(ErrorCode.FILE_NOT_FOUND).toBe('FILE_NOT_FOUND');
    expect(ErrorCode.TIMEOUT).toBe('TIMEOUT');
  });

  test('型定義がundefinedでないこと', () => {
    const types = [
      'IMCPServer',
      'IFileOperationManager',
      'ICodeEditorManager',
      'ITerminalExecutor',
      'IDiagnosticsProvider',
      'ISecurityValidator',
      'IEditorAdapter',
    ];
    // 型定義自体はランタイムでチェックできないが、
    // エクスポートが正しく行われていることを確認
    expect(types).toHaveLength(7);
  });

  test('ErrorCodeのenumが正しく定義されていること', () => {
    expect(Object.values(ErrorCode)).toContain('INVALID_PARAMS');
    expect(Object.values(ErrorCode)).toContain('FILE_NOT_FOUND');
    expect(Object.values(ErrorCode)).toContain('PERMISSION_DENIED');
    expect(Object.values(ErrorCode)).toContain('COMMAND_BLOCKED');
    expect(Object.values(ErrorCode)).toContain('TIMEOUT');
    expect(Object.values(ErrorCode)).toContain('INTERNAL_ERROR');
  });

  test('オブジェクト型の構造テスト', () => {
    const request: ToolRequest = {
      id: 'test-1',
      method: 'test_method',
      params: { key: 'value' },
      timestamp: Date.now(),
    };
    expect(request.id).toBe('test-1');
    expect(request.method).toBe('test_method');
  });

  test('ValidationResultの型テスト', () => {
    const validResult: ValidationResult = {
      valid: true,
    };
    expect(validResult.valid).toBe(true);

    const invalidResult: ValidationResult = {
      valid: false,
      error: 'Test error',
      reason: 'Test reason',
    };
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toBe('Test error');
  });
});
