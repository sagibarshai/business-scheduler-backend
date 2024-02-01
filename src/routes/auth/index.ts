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
  body("email").isLength({ min: 6, max: 64 }).isEmail().withMessage("email must be valid with max of 64 chars"),
  body("password").isLength({ min: 8, max: 24 }).withMessage("password must be min 8 chars and max 24 chars"),
  body("firstName").isLength({ min: 2, max: 64 }).withMessage("first_name must be min 2 chars and max 64 chars"),
  body("lastName").isLength({ min: 2, max: 64 }).withMessage("last_name must be min 2 chars and max 64 chars"),
  body("phone")
  .isLength({ min: 10, max: 15 })
  .withMessage("phone number must be valid with min 10 chars and max 15 chars"),
  async (req: SignupRequest, res): Promise<Express.Response> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array() })
    try {
      const connection = await pool.getConnection()

      const { email, firstName, lastName, password, phone} = req.body


      const [rows] = await connection.execute("SELECT * FROM users WHERE email = ?", [email])

      const users = rows as User[]
      const emailExist = Boolean(users.find((user) => user["email"] === email))
      
      if (emailExist) return res.status(400).json({message:'האימייל שהוזן כבר בשימוש'})

      const hashedPassword = await toHash(password)

      const user: User = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phone,
        last_login: new Date(),
        account_verified: false,
        role: 'N/A',
      }

      await connection.execute(
        "INSERT INTO users (id, timestamp, first_name, last_name, email, password, phone, last_login, account_verified, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user["id"],
          user["timestamp"],
          user["firstName"],
          user["lastName"],
          user["email"],
          user["password"],
          user["phone"],
          user["last_login"],
          user["account_verified"],
          user["role"],
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


     
     await pool.execute("UPDATE users SET last_login = ? WHERE id = ?",[new Date(),user.id]) 
      const isEqual = await compare(password!, user["password"])
      if (!isEqual) return res.status(400).json({ message: "Wrong credentials" })

      const token = jwt.sign(user, jwt_secret)

      const clientUser: Omit<User, 'password' | 'timestamp'> = {
          account_verified:user.account_verified,
          email:user.email,
          firstName:user.firstName,
          lastName:user.lastName,
          last_login:user.last_login,
          id:user.id,
          phone:user.phone,
          role:user.role,
      }
      return res.status(200).json({ user:clientUser, token })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: "something went wrong.." })
    }
  },
)

export const currentUserMiddleware = (req: any, res: any, next: any) => {
  const userToken: string | undefined = req["headers"]?.authorization?.split(" ")[1]

  if (!userToken) return res.status(401).json({ message: "Token not provided" })

  jwt.verify(userToken, jwt_secret, (err, user) => {
    if (err) return res.json.status(500)({ error: "Token not valid" })
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
