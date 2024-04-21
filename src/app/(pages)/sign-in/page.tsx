import SignInForm from "@/app/components/sign-in-form";
import { validateRequest } from "@/lib/lucia";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Sign In",
};

export default async function SignInPage() {
	const { user } = await validateRequest();

	if (user) {
		return redirect("/");
	}

	return (
		<div className="mx-auto max-w-prose px-4 py-16 sm:px-6 lg:px-8">
			<div className="mx-auto w-full mb-8">
				<h1 className="text-2xl font-bold sm:text-3xl">
					Sign In to your Account
				</h1>
				<p className="mt-4 text-gray-500">
					By continuing, you agree to our{" "}
					<a href="#" className="underline">
						User Agreement
					</a>{" "}
					and acknowledge that you understand the{" "}
					<a href="#" className="underline">
						Privacy Policy
					</a>
					.
				</p>
			</div>
			<SignInForm />
		</div>
	);
}
