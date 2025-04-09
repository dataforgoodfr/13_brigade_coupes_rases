import {
	generalInfoKey,
	generalInfoValue,
} from "@/features/clear-cutting/components/form/sections/GeneralInfoSection";
import {  mockClearCutting } from "@/mocks/clear-cuttings";
import { server } from "@/test/mocks/server";
import { renderApp } from "@/test/renderApp";
import { ic } from "@/test/utils";
import { fireEvent, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

describe("General info section form", () => {
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

		const accordionButton = await screen.findByText(ic(generalInfoKey.name));
		fireEvent.click(accordionButton);
		accordion = accordionButton.parentElement?.parentElement as HTMLElement;
	});

	it(`should display "${generalInfoKey.name}" section when there isn't a user connected`, async () => {
		expect(
			await screen.findByText(ic(generalInfoKey.name)),
		).toBeInTheDocument();
	});

	it("should display the report date and its label", async () => {
		const reportDate = generalInfoValue.find(
			(val) => val.name === "last_cut_date",
		);

		expect(
			await within(accordion).findByText(ic(reportDate?.label as string)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic(new Date().toLocaleDateString())),
		).toBeInTheDocument();
	});

	it("should display the city and its label", async () => {
		const city = generalInfoValue.find((val) => val.name === "city");

		expect(
			await within(accordion).findByText(ic(city?.label)),
		).toBeInTheDocument();
		expect(await within(accordion).findByText(ic("Paris"))).toBeInTheDocument();
	});

	it("should display the departement and its label", async () => {
		const department = generalInfoValue.find(
			(val) => val.name === "department.name",
		);

		expect(
			await within(accordion).findByText(ic(department?.label)),
		).toBeInTheDocument();
		expect(await within(accordion).findByText(ic("54000"))).toBeInTheDocument();
	});

	it("should display the latitude and its label", async () => {
		const latitude = generalInfoValue.find((val) => val.name === "average_location.coordinates.1");

		expect(
			await within(accordion).findByText(ic(latitude?.label)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic("12.2589")),
		).toBeInTheDocument();
	});

	it("should display the longitude and its label", async () => {
		const longitude = generalInfoValue.find((val) => val.name === "average_location.coordinates.0");

		expect(
			await within(accordion).findByText(ic(longitude?.label)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic("13.2589")),
		).toBeInTheDocument();
	});

	it("should display the cut year and its label", async () => {
		const cutYear = generalInfoValue.find(
			(val) => val.name === "last_cut_date",
		);

		expect(
			await within(accordion).findByText(ic(cutYear?.label as string)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic("testParcel")),
		).toBeInTheDocument();
	});

	it("should display the size of the clear cutting and its label", async () => {
		const clearCuttingSize = generalInfoValue.find(
			(val) => val.name === "total_area_hectare",
		);

		expect(
			await within(accordion).findByText(ic(clearCuttingSize?.label as string)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic("808080 ha")),
		).toBeInTheDocument();
	});

	it("should display the slope of the clear cutting and its label", async () => {
		const clearCuttingSlope = generalInfoValue.find(
			(val) => val.name === "slope_area_ratio_percentage",
		);

		expect(
			await within(accordion).findByText(
				ic(clearCuttingSlope?.label as string),
			),
		).toBeInTheDocument();
		expect(await within(accordion).findByText(ic("80%"))).toBeInTheDocument();
	});
});
