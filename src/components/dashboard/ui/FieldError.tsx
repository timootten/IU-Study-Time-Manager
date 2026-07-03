import { AlertCircle } from "lucide-react";

type FieldErrorProps = {
	message: string;
};

export default function FieldError({ message }: FieldErrorProps) {
	return (
		<p
			role="alert"
			className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-500"
		>
			<AlertCircle size={12} className="shrink-0" />
			<span>{message}</span>
		</p>
	);
}
