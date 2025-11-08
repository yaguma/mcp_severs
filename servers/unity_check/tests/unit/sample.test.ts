/**
 * サンプルテストファイル
 * Jestのテスト環境が正しく動作することを確認
 */

describe('サンプルテスト', () => {
  test('基本的な演算のテスト', () => {
    expect(1 + 1).toBe(2);
  });

  test('文字列のテスト', () => {
    const greeting = 'Hello, World!';
    expect(greeting).toContain('World');
  });

  test('配列のテスト', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
  });

  test('オブジェクトのテスト', () => {
    const user = {
      name: 'ずんだもん',
      role: 'AI Assistant',
    };
    expect(user).toHaveProperty('name');
    expect(user.name).toBe('ずんだもん');
  });

  test('非同期関数のテスト', async () => {
    const asyncFunction = async (): Promise<string> => {
      return 'success';
    };
    const result = await asyncFunction();
    expect(result).toBe('success');
  });
});
