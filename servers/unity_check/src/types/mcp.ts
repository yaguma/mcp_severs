/**
 * MCP (Model Context Protocol) 型定義
 */

/**
 * MCPサーバーのメインインターフェース
 */
export interface IMCPServer {
  /**
   * サーバーを起動する
   */
  start(): Promise<void>;

  /**
   * サーバーを停止する
   */
  stop(): Promise<void>;

  /**
   * ツールリクエストを処理する
   */
  handleToolRequest(request: ToolRequest): Promise<ToolResponse>;

  /**
   * 利用可能なツールのリストを取得する
   */
  listTools(): ToolDefinition[];
}

/**
 * ツール定義
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

/**
 * JSONスキーマ型
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * ツールリクエスト
 */
export interface ToolRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
  timestamp: number;
}

/**
 * ツールレスポンス
 */
export interface ToolResponse {
  id: string;
  result?: unknown;
  error?: ErrorResponse;
  timestamp: number;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * エラーコード
 */
export enum ErrorCode {
  INVALID_PARAMS = 'INVALID_PARAMS',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  COMMAND_BLOCKED = 'COMMAND_BLOCKED',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
