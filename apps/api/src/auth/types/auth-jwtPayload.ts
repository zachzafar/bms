export type AuthJwtPayload = {
  sub: string;
  tenants: string[];
  roles: Record<string, Array<{ roleId: string; roleName: string; permissions: string[] }>>;
};