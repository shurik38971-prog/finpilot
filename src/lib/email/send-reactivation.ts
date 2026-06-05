const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "FinPilot <onboarding@resend.dev>";

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export async function sendReactivationEmail(input: {
  to: string;
  campaignId: string;
  userName?: string | null;
}) {
  const base = appBaseUrl();
  const yesUrl = `${base}/reactivation?campaign=${input.campaignId}&answer=yes`;
  const noUrl = `${base}/reactivation?campaign=${input.campaignId}&answer=no`;
  const greeting = input.userName ? `Здравствуйте, ${input.userName}.` : "Здравствуйте.";

  const subject = "Удалось ли выполнить главное действие?";
  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 520px; color: #111;">
      <p>${greeting}</p>
      <p>Неделю назад FinPilot предложил вам действие для улучшения финансовой ситуации.</p>
      <p><strong>Удалось ли выполнить его?</strong></p>
      <p style="margin: 24px 0;">
        <a href="${yesUrl}" style="display:inline-block;margin-right:12px;padding:12px 20px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Да</a>
        <a href="${noUrl}" style="display:inline-block;padding:12px 20px;background:#f4f4f5;color:#111;text-decoration:none;border-radius:8px;font-weight:600;">Нет</a>
      </p>
      <p style="color:#666;font-size:14px;">Ваш ответ поможет сделать рекомендации точнее и полезнее.</p>
    </div>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[FinPilot email:dev]", { to: input.to, subject, yesUrl, noUrl });
    return { ok: true as const, dev: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: input.to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    console.error("Resend error:", details);
    return { ok: false as const, error: details };
  }

  return { ok: true as const, dev: false };
}
