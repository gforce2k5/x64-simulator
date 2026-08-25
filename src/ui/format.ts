export function formatHex(value: bigint, width = 64): string {
  const digits = Math.ceil(width / 4);
  return `0x${BigInt.asUintN(width, value).toString(16).toUpperCase().padStart(digits, '0')}`;
}
