import SignInForm from "@/app/components/sign-in-form";
import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignInPage() {
	const { user } = await validateRequest();

	if (user) {
		return redirect("/");
	}

	return (
		<div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-lg text-center">
				<h1 className="text-2xl font-bold sm:text-3xl">
					Sign In to your Account
				</h1>

				<p className="mt-4 text-gray-500">
					Lorem ipsum dolor sit amet consectetur adipisicing elit. Et
					libero nulla eaque error neque ipsa culpa autem, at itaque
					nostrum!
				</p>
			</div>
			<SignInForm />
		</div>
	);
}
