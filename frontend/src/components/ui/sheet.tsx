import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import type * as React from "react"

import { cn } from "@/lib/utils"

function Sheet({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

/**
 * Minimal bottom sheet built on the Radix dialog primitive. Slides up from the
 * bottom edge with a drag-handle affordance — used for mobile filter panels
 * where a dropdown would be too cramped.
 */
function SheetContent({
	className,
	children,
	title,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { title: string }) {
	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
			<DialogPrimitive.Content
				data-slot="sheet-content"
				className={cn(
					"fixed inset-x-0 bottom-0 z-[200] flex max-h-[85dvh] flex-col rounded-t-2xl border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg",
					"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
					className
				)}
				{...props}
			>
				<div className="mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-zinc-300" />
				<div className="mb-2 flex shrink-0 items-center justify-between">
					<DialogPrimitive.Title className="text-base font-semibold">
						{title}
					</DialogPrimitive.Title>
					<DialogPrimitive.Close className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100">
						<XIcon className="size-5" />
						<span className="sr-only">Fermer</span>
					</DialogPrimitive.Close>
				</div>
				{children}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	)
}

export { Sheet, SheetClose, SheetContent, SheetTrigger }
