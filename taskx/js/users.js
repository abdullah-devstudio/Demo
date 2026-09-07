/* =========================================================================
   users.js — `users` collection in Firestore
   Document id = auth uid.
   Shape: { id, name, email, totalTasks, completedTasks, pendingTasks, createdAt }
   ========================================================================= */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import { db } from "../firebase/config.js";

const userRef = (uid) => doc(db, "users", uid);

/** True when a profile document already exists for this uid. */
export async function userDocExists(uid) {
  try {
    const snap = await getDoc(userRef(uid));
    return snap.exists();
  } catch (error) {
    console.warn("Could not read user profile:", error);
    return false;
  }
}

/** Create the profile document if it does not exist yet (safe to call often). */
export async function ensureUserDoc(user, name) {
  if (!user) return;
  const ref = userRef(user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const patch = {};
      const displayName = name || user.displayName || "";
      if (displayName && snap.data().name !== displayName) patch.name = displayName;
      if (user.email && snap.data().email !== user.email) patch.email = user.email;
      if (Object.keys(patch).length) await updateDoc(ref, patch);
      return;
    }
    await setDoc(ref, {
      id: user.uid,
      name: name || user.displayName || (user.email || "").split("@")[0],
      email: user.email || "",
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("Could not write user profile:", error);
  }
}

/** Keep the task counters in sync with the live task list. */
export async function syncUserStats(user, tasks) {
  if (!user) return;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  try {
    await setDoc(
      userRef(user.uid),
      {
        id: user.uid,
        name: user.displayName || (user.email || "").split("@")[0],
        email: user.email || "",
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks: tasks.length - completedTasks,
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Could not update user stats:", error);
  }
}
