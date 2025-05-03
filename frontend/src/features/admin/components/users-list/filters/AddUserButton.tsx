import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import InsertUserModal from "@/features/admin/components/users-list/InsertUserModal";
import { useDialog } from "@/shared/hooks/dialog";

const AddUserButton = () => {
	const { isOpen, onOpenChange, onClose } = useDialog();

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button className="bg-primary">Ajouter</Button>
			</DialogTrigger>

			<InsertUserModal onClose={onClose} />
		</Dialog>
	);
};

export default AddUserButton;
