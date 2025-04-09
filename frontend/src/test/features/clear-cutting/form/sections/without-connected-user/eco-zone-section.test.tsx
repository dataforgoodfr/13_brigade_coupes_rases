import {
	ecoZoneKey,
	ecoZoneValue,
} from "@/features/clear-cutting/components/form/sections/EcoZoneSection";
import { mockClearCutting } from "@/mocks/clear-cuttings";
import { server } from "@/test/mocks/server";
import { renderApp } from "@/test/renderApp";
import { ic } from "@/test/utils";
import { fireEvent, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

describe("On Site section form when there isn't a user connected", () => {
	let accordion: HTMLElement;

	beforeAll(async () => {
		server.use(
			mockClearCutting({
				city: "Paris",
				last_cut_date: "2024-03-19",
				onSiteDate: "2024-03-19T14:26:30.789Z",
				weather: "Nuageux",
				standTypeAndSilviculturalSystemBCC: "Epicéa",
				waterCourseOrWetlandPresence: "Présence de cours d'eau",
				soilState: "Sol en mauvais état",
			}),
		);
		renderApp({
			route: "/clear-cuttings/$clearCuttingId",
			params: { $clearCuttingId: "ABC" },
		});

		const buttons = await screen.findAllByText(ic(ecoZoneKey.name));
		const accordionButton = buttons.filter((el) => el.tagName === "BUTTON")[0];
		fireEvent.click(accordionButton);
		accordion = accordionButton.parentElement?.parentElement as HTMLElement;
	});

	it(`should display "${ecoZoneKey.name}" section`, async () => {
		const buttons = await screen.findAllByText(ic(ecoZoneKey.name));
		expect(
			buttons.filter((el) => el.tagName === "BUTTON")[0],
		).toBeInTheDocument();
	});

	it("should display the switch for the natura zone 2000, its label, and it should be disabled", async () => {
		const isNatura2000 = ecoZoneValue.find(
			(val) => val.name === "isNatura2000",
		);

		const isNatura2000Switch = await within(accordion).findByLabelText(
			ic(isNatura2000?.label as string),
		);
		expect(isNatura2000Switch).toBeInTheDocument();
		expect(isNatura2000Switch).not.toBeChecked();
		expect(isNatura2000Switch).toBeDisabled();
	});

	it("should not display the the natura zone name, its label, and it should be disabled", async () => {
		const isNatura2000 = ecoZoneValue.find(
			(val) => val.name === "isNatura2000",
		);

		const isNatura2000Switch = await within(accordion).findByLabelText(
			ic(isNatura2000?.label as string),
		);
		expect(isNatura2000Switch).toBeInTheDocument();
		expect(isNatura2000Switch).not.toBeChecked();
		expect(isNatura2000Switch).toBeDisabled();
	});
});
