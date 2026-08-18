// Subconjunto de Discord Permission Flags que nos importa hoy.
// https://discord.com/developers/docs/topics/permissions
export const PERMISSION_BITS = {
  ADMINISTRATOR: BigInt(0x8),
  MANAGE_GUILD: BigInt(0x20),
  VIEW_CHANNEL: BigInt(0x400),
  SEND_MESSAGES: BigInt(0x800),
} as const;

export function hasManageAccess(permissions: bigint): boolean {
  return (
    (permissions & PERMISSION_BITS.ADMINISTRATOR) === PERMISSION_BITS.ADMINISTRATOR ||
    (permissions & PERMISSION_BITS.MANAGE_GUILD) === PERMISSION_BITS.MANAGE_GUILD
  );
}
