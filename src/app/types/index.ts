import { z } from "zod";
import { getExistingUserByEmail } from "../actions/auth.actions";

export const SignUpSchema = z
	.object({
		username: z
			.string()
			.min(3, { message: "Username must be at least 3 characters long" })
			.max(50, {
				message: "Username must be at most 50 characters long",
			}),
		email: z
			.string()
			.email()
			.refine(
				async (value) => {
					const existingUser = await getExistingUserByEmail(value);

					if (existingUser) {
						return false;
					}

					return true;
				},
				{
					message:
						"An account with this email exists. Please sign in instead",
				}
			),
		password: z
			.string()
			.min(8, { message: "Password must be at least 8 characters long" }),
		confirmPassword: z
			.string()
			.min(8, { message: "Password must be at least 8 characters long" }),
		acceptTermsAndConditions: z
			.boolean()
			.default(false)
			.refine((data) => data, {
				message: "Please accept the terms and conditions",
			}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const SignInSchema = z.object({
	email: z.string().email(),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
});
