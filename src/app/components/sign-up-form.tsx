"use client";

import { Button } from "@/components/ui/button";
import {
	createGithubAuthorizationURL,
	createGoogleAuthorizationURL,
} from "../actions/auth.actions";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import SignInEmailPassword from "./sign-in-email-password";
import Link from "next/link";

export default function SignUpForm() {
	const router = useRouter();

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

	const onGithubSignInClick = async () => {
		const res = await createGithubAuthorizationURL();

		if (res.error) {
			toast({
				variant: "destructive",
				description: res.error,
			});
		} else if (res.success) {
			router.push(res.data);
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
					<span className="mr-auto">Sign up with Google</span>
				</Button>
				<Button
					variant="outline"
					className="w-full flex justify-center items-center gap-2"
					onClick={onGithubSignInClick}
				>
					<SiGithub className="w-4 h-4 mr-auto shrink-0" />
					<span className="mr-auto">Sign up with Github</span>
				</Button>
			</div>
			<div className="flex items-center gap-4">
				<hr className="my-8 border grow" />
				<span className="text-muted-foreground font-light text-sm">
					OR
				</span>
				<hr className="my-8 border grow" />
			</div>
			<SignInEmailPassword />
			<p className="text-center text-sm text-gray-500">
				Already have an account?{" "}
				<Link className="underline" href="/sign-in">
					Sign in
				</Link>
			</p>
		</>
	);
}
