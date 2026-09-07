/* =========================================================================
   app.js — page controller. Wires auth.js / tasks.js / ui.js to the DOM.
   Runs on both index.html (splash + auth) and dashboard.html.
   ========================================================================= */
import { login, signup, logout, watchSession, validateCredentials, authErrorMessage, sendVerification, googleSignIn, setDisplayName } from "./auth.js";
import { subscribeToTasks, sortTasks, addTask, updateTask, setTaskStatus, deleteTask } from "./tasks.js";
import { sendDueReminders } from "./reminders.js";
import { ensureUserDoc, syncUserStats, userDocExists } from "./users.js";
import {
  $, initTheme, initLang, t, toast,
  renderTasks, renderSummary, updateFilterButtons,
} from "./ui.js";

const page = document.body.dataset.page; // "auth" | "dashboard"

/** Shared dashboard state (declared before any code that reads it). */
const state = {
  tasks: [],
  filter: "all",
  sort: "created",
  editingId: null,
  loading: true,
  ready: false,
  user: null,
};

/** Set by the auth page so language changes can refresh its copy. */
let updateAuthCopyRef = null;

function refreshLangDependentUI() {
  if (page === "auth") {
    if (updateAuthCopyRef) updateAuthCopyRef();
  } else if (page === "dashboard" && state.ready) {
    updateFilterButtons(state.filter);
    renderSummary(state.tasks);
    draw();
  }
}

initTheme();
initLang(() => refreshLangDependentUI());

/* ========================================================================
   AUTH PAGE
   ======================================================================== */
if (page === "auth") {
  let isSignup = false;
  let busy = false;
  let awaitingUsername = false;

  const authView = $("view-auth");

  // intro.html handles the branded intro before this page loads.
  const splashDone = Promise.resolve();

  const unwatch = watchSession(async (user) => {
    await splashDone;
    if (awaitingUsername) return;
    if (user && user.emailVerified) {
      window.location.replace("./dashboard.html");
      return;
    }
    if (user && !user.emailVerified) {
      await logout();
    }
    authView.classList.remove("hidden");
    authView.classList.add("flex");
  });
  window.addEventListener("beforeunload", () => unwatch());

  function updateAuthCopy() {
    $("auth-title").textContent = isSignup ? t("signupTitle") : t("loginTitle");
    $("auth-sub").textContent = isSignup ? t("signupSub") : t("loginSub");
    $("auth-submit-label").textContent = isSignup ? t("signup") : t("login");
    $("auth-switch-text").textContent = isSignup ? t("haveAccount") : t("noAccount");
    $("auth-toggle").textContent = isSignup ? t("login") : t("signup");
    const gLabel = $("google-label");
    if (gLabel) gLabel.textContent = isSignup ? "Sign up with Google" : "Continue with Google";
  }
  updateAuthCopyRef = updateAuthCopy;
  updateAuthCopy();

  function setMode(value) {
    isSignup = value;
    $("field-username").classList.toggle("hidden", !isSignup);
    $("password").autocomplete = isSignup ? "new-password" : "current-password";
    updateAuthCopy();
  }

  $("auth-toggle").addEventListener("click", () => {
    setMode(!isSignup);
    setError("");
  });

  /* --------------------- Password visibility toggle --------------------- */
  const pwToggle = $("password-toggle");
  if (pwToggle) {
    pwToggle.addEventListener("click", () => {
      const input = $("password");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      $("icon-eye").classList.toggle("hidden", show);
      $("icon-eye-off").classList.toggle("hidden", !show);
      pwToggle.setAttribute("aria-pressed", String(show));
      pwToggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      input.focus();
    });
  }

  function setError(message) {
    const el = $("auth-error");
    el.textContent = message;
    el.classList.toggle("hidden", !message);
  }

  /* ----------------------- Email verification notice --------------------- */
  let pending = null; // { email, password }

  function setVerifyNotice(message) {
    const box = $("verify-box");
    $("verify-msg").textContent = message || "";
    box.classList.toggle("hidden", !message);
  }

  $("resend-btn").addEventListener("click", async () => {
    if (!pending) return;
    const btn = $("resend-btn");
    btn.disabled = true;
    try {
      const user = await login(pending.email, pending.password);
      if (user.emailVerified) {
        setVerifyNotice("");
        window.location.replace("./dashboard.html");
        return;
      }
      await sendVerification(user);
      await logout();
      setVerifyNotice("Verification email sent again to " + pending.email + ". Check your inbox or spam folder.");
    } catch (error) {
      console.error("Resend failed:", error);
      setError(authErrorMessage(error));
    } finally {
      btn.disabled = false;
    }
  });

  function setBusy(value) {
    busy = value;
    $("auth-submit").disabled = value;
    $("auth-submit").classList.toggle("opacity-60", value);
    $("auth-spinner").classList.toggle("hidden", !value);
  }

  /* -------------------------- Google sign-in --------------------------- */
  function setGoogleBusy(value) {
    const btn = $("google-btn");
    btn.disabled = value;
    btn.classList.toggle("opacity-60", value);
    $("google-spinner").classList.toggle("hidden", !value);
    $("google-icon").classList.toggle("hidden", value);
  }

  function askUsername(email) {
    return new Promise((resolve) => {
      const modal = $("gname-modal");
      const input = $("gname-input");
      const error = $("gname-error");
      $("gname-email").textContent = email || "";
      input.value = (email || "").split("@")[0] || "";
      error.classList.add("hidden");
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      input.focus();

      const close = (value) => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        $("gname-save").removeEventListener("click", onSave);
        $("gname-cancel").removeEventListener("click", onCancel);
        input.removeEventListener("keydown", onKey);
        resolve(value);
      };
      const onSave = () => {
        const name = input.value.trim();
        if (name.length < 3) {
          error.textContent = "Username must be at least 3 characters.";
          error.classList.remove("hidden");
          return;
        }
        close(name);
      };
      const onCancel = () => close(null);
      const onKey = (e) => { if (e.key === "Enter") onSave(); };

      $("gname-save").addEventListener("click", onSave);
      $("gname-cancel").addEventListener("click", onCancel);
      input.addEventListener("keydown", onKey);
    });
  }

  async function startGoogleSignIn() {
    if (busy) return;
    setError("");
    setVerifyNotice("");
    setGoogleBusy(true);
    awaitingUsername = true;
    try {
      const user = await googleSignIn();
      const exists = await userDocExists(user.uid);
      if (!exists) {
        const name = await askUsername(user.email);
        if (!name) {
          await logout();
          awaitingUsername = false;
          setGoogleBusy(false);
          return;
        }
        await setDisplayName(user, name);
        await ensureUserDoc(user, name);
      } else {
        await ensureUserDoc(user);
      }
      window.location.replace("./dashboard.html");
    } catch (error) {
      console.error("Google sign-in failed:", error);
      awaitingUsername = false;
      setGoogleBusy(false);
      if (error && error.code === "auth/unauthorized-domain") {
        setError(
          'Add "' + window.location.hostname +
          '" to Firebase → Authentication → Settings → Authorized domains to use Google sign-in here.'
        );
      } else {
        setError(authErrorMessage(error));
      }
    }
  }

  $("google-btn").addEventListener("click", startGoogleSignIn);

  $("auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;

    const email = $("email").value;
    const password = $("password").value;
    const username = $("username").value;

    const invalid = validateCredentials({ email, password, username, isSignup });
    if (invalid) {
      setError(invalid);
      return;
    }

    setError("");
    setVerifyNotice("");
    setBusy(true);
    try {
      if (isSignup) {
        const user = await signup(email, password, username);
        await ensureUserDoc(user, username.trim());
        await sendVerification(user);
        await logout();
        pending = { email: email.trim(), password };
        setBusy(false);
        setVerifyNotice(
          "We sent a verification link to " + email.trim() +
          ". Verify your email, then log in to complete your signup."
        );
        return;
      }
      const user = await login(email, password);
      if (!user.emailVerified) {
        await logout();
        pending = { email: email.trim(), password };
        setBusy(false);
        setError("Email not verified. Please verify your email before logging in.");
        setVerifyNotice("Didn't get the email? Resend the verification link to " + email.trim() + ".");
        return;
      }
      await ensureUserDoc(user);
      window.location.replace("./dashboard.html");
    } catch (error) {
      console.error("Auth failed:", error);
      const notFound =
        !isSignup &&
        error &&
        ["auth/user-not-found", "auth/wrong-password", "auth/invalid-credential"].includes(error.code);
      if (notFound) {
        setMode(true);
        $("username").value = "";
        setError("User not found. Create an account below — with email and password, or with Google.");
      } else {
        setError(authErrorMessage(error));
      }
      setBusy(false);
    }
  });
}

/* ========================================================================
   DASHBOARD PAGE
   ======================================================================== */
function visibleTasks() {
  const filtered = state.tasks.filter((task) =>
    state.filter === "all" ? true : task.status === state.filter
  );
  return sortTasks(filtered, state.sort);
}

function draw() {
  renderTasks({
    tasks: state.tasks,
    visible: visibleTasks(),
    filter: state.filter,
    loading: state.loading,
    editingId: state.editingId,
  });
}

if (page === "dashboard") {
  state.ready = true;
  let unsubscribeTasks = null;
  let remindersChecked = false;

  updateFilterButtons(state.filter);
  draw();

  watchSession((user) => {
    if (!user) {
      if (unsubscribeTasks) unsubscribeTasks();
      window.location.replace("./index.html");
      return;
    }
    if (!user.emailVerified) {
      if (unsubscribeTasks) unsubscribeTasks();
      logout().finally(() => window.location.replace("./index.html"));
      return;
    }
    state.user = user;
    $("user-email").textContent = user.displayName || user.email || "";
    ensureUserDoc(user);

    if (unsubscribeTasks) unsubscribeTasks();
    state.loading = true;
    draw();

    unsubscribeTasks = subscribeToTasks(
      user.uid,
      (tasks) => {
        state.tasks = tasks;
        state.loading = false;
        renderSummary(tasks);
        draw();
        syncUserStats(user, tasks);
        if (!remindersChecked) {
          remindersChecked = true;
          sendDueReminders(tasks, user).catch((err) => console.error(err));
        }
      },
      (error) => {
        state.loading = false;
        draw();
        toast("Could not load tasks: " + (error.message || error.code), "error");
      }
    );
  });

  /* ------------------------------ Add task ------------------------------ */
  $("task-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = $("task-input");
    const title = input.value.trim();
    if (!title) {
      input.focus();
      return;
    }
    if (!state.user) return;

    const button = $("add-btn");
    button.disabled = true;
    try {
      await addTask(
        state.user.uid,
        title,
        $("task-date").value,
        state.user.email || "",
        state.user.displayName || (state.user.email ? state.user.email.split("@")[0] : "")
      );
      input.value = "";
      $("task-date").value = "";
    } catch (error) {
      console.error("Add task failed:", error);
      toast("Could not add the task. " + (error.message || ""), "error");
    } finally {
      button.disabled = false;
    }
  });

  /* --------------------------- Task list actions ------------------------ */
  $("task-list").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = button.dataset.id;
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;

    const action = button.dataset.action;
    try {
      if (action === "toggle") {
        await setTaskStatus(id, task.status === "completed" ? "pending" : "completed");
      } else if (action === "delete") {
        await deleteTask(id);
        toast("Task deleted", "success");
      } else if (action === "edit") {
        state.editingId = id;
        draw();
      } else if (action === "cancel") {
        state.editingId = null;
        draw();
      } else if (action === "save") {
        const titleInput = document.querySelector('[data-edit-title="' + id + '"]');
        const dateInput = document.querySelector('[data-edit-date="' + id + '"]');
        const title = titleInput.value.trim();
        if (!title) {
          titleInput.focus();
          return;
        }
        state.editingId = null;
        await updateTask(id, { title, dueDate: dateInput.value || "" });
        toast("Task updated", "success");
      }
    } catch (error) {
      console.error("Task action failed:", error);
      toast("Action failed. " + (error.message || ""), "error");
      draw();
    }
  });

  /* ------------------------------ Filters ------------------------------- */
  $("filters").addEventListener("click", (event) => {
    const button = event.target.closest(".filter-btn");
    if (!button) return;
    state.filter = button.dataset.filter;
    updateFilterButtons(state.filter);
    draw();
  });

  $("sort-select").addEventListener("change", (event) => {
    state.sort = event.target.value;
    draw();
  });

  /* ------------------------------- Logout ------------------------------- */
  $("logout-btn").addEventListener("click", async () => {
    try {
      if (unsubscribeTasks) unsubscribeTasks();
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      toast("Could not log out. Please try again.", "error");
    }
  });
}
