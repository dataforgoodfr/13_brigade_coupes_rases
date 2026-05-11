import preview from "@/assets/preview.png"
import { RegisterForm } from "@/features/user/components/RegisterForm"

export function Register() {
	return (
		<div className="flex w-full h-full">
			<div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 overflow-y-auto">
				<div className="w-full sm:w-3/4 max-w-md">
					<RegisterForm />
				</div>
			</div>
			<div className="hidden md:flex w-1/2 bg-gradient-to-r from-secondary to-primary flex-col items-center justify-center">
				<div className="w-3/4 max-w-lg">
					<img
						alt="Preview"
						src={preview}
						className="object-cover rounded-xl shadow-2xl"
					/>
					<h1 className="text-2xl 2xl:text-4xl/6 text-primary-foreground text-center font-semibold font-poppins mt-14">
						Rejoignez la Brigade
					</h1>
					<h2 className="text-neutral-200 font-poppins text-center font-light mt-4">
						Contribuez à l'identification et au suivi des coupes rases abusives.
					</h2>
				</div>
			</div>
		</div>
	)
}
