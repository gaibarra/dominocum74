import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Edit2, Trash2, FileText, Image as ImageIcon, Volume2, Film, Play } from "lucide-react";

const TYPE_META = {
  text: { label: "Texto", icon: FileText },
  image: { label: "Imagen", icon: ImageIcon },
  audio: { label: "Audio", icon: Volume2 },
  video: { label: "Video", icon: Film },
};

const getYouTubeMeta = (url) => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("youtube") && !parsed.hostname.includes("youtu")) return null;
    let videoId = parsed.searchParams.get("v");
    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.replace(/\//, "");
    }
    if (!videoId) return null;
    return {
      embed: `https://www.youtube.com/embed/${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  } catch {}
  return null;
};

const AnecdoteCard = ({ anecdote, index, onEdit, onDelete }) => {
  const type = anecdote.mediaType || "text";
  const meta = TYPE_META[type] || TYPE_META.text;
  const dateLabel = anecdote.date ? new Date(anecdote.date).toLocaleString() : "Sin fecha";
  const TypeIcon = meta.icon;
  const [showVideoPlayer, setShowVideoPlayer] = React.useState(false);
  const [showImagePreview, setShowImagePreview] = React.useState(false);

  const renderMediaPreview = () => {
    const url = anecdote.mediaUrl;
    if (type === "image" && url) {
      return (
        <>
          <button
            type="button"
            onClick={() => setShowImagePreview(true)}
            className="mt-3 group relative w-full overflow-hidden rounded-md border border-border/40 h-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <img
              src={url}
              alt={anecdote.text || "Anécdota visual"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center text-white text-xs px-3 text-center">
              Mantén presionado o haz clic para ver en tamaño completo.
            </div>
          </button>
          <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
            <DialogContent className="max-w-4xl w-[90vw]">
              <DialogHeader>
                <DialogTitle>Vista previa</DialogTitle>
                <DialogDescription>Imagen adjunta a la anécdota seleccionada.</DialogDescription>
              </DialogHeader>
              <img
                src={url}
                alt={anecdote.text || "Anécdota visual"}
                className="max-h-[80vh] w-full object-contain rounded-md"
              />
            </DialogContent>
          </Dialog>
        </>
      );
    }
    if (type === "audio" && url) {
      return (
        <audio className="mt-3 w-full" controls src={url}>
          Tu navegador no soporta audio embebido.
        </audio>
      );
    }
    if (type === "video" && url) {
      const ytMeta = getYouTubeMeta(url);
      if (ytMeta) {
        return showVideoPlayer ? (
          <div className="mt-3 aspect-video w-full overflow-hidden rounded-md border border-border/40">
            <iframe
              src={ytMeta.embed}
              title="Video de anécdota"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowVideoPlayer(true)}
            className="mt-3 relative w-full overflow-hidden rounded-md border border-border/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <img src={ytMeta.thumbnail} alt="Miniatura de video" className="block h-40 w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
              <Play className="h-10 w-10" />
            </span>
          </button>
        );
      }
      return (
        <video className="mt-3 w-full rounded-md border border-border/40 h-40 object-cover" controls src={url}>
          Tu navegador no soporta video embebido.
        </video>
      );
    }
    return null;
  };
  return (
    <motion.div
      key={anecdote.id || index}
      className="p-3 bg-background/70 rounded-xl shadow border border-border/40"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Badge variant="outline" className="gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider">
          <TypeIcon className="h-3 w-3" /> {meta.label}
        </Badge>
        <span>{dateLabel}</span>
      </div>
      {anecdote.text && (
        <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">{anecdote.text}</p>
      )}
      {renderMediaPreview()}
      <div className="mt-2 flex justify-end gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(anecdote)}>
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(anecdote.id)}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
      {anecdote.last_edited && <p className="text-xs text-muted-foreground italic">Editado: {new Date(anecdote.last_edited).toLocaleString()}</p>}
    </motion.div>
  );
};

export default AnecdoteCard;