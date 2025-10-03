"use client";

import { Button } from "../ui/button";
import { authClient } from "@/lib/auth-client";

export default function Upgrade() {
  const upgrade = async () => {
    await authClient.checkout({
      products: [
        process.env.NEXT_PUBLIC_POLAR_SAMLL_CREDIT_PACK!,
        process.env.NEXT_PUBLIC_POLAR_MEDIUM_CREDIT_PACK!,
        process.env.NEXT_PUBLIC_POLAR_LARGE_CREDIT_PACK!,
      ],
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-2 cursor-pointer text-orange-400"
      onClick={upgrade}
    >
      升级
    </Button>
  );
}
