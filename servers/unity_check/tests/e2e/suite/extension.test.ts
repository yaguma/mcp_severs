import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { E2ETestHelper, getTestWorkspacePath } from '../helper';

suite('E2E Test Suite', () => {
  const helper = new E2ETestHelper();
  const workspacePath = getTestWorkspacePath();

  suiteSetup(async function () {
    this.timeout(30000); // 30秒のタイムアウト

    // テストワークスペースを開く
    await helper.openTestWorkspace(workspacePath);
    await helper.sleep(2000); // ワークスペースの読み込みを待つ
  });

  suiteTeardown(async () => {
    // MCPサーバーを停止
    await helper.stopMCPServer();
  });

  test('VS Code Extension API is available', () => {
    assert.ok(vscode, 'VS Code API should be available');
    assert.ok(vscode.workspace, 'Workspace API should be available');
    assert.ok(vscode.window, 'Window API should be available');
  });

  test('Workspace is opened', () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders, 'Workspace folders should be available');
    assert.strictEqual(
      workspaceFolders!.length,
      1,
      'Should have exactly one workspace folder'
    );
  });

  test('Can create and read test file', async () => {
    const testFilePath = path.join(workspacePath, 'test-file.txt');
    const testContent = 'This is a test file for E2E testing.';

    // ファイルを作成
    await helper.createTestFile(testFilePath, testContent);

    // ファイルを読み取る
    const content = await helper.readTestFile(testFilePath);
    assert.strictEqual(
      content,
      testContent,
      'File content should match what was written'
    );

    // クリーンアップ
    await helper.deleteTestFile(testFilePath);
  });

  test('Can open and edit text document', async () => {
    const testFilePath = path.join(workspacePath, 'edit-test.ts');
    const initialContent = 'function test() {\n  return 42;\n}';

    // ファイルを作成
    await helper.createTestFile(testFilePath, initialContent);

    // ドキュメントを開く
    const document = await vscode.workspace.openTextDocument(testFilePath);
    await vscode.window.showTextDocument(document);

    // ドキュメントの内容を確認
    assert.strictEqual(
      document.getText(),
      initialContent,
      'Document content should match initial content'
    );

    // クリーンアップ
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    await helper.deleteTestFile(testFilePath);
  });

  test('Workspace configuration is accessible', () => {
    const config = vscode.workspace.getConfiguration();
    assert.ok(config, 'Workspace configuration should be accessible');

    const editorConfig = vscode.workspace.getConfiguration('editor');
    assert.ok(editorConfig, 'Editor configuration should be accessible');
  });

  test('Can get editor settings', () => {
    const config = vscode.workspace.getConfiguration('editor');
    const tabSize = config.get<number>('tabSize');
    const insertSpaces = config.get<boolean>('insertSpaces');

    assert.ok(typeof tabSize === 'number', 'Tab size should be a number');
    assert.ok(
      typeof insertSpaces === 'boolean',
      'Insert spaces should be a boolean'
    );
  });
});
