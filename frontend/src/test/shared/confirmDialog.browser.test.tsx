import { screen } from "@testing-library/dom"
import { describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import { ConfirmButton } from "@/shared/components/ConfirmDialog"

const renderButton = (onConfirm: () => void) =>
	render(
		<ConfirmButton
			title="Supprimer cette photo ?"
			description="Elle sera retirée du formulaire."
			confirmLabel="Supprimer"
			onConfirm={onConfirm}
		>
			Supprimer la photo
		</ConfirmButton>
	)

describe("ConfirmButton", () => {
	it("does nothing when the user goes back", async () => {
		const onConfirm = vi.fn()
		await renderButton(onConfirm)

		await userEvent.click(
			screen.getByRole("button", { name: "Supprimer la photo" })
		)
		expect(
			await screen.findByText("Supprimer cette photo ?")
		).toBeInTheDocument()
		await userEvent.click(screen.getByRole("button", { name: "Retour" }))

		await expect
			.poll(() => screen.queryByText("Supprimer cette photo ?"))
			.toBeNull()
		expect(onConfirm).not.toHaveBeenCalled()
	})

	it("carries out the action once confirmed", async () => {
		const onConfirm = vi.fn()
		await renderButton(onConfirm)

		await userEvent.click(
			screen.getByRole("button", { name: "Supprimer la photo" })
		)
		await userEvent.click(
			await screen.findByRole("button", { name: "Supprimer" })
		)

		expect(onConfirm).toHaveBeenCalledTimes(1)
		await expect
			.poll(() => screen.queryByText("Supprimer cette photo ?"))
			.toBeNull()
	})
})
