import { Button } from "@/components/ui/button";
import { useMapInstance } from "@/features/clear-cutting/components/map/Map.context";
import { selectDetail } from "@/features/clear-cutting/store/clear-cuttings-slice";
import { cn } from "@/lib/utils";
import { AccordionFullItem } from "@/shared/components/accordion/FullAccordionItem";
import { Form, type FormType } from "@/shared/components/form/Form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Accordion } from "radix-ui";
import { useEffect, useState } from "react";
import { type Path, useForm } from "react-hook-form";
import {
	type ClearCuttingForm,
	clearCuttingFormSchema,
} from "../store/clear-cuttings";
import { CLEAR_CUTTING_STATUS_TRANSLATIONS } from "../store/status";
import { DotByStatus } from "./DotByStatus";

import { Separator } from "@/components/ui/separator";
import { selectLoggedUser } from "@/features/user/store/user.slice";
import { FormDatePicker } from "@/shared/components/form/FormDatePicker";
import { FormInputFile } from "@/shared/components/form/FormInputFile";
import { FormInputText } from "@/shared/components/form/FormInputText";
import { FormSwitch } from "@/shared/components/form/FormSwitch";
import { FormTextArea } from "@/shared/components/form/FormTextArea";
import { FormToggleGroup } from "@/shared/components/form/FormToggleGroup";
import { useAppSelector } from "@/shared/hooks/store";
import { faker } from "@faker-js/faker";
import { TagBadge } from "./TagBadge";

enum FormItemType {
	Switch = 0,
	DatePicker = 1,
	TextArea = 2,
	InputText = 3,
	Fixed = 4,
	InuptFile = 5,
	ToggleGroup = 6,
	Customized = 7,
}

type SectionFormItem<T> = {
	name: Path<T>;
	transformValue?: (val: unknown) => string | undefined;
	label?: string;
	type: FormItemType;
	renderConditions: Path<T>[];
	fallBack?: (key: string | number) => React.ReactNode;
	className?: string;
	customizeRender?: (
		form: FormType<ClearCuttingForm>,
		key: string | number,
	) => React.ReactNode;
};

type SectionForm = {
	name: string;
	className?: string;
};

const ccForm: Map<SectionForm, SectionFormItem<ClearCuttingForm>[]> = new Map([
	[
		{ name: "Informations générales", className: "grid grid-cols-2 gap-2" },
		[
			{
				name: "reportDate",
				transformValue: (val: unknown) =>
					new Date(val as string).toLocaleDateString(),
				label: "Date de signalement",
				type: FormItemType.Fixed,
				renderConditions: [],
			},
			{
				name: "address.city",
				label: "Commune",
				type: FormItemType.Fixed,
				renderConditions: [],
			},
			{
				name: "address.postalCode",
				label: "Département",
				type: FormItemType.Fixed,
				renderConditions: [],
			},
			{
				name: "center.0",
				label: "Latitude",
				type: FormItemType.Fixed,
				renderConditions: [],
			},
			{
				name: "center.1",
				label: "Longitude",
				type: FormItemType.Fixed,
				renderConditions: [],
			},
			{
				name: "cadastralParcel.id",
				label: "Parcelle cadastrale",
				type: FormItemType.Fixed,
				renderConditions: [],
			},
			{
				name: "cutYear",
				label: "Date de la coupe",
				type: FormItemType.Fixed,
				renderConditions: [],
			},
			{
				name: "clearCuttingSize",
				label: "Taille de la coupe",
				type: FormItemType.Fixed,
				renderConditions: [],
			},
			{
				name: "clearCuttingSlope",
				label: "Pourcentage de pente",
				type: FormItemType.Fixed,
				renderConditions: [],
			},
		],
	],
	[
		{ name: "Terrain", className: "flex flex-col gap-4" },
		[
			{
				name: "assignedUser.login",
				label: "Bénévole en charge du terrain :",
				type: FormItemType.Fixed,
				renderConditions: ["assignedUser"],
				fallBack: (key: string | number) => (
					<div key={key} className="flex gap-2 my-2">
						<p className="font-bold">Bénévole en charge du terrain : </p>
						<p>Aucun bénévole n'est assigné</p>
					</div>
				),
			},
			{
				name: "onSiteDate",
				label: "Date du terrain",
				type: FormItemType.DatePicker,
				renderConditions: [],
			},
			{
				name: "wheater",
				label: "Météo",
				type: FormItemType.TextArea,
				renderConditions: [],
			},
			{
				name: "standTypeAndSilviculturalSystemBCC",
				label: "Type de peuplement avant la coupe",
				type: FormItemType.TextArea,
				renderConditions: [],
			},
			{
				name: "isPlantationPresentACC",
				label: "Présence plantation après la coupe ?",
				type: FormItemType.Switch,
				renderConditions: [],
			},
			{
				name: "newTreeSpicies",
				label: "Essence plantée (si pertinant)",
				type: FormItemType.TextArea,
				renderConditions: ["isPlantationPresentACC"],
			},
			{
				name: "imgsPlantation",
				label: "Photo de la plantation (si pertinant)",
				type: FormItemType.InuptFile,
				renderConditions: ["isPlantationPresentACC"],
			},
			{
				name: "isWorksiteSignPresent",
				label: "Le panneau de chantier est-il visible ?",
				type: FormItemType.Switch,
				renderConditions: [],
			},
			{
				name: "imgWorksiteSign",
				label: "Photo du panneau",
				type: FormItemType.InuptFile,
				renderConditions: ["isWorksiteSignPresent"],
			},
			{
				name: "waterCourseOrWetlandPresence",
				label:
					"Traversées de cours d'eau ou présence d'habitats d'espèces protégées",
				type: FormItemType.TextArea,
				renderConditions: [],
			},
			{
				name: "soilState",
				label: "Description de l'état des sols",
				type: FormItemType.TextArea,
				renderConditions: [],
			},
			{
				name: "imgsClearCutting",
				label: "Photos de la coupe",
				type: FormItemType.InuptFile,
				renderConditions: [],
			},
			{
				name: "imgsTreeTrunks",
				label: "Photos des bois coupés (sur la parcelle ou bord de route)",
				type: FormItemType.InuptFile,
				renderConditions: [],
			},
			{
				name: "imgsSoilState",
				label: "Photos permettant de constater l'état des sols",
				type: FormItemType.InuptFile,
				renderConditions: [],
			},
			{
				name: "imgsAccessRoad",
				label: "Photos des chemins d'accès",
				type: FormItemType.InuptFile,
				renderConditions: [],
			},
		],
	],
	[
		{ name: "Zonnages écologiques", className: "flex flex-col gap-4" },
		[
			{
				name: "isNatura2000",
				label: "Coupe au sein d'une zone Natura 2000 ?",
				type: FormItemType.Switch,
				renderConditions: [],
			},
			{
				name: "natura2000Zone",
				type: FormItemType.Customized,
				renderConditions: ["isNatura2000"],
				customizeRender: (
					form: FormType<ClearCuttingForm>,
					key: string | number,
				) => {
					return (
						<p key={key}>
							{`${form.getValues("natura2000Zone.id")} ${form.getValues("natura2000Zone.name")}`}
						</p>
					);
				},
			},
			{
				name: "isOtherEcoZone",
				label: "Coupe au sein d'autres zone écologiques ?",
				type: FormItemType.Switch,
				renderConditions: [],
			},
			{
				name: "ecoZoneType",
				label: "Type de zonages écologiques",
				type: FormItemType.TextArea,
				renderConditions: ["isOtherEcoZone"],
			},
			{
				name: "isNearEcoZone",
				label: "Zonages écologiques à proximité ?",
				type: FormItemType.Switch,
				renderConditions: [],
			},
			{
				name: "nearEcoZoneType",
				label: "Type de zonages écologiques a proximité",
				type: FormItemType.TextArea,
				renderConditions: ["isNearEcoZone"],
			},
			{
				name: "protectedSpeciesOnZone",
				label: "Espèces protégées sur la zone (bibliographie)",
				type: FormItemType.TextArea,
				renderConditions: [],
			},
			{
				name: "protectedSpeciesHabitatOnZone",
				label: "Habitat d'espèces protégées sur la zone (bibliographie)",
				type: FormItemType.TextArea,
				renderConditions: [],
			},
			{
				name: "isDDT",
				label:
					"Demande DDT faite sur la réalisation d'une évaluation d'incidence ?",
				type: FormItemType.Switch,
				renderConditions: [],
			},
			{
				name: "byWho",
				label: "Par qui ?",
				type: FormItemType.TextArea,
				renderConditions: ["isDDT"],
			},
		],
	],
	[
		{ name: "Acteurs engagés", className: "flex flex-col gap-4" },
		[
			{
				name: "companyName",
				label: "Nom de l'entreprise qui réalise les travaux",
				type: FormItemType.InputText,
				renderConditions: [],
			},
			{
				name: "subcontractor",
				label: "Nom du sous-traitant (si pertinant)",
				type: FormItemType.InputText,
				renderConditions: [],
			},
			{
				name: "ownerName",
				label: "Nom du propriétaire",
				type: FormItemType.InputText,
				renderConditions: [],
			},
		],
	],
	[
		{ name: "Régelementations", className: "flex flex-col gap-4" },
		[
			{
				name: "isCCOrCompanyCertified",
				label: "Coupe ou entreprise certifiée PEFC/FSC ?",
				type: FormItemType.ToggleGroup,
				renderConditions: [],
			},
			{
				name: "isMoreThan20ha",
				label: "Propriété de plus de 20 hectares",
				type: FormItemType.ToggleGroup,
				renderConditions: [],
			},
			{
				name: "isSubjectToPSG",
				label: "Parcelle soumise à PSG",
				type: FormItemType.ToggleGroup,
				renderConditions: [],
			},
		],
	],
	[
		{ name: "Autres informations", className: "flex flex-col gap-4" },
		[
			{
				name: "otherInfos",
				label: "Informations complémentaires",
				type: FormItemType.TextArea,
				renderConditions: [],
			},
		],
	],
]);

export function AsideForm() {
	const { value } = useAppSelector(selectDetail);
	const { map } = useMapInstance();
	const user = useAppSelector(selectLoggedUser);
	const [parsedValue, setParsedValue] = useState<ClearCuttingForm>();

	const isDisabled = () => {
		if (!user) return true;

		if (
			user.role === "volunteer" &&
			parsedValue &&
			parsedValue.assignedUser &&
			parsedValue.assignedUser.login !== user.login
		) {
			return true;
		}

		return false;
	};

	const form = useForm<ClearCuttingForm>({
		resolver: zodResolver(clearCuttingFormSchema),
	});

	useEffect(() => {
		if (value) {
			const temp = clearCuttingFormSchema.parse(value);
			setParsedValue(temp);
			form.reset(temp);
		}
	}, [value, form.reset]);

	useEffect(() => {
		if (map && value) {
			map.flyTo(value?.geoCoordinates[0], 10, { duration: 1 });
		}
	}, [map, value]);

	return (
		value && (
			<div className="lg:inset-y-0 lg:z-50 lg:flex lg:w-200 lg:flex-col">
				<div className="relative pt-6 px-4 pb-1 border-b-1">
					<Link to="/clear-cuttings" className="absolute right-2 top-1">
						<X size={30} />
					</Link>
					<h1 className="text-2xl font-extrabold font-[Manrope]">{`${value?.address.city.toLocaleUpperCase()}`}</h1>
					<span className="font-[Roboto]">
						{new Date(value.reportDate).toLocaleDateString()}
					</span>
				</div>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((form) => console.log(form))}
						className="p-1 flex flex-col flex-grow overflow-scroll px-4"
					>
						<div className="flex items-center mt-4 gap-6 text-sm">
							<img
								alt="Vue satellite de le coupe rase"
								// TODO : get image url from imgSatelliteCC
								src={faker.image.url()}
								loading="lazy"
								className="flex-1 aspect-square shadow-[0px_2px_6px_0px_#00000033] rounded-lg max-w-[45%]"
							/>
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-4">
									<DotByStatus status={form.getValues("status")} />
									{CLEAR_CUTTING_STATUS_TRANSLATIONS[form.getValues("status")]}
								</div>
								<div className="flex flex-col gap-2 flex-wrap mb-4">
									{value.abusiveTags.map((tag) => (
										<TagBadge className="max-w-fit" key={tag.id} {...tag} />
									))}
								</div>
								<Separator className="mb-4" />
								<p>
									Superficie de la coupe : {form.getValues("clearCuttingSize")}
								</p>
								<p>
									Zone natura 2000 : {form.getValues("natura2000Zone.name")}
								</p>
							</div>
						</div>
						<Accordion.Root type="multiple" className="grow">
							{[...ccForm].map(([section, sectionContent]) => {
								return (
									<AccordionFullItem
										key={section.name}
										title={section.name}
										{...section}
									>
										{sectionContent.map((item) => {
											let render = true;
											render = item.renderConditions.every(
												(value) => !!form.getValues(value),
											);
											const value = item.transformValue
												? item.transformValue(form.getValues(item.name))
												: form.getValues(item.name)?.toString();

											switch (item.type) {
												case FormItemType.Fixed:
													return render ? (
														<FixedField
															key={item.name}
															className={item.className}
															title={item.label}
															value={value}
														/>
													) : item.fallBack ? (
														item.fallBack(item.name)
													) : null;
												case FormItemType.InputText:
													return render ? (
														<FormInputText
															key={item.name}
															control={form.control}
															name={item.name}
															label={item.label}
															disabled={isDisabled()}
														/>
													) : item.fallBack ? (
														item.fallBack(item.name)
													) : null;
												case FormItemType.InuptFile:
													return render ? (
														<FormInputFile
															key={item.name}
															control={form.control}
															name={item.name}
															label={item.label}
															disabled={isDisabled()}
														/>
													) : item.fallBack ? (
														item.fallBack(item.name)
													) : null;
												case FormItemType.DatePicker:
													return render ? (
														<FormDatePicker
															key={item.name}
															control={form.control}
															name={item.name}
															label={item.label}
															disabled={isDisabled()}
														/>
													) : item.fallBack ? (
														item.fallBack(item.name)
													) : null;
												case FormItemType.Switch:
													return render ? (
														<FormSwitch
															key={item.name}
															control={form.control}
															name={item.name}
															label={item.label}
															disabled={isDisabled()}
														/>
													) : item.fallBack ? (
														item.fallBack(item.name)
													) : null;
												case FormItemType.TextArea:
													return render ? (
														<FormTextArea
															key={item.name}
															control={form.control}
															name={item.name}
															label={item.label}
															disabled={isDisabled()}
														/>
													) : item.fallBack ? (
														item.fallBack(item.name)
													) : null;
												case FormItemType.ToggleGroup:
													return render ? (
														<FormToggleGroup
															key={item.name}
															control={form.control}
															name={item.name}
															label={item.label}
															disabled={isDisabled()}
														/>
													) : item.fallBack ? (
														item.fallBack(item.name)
													) : null;
												case FormItemType.Customized:
													if (item.customizeRender)
														return render
															? item.customizeRender(form, item.name)
															: item.fallBack
																? item.fallBack(item.name)
																: null;
													return null;
												default:
													return null;
											}
										})}
									</AccordionFullItem>
								);
							})}
						</Accordion.Root>
						<Button
							type="submit"
							className="mx-auto text-xl font-bold mt-12 cursor-pointer"
							size="lg"
						>
							Valider
						</Button>
					</form>
				</Form>
			</div>
		)
	);
}

type FixedFieldProps = {
	title?: string;
	value?: string | number;
	className?: string;
};

function FixedField({ title, value, className }: FixedFieldProps) {
	return (
		<div className={cn("flex gap-2", className)}>
			{title && <p className="font-bold">{title} :</p>}
			{value && <p>{value}</p>}
		</div>
	);
}
