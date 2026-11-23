import type { Lesson } from "./queries";
export async function saveOfflineLesson(lesson: Lesson) {
  if (lesson.status !== "published" || !lesson.reviewed_on)
    throw new Error("Only published lessons with a recorded review date can be saved offline.");
  if (!("indexedDB" in window)) throw new Error("Offline storage is unavailable in this browser.");
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("dentprep-offline-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("lessons", { keyPath: "id" });
    request.onerror = () => reject(new Error("Offline storage could not be opened."));
    request.onblocked = () => reject(new Error("Close other offline reading tabs and try again."));
    request.onsuccess = () => resolve(request.result);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("lessons", "readwrite");
      tx.objectStore("lessons").put({
        id: lesson.id,
        title: lesson.title,
        notes_md: lesson.notes_md,
        reviewed_on: lesson.reviewed_on,
        saved_at: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(new Error("Couldn't save this lesson. Device storage may be full."));
      tx.onabort = () => reject(new Error("Offline save was interrupted."));
    });
  } finally {
    db.close();
  }
}
