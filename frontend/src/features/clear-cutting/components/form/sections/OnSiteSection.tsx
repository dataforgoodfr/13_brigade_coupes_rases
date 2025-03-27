import { ClearCuttingForm } from "@/features/clear-cutting/store/clear-cuttings";
import { FormItemType, SectionForm, SectionFormItem } from "../types";

export const onSiteKey : SectionForm = { 
    name: "Terrain", 
    className: "flex flex-col gap-4" 
}

export const onSiteValue :  SectionFormItem<ClearCuttingForm>[] = [
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
        transformValue: (val: unknown) => {
            if (val) return new Date(val as string);
            return undefined
        }
    },
    {
        name: "weather",
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
]