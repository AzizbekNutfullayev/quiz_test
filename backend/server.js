import express from "express";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routers/auth.routes.js";

const app = express();

app.use(express.json()); // ✅ 1
app.use(express.urlencoded({ extended: true })); // ✅ 2 (ixtiyoriy)

app.use("/auth", authRoutes);

app.listen(process.env.PORT || 5000, () => console.log("Server running"));