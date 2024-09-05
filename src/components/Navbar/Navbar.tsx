"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const Navbar = () => {
  const router = useRouter();

  return (
    <nav className=" bg-[#090909] flex justify-between items-center text-sm py-2 px-8 border-b-[0.5px] border-[#272727] fixed w-full  z-10">
      <ul className="flex items-center gap-8">
        <p
          className="cursor-pointer"
          onClick={() => {
            router.push("/");
          }}
        >
          Logo
        </p>
        <Link href={"/"}>lend</Link>
        <Link href={"/"}>borrow</Link>
        <Link href={"/portfolio"}>portfolio</Link>
      </ul>

      <ul className="flex items-center gap-4">
        <w3m-network-button />
        <w3m-account-button />
      </ul>
    </nav>
  );
};

export default Navbar;
