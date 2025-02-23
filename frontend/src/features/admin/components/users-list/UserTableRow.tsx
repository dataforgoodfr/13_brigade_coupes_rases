import { TableCell, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/features/user/components/UserAvatar";
import { User } from "@/features/user/store/user";

type UserTableRowProps = {
  user: User;
};

export const UserTableRow: React.FC<UserTableRowProps> = ({ user }) => {
  return (
    <TableRow>
      <TableCell>
        <UserAvatar url={user.avatarUrl} fallbackName={user.login} />
      </TableCell>
      <TableCell>{user.login}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.role}</TableCell>
      <TableCell>{user.region}</TableCell>
    </TableRow>
  );
};
