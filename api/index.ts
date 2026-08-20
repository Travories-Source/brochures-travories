import { createApp } from "../src/server";

const token = process.env.BROCHURE_SERVICE_TOKEN;
if (!token) throw new Error("BROCHURE_SERVICE_TOKEN must be set");

const app = createApp(token);
let ready: Promise<void> | undefined;

/** Vercel Node.js function adapter for the Fastify application. */
export default async function handler(request: any, response: any) {
  // Fastify returns a PromiseLike instance rather than a native Promise.
  // Normalise it so the Vercel function can cache readiness safely.
  ready ??= Promise.resolve(app.ready()).then(() => undefined);
  await ready;
  app.server.emit("request", request, response);
}
