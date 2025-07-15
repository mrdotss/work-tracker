import { JWT } from "next-auth/jwt"
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      first_name: string
      last_name: string
      phone_number?: string | null
      role: string
      user_image?: string | null
    }
  }

  interface User {
    id: string
    username: string
    first_name: string
    last_name: string
    phone_number?: string | null
    role: string
    user_image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: {
      id: string
      username: string
      first_name: string
      last_name: string
      phone_number?: string | null
      role: string
      user_image?: string | null
    }
  }
}