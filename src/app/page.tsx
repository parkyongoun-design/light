import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";

export default async function Home() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  if (member.role === "ADMIN") redirect("/admin");
  redirect("/zone");
}
