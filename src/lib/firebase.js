// src/lib/firebase.js
// Firebase v9+ modular SDK

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

// ── Config ────────────────────────────────────────────
// These values come from your Firebase project settings.
// All are public-safe (they're in your frontend bundle).
// Real security comes from Firestore Security Rules.
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ── Init (singleton) ──────────────────────────────────
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Collections ───────────────────────────────────────
export const threadsCol      = () => collection(db, "threads");
export const contribsCol     = (threadId) => collection(db, "threads", threadId, "contributions");
export const summariesCol    = () => collection(db, "summaries");

// ── Thread helpers ────────────────────────────────────

export async function fbCreateThread(thread) {
  await setDoc(doc(db, "threads", thread.id), {
    ...thread,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function fbGetThreads() {
  const snap = await getDocs(query(threadsCol(), orderBy("timestamp", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fbUpdateThread(threadId, updates) {
  await updateDoc(doc(db, "threads", threadId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function fbDeleteThread(threadId) {
  // Delete all contributions subcollection first
  const contribs = await getDocs(contribsCol(threadId));
  const deletes  = contribs.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletes);
  // Delete the thread doc
  await deleteDoc(doc(db, "threads", threadId));
}

// ── Contribution helpers ──────────────────────────────

export async function fbAddContribution(threadId, contrib) {
  await setDoc(doc(db, "threads", threadId, "contributions", contrib.id), {
    ...contrib,
    createdAt: serverTimestamp(),
  });
}

export async function fbGetContributions(threadId) {
  const snap = await getDocs(
    query(contribsCol(threadId), orderBy("timestamp", "asc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Summary helpers ───────────────────────────────────

export async function fbSetSummary(threadId, summary) {
  await setDoc(doc(db, "summaries", threadId), {
    summary,
    updatedAt: serverTimestamp(),
  });
}

export async function fbGetSummary(threadId) {
  const snap = await getDoc(doc(db, "summaries", threadId));
  return snap.exists() ? snap.data().summary : null;
}

// ── Real-time listener for a thread's contributions ───
// Returns unsubscribe function
export function fbWatchContributions(threadId, callback) {
  return onSnapshot(
    query(contribsCol(threadId), orderBy("timestamp", "asc")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}