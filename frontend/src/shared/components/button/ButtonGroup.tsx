import { useState } from "react";
import { motion } from "framer-motion";

const ButtonGroup = ({
	options,
	onSelect,
}: { options: string[]; onSelect?: (options: string) => void }) => {
	const [selected, setSelected] = useState(options[0]);
	const widthUnit = "24";

	function select(option: string) {
		setSelected(option);

		if (onSelect) onSelect(option);
	}

	return (
		<div className="relative flex bg-white rounded-sm w-max p-1 z-500">
			{options.map((option) => (
				<button
					type="button"
					key={option}
					onClick={() => select(option)}
					className={`relative z-10  text-sm font-medium transition-colors duration-300 rounded-sm h-8 w-${widthUnit} font-roboto font-semibold
            ${selected === option ? "text-white" : "text-foreground"}`}
				>
					{option}
				</button>
			))}

			<motion.div
				layoutId="activeButton"
				className={`absolute bg-primary rounded-sm text-sm font-medium w-${widthUnit} h-8`}
				initial={false}
				transition={{ type: "spring", stiffness: 800, damping: 40 }}
				style={{
					left: `calc(${options.indexOf(selected)} * var(--spacing) * ${widthUnit} + (var(--spacing) * 1))`,
				}}
			/>
		</div>
	);
};

export default ButtonGroup;
