import { inngest } from "./client";
import { db } from "@/db";
import { category, song, songCategory, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const generateSong = inngest.createFunction(
  {
    id: "generate-song",
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
    onFailure: async ({ event, error }) => {
      const songId = event.data.event.data.songId;
      await db
        .update(song)
        .set({
          status: "failed",
        })
        .where(eq(song.id, songId));
    },
  },
  { event: "generate-song-event" },
  async ({ event, step }) => {
    const { songId } = event.data as {
      songId: string;
      userId: string;
    };

    const { userId, credits, endpoint, requestBody } = await step.run(
      "gen-request-body",
      async () => {
        const result = await db
          .select()
          .from(song)
          .where(eq(song.id, songId))
          .leftJoin(user, eq(user.id, song.userId));

        if (!result[0]) {
          throw new Error("song not found");
        }

        const { song: songData, user: userData } = result[0];

        if (!userData) {
          throw new Error("user not found");
        }

        const requestBody = {
          guidance_scale: songData.guidanceScale ?? undefined,
          infer_step: songData.inferStep ?? undefined,
          audio_duration: songData.audioDuration ?? undefined,
          seed: songData.seed ?? undefined,
          full_described_song: songData.fullDescribedSong ?? undefined,
          prompt: songData.prompt ?? undefined,
          lyrics: songData.lyrics ?? undefined,
          described_lyrics: songData.describedLyrics ?? undefined,
          instrumental: songData.instrumental ?? undefined,
        };

        let endpoint = "";
        if (songData.fullDescribedSong) {
          endpoint = process.env.MODAL_URL_GENERATE_FROM_DESCRIPTION!;
        } else if (songData.lyrics && songData.prompt) {
          endpoint = process.env.MODAL_URL_GENERATE_WITH_LYRICS!;
        } else if (songData.describedLyrics && songData.prompt) {
          endpoint = process.env.MODAL_URL_GENERATE_WITH_DESCRIBED_LYRICS!;
        } else {
          throw Error("check endpoint failed");
        }

        return {
          userId: userData.id,
          credits: userData.credits,
          endpoint,
          requestBody,
        };
      },
    );

    if (credits <= 0) {
      return await step.run("set-status-no-credits", async () => {
        return await db
          .update(song)
          .set({
            status: "no credits",
          })
          .where(eq(song.id, songId));
      });
    }

    await step.run("set-status-processing", async () => {
      return await db
        .update(song)
        .set({
          status: "processing",
        })
        .where(eq(song.id, songId));
    });

    const aiResponse = await step.fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Modal-Key": process.env.MODAL_KEY!,
        "Modal-Secret": process.env.MODAL_SECRET!,
      },
      body: JSON.stringify(requestBody),
    });

    await step.run("update-song-result", async () => {
      const responseData = aiResponse.ok
        ? ((await aiResponse.json()) as {
            s3_key: string;
            cover_image_s3_key: string;
            categories: string[];
          })
        : null;

      await db
        .update(song)
        .set({
          s3Key: responseData?.s3_key,
          thumbnailS3Key: responseData?.cover_image_s3_key,
          status: aiResponse.ok ? "processed" : "failed",
        })
        .where(eq(song.id, songId));

      if (responseData && responseData.categories.length > 0) {
        const categoryResults = await db
          .insert(category)
          .values(
            responseData.categories.map((name) => ({
              id: name,
              name,
            })),
          )
          .onConflictDoUpdate({
            target: category.name,
            set: { name: category.name },
          })
          .returning({ id: category.id });

        await db.delete(songCategory).where(eq(songCategory.songId, songId));

        await db.insert(songCategory).values(
          categoryResults.map((category) => ({
            songId: songId,
            categoryId: category.id,
          })),
        );
      }
    });

    return await step.run("deduct-credits", async () => {
      if (!aiResponse.ok) return;

      return await db
        .update(user)
        .set({
          credits: sql`${user.credits} - 1`,
        })
        .where(eq(user.id, userId));
    });
  },
);
