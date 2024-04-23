import { TriangleAlert } from "lucide-react";

interface ErrorMessageProps {
	message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
	return (
		<div className="w-full flex items-center gap-2 mb-2">
			<TriangleAlert className="w-4 h-4 text-destructive" />
			<p className="text-destructive">{message}</p>
		</div>
	);
}
