import { initContract } from '@ts-rest/core';
import { insertAssetPropertySchema, selectAssetPropertySchema } from './src/settings';

const c = initContract();

export const contract = c.router({
  createProperty: {
    method: 'POST',
    path: '/property',
    //     ^ Note! This is the full path on the server, not just the sub-path of a route
    responses: {
      201: c.type<typeof selectAssetPropertySchema>(),
    },
    body:insertAssetPropertySchema,
    summary: 'Create a property',
    metadata: { role: 'user' } as const,
  },
  getProperties: {
    method: 'GET',
    path: '/posts',
    responses: {
      200: c.type<{ posts: typeof selectAssetPropertySchema[]; total: number }>(),
    },
    // headers: z.object({
    //   pagination: z.string().optional(),
    // }),
    // query: z.object({
    //   take: z.string().transform(Number).optional(),
    //   skip: z.string().transform(Number).optional(),
    //   search: z.string().optional(),
    // }),
    summary: 'Get all proeprties',
    metadata: { role: 'guest' } as const,
  },
});