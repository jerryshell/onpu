"use client";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { GenerateRequest, generateSong } from "@/actions/generation";
import { Loader2, Music, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const inspirationTags = [
  "80 年代合成器流行乐",
  "原声民谣",
  "史诗电影配乐",
  "低保真嘻哈",
  "激昂摇滚",
  "夏日海滩氛围",
];

const styleTags = [
  "工业锐舞",
  "重低音",
  "管弦乐",
  "电子节奏",
  "放克吉他",
  "灵魂唱腔",
  "氛围垫音",
];

export function SongPanel() {
  const [mode, setMode] = useState<"simple" | "custom">("simple");
  const [description, setDescription] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [lyricsMode, setLyricsMode] = useState<"write" | "auto">("write");
  const [lyrics, setLyrics] = useState("");
  const [styleInput, setStyleInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStyleInputTagClick = (tag: string) => {
    const currentTags = styleInput
      .split(", ")
      .map((s) => s.trim())
      .filter((s) => s);

    if (!currentTags.includes(tag)) {
      if (styleInput.trim() === "") {
        setStyleInput(tag);
      } else {
        setStyleInput(styleInput + ", " + tag);
      }
    }
  };

  const handleInspirationTagClick = (tag: string) => {
    const currentTags = description
      .split(", ")
      .map((s) => s.trim())
      .filter((s) => s);

    if (!currentTags.includes(tag)) {
      if (description.trim() === "") {
        setDescription(tag);
      } else {
        setDescription(description + ", " + tag);
      }
    }
  };

  const handleCreate = async () => {
    if (mode === "simple" && !description.trim()) {
      toast.error("请在创作前对歌曲进行描述");
      return;
    }
    if (mode === "custom" && !styleInput.trim()) {
      toast.error("请为歌曲添加一些风格");
      return;
    }

    let requestBody: GenerateRequest;

    if (mode === "simple") {
      requestBody = {
        fullDescribedSong: description,
        instrumental,
      };
    } else {
      const prompt = styleInput;
      if (lyricsMode === "write") {
        requestBody = {
          prompt,
          lyrics,
          instrumental,
        };
      } else {
        requestBody = {
          prompt,
          describedLyrics: lyrics,
          instrumental,
        };
      }
    }

    try {
      setLoading(true);
      await generateSong(requestBody);
      setDescription("");
      setLyrics("");
      setStyleInput("");
    } catch (error) {
      toast.error("生成歌曲失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted/30 flex w-full flex-col border-r lg:w-80">
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "simple" | "custom")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="simple">简单</TabsTrigger>
            <TabsTrigger value="custom">定制</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="mt-6 space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">描述你的歌曲</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="梦幻般的 Lofi hip hop 歌曲，适合放松学习"
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Lyrics button an instrumentals toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("custom")}
              >
                <Plus className="mr-2" />
                歌词
              </Button>
              <div className="flex items-center gap-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="lyrics-instrumental-switch"
                >
                  乐器演奏
                </label>
                <Switch
                  id="lyrics-instrumental-switch"
                  checked={instrumental}
                  onCheckedChange={setInstrumental}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">灵感</label>
              <div className="w-full overflow-x-auto whitespace-nowrap">
                <div className="flex flex-wrap gap-2 pb-2">
                  {inspirationTags.map((tag) => (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-shrink-0 bg-transparent text-xs"
                      key={tag}
                      onClick={() => handleInspirationTagClick(tag)}
                    >
                      <Plus className="mr-1" />
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-6 space-y-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">歌词</label>
                <div className="flex items-center gap-1">
                  <Button
                    variant={lyricsMode === "auto" ? "secondary" : "ghost"}
                    onClick={() => {
                      setLyricsMode("auto");
                      setLyrics("");
                    }}
                    size="sm"
                    className="h-7 text-xs"
                  >
                    自动
                  </Button>
                  <Button
                    variant={lyricsMode === "write" ? "secondary" : "ghost"}
                    onClick={() => {
                      setLyricsMode("write");
                      setLyrics("");
                    }}
                    size="sm"
                    className="h-7 text-xs"
                  >
                    写作
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder={
                  lyricsMode === "write"
                    ? "在此添加自己的歌词"
                    : "描述你的歌词，例如：一首关于失恋的悲伤歌曲"
                }
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium"
                htmlFor="custom-instrumental-switch"
              >
                乐器演奏
              </label>
              <Switch
                id="custom-instrumental-switch"
                checked={instrumental}
                onCheckedChange={setInstrumental}
              />
            </div>

            {/* Styles */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">风格</label>
              <Textarea
                placeholder="输入风格标签"
                value={styleInput}
                onChange={(e) => setStyleInput(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              <div className="w-full overflow-x-auto whitespace-nowrap">
                <div className="flex flex-wrap gap-2 pb-2">
                  {styleTags.map((tag) => (
                    <Badge
                      variant="secondary"
                      key={tag}
                      className="hover:bg-secondary/50 flex-shrink-0 cursor-pointer text-xs"
                      onClick={() => handleStyleInputTagClick(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t p-4">
        <Button
          onClick={handleCreate}
          disabled={loading}
          className="w-full cursor-pointer bg-gradient-to-r from-orange-500 to-pink-500 font-medium text-white hover:from-orange-600 hover:to-pink-600"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Music />}
          {loading ? "创作中..." : "创作"}
        </Button>
      </div>
    </div>
  );
}
