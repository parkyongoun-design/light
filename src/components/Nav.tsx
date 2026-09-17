import Link from "next/link";
import { logoutAction } from "@/app/logout-action";

type Props = {
  name: string;
  role: string;
  active: "zone" | "gacha" | "admin" | "admin-org" | "admin-missions" | "admin-gacha";
};

export default function Nav({ name, role, active }: Props) {
  const memberLinks = [
    { href: "/zone", key: "zone", label: "우리 구역" },
    { href: "/gacha", key: "gacha", label: "가챠" },
  ];
  const adminLinks = [
    { href: "/admin", key: "admin", label: "현황판" },
    { href: "/admin/org", key: "admin-org", label: "조직 관리" },
    { href: "/admin/missions", key: "admin-missions", label: "미션 관리" },
    { href: "/admin/gacha", key: "admin-gacha", label: "가챠 관리" },
    { href: "/gacha", key: "gacha", label: "가챠 미리보기" },
  ];
  const links = role === "ADMIN" ? adminLinks : memberLinks;

  return (
    <header className="sticky top-0 z-10 border-b" style={{ borderColor: "var(--gridline)", background: "var(--surface-1)" }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition"
              style={
                active === l.key
                  ? { background: "var(--series-1)", color: "#fff" }
                  : { color: "var(--text-secondary)" }
              }
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {name}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="text-xs underline" style={{ color: "var(--text-muted)" }}>
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
