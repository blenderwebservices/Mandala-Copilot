# Guía de Despliegue en Servidor Plesk — Mandala Copilot AI

**Documento:** `docs/despliegueEnPlesk.md`  
**Aplicación:** Mandala Copilot AI (React 19 + Express + Google Gemini API)  
**Entorno de Servidor:** Plesk Obsidian / Onyx con extensión Node.js (Phusion Passenger / Nginx Reverse Proxy)

---

## 1. Arquitectura de Despliegue

Mandala Copilot AI funciona mediante una arquitectura híbrida de alto rendimiento:
* **Frontend SPA (Cliente):** Generado estáticamente por Vite en la carpeta `dist/`.
* **Backend API (Servidor):** Servidor Express compilado por esbuild en un único archivo ejecutable `server.js`, el cual atiende las peticiones `/api/*` y sirve los archivos de `dist/` en producción.
* **Procesamiento de Puerto dinámico:** `server.js` toma automáticamente `process.env.PORT || 3000`, haciéndolo compatible de forma nativa con los sockets de Phusion Passenger y proxies inversos de Plesk.

---

## 2. Requisitos Previos en el Servidor Plesk

1. **Extensión Node.js de Plesk** instalada y habilitada para el dominio o subdominio asignado (ej. `mandala.tudominio.com`).
2. **Versión de Node.js:** Seleccionar **Node.js 20.x LTS** o **22.x LTS**.
3. **Certificado SSL Activo:** Emitir e instalar el certificado gratuito **Let's Encrypt** desde el panel de Plesk para habilitar `https://`.
4. **Clave API de Gemini:** Clave activa obtenida desde [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## 3. Preparación y Compilación Local

Antes de subir los archivos al servidor, ejecuta en tu terminal local:

```bash
npm run build
```

Este comando ejecuta:
1. `vite build` (compila el frontend React en `dist/`).
2. `esbuild server.ts` (empaqueta el backend en `server.js`).

### Archivos indispensables que DEBES subir a Plesk:
- 📁 `dist/` *(carpeta completa con assets y HTML compilado)*
- 📄 `server.js` *(el servidor backend compilado listo para Node)*
- 📄 `package.json` y `package-lock.json` *(para instalar dependencias en el servidor)*
- 📄 `.env` *(opcional si defines las variables directamente en el panel de Plesk)*

### Archivos que NO debes subir:
- ❌ `node_modules/` *(se instalan directamente en el servidor)*
- ❌ `src/` o archivos `.ts` fuente innecesarios en ejecución
- ❌ `.git/` o carpetas de configuración local

---

## 4. Subir los Archivos al Servidor

Puedes emplear cualquiera de estos tres métodos:

* **Opción A (Recomendada - Git de Plesk):**
  1. Conecta tu repositorio de GitHub / GitLab en **Plesk > Git**.
  2. En **Acciones adicionales de despliegue**, puedes configurar:
     ```bash
     npm install --omit=dev
     ```
* **Opción B (Administrador de Archivos de Plesk):**
  1. Comprime en un archivo `.zip` local las carpetas `dist/`, `server.js`, `package.json` y `package-lock.json`.
  2. Súbelo a la carpeta raíz de tu dominio (usualmente `/httpdocs` o `/subdominio.tudominio.com`).
  3. Extrae el contenido en la raíz.
* **Opción C (SFTP / SCP):**
  Sube los archivos directamente vía FileZilla, Cyberduck o terminal SSH a la ruta de tu dominio.

---

## 5. Configuración en la Pantalla de Node.js en Plesk

Entra a **Sitios web y dominios** > haz clic en el icono **Node.js** de tu dominio y completa los siguientes parámetros:

| Campo | Valor Configurado | Descripción |
| :--- | :--- | :--- |
| **Versión de Node.js** | `20.x.x` o `22.x.x` | Versión LTS compatible |
| **Modo de la aplicación (*Application Mode*)** | `production` | Activa compresión y omite middlewares de desarrollo |
| **Raíz de la aplicación (*Application Root*)** | `/httpdocs` | Directorio donde residen `server.js` y `dist/` |
| **Archivo de inicio (*Application Startup File*)** | `server.js` | Archivo principal que arranca Express |
| **Raíz del documento (*Document Root*)** | `/httpdocs` | Raíz web estándar para Passenger |

---

## 6. Instalación de Dependencias en Plesk

En la misma pantalla de Node.js de Plesk:
1. Haz clic en el botón **"Instalación de NPM"** (*NPM Install*).
2. Plesk leerá `package.json` e instalará las dependencias necesarias de producción (`express`, `@google/genai`, `dotenv`, etc.).

> **Nota para terminal SSH:** Si prefieres la línea de comandos, puedes ejecutar:
> ```bash
> cd /var/www/vhosts/tudominio.com/httpdocs
> npm install --omit=dev
> ```

---

## 7. Variables de Entorno

Puedes definirlas directamente en la sección **Variables de entorno** de la pantalla de Node.js en Plesk, o en un archivo `.env` en la raíz `/httpdocs`:

```env
NODE_ENV=production
GEMINI_API_KEY=AIzaSyTuClaveDeGoogleAIStudioAqui
GEMINI_MODEL=gemini-2.5-flash
```

*Configurarlas en el panel de Plesk es más seguro, ya que evita exponer credenciales en archivos del sistema de archivos.*

---

## 8. Configuración de Apache y Nginx en Plesk

Ve a **Sitios web y dominios** > **Configuración de Apache y Nginx**:

1. **Proxy Inverso:**
   - Asegúrate de que Nginx esté habilitado para procesar solicitudes dinámicas y delegar a Node.js (habilitado por defecto en Plesk).
2. **Caché Inteligente de Nginx:**
   - Si la caché de Nginx está activa, añade una regla o directiva para no almacenar en caché las rutas dinámicas `/api/*`:
     ```nginx
     location /api/ {
         proxy_pass http://unix:/tmp/passenger...; # O delegación por defecto
         proxy_cache_bypass 1;
         proxy_no_cache 1;
     }
     ```
3. **Compresión Gzip / Brotli:**
   - Habilita la compresión Gzip para archivos `.js`, `.css` y `.json` para máxima velocidad.

---

## 9. Iniciar y Verificar la Aplicación

1. En la pantalla de Node.js en Plesk, presiona el botón **"Reiniciar aplicación"** (*Restart*).
2. Abre tu navegador web en `https://tudominio.com`.
3. **Puntos de Comprobación:**
   - **Carga Visual:** La matriz 9×9 y los componentes deben cargar instantáneamente con diseño limpio.
   - **Selector de Tema:** Prueba alternar entre **Claro**, **Oscuro** y **Sistema** en la esquina superior derecha.
   - **Conectividad con IA:** Haz clic en la insignia de Gemini en la barra superior. Debe marcar `En línea / Activo` y reportar la latencia de respuesta en milisegundos.
   - **Cabeceras de Seguridad:** Verifica con las herramientas de desarrollador (F12 > Network) que las cabeceras `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y la directiva `Content-Security-Policy` estén presentes en la respuesta.

---

## 10. Resolución de Problemas Comunes (Troubleshooting)

### Error 502 Bad Gateway / Phusion Passenger Error
* **Causa 1:** El archivo de inicio no se llama `server.js` o no está en la raíz de la aplicación.
* **Causa 2:** `server.js` falló al arrancar debido a un módulo faltante.
* **Solución:** Revisa los logs en Plesk: ve a **Registros / Logs** del dominio y revisa `error_log` o `proxy_error_log`. Ejecuta nuevamente **"Instalación de NPM"**.

### Error de Conexión a Gemini (Insignia en Amarillo / "Sin API Key")
* **Causa:** La variable `GEMINI_API_KEY` no se cargó correctamente.
* **Solución:** Abre el modal de estado de IA haciendo clic en la insignia, introduce tu clave en el formulario y haz clic en **"Guardar en .env y Probar"** o configúrala en las variables de entorno de Plesk y reinicia la aplicación.

### Actualizaciones Futuras del Proyecto
Cada vez que realices cambios en el código:
1. En tu máquina local ejecuta: `npm run build`
2. Sube la carpeta `dist/` y el archivo `server.js` actualizados a Plesk.
3. En la pantalla de Node.js de Plesk haz clic en **"Reiniciar aplicación"**.
