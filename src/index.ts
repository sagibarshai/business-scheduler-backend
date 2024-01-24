import express from "express"

import bodyParser from "body-parser"

import authRoute from "./routes/auth"
import searchLocationRoute from "./routes/search-location"
import cookieSession from "cookie-session"
import dotEnv from "dotenv"
import mysql from "mysql2"

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(
  cookieSession({
    secure: false,
    signed: false,
  }),
)

dotEnv.config()

const password = process.env.mysql_password
if (!password) throw new Error("mysql password not defined")

const start = async () => {
  const pool = mysql.createPool({
    host: "sgys-MacBook-Air.local",
    user: "root",
    password,
    database: "pets",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

  pool.getConnection((err, connection) => {
    if (err) throw new Error("db not connected " + err)
    else {
      connection.release()
      console.log("server up (port 3300)")
    }
  })
}
app.use("/api", authRoute)
app.use("/api", searchLocationRoute)

app.listen(3300, start)