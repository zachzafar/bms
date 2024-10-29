import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { PinoLogger } from "hono-pino";
import type { User, Session } from "lucia";

export interface AppBindings {
    Variables: {
        logger: PinoLogger;
        user: User | null;
        session: Session | null;
    };
};

export type AppOpenAPI = OpenAPIHono<AppBindings>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;