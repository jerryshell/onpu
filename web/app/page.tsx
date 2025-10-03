import { getPresignedUrl } from "@/actions/generation";
import { SongCard } from "@/components/home/song-card";
import { db } from "@/db";
import { like, song, user, category, songCategory } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq, count, inArray } from "drizzle-orm";
import { Music } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const songs = await db
    .select({
      id: song.id,
      title: song.title,
      s3Key: song.s3Key,
      thumbnailS3Key: song.thumbnailS3Key,
      status: song.status,
      instrumental: song.instrumental,
      prompt: song.prompt,
      lyrics: song.lyrics,
      fullDescribedSong: song.fullDescribedSong,
      describedLyrics: song.describedLyrics,
      guidanceScale: song.guidanceScale,
      inferStep: song.inferStep,
      audioDuration: song.audioDuration,
      seed: song.seed,
      published: song.published,
      listenCount: song.listenCount,
      userId: song.userId,
      createdAt: song.createdAt,
      updatedAt: song.updatedAt,
      userName: user.name,
    })
    .from(song)
    .leftJoin(user, eq(song.userId, user.id))
    .where(eq(song.published, true))
    .orderBy(desc(song.createdAt))
    .limit(100);

  const songIds = songs.map((s) => s.id);

  const likesCounts =
    songIds.length > 0
      ? await db
          .select({
            songId: like.songId,
            count: count(like.songId).as("count"),
          })
          .from(like)
          .where(inArray(like.songId, songIds))
          .groupBy(like.songId)
      : [];

  const userLikes = await db
    .select({
      songId: like.songId,
    })
    .from(like)
    .where(eq(like.userId, session.user.id));

  const songCategories =
    songIds.length > 0
      ? await db
          .select({
            songId: songCategory.songId,
            categoryId: category.id,
            categoryName: category.name,
          })
          .from(songCategory)
          .leftJoin(category, eq(songCategory.categoryId, category.id))
          .where(inArray(songCategory.songId, songIds))
      : [];

  const likesCountMap = new Map(likesCounts.map((l) => [l.songId, l.count]));
  const userLikesSet = new Set(userLikes.map((l) => l.songId));
  const categoriesMap = new Map<string, Array<{ id: string; name: string }>>();

  songCategories.forEach((sc) => {
    if (!categoriesMap.has(sc.songId)) {
      categoriesMap.set(sc.songId, []);
    }
    if (sc.categoryId && sc.categoryName) {
      categoriesMap.get(sc.songId)!.push({
        id: sc.categoryId,
        name: sc.categoryName,
      });
    }
  });

  const songsWithRelations = songs.map((song) => ({
    ...song,
    _count: {
      likes: likesCountMap.get(song.id) || 0,
    },
    categories: categoriesMap.get(song.id) || [],
    likes: userLikesSet.has(song.id)
      ? [{ userId: session.user.id, songId: song.id }]
      : [],
  }));

  const songsWithUrls = await Promise.all(
    songsWithRelations.map(async (song) => {
      const thumbnailUrl = song.thumbnailS3Key
        ? await getPresignedUrl(song.thumbnailS3Key)
        : null;

      return {
        ...song,
        thumbnailUrl,
        user: {
          name: song.userName,
        },
      };
    }),
  );

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const trendingSongs = songsWithUrls
    .filter((song) => song.createdAt >= twoDaysAgo)
    .slice(0, 10);

  const trendingSongIds = new Set(trendingSongs.map((song) => song.id));

  const categorizedSongs = songsWithUrls
    .filter(
      (song) => !trendingSongIds.has(song.id) && song.categories.length > 0,
    )
    .reduce(
      (acc, song) => {
        const primaryCategory = song.categories[0];
        if (primaryCategory) {
          acc[primaryCategory.name] ??= [];
          if (acc[primaryCategory.name]!.length < 10) {
            acc[primaryCategory.name]!.push(song);
          }
        }
        return acc;
      },
      {} as Record<string, Array<any>>,
    );

  if (
    trendingSongs.length === 0 &&
    Object.keys(categorizedSongs).length === 0
  ) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <Music className="text-muted-foreground h-20 w-20" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">暂无音乐</h1>
        <p className="text-muted-foreground mt-2">
          现在没有已发布的歌曲。请稍后再查看！
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold tracking-tight">音乐探索</h1>

      {/* Trending songs */}
      {trendingSongs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">趋势</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {trendingSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {Object.entries(categorizedSongs)
        .slice(0, 5)
        .map(([category, songs]) => (
          <div key={category} className="mt-6">
            <h2 className="text-xl font-semibold">{category}</h2>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {(songs as any[]).map((song: any) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
