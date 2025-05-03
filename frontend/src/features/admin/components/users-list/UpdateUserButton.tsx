import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import InsertUserModal from "@/features/admin/components/users-list/InsertUserModal";
import type { UserWithDepartments } from "@/features/admin/components/users-list/UsersList";
import { IconButton } from "@/shared/components/button/Button";
import { useDialog } from "@/shared/hooks/dialog";
import { EditIcon } from "lucide-react";

type UpdateUserButtonProps = {
	user: UserWithDepartments;
};

const UpdateUserButton: React.FC<UpdateUserButtonProps> = ({ user }) => {
	const { isOpen, onOpenChange, onClose } = useDialog();

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<IconButton
					variant="white"
					icon={<EditIcon />}
					title="Éditer un utilisateur"
				/>
			</DialogTrigger>

			<InsertUserModal onClose={onClose} user={user} />
		</Dialog>
	);
};

export default UpdateUserButton;
