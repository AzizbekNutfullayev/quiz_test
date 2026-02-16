import express from "express";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routers/auth.routes.js";

const app = express();
app.use(express.json());

app.use("/auth", authRoutes); // ✅ SHU MUHIM

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running");
});