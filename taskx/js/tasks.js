/* =========================================================================
   tasks.js — Firestore CRUD + realtime subscription for the `tasks` collection
   Document shape: { userId, title, dueDate, status, createdAt }
   ========================================================================= */
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import { db } from "../firebase/config.js";

const tasksRef = collection(db, "tasks");

/**
 * Realtime listener for the signed-in user's tasks.
 * Sorting happens client-side so no composite Firestore index is required.
 */
export function subscribeToTasks(userId, onData, onError) {
  const q = query(tasksRef, where("userId", "==", userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || "",
          userEmail: data.userEmail || "",
          userName: data.userName || "",
          dueDate: data.dueDate || "",
          status: data.status === "completed" ? "completed" : "pending",
          createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : 0,
        };
      });
      onData(tasks);
    },
    (error) => {
      console.error("Task subscription failed:", error);
      if (onError) onError(error);
    }
  );
}

/** Sort helper: "due" = soonest due date first, "created" = newest first. */
export function sortTasks(tasks, mode) {
  const list = tasks.slice();
  if (mode === "due") {
    return list.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addTask(userId, title, dueDate, userEmail = "", userName = "") {
  return addDoc(tasksRef, {
    userId,
    userEmail,
    userName,
    title: title.trim(),
    dueDate: dueDate || "",
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function updateTask(taskId, changes) {
  return updateDoc(doc(db, "tasks", taskId), changes);
}

export async function setTaskStatus(taskId, status) {
  return updateTask(taskId, { status });
}

export async function deleteTask(taskId) {
  return deleteDoc(doc(db, "tasks", taskId));
}
