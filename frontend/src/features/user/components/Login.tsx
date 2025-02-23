import preview from "@/assets/preview.png";
import { LoginForm } from "@/features/user/components/LoginForm";
export function Login() {
	return (
		<div className="flex w-full h-full">
			<div className="w-full md:w-1/2 flex flex-col items-center justify-center">
				<div className="w-3/4 sm:w-2/4">
					<LoginForm />
				</div>
			</div>
			<div className="hidden md:flex w-1/2 bg-gradient-to-r from-secondary to-primary  flex-col items-center justify-center ">
				<div className="w-2/4">
					<img alt="Preview" src={preview} className=" object-cover" />
					<h1 className="text-2xl 2xl:text-4xl/6  text-primary-foreground text-center font-semibold font-poppins mt-14">
						Visualiser les coupes rases abusives
					</h1>
					<h2 className="text-neutral-200 font-poppins text-center font-light">
						Une seule source de données fiable xxx
					</h2>
				</div>
			</div>
		</div>
	);
}
