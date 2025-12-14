import { z } from 'zod';
import { env } from '../env.js';
import {
  saveUploadedFile,
  deleteUploadedFile,
  deriveRelativePathFromUrl,
} from '../services/uploadService.js';

const deleteSchema = z.object({
  path: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
}).refine((value) => value.path || value.url, {
  message: 'Debes proporcionar path o url',
});

const buildPublicUrl = (request, relativePath) => {
  const pathSegment = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const basePrefix = env.uploadsBasePath.endsWith('/')
    ? env.uploadsBasePath.slice(0, -1)
    : env.uploadsBasePath;
  const resourcePath = `${basePrefix}${pathSegment}`.replace(/\\/g, '/');

  if (env.uploadsPublicBaseUrl) {
    return `${env.uploadsPublicBaseUrl}${resourcePath}`;
  }

  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol = forwardedProto || request.protocol || 'http';
  const forwardedHost = request.headers['x-forwarded-host'];
  const host = forwardedHost || request.headers.host || request.hostname;

  if (!host) {
    return resourcePath;
  }
  return `${protocol}://${host}${resourcePath}`;
};

export default async function uploadRoutes(app) {
  app.post('/uploads', async (request, reply) => {
    const multipartFile = await request.file({ limits: { files: 1 } });
    if (!multipartFile) {
      return reply.badRequest('Archivo requerido');
    }

    const folderField = multipartFile.fields?.folder;
    const folder = folderField?.value || 'generic';

    const { relativePath } = await saveUploadedFile(multipartFile.file, {
      filename: multipartFile.filename,
      mimetype: multipartFile.mimetype,
      folder,
    });

    const publicUrl = buildPublicUrl(request, relativePath);
    reply.code(201);
    return {
      url: publicUrl,
      relativePath,
      mimeType: multipartFile.mimetype,
    };
  });

  app.delete('/uploads', async (request, reply) => {
    const payload = deleteSchema.parse(request.body || {});
    const relativePath = payload.path || deriveRelativePathFromUrl(payload.url);
    if (!relativePath) {
      return reply.badRequest('No se pudo interpretar la ruta del archivo');
    }
    const removed = await deleteUploadedFile(relativePath);
    if (!removed) {
      return reply.notFound('Archivo no encontrado');
    }
    reply.code(204);
  });
}
