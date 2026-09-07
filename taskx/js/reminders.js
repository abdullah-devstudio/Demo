/* =========================================================================
   reminders.js — EmailJS due-date reminders (placeholder config)
   Sends at most one reminder per task per day, tracked in localStorage.
   ========================================================================= */
import { emailjsConfig } from "../firebase/config.js";

const SENT_KEY = "taskx-reminders-sent";
const DUE_SOON_DAYS = 1; // remind when due today or tomorrow

function isConfigured() {
  return (
    typeof window.emailjs !== "undefined" &&
    emailjsConfig.publicKey &&
    !emailjsConfig.publicKey.startsWith("YOUR_")
  );
}

function daysUntil(dueDate) {
  const due = new Date(dueDate + "T00:00:00");
  if (isNaN(due)) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

function readSent() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
  } catch (err) {
    return {};
  }
}

/** Tasks that are pending and due within DUE_SOON_DAYS (or overdue). */
export function findDueSoon(tasks) {
  return tasks.filter((t) => t.status === "pending" && t.dueDate && daysUntil(t.dueDate) <= DUE_SOON_DAYS);
}

/** Fire reminder emails for due-soon tasks. Silently no-ops until EmailJS is configured. */
export async function sendDueReminders(tasks, user) {
  const due = findDueSoon(tasks);
  if (!due.length || !user) return { sent: 0, due: due.length };
  if (!isConfigured()) {
    console.info("[TaskX] EmailJS not configured — skipping", due.length, "reminder(s).");
    return { sent: 0, due: due.length };
  }

  const today = new Date().toISOString().slice(0, 10);
  const sentLog = readSent();
  let sent = 0;

  for (const task of due) {
    if (sentLog[task.id] === today) continue;
    try {
      window.emailjs.init({ publicKey: emailjsConfig.publicKey });
      await window.emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, {
        to_email: user.email,
        to_name: user.displayName || user.email,
        task_title: task.title,
        due_date: task.dueDate,
      });
      sentLog[task.id] = today;
      sent += 1;
    } catch (err) {
      console.error("Reminder email failed:", err);
    }
  }

  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(sentLog));
  } catch (err) {
    console.warn("Could not persist reminder log:", err);
  }
  return { sent, due: due.length };
}
