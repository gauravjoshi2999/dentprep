"use strict";
const request = indexedDB.open("dentprep-offline-v1", 1);
request.onupgradeneeded = () => request.result.createObjectStore("lessons", { keyPath: "id" });
request.onerror = () => { document.querySelector("#status").textContent = "Offline storage is unavailable in this browser."; };
request.onsuccess = () => renderSaved(request.result);
function renderSaved(db) {
  const query = db.transaction("lessons").objectStore("lessons").getAll();
  query.onerror = () => { document.querySelector("#status").textContent = "Saved notes could not be read."; };
  query.onsuccess = () => {
    const list = document.querySelector("#lessons");
    list.replaceChildren();
    document.querySelector("#status").textContent = query.result.length ? `${query.result.length} lessons saved on this device` : "No offline lessons saved. Open a reviewed lesson online and choose Save for offline reading.";
    for (const lesson of query.result) {
      const row = document.createElement("section"); row.className = "saved";
      const open = document.createElement("button"); open.className = "open"; open.type = "button"; open.textContent = lesson.title;
      const date = document.createElement("p"); date.textContent = `Review date: ${lesson.reviewed_on} · Saved: ${new Date(lesson.saved_at).toLocaleDateString("en-IN")}`; open.append(date);
      open.addEventListener("click", () => {
        document.querySelector("#title").textContent = lesson.title;
        document.querySelector("#metadata").textContent = `Review date: ${lesson.reviewed_on} · Saved on this device: ${new Date(lesson.saved_at).toLocaleDateString("en-IN")}`;
        // Treat downloaded notes as text, never executable HTML.
        document.querySelector("#notes").textContent = lesson.notes_md;
        document.querySelector("#reader").hidden = false; list.hidden = true;
        document.querySelector("#back").focus();
      });
      const remove = document.createElement("button"); remove.className = "remove"; remove.type = "button"; remove.textContent = "Remove"; remove.setAttribute("aria-label", `Remove offline copy: ${lesson.title}`);
      remove.addEventListener("click", () => { const tx = db.transaction("lessons", "readwrite"); tx.objectStore("lessons").delete(lesson.id); tx.oncomplete = () => renderSaved(db); });
      row.append(open, remove); list.append(row);
    }
  };
}
document.querySelector("#back").addEventListener("click", () => { document.querySelector("#reader").hidden = true; document.querySelector("#lessons").hidden = false; });
