/**
 * Servidor API para SoportePro - conectado a SQL Server.
 * Ejecutar: node server/index.js
 * Requiere .env con DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import { getPool, sql } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

// Generar número de ticket (ej: TKT-20260306-8912)
function generateTicketNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${date}-${random}`;
}

// ---------- Auth (compatible con tu frontend) ----------
app.get("/api/auth/me", async (_req, res) => {
  // TODO: validar sesión/token y devolver usuario desde BD
  res.json({ id: 1, name: "David", role: "admin" });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  try {
    const pool = await getPool();
    // Nota: aquí se compara con PasswordHash; para pruebas puedes guardar la contraseña en claro. En producción usa bcrypt.
    const r = await pool.request()
      .input("username", sql.NVarChar(100), username)
      .input("password", sql.NVarChar(255), password)
      .query(
        "SELECT Id, Username, Role, Email FROM Users WHERE Username = @username AND PasswordHash = @password"
      );
    const user = r.recordset[0];
    if (user) {
      res.json({ success: true, user: { id: user.Id, name: user.Username, role: user.Role } });
    } else {
      res.status(401).json({ success: false, error: "Usuario o contraseña incorrectos" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Error en el servidor" });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  res.json({ success: true });
});

// ---------- Tickets ----------
app.post("/api/tickets", async (req, res) => {
  const body = req.body || {};
  try {
    const pool = await getPool();
    const ticketNumber = generateTicketNumber();
    const result = await pool.request()
      .input("ticketNumber", sql.NVarChar(50), ticketNumber)
      .input("status", sql.NVarChar(50), body.status || "Pendiente")
      .input("branch", sql.NVarChar(100), body.branch || "")
      .input("purchaseDate", sql.Date, body.purchaseDate)
      .input("phone", sql.NVarChar(50), body.phone || "")
      .input("product", sql.NVarChar(100), body.product || "")
      .input("serialNumber", sql.NVarChar(100), body.serialNumber || "")
      .input("description", sql.NVarChar(sql.MAX), body.description || "")
      .input("taxCredit", sql.NVarChar(100), body.taxCredit || null)
      .input("rnc", sql.NVarChar(50), body.rnc || null)
      .input("fileUrl", sql.NVarChar(500), body.fileUrl || null)
      .query(`
        INSERT INTO Tickets (TicketNumber, Status, Branch, PurchaseDate, Phone, Product, SerialNumber, Description, TaxCredit, Rnc, FileUrl, AssigneeId)
        OUTPUT INSERTED.Id
        SELECT @ticketNumber, @status, @branch, @purchaseDate, @phone, @product, @serialNumber, @description, @taxCredit, @rnc, @fileUrl, (SELECT TOP 1 Id FROM Users WHERE Username = N'Tech@Helpdesk.Com')
      `);
    const id = result.recordset[0].Id;
    res.status(201).json({ ticketNumber, id });
  } catch (err) {
    console.error("Create ticket error:", err);
    res.status(500).json({ error: "No se pudo crear el ticket" });
  }
});

app.get("/api/tickets/:ticketNumber", async (req, res) => {
  const { ticketNumber } = req.params;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("ticketNumber", sql.NVarChar(50), ticketNumber)
      .query(`
        SELECT t.Id, t.TicketNumber, t.Status, t.Branch, t.PurchaseDate, t.Phone, t.Product,
               t.SerialNumber, t.Description, t.TaxCredit, t.Rnc, t.FileUrl, t.CreatedAt, t.AssigneeId,
               u.Username AS AssigneeUsername
        FROM Tickets t
        LEFT JOIN Users u ON t.AssigneeId = u.Id
        WHERE t.TicketNumber = @ticketNumber
      `);
    const row = result.recordset[0];
    if (!row) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }
    const evalResult = await pool.request()
      .input("ticketId", sql.Int, row.Id)
      .query("SELECT Rating, Comment FROM Evaluations WHERE TicketId = @ticketId");
    const evalRow = evalResult.recordset[0];
    res.json({
      id: row.Id,
      ticketNumber: row.TicketNumber,
      status: row.Status,
      branch: row.Branch,
      purchaseDate: row.PurchaseDate,
      phone: row.Phone,
      product: row.Product,
      serialNumber: row.SerialNumber,
      description: row.Description,
      taxCredit: row.TaxCredit,
      rnc: row.Rnc,
      fileUrl: row.FileUrl,
      createdAt: row.CreatedAt,
      assignee: row.AssigneeUsername ? { username: row.AssigneeUsername } : null,
      evaluation: evalRow ? { rating: evalRow.Rating, comment: evalRow.Comment } : null,
    });
  } catch (err) {
    console.error("Get ticket error:", err);
    res.status(500).json({ error: "Error al obtener el ticket" });
  }
});

app.get("/api/tickets", async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT t.Id, t.TicketNumber, t.Status, t.CreatedAt
      FROM Tickets t
      ORDER BY t.CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("List tickets error:", err);
    res.status(500).json({ error: "Error al listar tickets" });
  }
});

// ---------- Evaluations ----------
app.post("/api/evaluations", async (req, res) => {
  const { ticketId, rating, comment } = req.body || {};
  try {
    const pool = await getPool();
    await pool.request()
      .input("ticketId", sql.Int, ticketId)
      .input("rating", sql.Int, rating)
      .input("comment", sql.NVarChar(sql.MAX), comment || null)
      .query(
        "INSERT INTO Evaluations (TicketId, Rating, Comment) VALUES (@ticketId, @rating, @comment)"
      );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Create evaluation error:", err);
    res.status(500).json({ error: "No se pudo guardar la evaluación" });
  }
});

// ---------- Arranque ----------
app.listen(PORT, () => {
  console.log(`API SoportePro escuchando en http://localhost:${PORT}`);
});
