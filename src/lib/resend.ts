import { Resend } from "resend";

const FROM = process.env.REMINDER_EMAIL_FROM || "Outer Sunset <josh@relationaltechproject.org>";
const TO = process.env.REMINDER_EMAIL_TO || "joshuanesbit@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export type ReminderForEmail = {
  id: string;
  text: string;
  due_date: string; // YYYY-MM-DD
  person_id: string | null;
  person_name: string | null;
  note_id: string | null;
};

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function formatPrettyDate(iso: string): string {
  // Treat date as Pacific calendar date — use noon to avoid tz edge cases
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function todayPretty(): string {
  return new Date().toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function renderText(reminders: ReminderForEmail[]): string {
  const today = todayPretty();
  const lines = [
    `Today's follow-ups — ${today}`,
    "",
  ];
  for (const r of reminders) {
    const overdue = r.due_date < new Date().toISOString().slice(0, 10);
    const who = r.person_name ? ` (${r.person_name})` : "";
    const when = overdue ? ` [from ${formatPrettyDate(r.due_date)}]` : "";
    lines.push(`• ${r.text}${who}${when}`);
    if (r.person_id) {
      lines.push(`  ${APP_URL}/person/${r.person_id}`);
    }
  }
  lines.push("");
  lines.push("— your neighborhood gift bank");
  return lines.join("\n");
}

function renderHtml(reminders: ReminderForEmail[]): string {
  const today = todayPretty();
  const todayIso = new Date().toISOString().slice(0, 10);

  const items = reminders
    .map((r) => {
      const overdue = r.due_date < todayIso;
      const who = r.person_name
        ? r.person_id
          ? `<a href="${APP_URL}/person/${r.person_id}" style="color:#7A9B6D;text-decoration:none;font-weight:500;">${escapeHtml(r.person_name)}</a>`
          : `<span style="color:#7A9B6D;font-weight:500;">${escapeHtml(r.person_name)}</span>`
        : "";
      const meta = [
        who,
        overdue
          ? `<span style="color:#C4694A;font-size:13px;">from ${escapeHtml(formatPrettyDate(r.due_date))}</span>`
          : "",
      ]
        .filter(Boolean)
        .join(" &middot; ");

      return `
        <div style="padding:16px 0;border-bottom:1px solid rgba(59,42,30,0.08);">
          <div style="font-size:17px;color:#3B2A1E;line-height:1.45;margin-bottom:6px;">${escapeHtml(r.text)}</div>
          ${meta ? `<div style="font-size:14px;color:#7B6A5C;">${meta}</div>` : ""}
        </div>
      `;
    })
    .join("");

  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Today's follow-ups</title></head>
<body style="margin:0;padding:0;background:#F8F1E4;font-family:Georgia,'Times New Roman',serif;color:#3B2A1E;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <p style="font-size:13px;color:#7B6A5C;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 8px 0;">${escapeHtml(today)}</p>
    <h1 style="font-size:28px;font-weight:600;margin:0 0 8px 0;color:#3B2A1E;">Today's follow-ups</h1>
    <p style="font-size:15px;color:#7B6A5C;margin:0 0 24px 0;font-style:italic;">A quiet reminder before your next walk.</p>
    <div>${items}</div>
    <p style="font-size:13px;color:#7B6A5C;margin-top:32px;">
      <a href="${APP_URL}" style="color:#C4694A;text-decoration:none;">Open the notebook</a>
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendReminderDigest(reminders: ReminderForEmail[]) {
  if (reminders.length === 0) return { skipped: true as const };
  const resend = getResend();
  if (!resend) throw new Error("RESEND_API_KEY not configured");

  return resend.emails.send({
    from: FROM,
    to: TO,
    subject: `Today's follow-ups (${reminders.length})`,
    html: renderHtml(reminders),
    text: renderText(reminders),
  });
}
