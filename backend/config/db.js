import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
    connectionString: "postgresql://test:3xDWIrqIrrp2tjGDH0xVFSpPzJEaA0dF@dpg-d5vnrhsoud1c738npcvg-a.oregon-postgres.render.com/new_quiz",
    ssl: { rejectUnauthorized: false },
});