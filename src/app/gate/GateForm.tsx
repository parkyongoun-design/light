"use client";

import { useFormState, useFormStatus } from "react-dom";
import { enterGateAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60"
      style={{ background: "var(--series-1)" }}
    >
      {pending ? "확인 중..." : "입장하기"}
    </button>
  );
}

export default function GateForm({ next }: { next: string }) {
  const [state, formAction] = useFormState(enterGateAction, undefined);

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          비밀번호
        </label>
        <input
          type="password"
          name="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="••••"
          className="w-full rounded-lg border px-3 py-2 text-center text-lg tracking-widest outline-none"
          style={{ borderColor: "var(--baseline)" }}
        />
      </div>
      {state?.error && (
        <p className="text-sm" style={{ color: "var(--status-critical)" }}>
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
