# Frontend JavaScript

El frontend conserva el contrato HTML existente y divide el código en archivos por responsabilidad.
Los scripts se cargan en orden de dependencia como scripts clásicos para mantener compatibles los
controladores invocados desde atributos `onclick` existentes.

- `models/`: estado inicial y datos demo.
- `services/`: comunicación HTTP con el backend y adaptador local demo.
- `controllers/`: autenticación, navegación, reservas, mensajería y acciones de formularios.
- `views/`: renderizado de vistas de cliente, prestador y administración.
- `utils/`: helpers de interfaz compartidos.

Para cambiar a módulos ES nativos, el siguiente paso sería retirar los manejadores inline del HTML y
convertir las acciones públicas en listeners delegados; esta refactorización mantiene intacta la UI
actual para evitar regresiones de comportamiento.
