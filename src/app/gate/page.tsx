import GateForm from "./GateForm";

export default function GatePage({ searchParams }: { searchParams: { next?: string } }) {
  const next = searchParams.next && searchParams.next.startsWith("/") ? searchParams.next : "/";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-2 text-4xl">🔒</div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          미션 가챠
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          입장 비밀번호를 입력해주세요
        </p>
      </div>
      <GateForm next={next} />
    </main>
  );
}
