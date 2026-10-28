import { FlaskConical } from "lucide-react"

/** Shown on the public demo, whose data is made up and saved nowhere. */
export function DemoBanner() {
	if (import.meta.env.VITE_DEMO !== "true") return null
	return (
		<output className="flex items-center justify-center gap-2 bg-sky-100 text-sky-900 text-sm px-4 py-1.5 text-center">
			<FlaskConical className="size-4 shrink-0" />
			<span>
				Démo — données fictives, rien n'est enregistré. Connexion avec n'importe
				quel e-mail (contenant « admin » pour le rôle administrateur).
			</span>
		</output>
	)
}
