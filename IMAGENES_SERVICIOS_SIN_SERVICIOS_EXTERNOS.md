# Fotografías de servicios sin almacenamiento externo

La carga de imágenes de servicios utiliza el mismo mecanismo del perfil: el navegador lee la imagen como Data URL/Base64 y la envía en JSON al backend. El backend valida tipo y tamaño y guarda la cadena en `services.img` (columna TEXT existente en Neon).

- Formatos admitidos: JPG/JPEG, PNG, WEBP y GIF.
- Tamaño máximo del archivo original: 1,2 MB.
- Vista previa antes de guardar.
- Al editar, si no se selecciona otra foto se conserva la actual; el botón «Quitar fotografía» permite eliminarla.
- El catálogo, el detalle del servicio, el panel del prestador y la gestión administrativa muestran la imagen guardada.
- No requiere Cloudinary, Vercel Blob ni una migración de base de datos: `services.img` ya existe como TEXT.

Nota técnica: Base64 aumenta el tamaño del archivo aproximadamente un 33%. Se limita a 1,2 MB para ajustarse al límite JSON de 2 MB configurado en Express. Las imágenes se almacenan en Neon, por lo que aumentan el tamaño y el consumo de la base de datos; conviene mantener el límite y evitar imágenes originales pesadas.
