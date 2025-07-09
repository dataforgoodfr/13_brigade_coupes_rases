import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Upload, AlertCircle, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import type { FieldValues } from "react-hook-form";
import { useImageUpload } from "@/shared/hooks/useImageUpload";
import { useImageViewer } from "@/shared/hooks/useImageViewer";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	type FormProps,
} from "./Form";

export function FormS3ImageUpload<T extends FieldValues = FieldValues>({
	control,
	name,
	label,
	disabled = false,
	placeholder,
	reportId,
}: FormProps<T> & { reportId?: string }) {
	const { uploadImages, uploading, error, progress } = useImageUpload();
	const { getViewableUrls, loading: viewerLoading } = useImageViewer();
	const [uploadedImages, setUploadedImages] = React.useState<string[]>([]);
	const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
	const loadedKeysRef = React.useRef<string>('');
	const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		try {
			const uploaded = await uploadImages(files, reportId);
			// Save S3 keys to form data
			const s3Keys = uploaded.map((img) => img.key);
			setUploadedImages((prev) => [...prev, ...s3Keys]);
			
			// Create preview URLs for display
			const newPreviewUrls = Array.from(files).map((file) => URL.createObjectURL(file));
			setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
		} catch (err) {
			console.error("Upload failed:", err);
		}
	};

	const removeImage = (indexToRemove: number) => {
		// Remove from both S3 keys and preview URLs
		setUploadedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
		setPreviewUrls((prev) => {
			const updated = prev.filter((_, index) => index !== indexToRemove);
			// Clean up the removed blob URL to prevent memory leaks
			if (prev[indexToRemove]?.startsWith('blob:')) {
				URL.revokeObjectURL(prev[indexToRemove]);
			}
			return updated;
		});
	};

	// Clean up preview URLs when component unmounts
	React.useEffect(() => {
		return () => {
			previewUrls.forEach((url) => {
				if (url.startsWith('blob:')) {
					URL.revokeObjectURL(url);
				}
			});
		};
	}, [previewUrls]);

	// Handle keyboard navigation for modal
	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (selectedImageIndex === null) return;

			switch (event.key) {
				case 'ArrowLeft':
					event.preventDefault();
					setSelectedImageIndex(
						selectedImageIndex > 0 ? selectedImageIndex - 1 : previewUrls.length - 1
					);
					break;
				case 'ArrowRight':
					event.preventDefault();
					setSelectedImageIndex(
						selectedImageIndex < previewUrls.length - 1 ? selectedImageIndex + 1 : 0
					);
					break;
				case 'Escape':
					event.preventDefault();
					setSelectedImageIndex(null);
					break;
			}
		};

		if (selectedImageIndex !== null) {
			document.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [selectedImageIndex, previewUrls.length]);

	return (
		<>
			<FormField
				control={control}
				name={name}
				render={({ field }) => {
				// Load existing images from S3 keys when form value changes (on mount or external change)
				React.useEffect(() => {
					const loadExistingImages = async () => {
						if (field.value && Array.isArray(field.value) && field.value.length > 0) {
							// Check if these are S3 keys (not blob URLs)
							const s3Keys = field.value.filter((item: string) => 
								typeof item === 'string' && !item.startsWith('blob:')
							);
							
							// Only load if we don't already have these images loaded
							const newKeysString = s3Keys.join(',');
							
							if (s3Keys.length > 0 && loadedKeysRef.current !== newKeysString) {
								loadedKeysRef.current = newKeysString;
								try {
									const viewableUrls = await getViewableUrls(s3Keys);
									setUploadedImages(s3Keys);
									setPreviewUrls(viewableUrls);
								} catch (error) {
									console.error('Failed to load existing images:', error);
								}
							}
						} else if (!field.value || field.value.length === 0) {
							// Clear images if form value is empty
							setUploadedImages([]);
							setPreviewUrls([]);
							loadedKeysRef.current = '';
						}
					};

					loadExistingImages();
				}, [field.value]);

				// Update form field when uploadedImages changes (but prevent circular updates)
				React.useEffect(() => {
					const currentFieldValue = field.value || [];
					const uploadedImagesString = uploadedImages.join(',');
					const fieldValueString = Array.isArray(currentFieldValue) ? currentFieldValue.join(',') : '';
					
					// Only update if the values are actually different
					if (uploadedImagesString !== fieldValueString) {
						field.onChange(uploadedImages);
					}
				}, [uploadedImages]);

				return (
					<FormItem>
						{label && <FormLabel className="font-bold">{label}</FormLabel>}
						<FormControl>
							<div className="space-y-4">
								{/* Upload Input */}
								<div className="flex items-center gap-2">
									<Input
										type="file"
										accept="image/*"
										multiple
										disabled={disabled || uploading}
										onChange={handleFileUpload}
										placeholder={placeholder}
										className="max-w-fit"
									/>
									{(uploading || viewerLoading) && (
										<div className="flex items-center gap-2 text-sm text-gray-600">
											<Upload className="h-4 w-4 animate-spin" />
											{uploading ? "Uploading..." : "Loading images..."}
										</div>
									)}
								</div>

								{/* Progress Bar */}
								{uploading && (
									<Progress value={progress} className="w-full" />
								)}

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
												<div key={index} className="relative group">
													<div 
														className="relative cursor-pointer"
														onClick={() => setSelectedImageIndex(index)}
													>
														<img
															src={imageUrl}
															alt={`Upload ${index + 1}`}
															className="w-full h-24 object-cover rounded border hover:opacity-75 transition-opacity"
															onError={(e) => {
																// Fallback for broken images
																e.currentTarget.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f0f0f0'/><text x='50' y='50' font-family='Arial' font-size='12' fill='%23666' text-anchor='middle' dy='0.3em'>Image</text></svg>";
															}}
														/>
														<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded">
															<ZoomIn className="h-6 w-6 text-white" />
														</div>
													</div>
													<Button
														type="button"
														variant="destructive"
														size="sm"
														className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
														onClick={(e) => {
															e.stopPropagation();
															removeImage(index);
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
						</FormControl>
						<FormMessage />
					</FormItem>
				);
			}}
			/>
			
			{/* Image Preview Modal */}
		{selectedImageIndex !== null && (
			<div 
				className="fixed inset-0 flex items-center justify-center z-50"
				style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
				onClick={() => setSelectedImageIndex(null)}
			>
				<div className="relative max-w-4xl max-h-full p-4">
					<img
						src={previewUrls[selectedImageIndex]}
						alt={`Preview ${selectedImageIndex + 1}`}
						className="max-w-full max-h-full object-contain rounded shadow-lg"
						onClick={(e) => e.stopPropagation()}
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
										selectedImageIndex > 0 ? selectedImageIndex - 1 : previewUrls.length - 1
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
										selectedImageIndex < previewUrls.length - 1 ? selectedImageIndex + 1 : 0
									);
								}}
							>
								<ChevronRight className="h-6 w-6 text-gray-700" />
							</Button>
						</>
					)}
				</div>
			</div>
		)}
		</>
	);
}