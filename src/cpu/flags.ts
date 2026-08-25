export const FLAG_NAMES = ['CF', 'PF', 'AF', 'ZF', 'SF', 'OF'] as const;
export type FlagName = (typeof FLAG_NAMES)[number];
export type Flags = Record<FlagName, boolean>;

export function createFlags(): Flags {
  return { CF: false, PF: false, AF: false, ZF: false, SF: false, OF: false };
}
