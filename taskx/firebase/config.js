/* =========================================================================
   Firebase initialisation (v12 CDN, ES modules)
   ========================================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAiW_Koph_gbgcnG0qnXhE9TKxIxzbUluM",
  authDomain: "taskx-abdullahdevstudio.firebaseapp.com",
  projectId: "taskx-abdullahdevstudio",
  storageBucket: "taskx-abdullahdevstudio.firebasestorage.app",
  messagingSenderId: "703009141741",
  appId: "1:703009141741:web:2ac658ef0f65ddd1a86de4",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* EmailJS — placeholder config (replace with real IDs to enable reminders) */
export const emailjsConfig = {
  publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
  serviceId: "YOUR_EMAILJS_SERVICE_ID",
  templateId: "YOUR_EMAILJS_TEMPLATE_ID",
};
