import { Input } from "@/components/ui/input";
import {
  selectName,
  selectRole,
  setName,
  setRole,
} from "@/features/admin/store/users-filters.slice";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/store";
import { useState } from "react";
import { debounce } from "lodash-es";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role, USER_ROLES } from "@/features/user/store/user";
import { RegionFilter } from "@/features/admin/components/users-list/filters/RegionFilter";

export const Filters: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchedName = useAppSelector(selectName);
  const role = useAppSelector(selectRole);

  const [search, setSearch] = useState(searchedName);

  const handleSearch = debounce((name) => {
    dispatch(setName(name));
  }, 500);

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;

    setSearch(name);
    handleSearch(name);
  };

  return (
    <div className="flex items-center justify-between w-full gap-4">
      <Input
        type="search"
        placeholder="Rechercher un utilisateur..."
        value={search}
        onChange={onSearch}
      />

      <Select
        value={role}
        onValueChange={(value) => dispatch(setRole(value as Role))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner un rôle" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>

          {USER_ROLES.map((role) => {
            return (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <RegionFilter />
    </div>
  );
};
