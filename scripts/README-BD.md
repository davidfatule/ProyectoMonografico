# Base de datos SQL Server - SoportePro

## 1. Crear la base de datos en SQL Server

1. Abre **SQL Server Management Studio** (o Azure Data Studio) y conéctate a tu servidor.
2. Crea una base de datos llamada **SoportePro** (o el nombre que pongas en `DB_DATABASE`).
3. Abre el archivo `schema.sql` y ejecútalo **sobre esa base de datos** (selecciona `SoportePro` en la lista de bases o escribe `USE SoportePro;` al inicio si quieres).
4. El script crea las tablas **Users**, **Tickets** y **Evaluations** y un usuario técnico por defecto `Tech@Helpdesk.Com`.

## 2. Contraseña del técnico (pruebas)

En el script, el usuario `Tech@Helpdesk.Com` se inserta con `PasswordHash = N'CHANGE_ME_USE_BCRYPT'`.  
Para poder hacer login desde la API en pruebas, puedes dejarlo así y en el `.env` no hace falta nada extra; el login por ahora compara con la contraseña en texto plano que envíes.  
**Para producción:** cambia el script para no insertar contraseña en claro y luego hashea la contraseña con bcrypt en el servidor Node antes de comparar.

## 3. Variables de entorno del servidor Node

En la raíz del proyecto:

1. Copia `.env.example` a `.env`.
2. Rellena en `.env`:
   - **DB_SERVER**: nombre o IP del servidor SQL (ej. `localhost`, `.\SQLEXPRESS`, `tu-servidor.database.windows.net`).
   - **DB_DATABASE**: nombre de la BD (ej. `SoportePro`).
   - **DB_USER** y **DB_PASSWORD**: usuario y contraseña de SQL Server.
   - **DB_PORT**: normalmente `1433`.
   - **DB_ENCRYPT**: `true` si usas Azure SQL, `false` para SQL Server local.

## 4. Arrancar el servidor API

```bash
npm install
npm run server
```

El API quedará en `http://localhost:3001`.  
Con `npm run dev` (Vite), las peticiones a `/api/*` se redirigen a ese servidor.

## 5. Estructura de tablas (resumen)

| Tabla         | Uso |
|---------------|-----|
| **Users**     | Empleados, técnicos, admin. Login y técnico asignado a tickets. |
| **Tickets**   | Incidencias: número, estado, sucursal, producto, descripción, técnico asignado, etc. |
| **Evaluations** | Valoración (rating + comentario) asociada a un ticket resuelto. |
