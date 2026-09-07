/* =========================================================================
   auth.js — signup / login / logout / session helpers
   ========================================================================= */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { auth } from "../firebase/config.js";

/** Friendly messages for Firebase auth error codes. */
const ERRORS = {
  "auth/invalid-email": "That email address is not valid.",
  "auth/missing-password": "Please enter your password.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/user-not-found": "User not found.",
  "auth/wrong-password": "User not found.",
  "auth/invalid-credential": "User not found.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/operation-not-allowed": "Email/password sign-in is not enabled for this project.",
  "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  "auth/cancelled-popup-request": "Google sign-in was cancelled.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in popup. Allow popups and try again.",
  "auth/account-exists-with-different-credential":
    "An account with this email already exists. Log in with your email and password.",
  "auth/unauthorized-domain": "This domain is not authorized for Google sign-in in Firebase.",
};

/** Send a verification email to the given user.
 *  Firebase only accepts continue URLs whose domain is listed under
 *  Authentication → Settings → Authorized domains. "localhost" is authorized by
 *  default, so we use it when running locally and fall back to Firebase's own
 *  default action URL on any other (possibly unauthorized) origin. */
export async function sendVerification(user) {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const url = isLocal
    ? window.location.origin + "/taskx/index.html"
    : "http://localhost:8080/taskx/index.html";
  try {
    await sendEmailVerification(user, { url });
  } catch (error) {
    // Unauthorized continue URI → send without a custom continue link.
    if (error && error.code === "auth/unauthorized-continue-uri") {
      await sendEmailVerification(user);
      return;
    }
    throw error;
  }
}

export function authErrorMessage(error) {
  if (!error) return "Something went wrong. Please try again.";
  return ERRORS[error.code] || error.message || "Something went wrong.";
}

/** Basic client-side form validation. Returns an error string or null. */
export function validateCredentials({ email, password, username, isSignup }) {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
  if (!emailOk) return "Please enter a valid email address.";
  if (!password || password.length < 6) return "Password must be at least 6 characters.";
  if (isSignup && (!username || username.trim().length < 3)) {
    return "Username must be at least 3 characters.";
  }
  return null;
}

export async function signup(email, password, username) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (username && username.trim()) {
    try {
      await updateProfile(cred.user, { displayName: username.trim() });
    } catch (err) {
      console.warn("Could not set display name:", err);
    }
  }
  return cred.user;
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

/** Sign in (or sign up) with a Google account. Google emails are already verified. */
export async function googleSignIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

/** Store the chosen username on the auth profile. */
export async function setDisplayName(user, name) {
  if (!user || !name || !name.trim()) return;
  try {
    await updateProfile(user, { displayName: name.trim() });
  } catch (error) {
    console.warn("Could not set display name:", error);
  }
}

/** Subscribe to session changes. Returns the unsubscribe function. */
export function watchSession(callback) {
  return onAuthStateChanged(auth, callback);
}
