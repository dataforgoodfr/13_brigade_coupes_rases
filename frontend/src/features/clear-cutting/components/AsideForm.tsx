import { Button } from "@/components/ui/button";
import { useMapInstance } from "@/features/clear-cutting/components/map/Map.context";
import { selectDetail } from "@/features/clear-cutting/store/clear-cuttings-slice";
import { cn } from "@/lib/utils";
import { AccordionFullItem } from "@/shared/components/accordion/FullAccordionItem";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Accordion, Switch } from "radix-ui";
import { ReactElement, use, useEffect, useId } from "react";
import { FieldValues, Path, useForm, UseFormReturn } from "react-hook-form";
import { ClearCuttingForm, clearCuttingFormSchema } from "../store/clear-cuttings";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormProps, FormType } from "@/shared/components/form/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/Select";
import { CLEAR_CUTTING_STATUS_TRANSLATIONS, CLEAR_CUTTING_STATUSES } from "../store/status";
import { DotByStatus } from "./DotByStatus";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/user/components/Auth.context";

import { FormDatePicker } from "@/shared/components/form/FormDatePicker";
import { FormTextArea } from "@/shared/components/form/FormTextArea";
import { FormSwitch } from "@/shared/components/form/FormSwitch";
import { FormToggleGroup } from "@/shared/components/form/FormToggleGroup";

type AsideFormProps = {
	clearCuttingId: string;
};

enum FormItemType {
	Switch, 
	DatePicker,
	TextArea,
	Input,
	Fixed,
	Image,
	ToggleGroup,
	Customized
}


type SectionFormItem<T> = {
	name: Path<T>,
	transformValue?: (val : unknown) => string | undefined
	label: string,
	type: FormItemType,
	renderConditions: Path<T>[],
	fallBack?: (key: string | undefined) => React.ReactNode,
	className?: string,
	customizeRender?: (form : FormType<ClearCuttingForm>, key : string | number) => React.ReactNode
}

const ccForm : Map<string, SectionFormItem<ClearCuttingForm>[]> = 
	new Map([
		["Informations générales", 
			[
				{
					name: "reportDate",
					transformValue: (val: unknown) => new Date(val as string).toLocaleDateString(),
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
				{
					name: "imgSatelliteCC",
					label: "",
					type: FormItemType.Image,
					renderConditions: [],
				},
			],
		],
		["Terrain", 
			[
				{
					name: "assignedUser.login",
					label: "Bénévole en charge du terrain :",
					type: FormItemType.Fixed,
					renderConditions: ["assignedUser"],
					fallBack: (key: string | number) => ( <div key={key} className="flex gap-2">
						<p>Bénévole en charge du terrain : </p>
						<p>Aucun bénévole n'est assigné</p>
					</ div> )
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
					type: FormItemType.Image,
					renderConditions: ["isPlantationPresentACC"],
				},{
					name: "isWorksiteSignPresent",
					label: "Le panneau de chantier est-il visible ?",
					type: FormItemType.Switch,
					renderConditions: [],
				},{
					name: "imgWorksiteSign",
					label: "Photo du panneau",
					type: FormItemType.Image,
					renderConditions: ["isWorksiteSignPresent"],
				},{
					name: "waterCourseOrWetlandPresence",
					label: "Traversées de cours d'eau ou présence d'habitats d'espèces protégées",
					type: FormItemType.TextArea,
					renderConditions: [],
				},{
					name: "soilState",
					label: "Description de l'état des sols",
					type: FormItemType.TextArea,
					renderConditions: [],
				},{
					name: "imgsClearCutting",
					label: "Photos de la coupe",
					type: FormItemType.Image,
					renderConditions: [],
				},{
					name: "imgsTreeTrunks",
					label: "Photos des bois coupés (sur la parcelle ou bord de route)",
					type: FormItemType.Image,
					renderConditions: [],
				},{
					name: "imgsSoilState",
					label: "Photos permettant de constater l'état des sols",
					type: FormItemType.Image,
					renderConditions: [],
				},{
					name: "imgsAccessRoad",
					label: "Photos des chemins d'accès",
					type: FormItemType.Image,
					renderConditions: [],
				},
			]
		],
		[ "Zonnages écologiques",
			[
				{
					name: "isNatura2000",
					label: "Coupe au sein d'une zone Natura 2000 ?",
					type: FormItemType.Switch,
					renderConditions: [],
				},
				{
					name: "natura2000Zone",
					label: "",
					type: FormItemType.Customized,
					renderConditions: ["isNatura2000"],
					customizeRender : (form : FormType<ClearCuttingForm>, key: string | number) => {
						return (<p key={key}>{form.getValues("natura2000Zone.id") + " " + form.getValues("natura2000Zone.name")}</p>)
					}
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
					renderConditions: [],
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
					label: "Demande DDT faite sur la réalisation d'une évaluation d'incidence ?",
					type: FormItemType.Switch,
					renderConditions: [],
				},
				{
					name: "byWho",
					label: "Par qui ?",
					type: FormItemType.TextArea,
					renderConditions: ["isDDT"],
				},
			]	
		],
		["Acteurs engagés",
			[
				{
					name: "companyName",
					label: "Nom de l'entreprise qui réalise les travaux",
					type: FormItemType.TextArea,
					renderConditions: [],
				},
				{
					name: "subcontractor",
					label: "Nom du sous-traitant (si pertinant)",
					type: FormItemType.TextArea,
					renderConditions: [],
				},
				{
					name: "ownerName",
					label: "Nom du propriétaire",
					type: FormItemType.TextArea,
					renderConditions: [],
				},
			]
		],
		["Régelementations",
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
			]
		],
		["Autres informations",
			[
				{
					name: "otherInfos",
					label: "Informations complémentaires",
					type: FormItemType.TextArea,
					renderConditions: [],
				},
			]
		],
	]);

export function AsideForm({ clearCuttingId }: AsideFormProps) {
	const { value } = useGetClearCutting(clearCuttingId);
	const { map } = useMapInstance();
	let parsedValue;

	if (value) {
		parsedValue = clearCuttingFormSchema.parse(value);
	}

	const form = useForm<ClearCuttingForm>({
		resolver: zodResolver(clearCuttingFormSchema),
		defaultValues: parsedValue,
	});

	useEffect(() => {
		if (value) {
			parsedValue = clearCuttingFormSchema.parse(value);
			form.reset(parsedValue);
		}
	}, [value]);

	useEffect(() => {
		if (map && value) {
			map.flyTo(value?.geoCoordinates[0], 10, { duration: 1 });
		}
	}, [map, value]);

	return value && (
		<div className="lg:inset-y-0 lg:z-50 lg:flex lg:w-200 lg:flex-col">
			<div className="flex items-center pt-8 pb-6 px-6 border-b-2">
				<Link to="/clear-cuttings">
					<X size={36} color="var(--color-primary)"/>
				</Link>
				<h1 className="ml-4 text-(--color-primary) text-3xl font-extrabold">{`${value?.address.city.toLocaleUpperCase()} - ${value?.cutYear}`}</h1>
			</div>
			<div className="p-1 flex flex-col flex-grow overflow-auto px-4">
				<Form {...form}>
					<form onSubmit={(e) => e.preventDefault()}>
						<Accordion.Root type="multiple" className="grow">
							{[...ccForm].map(([sectionName, sectionContent]) => {
								return (
									<AccordionFullItem key={sectionName} title={sectionName}>
										{sectionContent.map((item) => {

											let render = true;
											render = item.renderConditions.every((value) => form.getValues(value) ? true : false);
											const value = item.transformValue ? 
												item.transformValue(form.getValues(item.name)) :
												form.getValues(item.name)?.toString()

											switch(item.type) {
												case FormItemType.Fixed :
													return render ? <FixedField 
																		key={item.name}
																		className={item.className} 
																		title={item.label} 
																		value={value}
																	/> :
																	item.fallBack ? item.fallBack(item.name) : null;
												
												case FormItemType.DatePicker :
													return render ? <FormDatePicker 
																		key={item.name}
																		control={form.control} 
																		name={item.name} 
																		label={item.label}
																	/> :
																	item.fallBack ? item.fallBack(item.name) : null;
												case FormItemType.Switch :
													return render ? <FormSwitch
																		key={item.name}
																		control={form.control}
																		name={item.name}
																		label={item.label}
																	/> :
																	item.fallBack ? item.fallBack(item.name) : null;
												case FormItemType.TextArea :
													return render ? <FormTextArea 
																		key={item.name}
																		control={form.control}
																		name={item.name}
																		label={item.label}
																	/> :
																	item.fallBack ? item.fallBack(item.name) : null;
												case FormItemType.ToggleGroup:
													return render ? <FormToggleGroup 
																		key={item.name}
																		control={form.control}
																		name={item.name}
																		label={item.label}
																	/> :
																	item.fallBack ? item.fallBack(item.name) : null;
												case FormItemType.Customized:
													if (item.customizeRender)
														return render ? item.customizeRender(form, item.name) : 
															item.fallBack ? item.fallBack(item.name) : null
													return null;
												default :
													return null;
											}
										})}
									</AccordionFullItem>
								)
							})}
						</Accordion.Root>
					</form>
				</Form>
			</div>
			<Button className="mx-auto text-xl font-bold mt-12 cursor-pointer" size="lg">
				Valider
			</Button>
		</div>
	);
}

type FixedFieldProps = {
	title: string,
	value?: string | number;
	className?: string;
}

function FixedField({title, value, className} : FixedFieldProps) {

	return (<div className={cn("flex gap-2", className)}>
		<p className="font-bold">{title} :</p>
		{value && <p>{value}</p>}
	</div>);
}

type SectionFormProps = {
	form : FormType<ClearCuttingForm>
}

function FirstFormSection({ form } : SectionFormProps) {
	const { isAdmin } = useAuth();

	return (
	<>
		<AccordionFullItem title="Informations générales">
				<div className="grid grid-cols-2">
					<FormField
						control={form.control}
						name="status"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Select
										defaultValue={field.value}
										onValueChange={field.onChange}
										disabled={!isAdmin}
									>
										<SelectTrigger>
											<SelectValue placeholder="Sélectionner un status" />
										</SelectTrigger>

										<SelectContent>
											{CLEAR_CUTTING_STATUSES.map((status) => {
												return <SelectItem key={status} value={status}>
													<DotByStatus status={status} />
													{CLEAR_CUTTING_STATUS_TRANSLATIONS[status]}
												</SelectItem>
											})}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FixedField className="col-start-1 col-end-2" title="Date de signalement" value={new Date(form.getValues("reportDate")).toLocaleDateString()} />
					<FixedField title="Commune" value={form.getValues("address.city")} />
					<FixedField title="Département" value={form.getValues("address.postalCode")} />
					<FixedField title="Latitude" value={form.getValues("center.0")} />
					<FixedField title="Longitude" value={form.getValues("center.1")} />
					<FixedField title="Parcelle cadastrale" value={form.getValues("cadastralParcel.id")} />
					<FixedField title="Date de la coupe" value={form.getValues("cutYear")} />
					<FixedField title="Taille de la coupe" value={form.getValues("clearCuttingSize")} />
					<FixedField title="Pourcentage de pente" value={form.getValues("clearCuttingSlope")} />
					{form.getValues("imgSatelliteCC") && <img src={form.getValues("imgSatelliteCC")}/>}
				</div>
		</ AccordionFullItem> 
	</>);

}

function SecondFormSection({ form } : SectionFormProps) {

	return (
		<AccordionFullItem title="Terrain">
			<div className="flex gap-2">
				<p>Bénévole en charge du terrain : </p>
				{form.getValues("assignedUser") ? <p>{form.getValues("assignedUser.login")}</p> 
				: <p>Auncun bénévole assigné</p>}
			</div>
			<FormDatePicker control={form.control} name="onSiteDate" label="Date du terrain" />
			<FormTextArea control={form.control} name="wheater" label="Météo"  />
			<FormTextArea control={form.control} name="standTypeAndSilviculturalSystemBCC" label="Type de peuplement avant la coupe"  />
			<FormSwitch control={form.control} name="isPlantationPresentACC" label="Présence plantation après la coupe ?" />
			<FormTextArea control={form.control} name="newTreeSpicies" label= "Essence plantée (si pertinant)" />
			{/* TODO : images of the plantation imgsPlantation "Photo de la plantation (si pertinant)" */}
			<FormSwitch control={form.control} name="isWorksiteSignPresent" label="Le panneau de chantier est-il visible ?" />
			{/* TODO : image of the worksite sign "Photo du panneau" */}
			<FormTextArea control={form.control} name="waterCourseOrWetlandPresence" label= "Traversées de cours d'eau ou présence d'habitats d'espèces protégées" />
			<FormTextArea control={form.control} name="soilState" label= "Description de l'état des sols" />
			{/* TODO : images of the clear cutting imgsClearCutting "Photos de la coupe" */}
			{/* TODO : images of the tree trunks imgsTreeTrunks "Photos des bois coupés (sur la parcelle ou bord de route)" */}
			{/* TODO : images of the tree trunks imgsSoilState "Photos permettant de constater l'état des sols" */}
			{/* TODO : images of the access roads imgsAccessRoad "Photos des chemins d'accès" */}
		</AccordionFullItem>
	);
}

function ThirdFormSection({form} : SectionFormProps) {
	return (
		<AccordionFullItem title="Zonages écologiques">
			<FormSwitch control={form.control} name="isNatura2000" label="Coupe au sein d'une zone Natura 2000 ?"/>
			{form.getValues("isNatura2000") && <p>{form.getValues("natura2000Zone.id") + " " + form.getValues("natura2000Zone.name")}</p>}
			<FormSwitch control={form.control} name="isOtherEcoZone" label="Coupe au sein d'autres zone écologiques ?"/>
			<FormTextArea control={form.control} name="ecoZoneType" label= "Type de zonages écologiques" />
			<FormSwitch control={form.control} name="isNearEcoZone" label="Zonages écologiques à proximité ?"/>
			{form.getValues("isNearEcoZone") && <FormTextArea control={form.control} name="nearEcoZoneType" label= "Type de zonages écologiques a proximité" /> }
			<FormTextArea control={form.control} name="protectedSpeciesOnZone" label= "Espèces protégées sur la zone (bibliographie)" />
			<FormTextArea control={form.control} name="protectedSpeciesHabitatOnZone" label= "Habitat d'espèces protégées sur la zone (bibliographie)" />
			<FormSwitch control={form.control} name="isDDT" label="Demande DDT faite sur la réalisation d'une évaluation d'incidence ?"/>
			{form.getValues("isDDT") && <FormTextArea control={form.control} name="byWho" label= "Par qui ?" />}
		</AccordionFullItem>
	);
}

