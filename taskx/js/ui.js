/* =========================================================================
   ui.js — theme, language, toasts and DOM rendering (no Firebase in here)
   ========================================================================= */

export const $ = (id) => document.getElementById(id);

/* -------------------------------- Theme --------------------------------- */
const THEME_KEY = "taskx-theme";

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

export function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  const moon = $("icon-moon");
  const sun = $("icon-sun");
  if (moon) moon.classList.toggle("hidden", !isDark);
  if (sun) sun.classList.toggle("hidden", isDark);
  document.querySelectorAll("img[data-logo]").forEach((img) => {
    img.src = isDark ? "./assets/logo.png" : "./assets/logo-light.png";
  });
  localStorage.setItem(THEME_KEY, theme);
}

export function initTheme() {
  applyTheme(getTheme());
  const btn = $("theme-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      applyTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
    });
  }
}

/* ------------------------------- Language -------------------------------- */
const LANG_KEY = "taskx-lang";

const STRINGS = {
  en: {
    tagline: "A part of X Series by Abdullah Dev Studio",
    loginTitle: "Welcome back",
    loginSub: "Log in to continue to your tasks.",
    signupTitle: "Create your account",
    signupSub: "Start organising your day with TaskX.",
    username: "Username",
    email: "Email",
    password: "Password",
    login: "Log in",
    signup: "Sign up",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    myTasks: "My Tasks",
    logout: "Log out",
    placeholder: "What needs to be done?",
    add: "Add",
    all: "All",
    pending: "Pending",
    completed: "Completed",
    sortCreated: "Newest first",
    sortDue: "Due date",
    noTasks: "No tasks yet",
    emptyTitle: "Nothing here yet",
    emptySub: "Add your first task above and it will show up right here.",
    caughtUpTitle: "All caught up",
    caughtUpSub: "Every task is done. Enjoy the clear list.",
    noCompletedTitle: "No completed tasks",
    noCompletedSub: "Complete a task to see it listed here.",
    noDue: "No due date",
    footer: "TaskX — A part of X Series by Abdullah Dev Studio",
  },
  ur: {
    tagline: "عبداللہ ڈیو اسٹوڈیو کی ایکس سیریز کا حصہ",
    loginTitle: "خوش آمدید",
    loginSub: "اپنے کاموں تک رسائی کے لیے لاگ ان کریں۔",
    signupTitle: "اکاؤنٹ بنائیں",
    signupSub: "ٹاسک ایکس کے ساتھ اپنا دن منظم کریں۔",
    username: "صارف نام",
    email: "ای میل",
    password: "پاس ورڈ",
    login: "لاگ ان",
    signup: "سائن اپ",
    noAccount: "اکاؤنٹ نہیں ہے؟",
    haveAccount: "پہلے سے اکاؤنٹ ہے؟",
    myTasks: "میرے کام",
    logout: "لاگ آؤٹ",
    placeholder: "کیا کرنا ہے؟",
    add: "شامل کریں",
    all: "تمام",
    pending: "زیر التوا",
    completed: "مکمل",
    sortCreated: "نئے پہلے",
    sortDue: "آخری تاریخ",
    noTasks: "ابھی کوئی کام نہیں",
    emptyTitle: "یہاں کچھ نہیں",
    emptySub: "اوپر اپنا پہلا کام شامل کریں، وہ یہاں نظر آئے گا۔",
    caughtUpTitle: "سب مکمل",
    caughtUpSub: "تمام کام مکمل ہو چکے ہیں۔",
    noCompletedTitle: "کوئی مکمل کام نہیں",
    noCompletedSub: "کوئی کام مکمل کریں تاکہ یہاں نظر آئے۔",
    noDue: "کوئی تاریخ نہیں",
    footer: "ٹاسک ایکس — عبداللہ ڈیو اسٹوڈیو کی ایکس سیریز کا حصہ",
  },
};

let currentLang = localStorage.getItem(LANG_KEY) === "ur" ? "ur" : "en";

export const t = (key) => (STRINGS[currentLang] && STRINGS[currentLang][key]) || STRINGS.en[key] || key;
export const getLang = () => currentLang;

export function applyLang(lang, onChange) {
  currentLang = lang === "ur" ? "ur" : "en";
  localStorage.setItem(LANG_KEY, currentLang);
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ur" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  const label = $("lang-label");
  if (label) label.textContent = currentLang.toUpperCase();
  if (typeof onChange === "function") onChange(currentLang);
}

export function initLang(onChange) {
  applyLang(currentLang, onChange);
  const btn = $("lang-toggle");
  if (btn) {
    btn.addEventListener("click", () => applyLang(currentLang === "en" ? "ur" : "en", onChange));
  }
}

/* -------------------------------- Toasts --------------------------------- */
export function toast(message, type = "info") {
  const host = $("toast-host");
  if (!host) return;
  const tone =
    type === "error"
      ? "border-red-500/50 text-red-500"
      : type === "success"
      ? "border-accent/50 text-accent"
      : "border-line text-txt";
  const el = document.createElement("div");
  el.className =
    "rise pointer-events-auto rounded-xl border bg-surface px-4 py-2.5 text-sm shadow-lg " + tone;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s ease";
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

/* ------------------------------ Formatting ------------------------------- */
export function formatDate(value) {
  if (!value) return t("noDue");
  const d = new Date(value + "T00:00:00");
  if (isNaN(d)) return t("noDue");
  return d.toLocaleDateString(currentLang === "ur" ? "ur-PK" : undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

/* -------------------------------- Icons ---------------------------------- */
export const ICONS = {
  edit: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  undo: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>',
  save: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  cancel: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
};

/* ---------------------------- Task rendering ----------------------------- */
function taskMarkup(task, editingId) {
  const isEditing = task.id === editingId;
  const done = task.status === "completed";

  if (isEditing) {
    return (
      '<li class="rise rounded-2xl border border-accent/60 bg-surface p-4 shadow-sm">' +
      '<div class="flex flex-col gap-3 sm:flex-row">' +
      '<input data-edit-title="' + task.id + '" value="' + escapeHtml(task.title) + '" ' +
      'class="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition focus:border-accent" />' +
      '<input data-edit-date="' + task.id + '" type="date" value="' + escapeHtml(task.dueDate) + '" ' +
      'class="rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-muted outline-none transition focus:border-accent sm:w-44" />' +
      '<div class="flex items-center gap-1">' +
      '<button data-action="save" data-id="' + task.id + '" class="rounded-lg border border-accent bg-accent/10 p-2.5 text-accent transition hover:bg-accent/20">' + ICONS.save + "</button>" +
      '<button data-action="cancel" data-id="' + task.id + '" class="rounded-lg border border-line p-2.5 text-muted transition hover:text-txt">' + ICONS.cancel + "</button>" +
      "</div></div></li>"
    );
  }

  return (
    '<li class="rise group flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:border-accent/50">' +
    '<div class="min-w-0 flex-1">' +
    '<p class="font-display text-[0.95rem] font-medium leading-snug ' + (done ? "text-muted line-through" : "") + '">' +
    escapeHtml(task.title) +
    "</p>" +
    '<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">' +
    '<span class="inline-flex items-center gap-1.5">' + ICONS.calendar + formatDate(task.dueDate) + "</span>" +
    '<span class="inline-flex items-center rounded-full border px-2 py-0.5 font-medium ' +
    (done ? "border-accent/40 bg-accent/10 text-accent" : "border-line text-muted") + '">' +
    (done ? t("completed") : t("pending")) +
    "</span></div></div>" +
    '<div class="flex shrink-0 items-center gap-1">' +
    '<button data-action="toggle" data-id="' + task.id + '" class="rounded-lg border border-line p-2 text-muted transition hover:border-accent hover:text-txt">' + (done ? ICONS.undo : ICONS.check) + "</button>" +
    '<button data-action="edit" data-id="' + task.id + '" class="rounded-lg border border-line p-2 text-muted transition hover:border-accent hover:text-txt">' + ICONS.edit + "</button>" +
    '<button data-action="delete" data-id="' + task.id + '" class="rounded-lg border border-line p-2 text-muted transition hover:border-red-500/60 hover:text-red-500">' + ICONS.trash + "</button>" +
    "</div></li>"
  );
}

/** Render the whole dashboard list area from state. */
export function renderTasks({ tasks, visible, filter, loading, editingId }) {
  const list = $("task-list");
  const empty = $("empty-state");
  const loader = $("list-loading");

  loader.classList.toggle("hidden", !loading);
  if (loading) {
    list.innerHTML = "";
    empty.classList.add("hidden");
    return;
  }

  list.innerHTML = visible.map((task) => taskMarkup(task, editingId)).join("");

  const isEmpty = visible.length === 0;
  empty.classList.toggle("hidden", !isEmpty);
  if (isEmpty) {
    if (tasks.length === 0) {
      $("empty-title").textContent = t("emptyTitle");
      $("empty-sub").textContent = t("emptySub");
    } else if (filter === "pending") {
      $("empty-title").textContent = t("caughtUpTitle");
      $("empty-sub").textContent = t("caughtUpSub");
    } else {
      $("empty-title").textContent = t("noCompletedTitle");
      $("empty-sub").textContent = t("noCompletedSub");
    }
  }
}

export function renderSummary(tasks) {
  const el = $("summary");
  if (!el) return;
  if (!tasks.length) {
    el.textContent = t("noTasks");
    return;
  }
  const done = tasks.filter((x) => x.status === "completed").length;
  el.textContent =
    tasks.length + " • " + (tasks.length - done) + " " + t("pending") + " • " + done + " " + t("completed");
}

export function updateFilterButtons(filter) {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    const active = btn.dataset.filter === filter;
    btn.className =
      "filter-btn rounded-lg border px-3.5 py-1.5 text-sm font-medium transition " +
      (active
        ? "border-accent bg-accent/10 text-accent"
        : "border-line text-muted hover:border-accent hover:text-txt");
  });
}
