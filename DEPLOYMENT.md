# Guía de Despliegue Frontend en Ubuntu Server

## 1. Clonar Repositorio Frontend

```bash
# Ir al directorio home
cd ~

# Clonar repositorio
git clone https://github.com/davidzaratecamp/frontend-university-nuevo.git
cd frontend-university-nuevo

# Instalar dependencias
npm install
```

## 2. Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

Contenido del archivo `.env`:

```env
VITE_API_URL=http://TU_IP_O_DOMINIO/api
```

Por ejemplo:
```env
VITE_API_URL=http://10.255.255.167/api
```

O si usas un dominio:
```env
VITE_API_URL=http://tudominio.com/api
```

## 3. Construir Frontend para Producción

```bash
# Construir proyecto
npm run build

# Esto creará una carpeta 'dist' con los archivos optimizados
```

## 4. Verificar Nginx

El frontend ya debería estar configurado en Nginx (ver DEPLOYMENT.md del backend).

La configuración de Nginx apunta a:
```
/home/asiste/frontend-university-nuevo/dist
```

## 5. Probar Aplicación

Abre tu navegador y ve a:
```
http://10.255.255.167
```

O si configuraste un dominio:
```
http://tudominio.com
```

## 6. Actualizar Frontend

Cuando hagas cambios:

```bash
cd ~/frontend-university-nuevo
git pull
npm install
npm run build
# No es necesario reiniciar Nginx
```

## 7. Configurar HTTPS con Let's Encrypt (Opcional pero Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com

# Certbot configurará automáticamente Nginx para HTTPS
```

Después de esto, actualiza el `.env`:
```env
VITE_API_URL=https://tudominio.com/api
```

Y reconstruye:
```bash
npm run build
```

## Comandos Útiles

```bash
# Ver tamaño de build
du -sh dist/

# Limpiar y reconstruir
rm -rf dist node_modules
npm install
npm run build

# Verificar que Nginx esté sirviendo los archivos correctos
ls -la /home/asiste/frontend-university-nuevo/dist/
```

## Resolución de Problemas

### Error 404 al refrescar página

Esto ya está resuelto en la configuración de Nginx con:
```nginx
try_files $uri $uri/ /index.html;
```

### API no responde

Verifica que:
1. La variable `VITE_API_URL` esté correcta
2. El backend esté corriendo: `pm2 status`
3. Nginx esté configurado correctamente: `sudo nginx -t`

### Cambios no se reflejan

Asegúrate de:
1. Haber ejecutado `npm run build`
2. Limpiar caché del navegador (Ctrl + Shift + R)
3. Verificar que Nginx esté apuntando a la carpeta correcta
