import { notFound } from "next/navigation";
import { authMiddleware } from "../middleware/auth";
import onError from "../middleware/on-error";
import { pinoLogger } from "../middleware/pino-logger";
import { AppBindings, AppOpenAPI } from "./types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { defaultHook } from "stoker/openapi";


export function createRouter() {
    return new OpenAPIHono<AppBindings>({
        strict: false,
        defaultHook,
    });
}

export default function createApp() {
    const app = createRouter();
    app.use(pinoLogger());
    app.use(authMiddleware)
    app.notFound(notFound);
    app.onError(onError);
    return app;
}

export function createTestApp<R extends AppOpenAPI>(router: R) {
    return createApp().route("/", router);
}
