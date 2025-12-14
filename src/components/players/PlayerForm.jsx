import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { optimizeImageFile, uploadPlayerPhoto } from "@/lib/mediaStorage";

const buildInitialState = (player) => ({
  id: player?.id || null,
  name: player?.name || "",
  nickname: player?.nickname || "",
  email: player?.email || "",
  phone: player?.phone || "",
  photo: player?.photo || "",
  playerType: player?.playerType || player?.player_type || "Tecnico",
});

const isValidHttpUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const PlayerForm = ({ player, onSave, onCancel }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(() => buildInitialState(player));
  const [photoPreview, setPhotoPreview] = useState(player?.photo || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const uploadControllerRef = useRef(null);
  const tempObjectUrlRef = useRef(null);

  const abortCurrentUpload = () => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.abort();
      uploadControllerRef.current = null;
    }
  };

  const resetTempPreview = () => {
    if (tempObjectUrlRef.current) {
      URL.revokeObjectURL(tempObjectUrlRef.current);
      tempObjectUrlRef.current = null;
    }
  };

  const setPreviewFromFile = (file) => {
    resetTempPreview();
    const objectUrl = URL.createObjectURL(file);
    tempObjectUrlRef.current = objectUrl;
    setPhotoPreview(objectUrl);
  };

  const setPreviewFromUrl = (url) => {
    resetTempPreview();
    setPhotoPreview(url);
  };

  useEffect(() => {
    setFormData(buildInitialState(player));
    setPreviewFromUrl(player?.photo || "");
    setPhotoUploadProgress(0);
    abortCurrentUpload();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [player]);

  useEffect(() => () => {
    abortCurrentUpload();
    resetTempPreview();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, playerType: value }));
  };

  const handlePhotoUrlChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, photo: value }));
    setPreviewFromUrl(value);
    setPhotoUploadProgress(0);
    abortCurrentUpload();
    setIsUploadingPhoto(false);
  };

  const handlePhotoFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previousPhoto = formData.photo;
    abortCurrentUpload();
    setIsUploadingPhoto(true);
    setPhotoUploadProgress(0);

    try {
      const optimizedFile = await optimizeImageFile(file);
      setPreviewFromFile(optimizedFile);

      const controller = new AbortController();
      uploadControllerRef.current = controller;

      const { publicUrl } = await uploadPlayerPhoto(optimizedFile, {
        signal: controller.signal,
        onProgress: (value) => setPhotoUploadProgress(value),
      });

      setFormData((prev) => ({ ...prev, photo: publicUrl }));
      setPhotoUploadProgress(1);
      toast({ title: "Fotografía lista", description: "Puedes seguir completando el formulario antes de guardar." });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error uploading player photo:", error);
        toast({
          title: "Error al subir la foto",
          description: error.message || "Inténtalo nuevamente con otra imagen.",
          variant: "destructive",
        });
        setFormData((prev) => ({ ...prev, photo: previousPhoto }));
        setPreviewFromUrl(previousPhoto || "");
      }
    } finally {
      setIsUploadingPhoto(false);
      uploadControllerRef.current = null;
    }
  };

  const handleClearPhoto = () => {
    abortCurrentUpload();
    setFormData((prev) => ({ ...prev, photo: "" }));
    setPreviewFromUrl("");
    setPhotoUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.name.trim() || !formData.nickname.trim()) {
      toast({
        title: "Error",
        description: "Nombre y Apodo son campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    if (isUploadingPhoto) {
      toast({
        title: "Subiendo fotografía",
        description: "Espera a que termine antes de guardar al jugador.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidHttpUrl(formData.photo)) {
      toast({
        title: "URL inválida",
        description: "La fotografía debe ser una URL pública válida (https://).",
        variant: "destructive",
      });
      return;
    }

    const normalizedData = {
      ...formData,
      name: formData.name.trim(),
      nickname: formData.nickname.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      photo: formData.photo.trim(),
    };

    setIsSubmitting(true);
    try {
      await Promise.resolve(onSave(normalizedData));
    } catch (error) {
      console.error("Error guardando jugador:", error);
      toast({
        title: "No pudimos guardar",
        description: "Inténtalo nuevamente en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre Completo</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Juan Pérez" required />
      </div>
      <div>
        <Label htmlFor="nickname">Apodo</Label>
        <Input id="nickname" name="nickname" value={formData.nickname} onChange={handleChange} placeholder="Ej: El Maestro" required />
      </div>
      <div>
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Ej: juan.perez@example.com" />
      </div>
      <div>
        <Label htmlFor="phone">Número de Celular</Label>
        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Ej: 5512345678" />
      </div>
      <div>
        <Label htmlFor="playerType">Tipo de Jugador</Label>
        <Select name="playerType" value={formData.playerType} onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tecnico">Técnico</SelectItem>
            <SelectItem value="Rudo">Rudo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="photoUrl">Fotografía</Label>
        <p className="text-xs text-muted-foreground mb-1">Pega una URL pública o sube una imagen. Puedes seguir llenando el formulario mientras se carga.</p>
        <Input
          id="photoUrl"
          name="photo"
          type="url"
          value={formData.photo}
          onChange={handlePhotoUrlChange}
          placeholder="https://ejemplo.com/foto.jpg"
          className="mb-3"
        />
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            id="photoFile"
            type="file"
            accept="image/*"
            onChange={handlePhotoFileChange}
          />
          {formData.photo && (
            <Button type="button" variant="ghost" onClick={handleClearPhoto} className="text-xs">
              Limpiar
            </Button>
          )}
        </div>
        {isUploadingPhoto && (
          <div className="mt-2">
            <div className="text-xs text-muted-foreground mb-1">Subiendo fotografía ({Math.round(photoUploadProgress * 100)}%)</div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(photoUploadProgress * 100, 100)}%` }} />
            </div>
          </div>
        )}
        {photoPreview && !isUploadingPhoto && (
          <div className="flex items-center gap-3 mt-3">
            <Avatar className="h-20 w-20">
              <AvatarImage src={photoPreview} alt={formData.nickname || "preview"} />
              <AvatarFallback>{formData.nickname?.[0] || "P"}</AvatarFallback>
            </Avatar>
            <div className="text-xs text-muted-foreground">
              Foto lista para guardar. Se almacenará en cuanto confirmes el formulario.
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Guardando..." : player?.id ? "Guardar Cambios" : "Agregar Jugador"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PlayerForm;