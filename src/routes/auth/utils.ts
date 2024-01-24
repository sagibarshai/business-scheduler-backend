import { scrypt, randomBytes } from "crypto"
import { promisify } from "util"

// scrypt : hashing function (callback based)
//randomBytes
//promisify (take the callback and turn it to promise)

const scryptAsync = promisify(scrypt)

export const toHash = async (password: string) => {
  const salt = randomBytes(8).toString("hex")
  const buf = (await scryptAsync(password, salt, 64)) as Buffer // this is the encoding of the data (scrypt is an function algorithm)
  const hashed = `${buf.toString("hex")}.${salt}`
  return hashed
}
export const compare = async (suppliedPassword: string, storedPassword: string) => {
  const [_, salt] = storedPassword.split(".")
  const buf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer // this is the encoding of the data (scrypt is an function algorithm)
  const hashed = `${buf.toString("hex")}.${salt}`

  if (hashed === storedPassword) return true

  return false
}
