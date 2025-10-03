"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function Credits() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const [userData] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id));

  return (
    <>
      <p className="font-semibold">{userData.credits}</p>
      <p className="text-muted-foreground">积分</p>
    </>
  );
}
