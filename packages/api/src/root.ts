import { authRouter } from "./router/auth";
import { gameRouter } from "./router/game";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  game: gameRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
