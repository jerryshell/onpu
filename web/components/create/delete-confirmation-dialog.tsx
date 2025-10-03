"use client";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Track } from "./track-list";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface DeleteConfirmationDialogProps {
  track: Track | null;
  onClose: () => void;
  onConfirm: (trackId: string) => Promise<void>;
}

export function DeleteConfirmationDialog({
  track,
  onClose,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!track) return;

    setIsDeleting(true);
    try {
      await onConfirm(track.id);
      onClose();
    } catch (error) {
      console.error("删除歌曲时出错:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!track) return null;

  return (
    <Dialog open={!!track} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            删除歌曲
          </DialogTitle>
          <DialogDescription>
            您确定要删除歌曲 <strong>"{track.title}"</strong> 吗？
            <br />
            <span className="text-destructive text-sm">
              此操作将永久删除歌曲文件和所有相关数据，无法撤销。
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
