import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

type SortingButtonProps = {
	onClick: () => void;
	children: React.ReactNode;
};

const SortingButton: React.FC<SortingButtonProps> = ({ onClick, children }) => {
	return (
		<Button variant="ghost" onClick={onClick}>
			{children}
			<ArrowUpDown />
		</Button>
	);
};

export default SortingButton;
