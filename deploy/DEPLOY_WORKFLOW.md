# Guía de ajustes y redeploy

Este instructivo detalla cada acción necesaria cuando modifiques el código del proyecto (frontend en Vite/React y backend Fastify en Docker) y quieras volver a desplegarlo en `dominocum74.top`. Sigue todas las secciones, en orden.

## 1. Preparación local
- Ubicación del código: `~/domino74` (o la ruta donde clonaste el repo).
- Actualiza la rama principal y crea una rama de trabajo:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/nueva-funcion
  ```
- Edita los archivos correspondientes:
  - Frontend: `src/**/*.jsx`, `src/pages/**/*.jsx`, `src/components/**/*`.
  - Backend: `server/**/*.js` (Fastify API), `server/routes`, `server/services`.
- Instala dependencias nuevas solo si cambiaste `package.json`: `npm install nombre-paquete`. Antes de commitear, deja todo limpio con `npm ci`.
- Ejecuta validaciones locales:
  ```bash
  npm run lint
  npm test # si aplica
  npm run build
  ```
- Realiza commits claros y descriptivos (`git commit -m "feat: nuevo componente"`).

## 2. Variables de entorno locales
Antes de construir, asegúrate de que tu `.env` local contenga:
```
VITE_API_BASE_URL=https://api.dominocum74.top
VITE_API_KEY=super-secret-key
VITE_UPLOADS_PUBLIC_BASE_URL=https://api.dominocum74.top
```
Ajusta estos valores sólo si cambian en producción.

## 3. Construcción del frontend
Desde la raíz del repo local:
```bash
npm ci
npm run build
```
Esto genera `dist/` con la SPA optimizada. Verifica que no existan errores en consola.

## 4. Conexión al servidor
- Conéctate al VPS: `ssh gaibarra@srv641665.niagahoster.com`.
- Directorio de trabajo remoto: `/home/gaibarra/domino74` (repo desplegado).

## 5. Actualizar código en el servidor
1. Trae los últimos commits:
   ```bash
   cd /home/gaibarra/domino74
   git pull
   ```
2. Reconstruye el frontend para asegurarte de que el entorno remoto tiene dependencias correctas:
   ```bash
   npm ci
   npm run build
   ```

## 6. Deploy del frontend (SPA)
Usa el script oficial, que sincroniza `dist/` hacia `/var/www/dominocum74/current`:
```bash
DEPLOY_USER=root DEPLOY_PORT=49153 ./scripts/deploy.sh
```
El script realiza:
- `rsync` de `dist/`.
- Actualización del symlink `current`.
- Ajuste de permisos.
- Reload de Nginx si es necesario.

## 7. Backend Fastify (si cambiaste `server/`)
1. Variables activas: edita `/var/www/dominocum74/current/.env.api` con `sudo nano` si necesitas actualizar `DATABASE_URL`, `API_KEY`, `UPLOADS_PUBLIC_BASE_URL`, `UPLOAD_MAX_BYTES`, etc. Asegúrate de que el host usado para exponer `/uploads` (por ejemplo `https://api.dominocum74.top`) corresponda al dominio real y que el límite de bytes sea suficiente para tus videos.
2. Reinicia el servicio systemd para reconstruir la imagen Docker y recrear el contenedor con las nuevas variables:
   ```bash
   sudo systemctl restart domino74-api.service
   ```
3. Confirma que usa la cadena correcta:
   ```bash
   docker exec backend-domino74-api-1 printenv DATABASE_URL
   ```
4. Revisa los logs:
   ```bash
   docker logs backend-domino74-api-1 --tail 50
   ```

## 8. Certificados y Nginx (solo si cambian dominios)
- Configuración activa: `/etc/nginx/sites-available/dominocum74.conf` (enlazado desde `sites-enabled`).
- Si agregas un subdominio nuevo, edita ese archivo y ejecuta:
  ```bash
  sudo nginx -t
  sudo systemctl reload nginx
  ```
- Para incluir el host en el certificado:
  ```bash
  sudo certbot --nginx -d dominocum74.top -d www.dominocum74.top -d api.dominocum74.top
  ```
   Si cambias `UPLOAD_MAX_BYTES`, también ajusta `client_max_body_size` dentro de `deploy/nginx/dominocum74.conf` para que Nginx acepte cuerpos del mismo tamaño.

## 9. Verificaciones posteriores
1. **API health**:
   ```bash
   API_KEY=$(grep '^API_KEY=' /var/www/dominocum74/current/.env.api | cut -d= -f2-)
   curl -H "x-api-key: $API_KEY" https://api.dominocum74.top/health
   ```
2. **Endpoints clave**:
   ```bash
   curl -H "x-api-key: $API_KEY" "https://api.dominocum74.top/games?limit=5&offset=0"
   ```
3. **Logs**:
   ```bash
   sudo journalctl -u domino74-api.service -n 100 --no-pager
   sudo tail -f /var/log/nginx/api.dominocum74.error.log
   ```
4. **Frontend**: abre `https://dominocum74.top`, haz hard refresh (Shift+F5) y revisa la consola del navegador.

## 10. Limpieza y documentación
- Si todo se ve bien, crea la PR o mergea `feature/...` en `main`.
- Opcional: etiqueta la versión (`git tag vX.Y && git push origin --tags`).
- Anota cambios importantes en `deploy/README.md` o en tus herramientas internas.

Siguiendo este documento no quedan pasos implícitos: desarrollas, construyes, despliegas, reinicias el backend y verificas el estado final.
