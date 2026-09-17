import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const current = await getCurrentMember();
  if (current) redirect(current.role === "ADMIN" ? "/admin" : "/zone");

  const teams = await prisma.team.findMany({
    orderBy: { order: "asc" },
    include: {
      zones: {
        orderBy: { order: "asc" },
        include: {
          members: {
            where: { active: true },
            orderBy: [{ isZoneLeader: "desc" }, { name: "asc" }],
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  const admins = await prisma.member.findMany({
    where: { active: true, role: "ADMIN" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const teamOptions = teams.map((t) => ({
    id: t.id,
    name: t.name,
    zones: t.zones.map((z) => ({
      id: z.id,
      name: z.name,
      members: z.members,
    })),
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-2 text-4xl">🎰</div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          미션 가챠
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          미션을 완료하고 뽑기권을 모아보세요
        </p>
      </div>
      <LoginForm teams={teamOptions} admins={admins} />
    </main>
  );
}
