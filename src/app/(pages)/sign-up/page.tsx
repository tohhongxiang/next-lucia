import SignUpForm from "@/app/components/sign-up-form";
import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
	const { user } = await validateRequest();

	if (user) {
		return redirect("/");
	}

	return (
		<div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-lg text-center">
				<h1 className="text-2xl font-bold sm:text-3xl">
					Sign Up Today!
				</h1>

				<p className="mt-4 text-gray-500">
					Lorem ipsum dolor sit amet consectetur adipisicing elit. Et
					libero nulla eaque error neque ipsa culpa autem, at itaque
					nostrum!
				</p>
			</div>
			<SignUpForm />
		</div>
	);
}
