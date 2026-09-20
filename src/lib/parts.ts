export const MEMBER_PARTS = ["WORKER", "STUDENT", "JOBSEEKER"] as const;
export const MISSION_PARTS = ["WORKER", "STUDENT", "JOBSEEKER", "HOLIDAY"] as const;

export const PART_LABEL: Record<string, string> = {
  WORKER: "직장인",
  STUDENT: "대학생",
  JOBSEEKER: "휴학&취준생",
  HOLIDAY: "명절생",
};

export function isMemberPart(v: string): v is (typeof MEMBER_PARTS)[number] {
  return (MEMBER_PARTS as readonly string[]).includes(v);
}

export function isMissionPart(v: string): v is (typeof MISSION_PARTS)[number] {
  return (MISSION_PARTS as readonly string[]).includes(v);
}

export const PART_BUTTON_ORDER = ["WORKER", "STUDENT", "JOBSEEKER", "HOLIDAY"] as const;
export const PART_EMOJI: Record<string, string> = { WORKER: "💼", STUDENT: "🎓", JOBSEEKER: "📚", HOLIDAY: "🌕" };
