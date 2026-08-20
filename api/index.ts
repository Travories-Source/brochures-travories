import { createApp } from "../src/server";

const token = process.env.BROCHURE_SERVICE_TOKEN;
if (!token) throw new Error("BROCHURE_SERVICE_TOKEN must be set");

const app = createApp(token);
let ready: Promise<unknown> | undefined;

/** Vercel Node.js function adapter for the Fastify application. */
export default async function handler(request: any, response: any) {
  ready ??= app.ready();
  await ready;
  app.server.emit("request", request, response);
}
