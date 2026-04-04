# Task Manager API

Sistema de gestión de tareas domésticas — Node.js + PostgreSQL

## Stack técnico

- **Runtime:** Node.js + Express
- **Base de datos:** PostgreSQL (driver `pg` nativo)
- **Auth:** JWT por sesión con revocación en BD
- **Arquitectura:** MVC + Repository Pattern + Observer + Strategy
- **Principios:** SOLID aplicados en cada capa

---

## Inicio rápido

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# 3. Crear la base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE task_manager_db;"

# 4. Ejecutar migraciones (crea todas las tablas)
npm run migrate

# 5. (Opcional) Cargar datos de prueba
npm run seed

# 6. Iniciar el servidor
npm run dev       # desarrollo con hot-reload
npm start         # producción
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run migrate` | Crea/actualiza todas las tablas en la BD |
| `npm run migrate:undo` | Muestra las migraciones aplicadas |
| `npm run seed` | Carga usuarios y tareas de prueba |
| `npm run dev` | Servidor con nodemon |
| `npm start` | Servidor en producción |

---

## Arquitectura

```
src/
├── app.js                     # Entry point — Express
├── config/
│   └── database.js            # Singleton — pool de conexiones
├── migrations/
│   └── 001_initial_schema.sql # DDL completo de la BD
├── controllers/               # MVC — Capa Controlador
│   ├── AuthController.js
│   ├── TaskController.js
│   ├── NotificationController.js
│   └── ReportController.js
├── services/                  # Lógica de negocio (SOLID: SRP)
│   ├── AuthService.js
│   ├── TaskService.js
│   └── ReportService.js
├── repositories/              # Patrón Repository (SOLID: DIP)
│   ├── BaseRepository.js
│   ├── UserRepository.js
│   ├── SessionRepository.js
│   ├── TaskRepository.js
│   └── NotificationRepository.js
├── views/
│   └── responses/
│       └── ResponseView.js    # MVC — Capa Vista (respuestas JSON)
├── middlewares/
│   ├── auth.middleware.js     # Validación JWT + sesión en BD
│   ├── validate.middleware.js # express-validator
│   └── error.middleware.js    # Manejador global
├── routes/
│   ├── auth.routes.js
│   ├── task.routes.js
│   └── misc.routes.js
└── patterns/
    ├── EventBus.js            # Observer — bus de eventos
    ├── NotificationObserver.js # Observer — escucha y notifica
    └── TaskFilterStrategy.js  # Strategy — filtros intercambiables
```

---

## Patrones de diseño implementados

### Singleton
`Database` — una sola instancia del pool de conexiones en toda la app.

### Repository
`BaseRepository` + repositorios específicos — abstrae el acceso a datos. Los servicios no conocen SQL.

### Observer (EventBus)
`TaskService` emite eventos (`task:created`, `task:assigned`, etc.). `NotificationObserver` los escucha y crea notificaciones sin acoplamiento.

### Strategy
`TaskFilterStrategy` — los filtros de búsqueda de tareas son estrategias intercambiables.

### MVC
- **Model:** Repositorios + Servicios (datos y lógica)
- **View:** `ResponseView` — formato estándar de respuestas JSON
- **Controller:** Controladores — orquestan sin lógica de negocio

---

## Endpoints de la API

### Autenticación
```
POST   /api/auth/register         Registro de usuario
POST   /api/auth/login            Inicio de sesión → devuelve token
POST   /api/auth/logout           Cierra sesión (revoca token)  
GET    /api/auth/me               Perfil del usuario actual     
POST   /api/auth/reset-request    Solicitar recuperación de contraseña
POST   /api/auth/reset-password   Restablecer contraseña con token
```

### Tareas
```
GET    /api/tasks                 Listar tareas (con filtros)   
POST   /api/tasks                 Crear tarea                   
GET    /api/tasks/:id             Ver detalle de tarea          
PUT    /api/tasks/:id             Editar tarea                  
PATCH  /api/tasks/:id/status      Cambiar estado                
DELETE /api/tasks/:id             Eliminar tarea                
```

### Notificaciones
```
GET    /api/notifications          Mis notificaciones           
PATCH  /api/notifications/read-all Marcar todas como leídas    
PATCH  /api/notifications/:id/read Marcar una como leída       
```

### Reportes
```
POST   /api/groups/:groupId/reports  Generar reporte del grupo  
GET    /api/groups/:groupId/reports  Ver reportes del grupo     
```

 = Requiere header `Authorization: Bearer <token>`

---

## Ejemplos de uso

### Registrar usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana García","email":"ana@demo.com","password":"Password1!"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@demo.com","password":"Password1!"}'
```

### Crear tarea
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Limpiar cocina",
    "priority": "high",
    "due_date": "2025-12-01T18:00:00Z",
    "assigned_to": "<user-uuid>"
  }'
```

### Filtrar tareas
```bash
# Por estado y prioridad
GET /api/tasks?status=pending&priority=high&page=1&limit=10
```

### Cambiar estado
```bash
curl -X PATCH http://localhost:3000/api/tasks/<id>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

---

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto | `5432` |
| `DB_NAME` | Nombre de la base de datos | `task_manager_db` |
| `DB_USER` | Usuario | `postgres` |
| `DB_PASSWORD` | Contraseña | — |
| `PORT` | Puerto del servidor | `3000` |
| `JWT_SECRET` | Clave secreta JWT | — |
| `JWT_EXPIRES_IN` | Duración del token | `8h` |
| `BCRYPT_ROUNDS` | Rounds de encriptación | `12` |
