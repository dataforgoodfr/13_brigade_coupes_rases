import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserTableRow } from "@/features/admin/components/users-list/UserTableRow";
import { useGetAdminQuery } from "@/features/admin/store/api";
import { useMemo } from "react";

export const UsersList: React.FC = () => {
  const { data } = useGetAdminQuery();

  const usersList = useMemo(() => {
    return data?.users || [];
  }, [data]);

  return (
    <Table className="w-full table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/6" />
          <TableHead className="w-1/3">Name</TableHead>
          <TableHead className="w-1/3">Email</TableHead>
          <TableHead className="w-1/6">Role</TableHead>
          <TableHead className="w-1/6">Region</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {usersList.map((user) => {
          // TODO: replace key with a unique identifier
          return <UserTableRow key={user.login} user={user} />;
        })}
      </TableBody>
    </Table>
  );
};
