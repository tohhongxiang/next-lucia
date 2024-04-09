import { Button } from "@/components/ui/button";
import { validateRequest } from "@/lib/auth";
import Image from "next/image";
import { redirect } from "next/navigation";
import { signOut } from "./actions/auth.actions";

export default async function Home() {
	const { user } = await validateRequest();

	if (!user) {
		return redirect("/sign-in");
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<h1>Logged in as: {user.id}</h1>
			<pre>{JSON.stringify(user, null, 2)}</pre>
			<form action={signOut}>
				<Button type="submit">Sign out</Button>
			</form>
		</main>
	);
}
