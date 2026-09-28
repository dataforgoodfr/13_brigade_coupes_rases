import { type ReactNode, useState } from "react"

import { Button, type ButtonProps } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog"

type ConfirmationProps = {
	title: string
	description: ReactNode
	/** Label of the button that carries out the action. */
	confirmLabel: string
	onConfirm: () => void
}

/** Asks before an action that cannot be undone. */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	onConfirm
}: ConfirmationProps & {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[calc(100%-2rem)] rounded-lg sm:max-w-md"
				// The dialog can be opened from a map popup: keep clicks off the map
				onClick={(e) => e.stopPropagation()}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2">
					<Button
						type="button"
						variant="outline"
						className="min-h-[44px]"
						onClick={() => onOpenChange(false)}
					>
						Retour
					</Button>
					<Button
						type="button"
						variant="destructive"
						className="min-h-[44px]"
						onClick={() => {
							onOpenChange(false)
							onConfirm()
						}}
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

/** A button that asks for confirmation before running `onConfirm`. */
export function ConfirmButton({
	title,
	description,
	confirmLabel,
	onConfirm,
	onClick,
	...buttonProps
}: ConfirmationProps &
	Omit<ButtonProps, "onClick"> & {
		onClick?: ButtonProps["onClick"]
	}) {
	const [open, setOpen] = useState(false)
	return (
		<>
			<Button
				type="button"
				{...buttonProps}
				onClick={(e) => {
					onClick?.(e)
					setOpen(true)
				}}
			/>
			<ConfirmDialog
				open={open}
				onOpenChange={setOpen}
				title={title}
				description={description}
				confirmLabel={confirmLabel}
				onConfirm={onConfirm}
			/>
		</>
	)
}
