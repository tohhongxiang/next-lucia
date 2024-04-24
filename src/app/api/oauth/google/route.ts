import db from "@/lib/database";
import { oauthAccountTable, userTable } from "@/lib/database/schema";
import { lucia } from "@/lib/lucia";
import { google } from "@/lib/lucia/oauth";
import { GoogleTokens, OAuth2RequestError } from "arctic";
import { and, eq } from "drizzle-orm";
import { generateId } from "lucia";
import { cookies, headers } from "next/headers";
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
			throw new Error("Invalid request");
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

		const { userId } = await createOrUpdateDatabase(
			googleTokens,
			googleData
		);

		const session = await lucia.createSession(userId, {
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
		const url = new URL("/sign-in", process.env.NEXT_PUBLIC_BASE_URL);

		if (e instanceof OAuth2RequestError || e instanceof Error) {
			url.searchParams.append("error", e.message);
			return NextResponse.redirect(url);
		}

		url.searchParams.append("error", "Unexpected error");
		return NextResponse.redirect(url);
	}
};

async function createOrUpdateDatabase(
	googleTokens: GoogleTokens,
	googleData: GoogleUser
) {
	const response = await db.transaction(async (trx) => {
		const oauthUser = await trx.query.oauthAccountTable.findFirst({
			where: and(
				eq(oauthAccountTable.providerUserId, googleData.id),
				eq(oauthAccountTable.provider, "google")
			),
		});

		if (oauthUser) {
			const updatedOAuthAccountRes = await trx
				.update(oauthAccountTable)
				.set({
					accessToken: googleTokens.accessToken,
					expiresAt: googleTokens.accessTokenExpiresAt,
					refreshToken: googleTokens.refreshToken,
				})
				.where(
					and(
						eq(oauthAccountTable.providerUserId, googleData.id),
						eq(oauthAccountTable.provider, "google")
					)
				);

			if (updatedOAuthAccountRes.rowCount === 0) {
				throw new Error("Failed to update OAuthAccountTable");
			}

			return { userId: oauthUser.userId };
		}

		const newUserId = generateId(15);

		const createdUserRes = await trx.insert(userTable).values({
			id: newUserId,
			username: googleData.name,
			profilePictureUrl: googleData.picture,
		});

		if (createdUserRes.rowCount === 0) {
			throw new Error("Failed to create user");
		}

		const createdOAuthAccountRes = await trx
			.insert(oauthAccountTable)
			.values({
				userId: newUserId,
				provider: "google",
				providerUserId: googleData.id,
				accessToken: googleTokens.accessToken,
				expiresAt: googleTokens.accessTokenExpiresAt,
				refreshToken: googleTokens.refreshToken,
			});

		if (createdOAuthAccountRes.rowCount === 0) {
			throw new Error("Failed to create OAuth Account");
		}

		return { userId: newUserId };
	});

	return response;
}
