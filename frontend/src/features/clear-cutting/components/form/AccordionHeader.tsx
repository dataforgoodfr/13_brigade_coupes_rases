import { DotByStatus } from "@/features/clear-cutting/components/DotByStatus";
import { CLEAR_CUTTING_STATUS_TRANSLATIONS } from "@/features/clear-cutting/store/status";
import { TagBadge } from "../TagBadge";
import { FormType } from "@/shared/components/form/Form";
import { ClearCuttingForm } from "@/features/clear-cutting/store/clear-cuttings";
import { Separator } from "@/components/ui/separator";
import { Tag } from "@/shared/store/referential/referential";

export default function AccordionHeader({form, abusiveTags} : {form: FormType<ClearCuttingForm>, abusiveTags: Tag[]}) {
    return (
        <div className="flex items-center mt-4 gap-6 text-sm">
            <img
                alt="Vue satellite de le coupe rase"
                src={form.getValues("imgSatelliteCC")}
                loading="lazy"
                className="flex-1 aspect-square shadow-[0px_2px_6px_0px_#00000033] rounded-lg max-w-[45%]"
            />
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                    <DotByStatus status={form.getValues("status")} />
                    {CLEAR_CUTTING_STATUS_TRANSLATIONS[form.getValues("status")]}
                </div>
                <div className="flex flex-col gap-2 flex-wrap mb-4">
                    {abusiveTags.map((tag) => (
                        <TagBadge className="max-w-fit" key={tag.id} {...tag} />
                    ))}
                </div>
                <Separator className="mb-4" />
                <p>
                    Superficie de la coupe : {`${form.getValues("clearCuttingSize")} ha`}
                </p>
                <p>
                    Zone natura 2000 : {form.getValues("natura2000Zone.name")}
                </p>
            </div>
        </div>
    )
}