import { db } from "@/db";
import { user } from "@/db/schema";
import * as schema from "@/db/schema";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq, sql } from "drizzle-orm";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_SERVER as "production" | "sandbox",
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.NEXT_PUBLIC_POLAR_SAMLL_CREDIT_PACK!,
              slug: "small",
            },
            {
              productId: process.env.NEXT_PUBLIC_POLAR_MEDIUM_CREDIT_PACK!,
              slug: "medium",
            },
            {
              productId: process.env.NEXT_PUBLIC_POLAR_LARGE_CREDIT_PACK!,
              slug: "large",
            },
          ],
          successUrl: "/",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOKS_SECRET!,
          onOrderPaid: async (order) => {
            const customerExternalId = order.data.customer.externalId;
            if (!customerExternalId) {
              console.error("no external customer id");
              throw new Error("no external customer id");
            }

            const productId = order.data.productId;

            let creditsToAdd = 0;
            switch (productId) {
              case process.env.NEXT_PUBLIC_POLAR_SAMLL_CREDIT_PACK!: {
                creditsToAdd = 10;
                break;
              }
              case process.env.NEXT_PUBLIC_POLAR_MEDIUM_CREDIT_PACK!: {
                creditsToAdd = 25;
                break;
              }
              case process.env.NEXT_PUBLIC_POLAR_LARGE_CREDIT_PACK!: {
                creditsToAdd = 50;
                break;
              }
            }

            await db
              .update(user)
              .set({
                credits: sql`${user.credits} + ${creditsToAdd}`,
              })
              .where(eq(user.id, customerExternalId));
          },
        }),
      ],
    }),
  ],
});
