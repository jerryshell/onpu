"use server";

import { db } from "@/db";
import { song, like } from "@/db/schema";
import { auth } from "@/lib/auth";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function setPublishedStatus(songId: string, published: boolean) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth/sign-in");

  await db
    .update(song)
    .set({ published })
    .where(and(eq(song.id, songId), eq(song.userId, session.user.id)));

  revalidatePath("/create");
}

export async function renameSong(songId: string, newTitle: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth/sign-in");

  await db
    .update(song)
    .set({ title: newTitle })
    .where(and(eq(song.id, songId), eq(song.userId, session.user.id)));

  revalidatePath("/create");
}

export async function toggleLikeSong(songId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth/sign-in");

  const existingLike = await db
    .select()
    .from(like)
    .where(and(eq(like.userId, session.user.id), eq(like.songId, songId)))
    .limit(1);

  if (existingLike.length > 0) {
    await db
      .delete(like)
      .where(and(eq(like.userId, session.user.id), eq(like.songId, songId)));
  } else {
    await db.insert(like).values({
      userId: session.user.id,
      songId: songId,
    });
  }

  revalidatePath("/");
}

export async function deleteSong(songId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth/sign-in");

  const songRecord = await db
    .select()
    .from(song)
    .where(and(eq(song.id, songId), eq(song.userId, session.user.id)))
    .limit(1);

  if (songRecord.length === 0) {
    throw new Error("歌曲不存在或无权限删除");
  }

  const songData = songRecord[0];

  if (songData.s3Key || songData.thumbnailS3Key) {
    const s3Client = new S3Client({
      region: "auto",
      endpoint: process.env.S3_ENDPOINT_URL!,
      credentials: {
        accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY!,
      },
    });

    const deletePromises = [];

    if (songData.s3Key) {
      deletePromises.push(
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: songData.s3Key,
          }),
        ),
      );
    }

    if (songData.thumbnailS3Key) {
      deletePromises.push(
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: songData.thumbnailS3Key,
          }),
        ),
      );
    }

    try {
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("删除S3文件时出错:", error);
    }
  }

  await db
    .delete(song)
    .where(and(eq(song.id, songId), eq(song.userId, session.user.id)));

  revalidatePath("/create");
}
