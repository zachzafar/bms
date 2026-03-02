export type OwnerMagicLinkEvent = {
  email: string;
  ownerId: number;
  token: string;
  expiresAt: Date;
  subdomain: string;
};
