import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  session: { strategy: 'jwt' as const },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    session({ session, token }: { session: any; token: any }) {
      session.user.role = token.role
      session.user.id = token.id
      return session
    },
    authorized({ auth }: { auth: any }) {
      return !!auth?.user
    },
  },
  providers: [],
} satisfies NextAuthConfig
