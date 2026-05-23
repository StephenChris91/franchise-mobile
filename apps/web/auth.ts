import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users, profiles, accounts, sessions, verificationTokens } from "@franchise/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1)
          .then((r) => r[0]);

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Load profile on first sign-in
        const profile = await db
          .select()
          .from(profiles)
          .where(eq(profiles.userId, user.id!))
          .limit(1)
          .then((r) => r[0]);

        if (profile) {
          token.approvalStatus = profile.approvalStatus;
          token.role = profile.role;
          token.username = profile.username;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.approvalStatus = token.approvalStatus as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-create a minimal profile when a user signs up via Google (OAuth)
      // Credentials signup creates the profile explicitly in the signup route
      if (user.id) {
        const existing = await db
          .select()
          .from(profiles)
          .where(eq(profiles.userId, user.id))
          .limit(1)
          .then((r) => r[0]);

        if (!existing) {
          const username = `user_${user.id.slice(0, 8)}`;
          await db.insert(profiles).values({
            userId: user.id,
            username,
            fullName: user.name ?? "New Member",
            approvalStatus: "pending",
            role: "member",
            ministry: "none",
          });
        }
      }
    },
  },
});
