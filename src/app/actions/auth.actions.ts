"use server";

import { z } from "zod";
import { SignInSchema, SignUpSchema } from "../types";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import db from "../../lib/database";
import { userTable } from "../../lib/database/schema";
import { lucia, validateRequest } from "@/lib/lucia";
import { cookies, headers } from "next/headers";
import { generateCodeVerifier, generateState } from "arctic";
import { github, google } from "@/lib/lucia/oauth";
import { eq } from "drizzle-orm";

export const signUp = async (values: z.infer<typeof SignUpSchema>) => {
	const existingUser = await db.query.userTable.findFirst({
		where: eq(userTable.email, values.email),
	});

	if (existingUser) {
		return {
			error: "An account with this email already exists. Please sign in instead",
		};
	}

	const hashedPassword = await new Argon2id().hash(values.password);
	const userId = generateId(15);

	try {
		await db
			.insert(userTable)
			.values({
				id: userId,
				username: values.username,
				email: values.email,
				hashedPassword,
			})
			.returning({ id: userTable.id, username: userTable.username });

		const session = await lucia.createSession(userId, {
			expiresIn: 60 * 60 * 24 * 30,
		});

		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies().set(
			sessionCookie.name,
			sessionCookie.value,
			sessionCookie.attributes
		);

		return {
			success: true,
			data: {
				userId,
			},
		};
	} catch (error) {
		if (error instanceof Error) {
			return {
				error: error?.message,
			};
		}

		return {
			error: "An unexpected error occurred",
			details: error,
		};
	}
};

export const getExistingUserByEmail = async (email: string) => {
	return db.query.userTable.findFirst({
		where: (table, { eq }) => eq(table.email, email),
	});
};

export const signIn = async (values: z.infer<typeof SignInSchema>) => {
	const existingUser = await db.query.userTable.findFirst({
		where: (table, { eq }) => eq(table.email, values.email),
	});

	if (!existingUser || !existingUser.hashedPassword) {
		return {
			error: "Email or password is incorrect",
		};
	}

	const isValidPassword = await new Argon2id().verify(
		existingUser.hashedPassword,
		values.password
	);
	if (!isValidPassword) {
		return {
			error: "Email or password is incorrect",
		};
	}

	const session = await lucia.createSession(existingUser.id, {
		expiresIn: 60 * 60 * 24 * 30,
	});

	const sessionCookie = lucia.createSessionCookie(session.id);

	cookies().set(
		sessionCookie.name,
		sessionCookie.value,
		sessionCookie.attributes
	);

	return {
		success: "Logged in successfully",
	};
};

export const signOut = async () => {
	try {
		const { session } = await validateRequest();

		if (!session) {
			return {
				error: "Unauthorized",
			};
		}

		await lucia.invalidateSession(session.id);

		const sessionCookie = lucia.createBlankSessionCookie();

		cookies().set(
			sessionCookie.name,
			sessionCookie.value,
			sessionCookie.attributes
		);
	} catch (error) {
		if (error instanceof Error) {
			return {
				error: error?.message,
			};
		}

		return {
			error: "An unexpected error occurred",
			details: error,
		};
	}
};

export const createGoogleAuthorizationURL = async () => {
	try {
		const state = generateState();
		const codeVerifier = generateCodeVerifier();

		cookies().set("codeVerifier", codeVerifier, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		});

		cookies().set("state", state, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		});

		const authorizationURL = await google.createAuthorizationURL(
			state,
			codeVerifier,
			{
				scopes: ["email", "profile"],
			}
		);

		return {
			success: true,
			data: authorizationURL.toString(),
		};
	} catch (error) {
		if (error instanceof Error) {
			return {
				error: error.message,
			};
		}

		return { error: "Unexpected error occurred" };
	}
};

export const createGithubAuthorizationURL = async () => {
	try {
		const state = generateState();

		cookies().set("state", state, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
		});

		const authorizationURL = await github.createAuthorizationURL(state, {
			scopes: ["user:email"],
		});

		return {
			success: true,
			data: authorizationURL.toString(),
		};
	} catch (error) {
		if (error instanceof Error) {
			return {
				error: error.message,
			};
		}

		return { error: "Unexpected error occurred" };
	}
};
