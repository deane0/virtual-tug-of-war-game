import type { TRPCLink } from "@trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { NextPageContext } from "next";
import {
  createWSClient,
  httpBatchLink,
  loggerLink,
  wsLink,
} from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { ssrPrepass } from "@trpc/next/ssrPrepass";
import superjson from "superjson";

import type { AppRouter } from "@acme/api";
import { t } from "@acme/api";

import { env } from "~/env";

function getEndingLink(ctx: NextPageContext | undefined): TRPCLink<AppRouter> {
  if (typeof window === "undefined") {
    return httpBatchLink({
      /**
       * @see https://trpc.io/docs/v11/data-transformers
       */
      transformer: superjson,
      url: `${getBaseUrl()}/api/trpc`,
      headers() {
        if (!ctx?.req?.headers) {
          return {};
        }
        // on ssr, forward client's headers to the server
        return {
          ...ctx.req.headers,
          "x-ssr": "1",
        };
      },
    });
  }
  const client = createWSClient({
    url: "ws://localhost:3001",
  });
  return wsLink({
    client,
    /**
     * @see https://trpc.io/docs/v11/data-transformers
     */
    transformer: superjson,
  });
}

/**
 * A set of strongly-typed React hooks from your `AppRouter` type signature with `createReactQueryHooks`.
 * @see https://trpc.io/docs/v11/react#3-create-trpc-hooks
 */
export const trpc = createTRPCNext<AppRouter>({
  /**
   * @see https://trpc.io/docs/v11/ssr
   */
  ssr: true,
  ssrPrepass,
  config({ ctx }) {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @see https://trpc.io/docs/v11/ssr
     */

    return {
      /**
       * @see https://trpc.io/docs/v11/client/links
       */
      links: [
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV === "development" &&
              typeof window !== "undefined") ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        getEndingLink(ctx),
      ],
      /**
       * @see https://tanstack.com/query/v5/docs/reference/QueryClient
       */
      queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  /**
   * @see https://trpc.io/docs/v11/data-transformers
   */
  transformer: superjson,
});

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`;
};
