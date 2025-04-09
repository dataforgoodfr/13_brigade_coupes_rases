import {
	onSiteKey,
	onSiteValue,
} from "@/features/clear-cutting/components/form/sections/OnSiteSection";
import { mockClearCutting } from "@/mocks/clear-cuttings";
import { server } from "@/test/mocks/server";
import { volunteerMock } from "@/test/mocks/user";
import { renderApp } from "@/test/renderApp";
import { ic } from "@/test/utils";
import { fireEvent, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

describe("On Site section form when there is a volunteer connected and assigned to the cc", () => {
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
				assignedUser: volunteerMock,
			}),
		);
		renderApp({
			route: "/clear-cuttings/$clearCuttingId",
			params: { $clearCuttingId: "ABC" },
			user: volunteerMock,
		});

		const buttons = await screen.findAllByText(ic(onSiteKey.name));
		const accordionButton = buttons.filter((el) => el.tagName === "BUTTON")[0];
		fireEvent.click(accordionButton);
		accordion = accordionButton.parentElement?.parentElement as HTMLElement;
	});

	it(`should display "${onSiteKey.name}" section`, async () => {
		const buttons = await screen.findAllByText(ic(onSiteKey.name));
		expect(
			buttons.filter((el) => el.tagName === "BUTTON")[0],
		).toBeInTheDocument();
	});

	it("should display the on site date date picker, its label, and it should be enabled", async () => {
		const onSiteDate = onSiteValue.find((val) => val.name === "onSiteDate");

		const onSiteDatepicker = await within(accordion).findByLabelText(
			ic(onSiteDate?.label as string),
		);
		expect(onSiteDatepicker).toBeInTheDocument();
		expect(
			await within(onSiteDatepicker).findByText(ic("19 mars 2024")),
		).toBeInTheDocument();
		expect(onSiteDatepicker).toBeEnabled();
	});

	it("should display the weather text area, its label, and it should be enabled", async () => {
		const weather = onSiteValue.find((val) => val.name === "weather");

		const weatherTextArea = await within(accordion).findByLabelText(
			ic(weather?.label as string),
		);
		expect(weatherTextArea).toBeInTheDocument();
		expect(weatherTextArea).toHaveValue("Nuageux");
		expect(weatherTextArea).toBeEnabled();
	});

	it("should display the stand type and silvicultural system before cc text area, its label, and it should be enabled", async () => {
		const standTypeAndSilviculturalSystemBCC = onSiteValue.find(
			(val) => val.name === "standTypeAndSilviculturalSystemBCC",
		);

		const standTypeAndSilviculturalSystemBCCTextArea = await within(
			accordion,
		).findByLabelText(ic(standTypeAndSilviculturalSystemBCC?.label as string));
		expect(standTypeAndSilviculturalSystemBCCTextArea).toBeInTheDocument();
		expect(standTypeAndSilviculturalSystemBCCTextArea).toHaveValue("Epicéa");
		expect(standTypeAndSilviculturalSystemBCCTextArea).toBeEnabled();
	});

	it("should display the switch for the presence of plantation after cc, its label, and it should be enabled", async () => {
		const isPlantationPresentACC = onSiteValue.find(
			(val) => val.name === "isPlantationPresentACC",
		);

		const isPlantationPresentACCSwitch = await within(
			accordion,
		).findByLabelText(ic(isPlantationPresentACC?.label as string));
		expect(isPlantationPresentACCSwitch).toBeInTheDocument();
		expect(isPlantationPresentACCSwitch).not.toBeChecked();
		expect(isPlantationPresentACCSwitch).toBeEnabled();
	});

	it("should not display the new tree spicies field when isPlantationPresentACC is false", async () => {
		const newTreeSpicies = onSiteValue.find(
			(val) => val.name === "newTreeSpicies",
		);

		expect(
			await screen.queryByText(newTreeSpicies?.label as string),
		).not.toBeInTheDocument();
	});

	it("should not display the plantation images input when isPlantationPresentACC is false", async () => {
		const imgsPlantation = onSiteValue.find(
			(val) => val.name === "imgsPlantation",
		);

		expect(
			await screen.queryByText(imgsPlantation?.label as string),
		).not.toBeInTheDocument();
	});

	it("should display the switch for the presence of the working sign, its label, and it should be enabled", async () => {
		const isWorksiteSignPresent = onSiteValue.find(
			(val) => val.name === "isWorksiteSignPresent",
		);

		const isWorksiteSignPresentSwitch = await within(accordion).findByLabelText(
			ic(isWorksiteSignPresent?.label as string),
		);
		expect(isWorksiteSignPresentSwitch).toBeInTheDocument();
		expect(isWorksiteSignPresentSwitch).not.toBeChecked();
		expect(isWorksiteSignPresentSwitch).toBeEnabled();
	});

	it("should not display the worksign images input when isWorksiteSignPresent is false", async () => {
		const imgWorksiteSign = onSiteValue.find(
			(val) => val.name === "imgWorksiteSign",
		);

		expect(
			await screen.queryByText(imgWorksiteSign?.label as string),
		).not.toBeInTheDocument();
	});

	it("should display the water courses or wetland presence text area, its label, and it should be enabled", async () => {
		const waterCourseOrWetlandPresence = onSiteValue.find(
			(val) => val.name === "waterCourseOrWetlandPresence",
		);

		const waterCourseOrWetlandPresenceTextArea = await within(
			accordion,
		).findByLabelText(ic(waterCourseOrWetlandPresence?.label as string));
		expect(waterCourseOrWetlandPresenceTextArea).toBeInTheDocument();
		expect(waterCourseOrWetlandPresenceTextArea).toHaveValue(
			"Présence de cours d'eau",
		);
		expect(waterCourseOrWetlandPresenceTextArea).toBeEnabled();
	});

	it("should display the soil state text area, its label, and it should be enabled", async () => {
		const soilState = onSiteValue.find((val) => val.name === "soilState");

		const soilStateTextArea = await within(accordion).findByLabelText(
			ic(soilState?.label as string),
		);
		expect(soilStateTextArea).toBeInTheDocument();
		expect(soilStateTextArea).toHaveValue("Sol en mauvais état");
		expect(soilStateTextArea).toBeEnabled();
	});

	it("should display the input image clear cutting, its label, and it should be enabled", async () => {
		const soilState = onSiteValue.find((val) => val.name === "soilState");

		const soilStateTextArea = await within(accordion).findByLabelText(
			ic(soilState?.label as string),
		);
		expect(soilStateTextArea).toBeInTheDocument();
		expect(soilStateTextArea).toHaveValue("Sol en mauvais état");
		expect(soilStateTextArea).toBeEnabled();
	});

	it("should display the input image tree trunks, its label, and it should be enabled", async () => {
		const imgsTreeTrunks = onSiteValue.find(
			(val) => val.name === "imgsTreeTrunks",
		);

		const imgsTreeTrunksInputFile = await within(accordion).findByLabelText(
			imgsTreeTrunks?.label as string,
		);
		expect(imgsTreeTrunksInputFile).toBeInTheDocument();
		expect(imgsTreeTrunksInputFile).toBeEnabled();
	});

	it("should display the input image soil state, its label, and it should be enabled", async () => {
		const imgsSoilState = onSiteValue.find(
			(val) => val.name === "imgsSoilState",
		);

		const imgsSoilStateInputFile = await within(accordion).findByLabelText(
			ic(imgsSoilState?.label as string),
		);
		expect(imgsSoilStateInputFile).toBeInTheDocument();
		expect(imgsSoilStateInputFile).toBeEnabled();
	});

	it("should display the input image access road, its label, and it should be enabled", async () => {
		const imgsAccessRoad = onSiteValue.find(
			(val) => val.name === "imgsAccessRoad",
		);

		const imgsAccessRoadInputFile = await within(accordion).findByLabelText(
			ic(imgsAccessRoad?.label as string),
		);
		expect(imgsAccessRoadInputFile).toBeInTheDocument();
		expect(imgsAccessRoadInputFile).toBeEnabled();
	});
});
