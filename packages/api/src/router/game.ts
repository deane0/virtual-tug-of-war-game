import { EventEmitter } from "node:events";
import type { TRPCRouterRecord } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../trpc";

interface GameData {
  id: string;
  user: string;
  offset: number;
}

interface MyEvents {
  offsetChange: (data: GameData) => void;
}
declare interface MyEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(
    event: TEv,
    ...args: Parameters<MyEvents[TEv]>
  ): boolean;
}

class MyEventEmitter extends EventEmitter {}

// In a real app, you'd probably use Redis or something
const ee = new MyEventEmitter();

const gameToCurrentlyTyping: Record<
  string,
  Record<string, { offset: number; lastTyped: Date }>
> = {};

export const gameRouter = {
  isTyping: publicProcedure
    .input(
      z.object({
        id: z.string(),
        user: z.string(),
        offset: z.number(),
        typing: z.boolean(),
      }),
    )
    .mutation(({ input, ctx }) => {
      const game = gameToCurrentlyTyping[input.id];
      if (game) {
        game[input.user] = {
          offset: input.offset,
          lastTyped: new Date(),
        };

        ee.emit("offsetChange", input);
        return game;
      }

      gameToCurrentlyTyping[input.id] = {
        [input.user]: {
          offset: input.offset,
          lastTyped: new Date(),
        },
      };
      ee.emit("offsetChange", input);
      return gameToCurrentlyTyping[input.id];
    }),

  onOffsetChange: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .subscription(() => {
      return observable<{ id: string; user: string; offset: number }>(
        (emit) => {
          const onChange = (data: {
            id: string;
            user: string;
            offset: number;
          }) => {
            emit.next(data);
          };
          ee.on("offsetChange", onChange);
          return () => {
            ee.off("offsetChange", onChange);
          };
        },
      );
    }),
} satisfies TRPCRouterRecord;
