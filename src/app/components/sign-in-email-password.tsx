"use client";

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
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import ErrorMessage from "./error-message";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldName, useForm } from "react-hook-form";
import { z } from "zod";
import { getExistingUserByEmail, signUp } from "../actions/auth.actions";
import { SignUpSchema } from "../types";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

const steps = [
	{ name: "Email", fields: ["email"] },
	{
		name: "Username and Password",
		fields: ["username", "password", "confirmPassword"],
	},
	{
		name: "Terms and Conditions",
		fields: ["acceptTermsAndConditions"],
	},
];

export default function SignInEmailPassword() {
	const [currentStep, setCurrentStep] = useState(0);

	const form = useForm<z.infer<typeof SignUpSchema>>({
		resolver: zodResolver(SignUpSchema),
		defaultValues: {
			username: "",
			email: "",
			password: "",
			confirmPassword: "",
			acceptTermsAndConditions: false,
		},
	});

	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const goToNextStep = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		form.clearErrors();

		const fieldsToValidate = steps[currentStep].fields;

		setIsLoading(true);
		const areFormFieldsValid = await form.trigger(
			fieldsToValidate as FieldName<z.infer<typeof SignUpSchema>>[],
			{
				shouldFocus: true,
			}
		);
		setIsLoading(false);

		if (!areFormFieldsValid) return;

		if (currentStep === steps.length - 1) {
			await form.handleSubmit(onSubmit)();
		} else {
			setCurrentStep((c) => c + 1);
		}
	};

	const onSubmit = async (values: z.infer<typeof SignUpSchema>) => {
		setIsLoading(true);

		const result = await signUp(values);
		if (result.error) {
			form.setError("root", { message: result.error });
		} else if (result.success) {
			toast({
				variant: "default",
				title: "Account created successfully!",
				description: "You will be redirected shortly...",
			});

			router.push("/");
		}

		setIsLoading(false);
	};

	return (
		<div>
			{currentStep > 0 && (
				<div className="flex items-center gap-4 mb-4">
					<Button
						variant="ghost"
						onClick={() => setCurrentStep((c) => c - 1)}
					>
						<span className="sr-only">Go to previous step</span>
						<ChevronLeft className="w-8 h-8" />
					</Button>
					<div>
						<p className="text-muted-foreground text-sm">
							Step {currentStep + 1} of {steps.length}
						</p>
						<p className="font-bold">{steps[currentStep].name}</p>
					</div>
				</div>
			)}
			<Form {...form}>
				<form onSubmit={goToNextStep} className="space-y-8 p-4">
					{currentStep === 0 && (
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											placeholder="shadcn@example.com"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
					{currentStep === 1 && (
						<>
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Username</FormLabel>
										<FormControl>
											<Input
												placeholder="shadcn"
												{...field}
											/>
										</FormControl>
										{form.formState.errors.username ? (
											<FormMessage />
										) : (
											<FormDescription>
												Username must be at least 3
												characters long
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
												Password must be at least 8
												characters long
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
						</>
					)}
					{currentStep === 2 && (
						<FormField
							control={form.control}
							name="acceptTermsAndConditions"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel className="cursor-pointer">
											Accept terms and conditions
										</FormLabel>
										<FormDescription>
											By continuing, you agree to our{" "}
											<a href="#" className="underline">
												User Agreement
											</a>{" "}
											and acknowledge that you understand
											the{" "}
											<a href="#" className="underline">
												Privacy Policy
											</a>
											.
										</FormDescription>
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>
					)}
					{form.formState.errors.root?.message && (
						<ErrorMessage
							message={form.formState.errors.root.message}
						/>
					)}
					<Button
						type="submit"
						className="w-full"
						disabled={isLoading}
					>
						{isLoading
							? "Loading..."
							: currentStep === steps.length - 1
							? "Sign Up"
							: "Next"}
					</Button>
				</form>
			</Form>
		</div>
	);
}
