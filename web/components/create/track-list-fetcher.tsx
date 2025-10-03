"use server";

import { TrackList } from "./track-list";
import { getPresignedUrl } from "@/actions/generation";
import { db } from "@/db";
import { song } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function TrackListFetcher() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const songs = await db.query.song.findMany({
    where: eq(song.userId, session.user.id),
    with: {
      user: {
        columns: {
          name: true,
        },
      },
    },
    orderBy: desc(song.createdAt),
  });

  const songsWithThumbnails = await Promise.all(
    songs.map(async (song) => {
      const thumbnailUrl = song.thumbnailS3Key
        ? await getPresignedUrl(song.thumbnailS3Key)
        : null;

      return {
        id: song.id,
        title: song.title,
        createdAt: song.createdAt,
        instrumental: song.instrumental,
        prompt: song.prompt,
        lyrics: song.lyrics,
        describedLyrics: song.describedLyrics,
        fullDescribedSong: song.fullDescribedSong,
        thumbnailUrl,
        playUrl: null,
        status: song.status,
        createdByUserName: song.user!.name,
        published: song.published,
      };
    }),
  );

  return <TrackList tracks={songsWithThumbnails} />;
}
