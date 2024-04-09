"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SignUpSchema } from "../types";
import { signUp } from "../actions/auth.actions";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
	const router = useRouter();

	const form = useForm<z.infer<typeof SignUpSchema>>({
		resolver: zodResolver(SignUpSchema),
		defaultValues: {
			username: "",
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = async (values: z.infer<typeof SignUpSchema>) => {
		const result = await signUp(values);
		if (result.error) {
			toast({
				variant: "destructive",
				title: "Error!",
				description: result.error,
			});
		} else if (result.success) {
			toast({
				variant: "default",
				title: "Account created successfully!",
				description: "You will be redirected shortly...",
			});

			router.push("/");
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Username</FormLabel>
							<FormControl>
								<Input placeholder="shadcn" {...field} />
							</FormControl>
							{form.formState.errors.username ? (
								<FormMessage />
							) : (
								<FormDescription>
									Username must be at least 3 characters long
								</FormDescription>
							)}
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<Input
									placeholder="********"
									type="password"
									{...field}
								/>
							</FormControl>
							{form.formState.errors.password ? (
								<FormMessage />
							) : (
								<FormDescription>
									Password must be at least 8 characters long
								</FormDescription>
							)}
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="confirmPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Confirm Password</FormLabel>
							<FormControl>
								<Input
									placeholder="********"
									type="password"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Submit</Button>
				<p className="text-center text-sm text-gray-500">
					Already have an account?{" "}
					<Link className="underline" href="/sign-in">
						Sign in
					</Link>
				</p>
			</form>
		</Form>
	);
}
