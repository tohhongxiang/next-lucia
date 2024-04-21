/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import { validateRequest } from "@/lib/lucia";
import { redirect } from "next/navigation";
import { signOut } from "./actions/auth.actions";
import { User } from "lucide-react";

export default async function Home() {
	const { user } = await validateRequest();

	if (!user) {
		return redirect("/sign-in");
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<div className="flex flex-col items-center justify-center">
				{user.profilePictureUrl ? (
					<img
						src={user.profilePictureUrl}
						alt=""
						className="rounded-full mb-4 w-16 h-16"
					/>
				) : (
					<User className="w-16 h-16 mb-4" />
				)}
				<p className="font-bold">{user.username}</p>
				<p>{user.email}</p>
			</div>
			<pre>{JSON.stringify(user, null, 2)}</pre>
			<form action={signOut}>
				<Button type="submit">Sign out</Button>
			</form>
		</main>
	);
}
