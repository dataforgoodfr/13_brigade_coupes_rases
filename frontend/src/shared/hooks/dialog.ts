import { useState } from "react";

export const useDialog = (defaultIsOpen = false) => {
	const [isOpen, setIsOpen] = useState(defaultIsOpen);

	const onClose = () => {
		setIsOpen(false);
	};

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
	};

	return {
		isOpen,
		onClose,
		onOpenChange,
	};
};
