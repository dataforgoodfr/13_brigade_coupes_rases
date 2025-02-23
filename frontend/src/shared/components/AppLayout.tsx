import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface Props {
  children?: ReactNode;
  sideBar?: ReactNode;
}

export function AppLayout({ children, sideBar }: Props) {
  return (
    <>
      <div className="h-screen">
        <Navbar className="h-20 z-10" />
        <div className="flex pt-20 h-full ">
          <main className="flex-grow">{children}</main>
          {sideBar && (
            <div className="hidden right-0 lg:inset-y-0 lg:z-50 lg:flex lg:w-200 lg:flex-col  px-8">
              {sideBar}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
