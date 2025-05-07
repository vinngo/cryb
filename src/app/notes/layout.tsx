import type React from "react";
import Navbar from "@/components/navbar";

export default function NotesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </>
  );
}
