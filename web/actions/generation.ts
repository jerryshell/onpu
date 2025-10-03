"use server";

import { db } from "@/db";
import { song } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { auth } from "@/lib/auth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export interface GenerateRequest {
  prompt?: string;
  lyrics?: string;
  fullDescribedSong?: string;
  describedLyrics?: string;
  instrumental?: boolean;
}

export async function generateSong(generateRequest: GenerateRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth/sign-in");

  await queueSong(generateRequest, 15, session.user.id);

  revalidatePath("/create");
}

export async function queueSong(
  generateRequest: GenerateRequest,
  guidanceScale: number,
  userId: string,
) {
  let title = "Untitled";
  if (generateRequest.describedLyrics) {
    title = generateRequest.describedLyrics;
  }
  if (generateRequest.fullDescribedSong) {
    title = generateRequest.fullDescribedSong;
  }

  title = title.charAt(0).toUpperCase() + title.slice(1);

  const result = await db
    .insert(song)
    .values({
      id: crypto.randomUUID(),
      userId: userId,
      title,
      prompt: generateRequest.prompt,
      lyrics: generateRequest.lyrics,
      describedLyrics: generateRequest.describedLyrics,
      fullDescribedSong: generateRequest.fullDescribedSong,
      instrumental: generateRequest.instrumental,
      guidanceScale: guidanceScale,
      audioDuration: 180,
    })
    .returning();

  if (!result[0]) {
    throw new Error("insert song failed");
  }

  const songData = result[0];

  await inngest.send({
    name: "generate-song-event",
    data: {
      songId: songData.id,
      userId: songData.userId,
    },
  });
}

export async function getPlayUrl(songId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth/sign-in");

  const result = await db.query.song.findFirst({
    where: and(
      eq(song.id, songId),
      or(eq(song.userId, session.user.id), eq(song.published, true)),
      isNotNull(song.s3Key),
    ),
    columns: {
      s3Key: true,
    },
  });

  if (!result) {
    throw new Error("Song not found");
  }
  if (!result.s3Key) {
    throw new Error("Song S3 key not found");
  }

  await db
    .update(song)
    .set({
      listenCount: sql`${song.listenCount} + 1`,
    })
    .where(eq(song.id, songId));

  return await getPresignedUrl(result.s3Key);
}

export async function getPresignedUrl(key: string) {
  const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.S3_ENDPOINT_URL!,
    credentials: {
      accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
  });
}
