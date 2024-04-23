import db from "@/lib/database";
import { oauthAccountTable, userTable } from "@/lib/database/schema";
import { lucia } from "@/lib/lucia";
import { github, google } from "@/lib/lucia/oauth";
import { GitHubTokens, GoogleTokens, OAuth2RequestError } from "arctic";
import { and, eq } from "drizzle-orm";
import { generateId } from "lucia";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface GithubUser {
	id: number;
	avatar_url: string;
	name: string;
	email?: string; // if user is privated, this field is undefined
}

export const GET = async (req: NextRequest) => {
	try {
		const url = new URL(req.url);
		const searchParams = url.searchParams;

		const code = searchParams.get("code");
		const state = searchParams.get("state");

		const storedState = cookies().get("state")?.value;

		if (!code || !storedState || state !== storedState) {
			throw new Error("Invalid request");
		}

		const githubTokens = await github.validateAuthorizationCode(code);

		const githubData: GithubUser = await fetch(
			"https://api.github.com/user",
			{
				headers: {
					Authorization: `Bearer ${githubTokens.accessToken}`,
				},
				method: "GET",
			}
		).then((res) => res.json());

		const { userId } = await createOrUpdateDatabase(
			githubTokens,
			githubData
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
	githubTokens: GitHubTokens,
	githubData: GithubUser
) {
	const response = await db.transaction(async (trx) => {
		// get corresponding user where provider == "github" and providerUserId is matching
		const oauthUser = await trx.query.oauthAccountTable.findFirst({
			where: and(
				eq(oauthAccountTable.providerUserId, githubData.id.toString()),
				eq(oauthAccountTable.provider, "github")
			),
		});

		if (oauthUser) {
			const updatedOAuthAccountRes = await trx
				.update(oauthAccountTable)
				.set({
					accessToken: githubTokens.accessToken,
				})
				.where(
					and(
						eq(
							oauthAccountTable.providerUserId,
							githubData.id.toString()
						),
						eq(oauthAccountTable.provider, "github")
					)
				);

			if (updatedOAuthAccountRes.rowCount === 0) {
				throw new Error("Failed to update OAuthAccountTable");
			}

			return { userId: oauthUser.userId };
		}

		const user = await trx.query.userTable.findFirst({
			where: eq(userTable.email, githubData.email ?? ""),
		});

		if (user) {
			throw new Error("User already exists in database");
		}

		const newUserId = generateId(15);

		const createdUserRes = await trx.insert(userTable).values({
			id: newUserId,
			username: githubData.name,
			profilePictureUrl: githubData.avatar_url,
			email: githubData.email,
		});

		if (createdUserRes.rowCount === 0) {
			throw new Error("Failed to create user");
		}

		const createdOAuthAccountRes = await trx
			.insert(oauthAccountTable)
			.values({
				userId: newUserId,
				provider: "github",
				providerUserId: githubData.id.toString(),
				accessToken: githubTokens.accessToken,
			});

		if (createdOAuthAccountRes.rowCount === 0) {
			throw new Error("Failed to create OAuth Account");
		}

		return { userId: newUserId };
	});

	return response;
}
