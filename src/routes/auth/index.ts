import jwt, { JwtPayload } from "jsonwebtoken"
import { Router } from "express"
import dotEnv from "dotenv"
import { compare, toHash } from "./utils"
import { LoginRequest, SignupRequest, User } from "./types"
import { pool } from "../../db"
import { body, validationResult } from "express-validator"

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

const router = Router()

dotEnv.config()

const jwt_secret = process.env.jwt_secret
if (!jwt_secret) {
  throw new Error("jwt_secret is not defined")
}

router.post(
  "/signup",
  body("first_name").isLength({ min: 2, max: 64 }).withMessage("first_name must be min 2 chars and max 64 chars"),
  body("last_name").isLength({ min: 2, max: 64 }).withMessage("last_name must be min 2 chars and max 64 chars"),
  body("email").isLength({ min: 6, max: 64 }).isEmail().withMessage("email must be valid with max of 64 chars"),
  body("password").isLength({ min: 8, max: 24 }).withMessage("password must be min 8 chars and max 24 chars"),
  body("phone")
    .isLength({ min: 10, max: 15 })
    .withMessage("phone number must be valid with min 10 chars and max 15 chars"),
  async (req: SignupRequest, res): Promise<Express.Response> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array() })

    try {
      const connection = await pool.getConnection()

      const { email, first_name, last_name, password, phone, lat, lon } = req.body

      if (!password || !email || !first_name || !last_name || !phone) return res.status(400).json({})

      const [rows] = await connection.execute("SELECT * FROM users WHERE email = ?", [email])

      const users = rows as User[]
      const emailExist = Boolean(users.find((user) => user["email"] === email))

      if (emailExist) return res.status(400).json({ message: "Email is in use." })

      const hashedPassword = await toHash(password)

      const user: User = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        first_name,
        last_name,
        email,
        password: hashedPassword,
        phone,
        last_login: null,
        account_verified: false,
        role: "user",
        lat,
        lon,
      }

      await connection.execute(
        "INSERT INTO users (id, timestamp, first_name, last_name, email, password, phone, last_login, account_verified, role, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user["id"],
          user["timestamp"],
          user["first_name"],
          user["last_name"],
          user["email"],
          user["password"],
          user["phone"],
          user["last_login"],
          user["account_verified"],
          user["role"],
          user["lat"],
          user["lon"],
        ],
      )
      const token = jwt.sign(user, jwt_secret)
      return res.status(201).json({ user, token })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: "Something went wrong.." })
    }
  },
)

router.post(
  "/login",
  body("email").isLength({ min: 6, max: 64 }).isEmail().withMessage("email must be valid with max of 64 chars"),
  body("password").isLength({ min: 8, max: 24 }).withMessage("password must be min 8 chars and max 24 chars"),

  async (req: LoginRequest, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() })
    }

    const { email, password } = req.body

    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE email = ? ", [email])
      const users = rows as User[]

      const user = users.find((user) => user["email"] === email)

      if (!user) return res.status(400).json({ message: "Wrong credentials" })

      const isEqual = await compare(password!, user["password"])
      if (!isEqual) return res.status(400).json({ message: "Wrong credentials" })

      const token = jwt.sign(user, jwt_secret)
      return res.status(200).json({ user, token })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: "something went wrong.." })
    }
  },
)

export const currentUserMiddleware = (req: any, res: any, next: any) => {
  const userToken: string | undefined = req["headers"]?.authorization?.split(" ")[1]

  if (!userToken) return res.json({ message: "Token not provided" }).status(401)

  jwt.verify(userToken, jwt_secret, (err, user) => {
    if (err) return res.json({ error: "Token not valid" }).status(500)
    req.user = user

    next()
    return
  })
}

router.get("/users/all", currentUserMiddleware, async (req, res) => {
  console.log(req.user)

  const [rows] = await pool.execute("SELECT * FROM users")
  const users = rows as User[]
  return res.status(200).json({ users })
})

export default router
