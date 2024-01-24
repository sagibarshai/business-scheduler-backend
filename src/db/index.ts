import { configDotenv } from "dotenv"
import mysql from "mysql2/promise"

configDotenv()

const password = process.env.mysql_password
if (!password) throw new Error("mysql password not defined")

const pool = mysql.createPool({
  host: "sgys-MacBook-Air.local",
  user: "root",
  password,
  database: "BusinessScheduler",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export { pool }
