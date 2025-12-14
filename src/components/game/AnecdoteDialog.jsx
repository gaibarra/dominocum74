import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Upload, Link as LinkIcon, Loader2 } from "lucide-react";

const ANECDOTE_TYPES = [
  { value: "text", label: "Texto" },
  { value: "image", label: "Imagen" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
];

const ACCEPTED_FILE_TYPES = {
  image: "image/*",
  audio: "audio/*",
  video: "video/*",
};

const AnecdoteDialog = ({
  isOpen,
  setIsOpen,
  anecdoteText,
  setAnecdoteText,
  anecdoteType,
  setAnecdoteType,
  mediaUrl,
  setMediaUrl,
  onMediaFileSelected,
  isUploadingMedia = false,
  uploadedFileName = "",
  onSave,
  title,
}) => {
  const fileInputRef = React.useRef(null);
  const acceptAttr = ACCEPTED_FILE_TYPES[anecdoteType] || "*/*";

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onMediaFileSelected) {
      onMediaFileSelected(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glassmorphism-card">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Selecciona el tipo de contenido, agrega el archivo o enlace correspondiente y completa la descripción si aplica.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 my-4">
          <div className="space-y-2">
            <Label htmlFor="anecdote-type">Tipo de contenido</Label>
            <Select value={anecdoteType} onValueChange={setAnecdoteType}>
              <SelectTrigger id="anecdote-type">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {ANECDOTE_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {anecdoteType !== "text" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Archivo desde tu dispositivo</Label>
                <div className="rounded-md border border-dashed border-border/60 bg-muted/40 p-4 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptAttr}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleFileButtonClick}
                      disabled={isUploadingMedia}
                    >
                      {isUploadingMedia ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {isUploadingMedia ? "Subiendo..." : "Seleccionar archivo"}
                    </Button>
                    {mediaUrl && (
                      <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:underline"
                      >
                        <LinkIcon className="mr-1 h-4 w-4" /> Ver recurso
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {uploadedFileName
                      ? `Archivo listo: ${uploadedFileName}`
                      : mediaUrl
                        ? "Ya existe un recurso para esta anécdota. Puedes reemplazarlo subiendo otro archivo."
                        : "Selecciona un archivo o usa un enlace público."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anecdote-media">Enlace del recurso (opcional)</Label>
                <Input
                  id="anecdote-media"
                  type="url"
                  placeholder="https://..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si subes un archivo se generará el enlace automáticamente, pero puedes sobrescribirlo manualmente.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="anecdote-text">
              {anecdoteType === "text" ? "Anécdota" : "Descripción (opcional)"}
            </Label>
            <Textarea
              id="anecdote-text"
              value={anecdoteText}
              onChange={(e) => setAnecdoteText(e.target.value)}
              placeholder={anecdoteType === "text" ? "Escribe aquí tu anécdota..." : "Añade un contexto o nota"}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isUploadingMedia}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnecdoteDialog;