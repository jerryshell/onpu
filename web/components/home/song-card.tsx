"use client";

import { getPlayUrl } from "@/actions/generation";
import { toggleLikeSong } from "@/actions/song";
import { Category, Like, Song } from "@/db/schema";
import { usePlayerStore } from "@/stores/use-player-store";
import { Heart, Loader2, Music, Play } from "lucide-react";
import { useState } from "react";

type SongWithRelation = Song & {
  user: { name: string | null };
  _count: {
    likes: number;
  };
  categories: Category[];
  thumbnailUrl?: string | null;
  likes?: Like[];
};

export function SongCard({ song }: { song: SongWithRelation }) {
  const [isLoading, setIsLoading] = useState(false);
  const setTrack = usePlayerStore((state) => state.setTrack);
  const [isLiked, setIsLiked] = useState(
    song.likes ? song.likes.length > 0 : false,
  );
  const [likesCount, setLikesCount] = useState(song._count.likes);

  const handlePlay = async () => {
    setIsLoading(true);
    const playUrl = await getPlayUrl(song.id);

    setTrack({
      id: song.id,
      title: song.title,
      url: playUrl,
      artwork: song.thumbnailUrl,
      prompt: song.prompt,
      createdByUserName: song.user.name,
    });

    setIsLoading(false);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    await toggleLikeSong(song.id);
  };

  return (
    <div>
      <div onClick={handlePlay} className="cursor-pointer">
        <div className="group relative aspect-square w-full overflow-hidden rounded-md bg-muted group-hover:opacity-75">
          {song.thumbnailUrl ? (
            <img
              className="h-full w-full object-cover object-center"
              src={song.thumbnailUrl}
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <Music className="text-muted-foreground h-12 w-12" />
            </div>
          )}

          {/* Loader */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 transition-transform group-hover:scale-105">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Play className="h-6 w-6 fill-white text-white" />
              )}
            </div>
          </div>
        </div>

        <h3 className="mt-2 truncate text-sm font-medium text-foreground">
          {song.title}
        </h3>

        <p className="text-xs text-muted-foreground">{song.user.name}</p>

        <div className="mt-1 flex items-center justify-between text-xs text-foreground">
          <span>{song.listenCount} 播放</span>
          <button
            onClick={handleLike}
            className="flex cursor-pointer items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
            />
            {likesCount} 喜欢
          </button>
        </div>
      </div>
    </div>
  );
}
