import {
	generalInfoKey,
	generalInfoValue,
} from "@/features/clear-cutting/components/form/sections/GeneralInfoSection";
import { createAddressMock, mockClearCutting } from "@/mocks/clear-cuttings";
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
				address: createAddressMock({ city: "Paris", postalCode: "54000" }),
				cutYear: 2024,
				reportDate: new Date().toISOString(),
				center: [12.2589, 13.2589],
				cadastralParcel: {
					id: "testParcel",
					slope: 30,
					surfaceKm: 25,
				},
				clearCuttingSize: 808080,
				clearCuttingSlope: 80,
			}),
		);
		renderApp({
			route: "/clear-cuttings/$clearCuttingId",
			params: { $clearCuttingId: "ABC" },
		});

		const accordionButton = await screen.findByText(ic(generalInfoKey.name));
		fireEvent.click(accordionButton);
		accordion = accordionButton.parentElement?.parentElement!;
	});

	it(`should display "${generalInfoKey.name}" section when there isn't a user connected`, async () => {
		expect(
			await screen.findByText(ic(generalInfoKey.name)),
		).toBeInTheDocument();
	});

	it("should display the report date and its label", async () => {
		const reportDate = generalInfoValue.find(
			(val) => val.name === "reportDate",
		);

		expect(
			await within(accordion).findByText(ic(reportDate!.label)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic(new Date().toLocaleDateString())),
		).toBeInTheDocument();
	});

	it("should display the city and its label", async () => {
		const city = generalInfoValue.find((val) => val.name === "address.city");

		expect(
			await within(accordion).findByText(ic(city?.label)),
		).toBeInTheDocument();
		expect(await within(accordion).findByText(ic("Paris"))).toBeInTheDocument();
	});

	it("should display the departement and its label", async () => {
		const postalCode = generalInfoValue.find(
			(val) => val.name === "address.postalCode",
		);

		expect(
			await within(accordion).findByText(ic(postalCode?.label)),
		).toBeInTheDocument();
		expect(await within(accordion).findByText(ic("54000"))).toBeInTheDocument();
	});

	it("should display the latitude and its label", async () => {
		const latitude = generalInfoValue.find((val) => val.name === "center.0");

		expect(
			await within(accordion).findByText(ic(latitude!.label)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic("12.2589")),
		).toBeInTheDocument();
	});

	it("should display the longitude and its label", async () => {
		const longitude = generalInfoValue.find((val) => val.name === "center.1");

		expect(
			await within(accordion).findByText(ic(longitude!.label)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic("13.2589")),
		).toBeInTheDocument();
	});

	it("should display the id of the cadastral parcel and its label", async () => {
		const cadastralParcel = generalInfoValue.find(
			(val) => val.name === "cadastralParcel.id",
		);

		expect(
			await within(accordion).findByText(ic(cadastralParcel?.label)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic("testParcel")),
		).toBeInTheDocument();
	});

	it("should display the cut year and its label", async () => {
		const cutYear = generalInfoValue.find((val) => val.name === "cutYear");

		expect(
			await within(accordion).findByText(ic(cutYear?.label!)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic("testParcel")),
		).toBeInTheDocument();
	});

	it("should display the size of the clear cutting and its label", async () => {
		const clearCuttingSize = generalInfoValue.find(
			(val) => val.name === "clearCuttingSize",
		);

		expect(
			await within(accordion).findByText(ic(clearCuttingSize?.label!)),
		).toBeInTheDocument();
		expect(
			await within(accordion).findByText(ic("808080 ha")),
		).toBeInTheDocument();
	});

	it("should display the slope of the clear cutting and its label", async () => {
		const clearCuttingSlope = generalInfoValue.find(
			(val) => val.name === "clearCuttingSlope",
		);

		expect(
			await within(accordion).findByText(ic(clearCuttingSlope?.label!)),
		).toBeInTheDocument();
		expect(await within(accordion).findByText(ic("80%"))).toBeInTheDocument();
	});
});
