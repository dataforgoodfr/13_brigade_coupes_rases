import { AlertCircle, Camera, ChevronLeft, ChevronRight, ImagePlus, X, ZoomIn } from "lucide-react"
import { type ChangeEvent, useEffect, useRef, useState } from "react"
import type { FieldValues } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useImageUpload } from "@/shared/hooks/useImageUpload"
import { useImageViewer } from "@/shared/hooks/useImageViewer"

import {
	FormControl,
	type FormFieldRenderProps,
	FormItem,
	FormLabel,
	FormMessage
} from "./Form"
import type { FormProps } from "../types"

type Forms3ImageUploadProps<T extends FieldValues> = FormProps<T> & {
	reportId: string
}
type FormS3ImageFieldProps<T extends FieldValues> = FormFieldRenderProps<T> & {
	reportId: string
	previewUrls: string[]
	onPreviewUrlsChanged: (previews: string[]) => void
	onSelectedImageIndexChanged: (index: number) => void
} & Forms3ImageUploadProps<T>

function FormS3ImageField<T extends FieldValues>({
	onPreviewUrlsChanged,
	previewUrls,
	reportId,
	label,
	placeholder,
	onSelectedImageIndexChanged,
	field
}: FormS3ImageFieldProps<T>) {
	const { uploadImages, uploading, error, progress } = useImageUpload()
	const { getViewableUrls, loading: viewerLoading } = useImageViewer()
	const [uploadedImages, setUploadedImages] = useState<string[]>([])

	const galleryInputRef = useRef<HTMLInputElement>(null)
	const cameraInputRef = useRef<HTMLInputElement>(null)

	const handleFiles = async (files: FileList | null) => {
		if (!files || files.length === 0) return
		try {
			const uploaded = await uploadImages(files, reportId)
			const s3Keys = uploaded.map((img) => img.key)
			const newUploadedImages = [...uploadedImages, ...s3Keys]
			setUploadedImages(newUploadedImages)
			field.onChange(newUploadedImages)
		} catch (_e) {}
	}

	const handleGalleryChange = (e: ChangeEvent<HTMLInputElement>) =>
		handleFiles(e.target.files)
	const handleCameraChange = (e: ChangeEvent<HTMLInputElement>) =>
		handleFiles(e.target.files)

	const removeImageWithField = (indexToRemove: number) => {
		const newUploadedImages = uploadedImages.filter((_, i) => i !== indexToRemove)
		const newPreviewUrls = previewUrls.filter((_, i) => i !== indexToRemove)
		setUploadedImages(newUploadedImages)
		onPreviewUrlsChanged(newPreviewUrls)
		field.onChange(newUploadedImages)
	}

	useEffect(() => {
		if (field.value && Array.isArray(field.value) && field.value.length > 0) {
			const s3Keys = field.value.filter(
				(item: string) => typeof item === "string" && !item.startsWith("blob:")
			)
			if (s3Keys.length > 0) {
				getViewableUrls(s3Keys).then((viewableUrls) => {
					setUploadedImages(s3Keys)
					onPreviewUrlsChanged(viewableUrls)
				})
			}
		}
	}, [field.value, getViewableUrls, onPreviewUrlsChanged])

	const isDisabled = field.disabled || uploading

	return (
		<FormItem>
			{label && <FormLabel className="font-bold">{label}</FormLabel>}
			<FormControl>
				<div className="flex flex-col gap-2">
					{/* Hidden file inputs */}
					<input
						ref={galleryInputRef}
						type="file"
						accept="image/*"
						multiple
						className="hidden"
						disabled={isDisabled}
						onChange={handleGalleryChange}
						aria-label={`Sélectionner des photos — ${label ?? placeholder}`}
					/>
					<input
						ref={cameraInputRef}
						type="file"
						accept="image/*"
						capture="environment"
						className="hidden"
						disabled={isDisabled}
						onChange={handleCameraChange}
						aria-label={`Prendre une photo — ${label ?? placeholder}`}
					/>

					{/* Action buttons — touch-friendly, full width on mobile */}
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="flex-1 min-h-[44px] gap-2 text-sm"
							disabled={isDisabled}
							onClick={() => galleryInputRef.current?.click()}
						>
							<ImagePlus className="h-4 w-4 shrink-0" />
							<span>{uploading ? "Envoi…" : "Galerie"}</span>
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="flex-1 min-h-[44px] gap-2 text-sm"
							disabled={isDisabled}
							onClick={() => cameraInputRef.current?.click()}
						>
							<Camera className="h-4 w-4 shrink-0" />
							<span>Appareil photo</span>
						</Button>
					</div>
				</div>
			</FormControl>

			{/* Progress and status */}
			{(uploading || viewerLoading) && (
				<div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
					<svg
						className="h-4 w-4 animate-spin text-gray-500 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
					>
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
					</svg>
					{uploading ? "Envoi en cours…" : "Chargement des photos…"}
				</div>
			)}

			{uploading && <Progress value={progress} className="w-full" />}

			{error && (
				<div className="flex items-start gap-2 text-sm text-red-600 mt-1">
					<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
					<span>{error}</span>
				</div>
			)}

			{/* Image previews */}
			{previewUrls.length > 0 && (
				<div className="space-y-2 mt-2">
					<p className="text-sm font-medium text-gray-700">
						{previewUrls.length} photo{previewUrls.length > 1 ? "s" : ""}
					</p>
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
						{previewUrls.map((imageUrl, index) => (
							<div key={imageUrl} className="relative group">
								<button
									type="button"
									className="relative cursor-pointer w-full bg-transparent border-none p-0"
									onClick={() => onSelectedImageIndexChanged(index)}
									aria-label={`Voir la photo ${index + 1}`}
								>
									<img
										src={imageUrl}
										alt={`Photo ${index + 1}`}
										className="w-full h-24 object-cover rounded border hover:opacity-75 transition-opacity"
										onError={(e) => {
											e.currentTarget.src =
												"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f0f0f0'/><text x='50' y='50' font-family='Arial' font-size='12' fill='%23666' text-anchor='middle' dy='0.3em'>Photo</text></svg>"
										}}
									/>
									<div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-opacity-30 rounded">
										<ZoomIn className="h-6 w-6 text-white drop-shadow" />
									</div>
								</button>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
									onClick={(e) => {
										e.stopPropagation()
										removeImageWithField(index)
									}}
									disabled={uploading}
									aria-label={`Supprimer la photo ${index + 1}`}
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						))}
					</div>
				</div>
			)}

			<FormMessage />
		</FormItem>
	)
}

export function FormS3ImageUpload<T extends FieldValues = FieldValues>({
	form,
	name,
	...props
}: Forms3ImageUploadProps<T>) {
	const [previewUrls, setPreviewUrls] = useState<string[]>([])
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | undefined>()

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (selectedImageIndex === undefined) return
			switch (event.key) {
				case "ArrowLeft":
					event.preventDefault()
					setSelectedImageIndex(
						selectedImageIndex > 0 ? selectedImageIndex - 1 : previewUrls.length - 1
					)
					break
				case "ArrowRight":
					event.preventDefault()
					setSelectedImageIndex(
						selectedImageIndex < previewUrls.length - 1 ? selectedImageIndex + 1 : 0
					)
					break
				case "Escape":
					event.preventDefault()
					setSelectedImageIndex(undefined)
					break
			}
		}
		if (selectedImageIndex !== undefined) {
			document.addEventListener("keydown", handleKeyDown)
		}
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [selectedImageIndex, previewUrls.length])

	return (
		<>
			<FormS3ImageField
				{...props}
				form={form}
				name={name}
				previewUrls={previewUrls}
				onPreviewUrlsChanged={setPreviewUrls}
				onSelectedImageIndexChanged={setSelectedImageIndex}
			/>

			{/* Lightbox modal */}
			{selectedImageIndex !== undefined && (
				<button
					type="button"
					className="fixed inset-0 flex items-center justify-center z-50 border-none p-0"
					style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
					onClick={() => setSelectedImageIndex(undefined)}
					aria-label="Fermer"
				>
					<div className="relative w-full max-w-4xl max-h-screen p-4">
						<img
							src={previewUrls[selectedImageIndex]}
							alt={`Photo ${selectedImageIndex + 1}`}
							className="max-w-full max-h-[80vh] object-contain rounded shadow-lg mx-auto block"
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
						/>

						{previewUrls.length > 1 && (
							<>
								<Button
									type="button"
									variant="outline"
									size="lg"
									className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full p-0 bg-white/90"
									onClick={(e) => {
										e.stopPropagation()
										setSelectedImageIndex(
											selectedImageIndex > 0 ? selectedImageIndex - 1 : previewUrls.length - 1
										)
									}}
								>
									<ChevronLeft className="h-6 w-6 text-gray-700" />
								</Button>
								<Button
									type="button"
									variant="outline"
									size="lg"
									className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full p-0 bg-white/90"
									onClick={(e) => {
										e.stopPropagation()
										setSelectedImageIndex(
											selectedImageIndex < previewUrls.length - 1 ? selectedImageIndex + 1 : 0
										)
									}}
								>
									<ChevronRight className="h-6 w-6 text-gray-700" />
								</Button>
							</>
						)}

						<p className="text-white text-center text-sm mt-2 opacity-70">
							{selectedImageIndex + 1} / {previewUrls.length}
						</p>
					</div>
				</button>
			)}
		</>
	)
}
