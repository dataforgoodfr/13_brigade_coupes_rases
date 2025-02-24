export function Dot({ className, color }: { className: string, color: string }) {
	const style = {
		width: "8px",
		height: "8px",
		backgroundColor: color,
	};

	return <div className={`rounded-full  ${className}`} style={style} />;
}
