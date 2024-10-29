import { hc } from "hono/client";
import type { AppType } from "@/server";

export const client = hc<AppType>('localhost:3000/api')
