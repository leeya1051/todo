import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GithubProvider from "next-auth/providers/github"
import bcrypt from "bcryptjs"

import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()

        const email = credentials.email.toLowerCase().trim()
        const user = await User.findOne({ email })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isValid) {
          return null
        }

        return { id: String(user._id), email: user.email }
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github" || !profile) {
        return true
      }

      const githubProfile = profile as {
        id: number
        login: string
        avatar_url: string
        email: string | null
      }

      await connectDB()

      const githubId = String(githubProfile.id)
      const email = githubProfile.email
        ? githubProfile.email.toLowerCase().trim()
        : undefined

      let dbUser = await User.findOne({ githubId })

      if (!dbUser && email) {
        dbUser = await User.findOne({ email })
      }

      if (dbUser) {
        dbUser.githubId = githubId
        dbUser.username = githubProfile.login
        dbUser.avatarUrl = githubProfile.avatar_url
        if (email) {
          dbUser.email = email
        }
        await dbUser.save()
      } else {
        dbUser = await User.create({
          githubId,
          email,
          username: githubProfile.login,
          avatarUrl: githubProfile.avatar_url,
        })
      }

      user.id = String(dbUser._id)

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id
      }
      return session
    },
  },
}

export default authOptions
