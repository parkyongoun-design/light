const RARITY_LABEL: Record<string, string> = { COMMON: "일반", RARE: "희귀", EPIC: "에픽", LEGENDARY: "전설" };

const RARITY_GRADIENT: Record<string, [string, string]> = {
  COMMON: ["#9CA3AF", "#6B7280"],
  RARE: ["#60A5FA", "#2563EB"],
  EPIC: ["#C084FC", "#7C3AED"],
  LEGENDARY: ["#FCD34D", "#F59E0B"],
};

export type ShareCardData = {
  emoji: string;
  name: string;
  rarity: string;
  description?: string;
  memberName: string;
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, centerX: number, startY: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const totalHeight = lines.length * lineHeight;
  let y = startY - totalHeight / 2 + lineHeight / 2;
  for (const l of lines) {
    ctx.fillText(l, centerX, y);
    y += lineHeight;
  }
  return startY + totalHeight / 2;
}

/** Renders the pull result as a shareable PNG card and triggers a browser download. */
export function downloadGachaResultCard(data: ShareCardData) {
  const W = 900;
  const H = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const [c1, c2] = RARITY_GRADIENT[data.rarity] ?? RARITY_GRADIENT.COMMON;
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, c1);
  bgGrad.addColorStop(1, c2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const pad = 48;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, 40);
  ctx.fill();

  ctx.textAlign = "center";

  ctx.fillStyle = "#52514e";
  ctx.font = "600 32px sans-serif";
  ctx.fillText("🎰 미션 가챠", W / 2, pad + 100);

  ctx.font = "700 34px sans-serif";
  ctx.fillStyle = c2;
  ctx.fillText(RARITY_LABEL[data.rarity] ?? data.rarity, W / 2, pad + 170);

  ctx.font = "220px sans-serif";
  ctx.fillText(data.emoji, W / 2, pad + 430);

  ctx.fillStyle = "#0b0b0b";
  ctx.font = "700 58px sans-serif";
  let nextY = wrapText(ctx, data.name, W / 2, pad + 540, W - pad * 2 - 100, 68);

  if (data.description) {
    ctx.fillStyle = "#52514e";
    ctx.font = "400 28px sans-serif";
    wrapText(ctx, data.description, W / 2, nextY + 50, W - pad * 2 - 140, 38);
  }

  const dateStr = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
  ctx.fillStyle = "#898781";
  ctx.font = "500 28px sans-serif";
  ctx.fillText(`${data.memberName} · ${dateStr}`, W / 2, H - pad - 60);

  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = `가챠결과_${data.name}.png`;
  link.click();
}
