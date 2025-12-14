import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import { env } from '../env.js';

const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'video/mp4': '.mp4',
};

const sanitizeFolder = (folder) => {
  if (!folder) return 'generic';
  const safe = String(folder)
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '')
    .replace(/\.\.+/g, '')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/');
  return safe || 'generic';
};

const sanitizeRelativePath = (relativePath) => {
  if (!relativePath) return null;
  const clean = String(relativePath)
    .replace(/^[./\\]+/, '')
    .replace(/\.\.+/g, '')
    .replace(/\\/g, '/');
  return clean || null;
};

const pickExtension = (filename, mimetype) => {
  const directExt = filename ? path.extname(filename) : '';
  if (directExt) return directExt;
  if (mimetype && MIME_EXTENSION_MAP[mimetype]) {
    return MIME_EXTENSION_MAP[mimetype];
  }
  return '.bin';
};

const ensureWithinUploadsDir = (targetPath) => {
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(path.resolve(env.uploadsDir))) {
    throw new Error('Ruta de subida inválida');
  }
  return resolved;
};

export const saveUploadedFile = async (stream, { filename, mimetype, folder } = {}) => {
  const safeFolder = sanitizeFolder(folder);
  const ext = pickExtension(filename, mimetype);
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;
  const relativePath = path.posix.join(safeFolder, fileName);
  const targetDir = path.join(env.uploadsDir, safeFolder);
  await fs.mkdir(targetDir, { recursive: true });
  const absolutePath = ensureWithinUploadsDir(path.join(targetDir, fileName));
  await pipeline(stream, createWriteStream(absolutePath));
  return {
    relativePath,
    absolutePath,
  };
};

export const deleteUploadedFile = async (relativePath) => {
  const clean = sanitizeRelativePath(relativePath);
  if (!clean) return false;
  const absolutePath = ensureWithinUploadsDir(path.join(env.uploadsDir, clean));
  try {
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

export const deriveRelativePathFromUrl = (url, basePath = env.uploadsBasePath) => {
  if (!url) return null;
  try {
    const isAbsolute = /^https?:\/\//i.test(url);
    const target = isAbsolute ? new URL(url).pathname : url;
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const idx = target.indexOf(normalizedBase);
    if (idx === -1) return sanitizeRelativePath(target);
    const after = target.substring(idx + normalizedBase.length);
    return sanitizeRelativePath(after);
  } catch {
    return null;
  }
};
