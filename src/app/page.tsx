"use client";

import Navbar from "@/components/Navbar/Navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main>
      <Navbar />
      <h1>Hello world</h1>
      <button
        onClick={() => {
          router.push("/hello");
        }}
      >
        Click
      </button>
    </main>
  );
}
