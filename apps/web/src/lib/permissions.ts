// lib/permissions.ts

export function canAccessFeature(
  userPermissions: string[],
  requiredPermissions: readonly string[]
) {
  return requiredPermissions.every(p =>
    userPermissions.includes(p)
  );
}
