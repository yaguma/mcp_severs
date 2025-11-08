/**
 * E2Eテスト用のサンプルファイル
 */

export class SampleClass {
  private value: number;

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  public getValue(): number {
    return this.value;
  }

  public setValue(newValue: number): void {
    this.value = newValue;
  }

  public increment(): void {
    this.value++;
  }

  public decrement(): void {
    this.value--;
  }
}

export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
