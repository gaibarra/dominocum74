import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { saveGame } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { uploadAnecdoteMedia, deleteAnecdoteMediaByUrl } from '@/lib/mediaStorage';

export const useAnecdotes = (game, setGame, fetchGameAndPlayersData) => {
  const { toast } = useToast();
  const [isAnecdoteDialogOpen, setIsAnecdoteDialogOpen] = useState(false);
  const [currentAnecdoteText, setCurrentAnecdoteText] = useState("");
  const [currentAnecdoteType, setCurrentAnecdoteType] = useState("text");
  const [currentAnecdoteMediaUrl, setCurrentAnecdoteMediaUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [editingAnecdote, setEditingAnecdote] = useState(null); 
  const [dialogTitle, setDialogTitle] = useState("Nueva Anécdota");
  const pendingDeletionOnSaveRef = useRef(null);

  const resetDialogState = useCallback(() => {
    setEditingAnecdote(null);
    setCurrentAnecdoteText("");
    setCurrentAnecdoteType("text");
    setCurrentAnecdoteMediaUrl("");
    setUploadedFileName("");
    pendingDeletionOnSaveRef.current = null;
  }, []);

  const handleOpenAddAnecdoteDialog = useCallback(() => {
    resetDialogState();
    setDialogTitle("Nueva Anécdota");
    setIsAnecdoteDialogOpen(true);
  }, [resetDialogState]);

  const handleOpenEditAnecdoteDialog = useCallback((anecdote) => {
    setEditingAnecdote(anecdote);
    setCurrentAnecdoteText(anecdote.text || "");
    setCurrentAnecdoteType(anecdote.mediaType || "text");
    setCurrentAnecdoteMediaUrl(anecdote.mediaUrl || "");
    setUploadedFileName("");
    pendingDeletionOnSaveRef.current = null;
    setDialogTitle("Editar Anécdota");
    setIsAnecdoteDialogOpen(true);
  }, []);

  useEffect(() => {
    if (currentAnecdoteType === "text" && currentAnecdoteMediaUrl) {
      setCurrentAnecdoteMediaUrl("");
    }
  }, [currentAnecdoteType, currentAnecdoteMediaUrl]);

  const handleMediaFileSelected = useCallback(async (file) => {
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const { publicUrl } = await uploadAnecdoteMedia(file, currentAnecdoteType);
      if (editingAnecdote?.mediaUrl && editingAnecdote.mediaUrl !== publicUrl) {
        pendingDeletionOnSaveRef.current = editingAnecdote.mediaUrl;
      }
      setCurrentAnecdoteMediaUrl(publicUrl);
      setUploadedFileName(file.name);
      toast({ title: "Archivo listo", description: "El recurso se subió correctamente." });
    } catch (error) {
      console.error('Error uploading anecdote media:', error);
      toast({ title: "Error al subir", description: "No se pudo subir el archivo. Intenta nuevamente.", variant: "destructive" });
    } finally {
      setIsUploadingMedia(false);
    }
  }, [currentAnecdoteType, editingAnecdote, toast]);

  const handleSaveAnecdote = async () => {
    if (isUploadingMedia) {
      toast({ title: "Subiendo archivo", description: "Espera a que el archivo termine de subir antes de guardar.", variant: "destructive" });
      return;
    }

    const trimmedText = currentAnecdoteText.trim();
    const trimmedUrl = currentAnecdoteMediaUrl.trim();
    const isTextEntry = currentAnecdoteType === "text";

    if (isTextEntry && !trimmedText) {
      toast({ title: "Error", description: "La anécdota de texto no puede estar vacía.", variant: "destructive" });
      return;
    }

    if (!isTextEntry && !trimmedUrl) {
      toast({ title: "Error", description: "Proporciona un enlace válido para la anécdota.", variant: "destructive" });
      return;
    }

    const updatedGame = JSON.parse(JSON.stringify(game));
    
    if (editingAnecdote && editingAnecdote.id) {
      const anecdoteIndex = updatedGame.anecdotes.findIndex(a => a.id === editingAnecdote.id);
      if (anecdoteIndex !== -1) {
        updatedGame.anecdotes[anecdoteIndex] = {
          ...updatedGame.anecdotes[anecdoteIndex],
          text: trimmedText,
          mediaType: currentAnecdoteType,
          mediaUrl: isTextEntry ? "" : trimmedUrl,
        };
        updatedGame.anecdotes[anecdoteIndex].last_edited = new Date().toISOString();
      } else {
        toast({ title: "Error", description: "No se encontró la anécdota para actualizar.", variant: "destructive" });
        return;
      }
    } else {
      if (!updatedGame.anecdotes) {
        updatedGame.anecdotes = [];
      }
      updatedGame.anecdotes.push({
        id: `temp-anecdote-${uuidv4()}`,
        text: trimmedText,
        mediaType: currentAnecdoteType,
        mediaUrl: isTextEntry ? "" : trimmedUrl,
        date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }
    
    const gameSavedId = await saveGame(updatedGame);
    if (gameSavedId) {
      await fetchGameAndPlayersData();
      setIsAnecdoteDialogOpen(false);
      resetDialogState();
      if (pendingDeletionOnSaveRef.current) {
        try {
          await deleteAnecdoteMediaByUrl(pendingDeletionOnSaveRef.current);
        } catch (error) {
          console.error('Error deleting replaced media:', error);
        } finally {
          pendingDeletionOnSaveRef.current = null;
        }
      }
      toast({ title: editingAnecdote ? "Anécdota Actualizada" : "Anécdota Agregada" });
    } else {
      toast({ title: "Error", description: "No se pudo guardar la anécdota. Intenta de nuevo.", variant: "destructive" });
    }
  };

  const handleDeleteAnecdote = async (anecdoteId) => {
    const updatedGame = JSON.parse(JSON.stringify(game));
    const anecdoteToDelete = updatedGame.anecdotes.find(a => a.id === anecdoteId);
    updatedGame.anecdotes = updatedGame.anecdotes.filter(a => a.id !== anecdoteId);
    
    const gameSavedId = await saveGame(updatedGame);
    if (gameSavedId) {
      await fetchGameAndPlayersData();
      if (anecdoteToDelete?.mediaUrl) {
        try {
          await deleteAnecdoteMediaByUrl(anecdoteToDelete.mediaUrl);
        } catch (error) {
          console.error('Error deleting anecdote media from storage:', error);
        }
      }
      toast({ title: "Anécdota Eliminada" });
    } else {
      toast({ title: "Error", description: "No se pudo eliminar la anécdota. Intenta de nuevo.", variant: "destructive" });
    }
  };

  return {
    isAnecdoteDialogOpen,
    setIsAnecdoteDialogOpen,
    currentAnecdoteText,
    setCurrentAnecdoteText,
    currentAnecdoteType,
    setCurrentAnecdoteType,
    currentAnecdoteMediaUrl,
    setCurrentAnecdoteMediaUrl,
    uploadedFileName,
    isUploadingMedia,
    editingAnecdote, 
    dialogTitle,
    handleOpenAddAnecdoteDialog,
    handleOpenEditAnecdoteDialog,
    handleMediaFileSelected,
    handleSaveAnecdote,
    handleDeleteAnecdote,
  };
};