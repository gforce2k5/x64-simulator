/** Reserved architectural boundary for future byte-addressable memory support. */
export class Memory {
  private readonly bytes = new Map<bigint, number>();

  readByte(address: bigint): number {
    return this.bytes.get(address) ?? 0;
  }

  writeByte(address: bigint, value: number): void {
    this.bytes.set(address, value & 0xff);
  }

  clone(): Memory {
    const copy = new Memory();
    for (const [address, value] of this.bytes) copy.bytes.set(address, value);
    return copy;
  }
}
