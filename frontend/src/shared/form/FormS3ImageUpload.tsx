import {
	AlertCircle,
	ChevronLeft,
	ChevronRight,
	X,
	ZoomIn,
} from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useImageUpload } from "@/shared/hooks/useImageUpload";
import { useImageViewer } from "@/shared/hooks/useImageViewer";
import {
	FormControl,
	type FormFieldRenderProps,
	FormItem,
	FormLabel,
	FormMessage,
} from "./Form";
import type { FormProps } from "./types";

type Forms3ImageUploadProps<T extends FieldValues> = FormProps<T> & {
	reportId: string;
};
type FormS3ImageFieldProps<T extends FieldValues> = FormFieldRenderProps<T> & {
	reportId: string;
	previewUrls: string[];
	onPreviewUrlsChanged: (previews: string[]) => void;
	onSelectedImageIndexChanged: (index: number) => void;
} & Forms3ImageUploadProps<T>;

function FormS3ImageField<T extends FieldValues>({
	onPreviewUrlsChanged,
	previewUrls,
	reportId,
	label,
	placeholder,
	onSelectedImageIndexChanged,
	field,
}: FormS3ImageFieldProps<T>) {
	const { uploadImages, uploading, error, progress } = useImageUpload();
	const { getViewableUrls, loading: viewerLoading } = useImageViewer();
	const [uploadedImages, setUploadedImages] = useState<string[]>([]);
	const handleFileUploadWithField = async (
		event: ChangeEvent<HTMLInputElement>,
	) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		try {
			const uploaded = await uploadImages(files, reportId);
			// Save S3 keys to form data
			const s3Keys = uploaded.map((img) => img.key);
			const newUploadedImages = [...uploadedImages, ...s3Keys];
			setUploadedImages(newUploadedImages);

			// Update form field immediately
			field.onChange(newUploadedImages);
		} catch (_e) {}
	};

	const removeImageWithField = (indexToRemove: number) => {
		// Remove from both S3 keys and preview URLs
		const newUploadedImages = uploadedImages.filter(
			(_, index) => index !== indexToRemove,
		);
		const newPreviewUrls = previewUrls.filter(
			(_, index) => index !== indexToRemove,
		);

		setUploadedImages(newUploadedImages);
		onPreviewUrlsChanged(newPreviewUrls);

		// Update form field immediately
		field.onChange(newUploadedImages);
	};
	// // Load existing images from S3 keys when form value changes (on mount or external change)
	useEffect(() => {
		if (field.value && Array.isArray(field.value) && field.value.length > 0) {
			// Check if these are S3 keys (not blob URLs)
			const s3Keys = field.value.filter(
				(item: string) => typeof item === "string" && !item.startsWith("blob:"),
			);

			if (s3Keys.length > 0) {
				getViewableUrls(s3Keys).then((viewableUrls) => {
					setUploadedImages(s3Keys);
					onPreviewUrlsChanged(viewableUrls);
				});
			}
		} else if (!field.value || field.value.length === 0) {
			// setUploadedImages(EMPTY_ARRAY);
			// onPreviewUrlsChanged(EMPTY_ARRAY);
		}
	}, [field.value, getViewableUrls, onPreviewUrlsChanged]);

	return (
		<FormItem>
			{label && <FormLabel className="font-bold">{label}</FormLabel>}
			<FormControl>
				<Input
					type="file"
					accept="image/*"
					multiple
					disabled={field.disabled || uploading}
					onChange={handleFileUploadWithField}
					placeholder={placeholder}
					className="max-w-fit"
				/>
			</FormControl>
			{/* Additional UI for the upload component */}
			<div className="space-y-4">
				{/* Upload Progress and Status */}
				{(uploading || viewerLoading) && (
					<div className="flex items-center gap-2 text-sm text-gray-600">
						{/* Circular Spinner */}
						<svg
							className="h-4 w-4 animate-spin text-gray-500"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
							/>
						</svg>
						{uploading ? "Uploading..." : "Loading images..."}
					</div>
				)}

				{/* Progress Bar */}
				{uploading && <Progress value={progress} className="w-full" />}

				{/* Error Message */}
				{error && (
					<div className="flex items-center gap-2 text-sm text-red-600">
						<AlertCircle className="h-4 w-4" />
						{error}
					</div>
				)}

				{/* Uploaded Images Preview */}
				{previewUrls.length > 0 && (
					<div className="space-y-2">
						<p className="text-sm font-medium text-gray-700">
							Images uploaded ({previewUrls.length})
						</p>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
							{previewUrls.map((imageUrl, index) => (
								<div key={imageUrl} className="relative group">
									<button
										type="button"
										className="relative cursor-pointer w-full h-full bg-transparent border-none p-0"
										onClick={() => onSelectedImageIndexChanged(index)}
										aria-label={`View image ${index + 1}`}
									>
										<img
											src={imageUrl}
											alt={`Upload ${index + 1}`}
											className="w-full h-24 object-cover rounded border hover:opacity-75 transition-opacity"
											onError={(e) => {
												// Fallback for broken images
												e.currentTarget.src =
													"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f0f0f0'/><text x='50' y='50' font-family='Arial' font-size='12' fill='%23666' text-anchor='middle' dy='0.3em'>Image</text></svg>";
											}}
										/>
										<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded">
											<ZoomIn className="h-6 w-6 text-white" />
										</div>
									</button>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={(e) => {
											e.stopPropagation();
											removeImageWithField(index);
										}}
										disabled={uploading}
									>
										<X className="h-3 w-3" />
									</Button>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
			<FormMessage />
		</FormItem>
	);
}

export function FormS3ImageUpload<T extends FieldValues = FieldValues>({
	form,
	name,
	...props
}: Forms3ImageUploadProps<T>) {
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
	const [selectedImageIndex, setSelectedImageIndex] = useState<number>();

	// Handle keyboard navigation for modal
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (selectedImageIndex === undefined) return;

			switch (event.key) {
				case "ArrowLeft":
					event.preventDefault();
					setSelectedImageIndex(
						selectedImageIndex > 0
							? selectedImageIndex - 1
							: previewUrls.length - 1,
					);
					break;
				case "ArrowRight":
					event.preventDefault();
					setSelectedImageIndex(
						selectedImageIndex < previewUrls.length - 1
							? selectedImageIndex + 1
							: 0,
					);
					break;
				case "Escape":
					event.preventDefault();
					setSelectedImageIndex(undefined);
					break;
			}
		};

		if (selectedImageIndex !== null) {
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [selectedImageIndex, previewUrls.length]);

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

			{/* Image Preview Modal */}
			{selectedImageIndex !== undefined && (
				<button
					type="button"
					className="fixed inset-0 flex items-center justify-center z-50 bg-transparent border-none p-0"
					style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
					onClick={() => setSelectedImageIndex(undefined)}
					aria-label="Close modal"
				>
					<div className="relative max-w-4xl max-h-full p-4">
						<img
							src={previewUrls[selectedImageIndex]}
							alt={`Preview ${selectedImageIndex + 1}`}
							className="max-w-full max-h-full object-contain rounded shadow-lg"
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									e.stopPropagation();
								}
							}}
						/>
						{/* Navigation arrows if multiple images */}
						{previewUrls.length > 1 && (
							<>
								<Button
									type="button"
									variant="outline"
									size="lg"
									className="absolute left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 rounded-full p-0 bg-white/90 hover:bg-white border-gray-300 shadow-lg backdrop-blur-sm"
									onClick={(e) => {
										e.stopPropagation();
										setSelectedImageIndex(
											selectedImageIndex > 0
												? selectedImageIndex - 1
												: previewUrls.length - 1,
										);
									}}
								>
									<ChevronLeft className="h-6 w-6 text-gray-700" />
								</Button>
								<Button
									type="button"
									variant="outline"
									size="lg"
									className="absolute right-4 top-1/2 transform -translate-y-1/2 h-12 w-12 rounded-full p-0 bg-white/90 hover:bg-white border-gray-300 shadow-lg backdrop-blur-sm"
									onClick={(e) => {
										e.stopPropagation();
										setSelectedImageIndex(
											selectedImageIndex < previewUrls.length - 1
												? selectedImageIndex + 1
												: 0,
										);
									}}
								>
									<ChevronRight className="h-6 w-6 text-gray-700" />
								</Button>
							</>
						)}
					</div>
				</button>
			)}
		</>
	);
}
