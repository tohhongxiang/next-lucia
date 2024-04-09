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
import { signIn } from "../actions/auth.actions";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function SignInForm() {
	const router = useRouter();

	const form = useForm<z.infer<typeof SignInSchema>>({
		resolver: zodResolver(SignInSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	const onSubmit = async (values: z.infer<typeof SignInSchema>) => {
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
				<Button type="submit">Submit</Button>
				<p className="text-center text-sm text-gray-500">
					Don&apos;t have an account?{" "}
					<Link className="underline" href="/sign-up">
						Sign up
					</Link>
				</p>
			</form>
		</Form>
	);
}
