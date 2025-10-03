"use client";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { RenameDialog } from "./rename-dialog";
import { getPlayUrl } from "@/actions/generation";
import { renameSong, setPublishedStatus, deleteSong } from "@/actions/song";
import { usePlayerStore } from "@/stores/use-player-store";
import {
  Download,
  Loader2,
  MoreHorizontal,
  Music,
  Pencil,
  Play,
  RefreshCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface Track {
  id: string;
  title: string | null;
  createdAt: Date;
  instrumental: boolean;
  prompt: string | null;
  lyrics: string | null;
  describedLyrics: string | null;
  fullDescribedSong: string | null;
  thumbnailUrl: string | null;
  playUrl: string | null;
  status: string | null;
  createdByUserName: string | null;
  published: boolean;
}

export function TrackList({ tracks }: { tracks: Track[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [trackToRename, setTrackToRename] = useState<Track | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const router = useRouter();
  const setTrack = usePlayerStore((state) => state.setTrack);

  const handleTrackSelect = async (track: Track) => {
    if (loadingTrackId) return;
    setLoadingTrackId(track.id);
    const playUrl = await getPlayUrl(track.id);
    setLoadingTrackId(null);

    setTrack({
      id: track.id,
      title: track.title,
      url: playUrl,
      artwork: track.thumbnailUrl,
      prompt: track.prompt,
      createdByUserName: track.createdByUserName,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredTracks = tracks.filter(
    (track) =>
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ??
      track.prompt?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-1 flex-col overflow-y-scroll">
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="pl-10"
            />
          </div>
          <Button
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2" />
            )}
            刷新
          </Button>
        </div>

        {/* Track list */}
        <div className="space-y-2">
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track) => {
              switch (track.status) {
                case "failed":
                  return (
                    <div
                      key={track.id}
                      className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                    >
                      <div className="bg-destructive/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md">
                        <XCircle className="text-destructive h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-destructive truncate text-sm font-medium">
                          生成失败
                        </h3>
                        <p className="text-muted-foreground truncate text-xs">
                          请尝试重新创作歌曲
                        </p>
                      </div>
                    </div>
                  );

                case "no credits":
                  return (
                    <div
                      key={track.id}
                      className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                    >
                      <div className="bg-destructive/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md">
                        <XCircle className="text-destructive h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-destructive truncate text-sm font-medium">
                          积分不足
                        </h3>
                        <p className="text-muted-foreground truncate text-xs">
                          请购买更多积分来创作歌曲
                        </p>
                      </div>
                    </div>
                  );

                case "queued":
                case "processing":
                  return (
                    <div
                      key={track.id}
                      className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
                    >
                      <div className="bg-muted flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md">
                        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-muted-foreground truncate text-sm font-medium">
                          正在创作...
                        </h3>
                        <p className="text-muted-foreground truncate text-xs">
                          刷新获取新状态
                        </p>
                      </div>
                    </div>
                  );

                default:
                  return (
                    <div
                      key={track.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors"
                      onClick={() => handleTrackSelect(track)}
                    >
                      {/* Thumbnail */}
                      <div className="group relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                        {track.thumbnailUrl ? (
                          <img
                            className="h-full w-full object-cover"
                            src={track.thumbnailUrl}
                          />
                        ) : (
                          <div className="bg-muted flex h-full w-full items-center justify-center">
                            <Music className="text-muted-foreground h-6 w-6" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                          {loadingTrackId === track.id ? (
                            <Loader2 className="animate-spin text-white" />
                          ) : (
                            <Play className="fill-white text-white" />
                          )}
                        </div>
                      </div>

                      {/* Track info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="trucate text-sm font-medium">
                            {track.title}
                          </h3>
                          {track.instrumental && (
                            <Badge variant="outline">乐器演奏</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground truncate text-xs">
                          {track.prompt}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await setPublishedStatus(
                              track.id,
                              !track.published,
                            );
                          }}
                          variant="outline"
                          size="sm"
                          className={`cursor-pointer ${track.published ? "border-red-200" : ""}`}
                        >
                          {track.published ? "取消发布" : "发布"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                const playUrl = await getPlayUrl(track.id);
                                window.open(playUrl, "_blank");
                              }}
                            >
                              <Download className="mr-2" /> 下载
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                setTrackToRename(track);
                              }}
                            >
                              <Pencil className="mr-2" /> 重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                setTrackToDelete(track);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2" /> 删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
              }
            })
          ) : (
            <div className="flex flex-col items-center justify-center pt-20 text-center">
              <Music className="text-muted-foreground h-10 w-10" />
              <h2 className="mt-4 text-lg font-semibold">尚未有音乐</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {searchQuery
                  ? "没有符合搜索条件的曲目"
                  : "创建第一首歌，开始音乐之旅"}
              </p>
            </div>
          )}
        </div>
      </div>

      {trackToRename && (
        <RenameDialog
          track={trackToRename}
          onClose={() => setTrackToRename(null)}
          onRename={(trackId, newTitle) => renameSong(trackId, newTitle)}
        />
      )}

      {trackToDelete && (
        <DeleteConfirmationDialog
          track={trackToDelete}
          onClose={() => setTrackToDelete(null)}
          onConfirm={deleteSong}
        />
      )}
    </div>
  );
}
