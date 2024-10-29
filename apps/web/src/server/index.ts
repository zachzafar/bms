import configureOpenAPI from "./lib/configure-open-api";
import createApp from "./lib/create-app";
import auth from "./routes/auth/auth.index";
import property from "./routes/settings/property/property.index";
const app = createApp();

configureOpenAPI(app);

const routes = [
  auth,
  property
] as const;

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = typeof routes[number];

export default app;