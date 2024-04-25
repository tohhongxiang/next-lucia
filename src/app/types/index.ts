import { z } from "zod";

export const SignUpSchema = z
	.object({
		username: z
			.string()
			.min(3, { message: "Username must be at least 3 characters long" })
			.max(50, {
				message: "Username must be at most 50 characters long",
			}),
		email: z.string().email(),
		password: z
			.string()
			.min(8, { message: "Password must be at least 8 characters long" }),
		confirmPassword: z
			.string()
			.min(8, { message: "Password must be at least 8 characters long" }),
		acceptTermsAndConditions: z.boolean(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	})
	.refine((data) => data.acceptTermsAndConditions, {
		message: "Please accept the terms and conditions",
		path: ["acceptTermsAndConditions"],
	});

export const SignInSchema = z.object({
	email: z.string().email(),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
});
