export const POSITIONS = ["start", "end"] as const;
export type Position = (typeof POSITIONS)[number];

export const ALIGNMENTS = [
	...POSITIONS,
	"end-safe",
	"center",
	"center-safe",
	"baseline",
	"baseline-last",
	"stretch",
] as const;
export type Align = (typeof ALIGNMENTS)[number];

export const ORIENTATIONS = ["vertical", "horizontal"] as const;
export type Orientation = (typeof ORIENTATIONS)[number];
