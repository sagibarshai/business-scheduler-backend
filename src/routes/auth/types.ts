interface SignupBodyRequest extends Omit<User, "timestamp" | "id" | "account_verifyed" | "last_login" |"role"> {}

interface LoginBodyRequest {
  email?: string
  password?: string
}

export interface SignupRequest extends Express.Request {
  body: SignupBodyRequest
}

export interface User {
  timestamp: Date
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  account_verified: boolean
  last_login: Date | null
  role: "business" | "user" |"guest" | "employee" | "N/A"
  phone: string
}

export interface LoginRequest extends Express.Request {
  body: LoginBodyRequest
}
