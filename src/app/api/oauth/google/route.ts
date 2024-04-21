import db from "@/lib/database";
import { oauthAccountTable, userTable } from "@/lib/database/schema";
import { lucia } from "@/lib/lucia";
import { google } from "@/lib/lucia/oauth";
import { GoogleTokens, OAuth2RequestError } from "arctic";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface GoogleUser {
	id: string;
	email: string;
	verified_email: boolean;
	name: string;
	given_name: string;
	picture: string;
	locale: string;
}

export const GET = async (req: NextRequest) => {
	try {
		const url = new URL(req.url);
		const searchParams = url.searchParams;

		const code = searchParams.get("code");
		const state = searchParams.get("state");

		const storedCodeVerifier = cookies().get("codeVerifier")?.value;
		const storedState = cookies().get("state")?.value;

		if (
			!code ||
			!storedState ||
			!storedCodeVerifier ||
			state !== storedState
		) {
			return Response.json({ error: "Invalid request" }, { status: 400 });
		}

		const googleTokens: GoogleTokens =
			await google.validateAuthorizationCode(code, storedCodeVerifier);

		const googleData: GoogleUser = await fetch(
			"https://www.googleapis.com/oauth2/v1/userinfo",
			{
				headers: {
					Authorization: `Bearer ${googleTokens.accessToken}`,
				},
				method: "GET",
			}
		).then((res) => res.json());

		const updateDatabaseResponse = await createOrUpdateDatabase(
			googleTokens,
			googleData
		);

		if (updateDatabaseResponse?.error) {
			return Response.json(
				{ error: updateDatabaseResponse.error },
				{ status: 500 }
			);
		}

		const session = await lucia.createSession(googleData.id, {
			expiresIn: 60 * 60 * 24 * 30,
		});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies().set(
			sessionCookie.name,
			sessionCookie.value,
			sessionCookie.attributes
		);

		cookies().set("state", "", { expires: new Date(0) });
		cookies().set("codeVerifier", "", { expires: new Date(0) });

		return NextResponse.redirect(
			new URL("/", process.env.NEXT_PUBLIC_BASE_URL),
			{ status: 302 }
		);
	} catch (e) {
		if (e instanceof OAuth2RequestError) {
			return Response.json({ error: e.message }, { status: 400 });
		}

		if (e instanceof Error) {
			return Response.json({ error: e.message }, { status: 500 });
		}

		return Response.json({ error: "Unexpected error" }, { status: 500 });
	}
};

async function createOrUpdateDatabase(
	googleTokens: GoogleTokens,
	googleData: GoogleUser
) {
	const response = await db.transaction(async (trx) => {
		const user = await trx.query.userTable.findFirst({
			where: eq(userTable.id, googleData.id),
		});

		if (!user) {
			const createdUserRes = await trx.insert(userTable).values({
				email: googleData.email,
				id: googleData.id,
				username: googleData.name,
				profilePictureUrl: googleData.picture,
			});

			if (createdUserRes.rowCount === 0) {
				trx.rollback();
				return { error: "Failed to create user" };
			}

			const createdOAuthAccountRes = await trx
				.insert(oauthAccountTable)
				.values({
					accessToken: googleTokens.accessToken,
					expiresAt: googleTokens.accessTokenExpiresAt,
					id: googleData.id,
					provider: "google",
					providerUserId: googleData.id,
					userId: googleData.id,
					refreshToken: googleTokens.refreshToken,
				});

			if (createdOAuthAccountRes.rowCount === 0) {
				trx.rollback();
				return { error: "Failed to create OAuth Account" };
			}
		} else {
			const updatedOAuthAccountRes = await trx
				.update(oauthAccountTable)
				.set({
					accessToken: googleTokens.accessToken,
					expiresAt: googleTokens.accessTokenExpiresAt,
					refreshToken: googleTokens.refreshToken,
				})
				.where(eq(oauthAccountTable.id, googleData.id));

			if (updatedOAuthAccountRes.rowCount === 0) {
				trx.rollback();
				return { error: "Failed to update OAuthAccountTable" };
			}
		}
	});

	return response;
}
