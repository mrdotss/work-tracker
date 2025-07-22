import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client"
import { AuthOptions } from "next-auth";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login',
    },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { username: credentials.username },
                    });

                    if (!user) {
                        return null;
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password);
                    if (!isValid) {
                        return null;
                    }

                    // Check if the user is active
                    if (!user.is_active) {
                        return null;
                    }

                    // return complete user data to match your schema
                    return {
                        id: user.id,
                        username: user.username,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        phone_number: user.phone_number,
                        role: user.role,
                        user_image: user.user_image
                    };
                } catch (error) {
                    console.error('Authentication error:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            // Initial sign in
            if (user) {
                token.user = user;
                token.role = user.role; // Add role to token root for middleware access
            }

            // Force refresh user data from a database on session update or when trigger is 'update'
            if (trigger === 'update' || !token.user) {
                try {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.user?.id || user?.id },
                        select: {
                            id: true,
                            username: true,
                            first_name: true,
                            last_name: true,
                            phone_number: true,
                            role: true,
                            user_image: true,
                        },
                    });

                    if (freshUser) {
                        token.user = freshUser;
                        token.role = freshUser.role; // Add a role to token root for middleware access
                    }
                } catch (error) {
                    console.error('Error refreshing user data:', error);
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token.user) session.user = token.user;
            return session;
        },
    },
};