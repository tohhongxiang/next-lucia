"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SignInSchema } from "../types";
import { createGoogleAuthorizationURL, signIn } from "../actions/auth.actions";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";

export default function SignInForm() {
	const router = useRouter();

	const form = useForm<z.infer<typeof SignInSchema>>({
		resolver: zodResolver(SignInSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	const [isLoading, setIsLoading] = useState(false);
	const onSubmit = async (values: z.infer<typeof SignInSchema>) => {
		setIsLoading(true);
		const result = await signIn(values);
		if (result.error) {
			toast({
				variant: "destructive",
				title: "Error!",
				description: result.error,
			});
		} else if (result.success) {
			toast({
				variant: "default",
				title: "Signed in successfully!",
				description: "You will be redirected shortly...",
			});

			router.push("/");
		}
		setIsLoading(false);
	};

	const onGoogleSignInClick = async () => {
		const res = await createGoogleAuthorizationURL();

		if (res.error) {
			toast({
				variant: "destructive",
				description: res.error,
			});
		} else if (res.success) {
			window.location.href = res.data;
		}
	};

	return (
		<>
			<div className="flex flex-col gap-4 w-full items-center justify-center">
				<Button
					variant="outline"
					className="w-full flex justify-center items-center gap-2"
					onClick={onGoogleSignInClick}
				>
					<SiGoogle className="w-4 h-4 mr-auto shrink-0" />
					<span className="mr-auto">Sign In with Google</span>
				</Button>
				<Button
					variant="outline"
					className="w-full flex justify-center items-center gap-2"
				>
					<SiGithub className="w-4 h-4 mr-auto shrink-0" />
					<span className="mr-auto">Sign In with Github</span>
				</Button>
			</div>
			<div className="flex items-center gap-4">
				<hr className="my-8 border grow" />
				<span className="text-muted-foreground font-light text-sm">
					OR
				</span>
				<hr className="my-8 border grow" />
			</div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-8"
				>
					<FormField
						control={form.control}
						name="username"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Username</FormLabel>
								<FormControl>
									<Input placeholder="shadcn" {...field} />
								</FormControl>
								<FormMessage />
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
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "Loading..." : "Sign In"}
					</Button>
					<p className="text-center text-sm text-gray-500">
						Don&apos;t have an account?{" "}
						<Link className="underline" href="/sign-up">
							Sign up
						</Link>
					</p>
				</form>
			</Form>
		</>
	);
}
