import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { getSession } from "next-auth/react";
import { WebSocketServer } from "ws";

import { appRouter, createTRPCContext } from "@acme/api";
import { db } from "@acme/db/client";

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export const createContext = async (
  opts: CreateNextContextOptions | CreateWSSContextFnOptions,
) => {
  const session = await getSession(opts);

  console.log("createContext for", session?.user.name ?? "unknown user");

  return {
    session,
    db,
    token: null, // TODO
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const wss = new WebSocketServer({
  port: 3001,
});
const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
  // createContext: createTRPCContext,
  // Enable heartbeat messages to keep connection open (disabled by default)
  keepAlive: {
    enabled: true,
    // server ping message interval in milliseconds
    pingMs: 30000,
    // connection is terminated if pong message is not received in this many milliseconds
    pongWaitMs: 5000,
  },
});
wss.on("connection", (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`➖➖ Connection (${wss.clients.size})`);
  });
});

console.log("✅ WebSocket Server listening on ws://localhost:3001");

process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});
