---
description: Iniciar el servidor backend de Servi Choquib en el puerto 8000
---

1. Verifica que el archivo `server/.env` existe. Si no, créalo copiando `server/.env.example` y cambia `PORT=8000`.

// turbo
2. Instala dependencias dentro de la carpeta server si no están instaladas:
```powershell
npm install
```
Cwd: c:\Users\Danny\Downloads\servi-choquib\server

// turbo
3. Inicia el servidor:
```powershell
node src/server.js
```
Cwd: c:\Users\Danny\Downloads\servi-choquib\server

4. Verifica que responde en http://localhost:8000/api/health — debe devolver `{"ok":true}`.
