import dataForGoodLogo from "@/assets/dataforgoodLogo.png"
import canopeeLogo from "@/assets/logo-lg.png"

const REPOSITORY_URL =
	"https://github.com/dataforgoodfr/13_brigade_coupes_rases"

const linkClassName = "text-primary font-semibold hover:underline"

export function About() {
	return (
		<div className="flex flex-col w-full h-full p-6 sm:p-10 overflow-y-auto bg-neutral-50">
			<div className="max-w-2xl space-y-6">
				<img alt="Canopée forêts vivantes" src={canopeeLogo} className="w-48" />
				<h1 className="text-3xl font-bold text-primary font-poppins">
					À propos
				</h1>
				<p className="text-neutral-700">
					L'outil d'alerte de la brigade des coupes rases est porté par
					l'association{" "}
					<a
						href="https://www.canopee.ong"
						target="_blank"
						rel="noreferrer"
						className={linkClassName}
					>
						Canopée
					</a>
					. Il recense les coupes rases détectées par satellite, pour que les
					bénévoles les vérifient sur le terrain.
				</p>
				<div className="flex items-center gap-4">
					<img
						alt="Data For Good"
						src={dataForGoodLogo}
						className="size-12 shrink-0"
					/>
					<p className="text-neutral-700">
						Il a été développé à l'origine par les bénévoles de{" "}
						<a
							href="https://dataforgood.fr"
							target="_blank"
							rel="noreferrer"
							className={linkClassName}
						>
							Data For Good
						</a>{" "}
						(saison 13).
					</p>
				</div>
				<p className="text-neutral-700">
					Son code source est libre, sous licence MIT, et publié sur{" "}
					<a
						href={REPOSITORY_URL}
						target="_blank"
						rel="noreferrer"
						className={linkClassName}
					>
						GitHub
					</a>
					.
				</p>
				<p className="text-sm text-neutral-500">Version {__APP_VERSION__}</p>
			</div>
		</div>
	)
}
