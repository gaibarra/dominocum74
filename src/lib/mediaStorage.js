import { apiClient, apiConfig } from './apiClient';

const UPLOADS_ENDPOINT = '/uploads';
const PLAYER_MEDIA_FOLDER = 'players';
const ANECDOTE_MEDIA_BASE_FOLDER = 'anecdotes';
const PLAYER_PHOTO_MAX_DIMENSION = 1200;
const PLAYER_PHOTO_QUALITY = 0.85;

const ensureUploadSupport = () => {
  if (typeof window === 'undefined' || typeof XMLHttpRequest === 'undefined' || typeof FormData === 'undefined') {
    throw new Error('La carga de archivos solo está disponible en el navegador.');
  }
};

const normalizeBaseUrl = (baseUrl) => {
  if (!baseUrl) return '';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const getUploadsUrl = () => `${normalizeBaseUrl(apiConfig.baseUrl || '')}${UPLOADS_ENDPOINT}`;

const uploadFileWithProgress = ({ file, folder, onProgress, signal }) => new Promise((resolve, reject) => {
  ensureUploadSupport();
  const xhr = new XMLHttpRequest();
  const endpoint = getUploadsUrl();
  const headers = [];
  if (apiConfig.apiKey) {
    headers.push(['x-api-key', apiConfig.apiKey]);
  }

  xhr.open('POST', endpoint);
  headers.forEach(([key, value]) => xhr.setRequestHeader(key, value));

  let abortListener;

  xhr.upload.onprogress = (event) => {
    if (typeof onProgress !== 'function' || !event.lengthComputable) return;
    onProgress(event.loaded / event.total);
  };

  xhr.onload = () => {
    if (signal && abortListener) {
      signal.removeEventListener('abort', abortListener);
    }
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const payload = JSON.parse(xhr.responseText || '{}');
        resolve(payload);
      } catch (error) {
        reject(new Error('No se pudo interpretar la respuesta del servidor.'));
      }
    } else {
      reject(new Error(`Falló la carga (${xhr.status})`));
    }
  };

  xhr.onerror = () => {
    if (signal && abortListener) {
      signal.removeEventListener('abort', abortListener);
    }
    reject(new Error('No se pudo completar la carga.'));
  };

  const abortHandler = () => {
    xhr.abort();
    reject(new DOMException('Upload aborted', 'AbortError'));
  };

  if (signal) {
    if (signal.aborted) {
      abortHandler();
      return;
    }
    abortListener = abortHandler;
    signal.addEventListener('abort', abortListener, { once: true });
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder || 'generic');
  xhr.send(formData);
});

const readImageElement = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    resolve(image);
  };
  image.onerror = (error) => {
    URL.revokeObjectURL(objectUrl);
    reject(error);
  };
  image.src = objectUrl;
});

const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('No se pudo procesar la imagen.'));
      return;
    }
    resolve(blob);
  }, type, quality);
});

export const optimizeImageFile = async (file, { maxDimension = PLAYER_PHOTO_MAX_DIMENSION, quality = PLAYER_PHOTO_QUALITY } = {}) => {
  if (!file) {
    throw new Error('No se proporcionó archivo para optimizar.');
  }
  if (!file.type?.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen.');
  }

  const image = await readImageElement(file);
  const largestSide = Math.max(image.width, image.height);
  const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;

  if (scale === 1 && file.type === 'image/jpeg' && file.size < 800 * 1024) {
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  }

  const optimizedBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
  return new File([optimizedBlob], `player-photo-${Date.now()}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
};

const toUploadResponse = (payload) => ({
  publicUrl: payload?.url || '',
  relativePath: payload?.relativePath || '',
});

const buildAnecdoteFolder = (mediaType = 'generic') => {
  const safe = String(mediaType)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '');
  const suffix = safe || 'generic';
  return `${ANECDOTE_MEDIA_BASE_FOLDER}/${suffix}`;
};

export const uploadPlayerPhoto = async (file, { onProgress, signal } = {}) => {
  const payload = await uploadFileWithProgress({
    file,
    folder: PLAYER_MEDIA_FOLDER,
    onProgress,
    signal,
  });
  return toUploadResponse(payload);
};

export const uploadAnecdoteMedia = async (file, mediaType = 'image', { onProgress, signal } = {}) => {
  const payload = await uploadFileWithProgress({
    file,
    folder: buildAnecdoteFolder(mediaType),
    onProgress,
    signal,
  });
  return toUploadResponse(payload);
};

export const deleteAnecdoteMediaByUrl = async (targetUrl) => {
  if (!targetUrl) return false;
  try {
    await apiClient.delete(UPLOADS_ENDPOINT, { url: targetUrl });
    return true;
  } catch (error) {
    console.warn('No se pudo eliminar el archivo remoto:', error.message);
    return false;
  }
};
