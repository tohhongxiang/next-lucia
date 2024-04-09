"use server";

import { z } from "zod";
import { SignInSchema, SignUpSchema } from "../types";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import db from "../lib/db";
import { userTable } from "../lib/db/schema";
import { lucia, validateRequest } from "@/lib/auth";
import { cookies } from "next/headers";

export const signUp = async (values: z.infer<typeof SignUpSchema>) => {
	console.log(values);

	const hashedPassword = await new Argon2id().hash(values.password);
	const userId = generateId(15);

	try {
		await db
			.insert(userTable)
			.values({
				id: userId,
				username: values.username,
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

export const signIn = async (values: z.infer<typeof SignInSchema>) => {
	const existingUser = await db.query.userTable.findFirst({
		where: (table, { eq }) => eq(table.username, values.username),
	});

	if (!existingUser) {
		return {
			error: "User not found",
		};
	}

	if (!existingUser.hashedPassword) {
		return {
			error: "User not found",
		};
	}

	const isValidPassword = await new Argon2id().verify(
		existingUser.hashedPassword,
		values.password
	);
	if (!isValidPassword) {
		return {
			error: "Incorrect password",
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
