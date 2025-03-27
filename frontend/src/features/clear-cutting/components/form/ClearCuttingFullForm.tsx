import { Form } from "@/shared/components/form/Form";
import { ClearCutting, ClearCuttingForm, clearCuttingSchema } from "@/features/clear-cutting/store/clear-cuttings";
import AccordionContent from "./AccordionContent";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AccordionHeader from "./AccordionHeader";
import { Accordion } from "radix-ui";
import { Button } from "@/components/ui/button";

export default function ClearCuttingFullForm({clearCutting} : {clearCutting : ClearCutting} ) {
    const form = useForm<ClearCuttingForm>({
        resolver: zodResolver(clearCuttingSchema),
        defaultValues: clearCuttingSchema.parse(clearCutting)
    });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit((form) => console.log(form))}
                className="p-1 flex flex-col flex-grow overflow-scroll px-4"
            >
                <AccordionHeader form={form} abusiveTags={clearCutting.abusiveTags} />
                <Accordion.Root type="multiple" className="grow">
                    <AccordionContent form={form} />
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
    );
}