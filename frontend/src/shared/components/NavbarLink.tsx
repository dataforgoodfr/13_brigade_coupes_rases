import { Link } from "@tanstack/react-router";
import { PropsWithChildren } from "react";
import React from "react";

type NavbarLinkProps = PropsWithChildren<{
  to: string;
}>;

export const NavbarLink: React.FC<NavbarLinkProps> = ({ to, children }) => {
  return (
    <Link
      to={to}
      activeProps={{
        className: "border-green-500  text-gray-900",
      }}
      inactiveProps={{
        className:
          "border-transparent  text-gray-500 hover:border-gray-300 hover:text-gray-700",
      }}
      className="inline-flex items-center border-b-2 h-full px-1 pt-1 text-sm font-medium "
    >
      {children}
    </Link>
  );
};
