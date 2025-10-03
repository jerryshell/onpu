import { polarClient } from "@polar-sh/better-auth";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [polarClient()],
});

const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: "github",
  });
};
