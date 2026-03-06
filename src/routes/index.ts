import { api } from "@/api/endpoints";

export { api };

// con _req
import express from "express";

const router = express.Router();

router.get("/auth/me", (_req, res) => {
  res.json({ id: 1, name: "David", role: "admin" });
});

router.post("/auth/login", (_req, res) => {
  res.json({ success: true });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ success: true });
});

router.get("/tickets", (_req, res) => {
  res.json([{ id: 1, title: "Error en sistema" }]);
});

export default router;

// con req

//import express from "express";

//const router = express.Router();

// Obtener información del usuario autenticado
//router.get("/auth/me", (req, res) => {
  // Ejemplo: leer header de autorización
  //const authHeader = req.headers["authorization"];
 // res.json({ id: 1, name: "David", role: "admin", auth: authHeader });
//});

// Login
//router.post("/auth/login", (req, res) => {
  // Ejemplo: leer datos del body
  //const { username, password } = req.body;
  //res.json({ success: true, user: username });
//});

// Logout
//router.post("/auth/logout", (req, res) => {
  // Ejemplo: leer cookies
  //const cookies = req.cookies;
  //res.json({ success: true, cleared: cookies });
//});

// Obtener tickets
//router.get("/tickets", (req, res) => {
  // Ejemplo: leer query params
  //const filter = req.query.filter;
  //res.json([{ id: 1, title: "Error en sistema", filter }]);
//});

//export default router;