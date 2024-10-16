import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { desc, eq } from "@acme/db";
import { CreatePostSchema, Post } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = {
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return ctx.db.query.Post.findMany({
      orderBy: desc(Post.id),
      limit: 10,
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      // return ctx.db
      //   .select()
      //   .from(schema.post)
      //   .where(eq(schema.post.id, input.id));

      return ctx.db.query.Post.findFirst({
        where: eq(Post.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(Post).values(input);
    }),

  delete: protectedProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.delete(Post).where(eq(Post.id, input));
  }),

  // isTyping: authedProcedure
  //   .input(z.object({ typing: z.boolean() }))
  //   .mutation(({ input, ctx }) => {
  //     const { name } = ctx.user;
  //     if (!input.typing) {
  //       delete currentlyTyping[name];
  //     } else {
  //       currentlyTyping[name] = {
  //         lastTyped: new Date(),
  //       };
  //     }
  //     ee.emit("isTypingUpdate");
  //   }),

  // whoIsTyping: publicProcedure.subscription(() => {
  //   let prev: string[] | null = null;
  //   return observable<string[]>((emit) => {
  //     const onIsTypingUpdate = () => {
  //       const newData = Object.keys(currentlyTyping);

  //       if (!prev || prev.toString() !== newData.toString()) {
  //         emit.next(newData);
  //       }
  //       prev = newData;
  //     };
  //     ee.on("isTypingUpdate", onIsTypingUpdate);
  //     return () => {
  //       ee.off("isTypingUpdate", onIsTypingUpdate);
  //     };
  //   });
  // }),
} satisfies TRPCRouterRecord;
