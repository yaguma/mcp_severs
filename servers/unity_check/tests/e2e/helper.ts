import * as vscode from 'vscode';
import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';

/**
 * E2Eテストヘルパークラス
 */
export class E2ETestHelper {
  private serverProcess: ChildProcess | null = null;

  /**
   * MCPサーバーを起動する
   * @param serverPath サーバーのエントリポイントのパス
   * @returns サーバープロセス
   */
  async startMCPServer(serverPath: string): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      const serverProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      });

      serverProcess.on('error', (err) => {
        reject(new Error(`Failed to start MCP server: ${err.message}`));
      });

      // Wait for server to be ready
      setTimeout(() => {
        this.serverProcess = serverProcess;
        resolve(serverProcess);
      }, 2000);
    });
  }

  /**
   * MCPサーバーを停止する
   */
  async stopMCPServer(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  /**
   * テスト用のワークスペースを開く
   * @param workspacePath ワークスペースのパス
   */
  async openTestWorkspace(workspacePath: string): Promise<void> {
    const uri = vscode.Uri.file(workspacePath);
    await vscode.commands.executeCommand('vscode.openFolder', uri);
  }

  /**
   * テスト用のファイルを作成する
   * @param filePath ファイルパス
   * @param content ファイル内容
   */
  async createTestFile(filePath: string, content: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    await vscode.workspace.fs.writeFile(uri, data);
  }

  /**
   * テスト用のファイルを削除する
   * @param filePath ファイルパス
   */
  async deleteTestFile(filePath: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    await vscode.workspace.fs.delete(uri);
  }

  /**
   * ファイルの内容を読み取る
   * @param filePath ファイルパス
   * @returns ファイル内容
   */
  async readTestFile(filePath: string): Promise<string> {
    const uri = vscode.Uri.file(filePath);
    const data = await vscode.workspace.fs.readFile(uri);
    const decoder = new TextDecoder();
    return decoder.decode(data);
  }

  /**
   * 指定時間待機する
   * @param ms 待機時間（ミリ秒）
   */
  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * テスト用のワークスペースパスを取得する
 */
export function getTestWorkspacePath(): string {
  return path.resolve(__dirname, './workspace');
}
