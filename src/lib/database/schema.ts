import { InferSelectModel } from "drizzle-orm";
import {
	boolean,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
	id: text("id").primaryKey(),
	hashedPassword: text("hashed_password"),
	email: text("email").unique(),
	isEmailVerified: boolean("is_email_verified").notNull().default(false),
	profilePictureUrl: text("profile_picture_url"),
	username: text("username").notNull(),
});

export type User = InferSelectModel<typeof userTable>;

export const oauthAccountTable = pgTable(
	"oauth_account",
	{
		userId: text("user_id")
			.notNull()
			.references(() => userTable.id, { onDelete: "cascade" }),
		provider: text("provider").notNull(),
		providerUserId: text("provider_user_id").notNull(),
		accessToken: text("access_token").notNull(),
		refreshToken: text("refresh_token"),
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
		}),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.provider, table.providerUserId] }),
	})
);

export const sessionTable = pgTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => userTable.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
});
