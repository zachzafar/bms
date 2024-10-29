// routes/auth/auth.index.ts

import { createRouter } from "../../lib/create-app";
import * as handlers from "./auth.handlers";
import * as routes from "./auth.routes";

const router = createRouter()
  .openapi(routes.login, handlers.login)
  .openapi(routes.signup, handlers.signup)
  .openapi(routes.logout, handlers.logout);

export default router;