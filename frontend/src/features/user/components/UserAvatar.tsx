import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UsersListProps = {
  url: string | undefined;
  fallbackName: string;
};

export const UserAvatar: React.FC<UsersListProps> = ({ url, fallbackName }) => {
  return (
    <Avatar>
      <AvatarImage alt="Avatar" src={url} />
      <AvatarFallback>{fallbackName}</AvatarFallback>
    </Avatar>
  );
};
