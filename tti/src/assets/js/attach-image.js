/* ===========================================================================
   Attach a starting image — for the picture generator and the film camera
   ---------------------------------------------------------------------------
   Both generators already accept a starting image: the drawing box sends one
   as `sketch`, the camera as `frame`, and in each case the back end wants a
   stored URL rather than a blob of base64 in the request body. So the button
   here does the whole errand — read the file, shrink it to something sane,
   hand it to /api/upload, and keep the URL until the generator asks for it.

   Markup contract, per generator:

     <div class="attach" data-attach="draw">
       <label class="btn btn--ghost file-btn">
         … <input type="file" accept="image/*" data-attach-input>
       </label>
       <div class="attach-held" data-attach-held hidden>
         <img data-attach-thumb alt="">
         <button type="button" data-attach-drop>Remove</button>
       </div>
       <p class="attach-msg" data-attach-msg role="status"></p>
     </div>

   The generators read it back with window.EGAttachedImage("draw" | "film").
   Nothing here assumes the other module exists, and if the upload endpoint is
   missing the button says so plainly and the generator carries on from words
   alone.
   ======================================================================== */
(() => {
  "use strict";

  const held = Object.create(null);            // key → { url, name }
  window.EGAttachedImage = (key) => (held[key] ? held[key].url : null);

  const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const MAX_EDGE = 1280;                       // longest side we bother sending
  const MAX_BYTES = 8 * 1024 * 1024;

  /* Shrink in the browser so a 12-megapixel phone photograph does not travel
     the wire whole. Returns { data (base64, no prefix), type, name }. */
  function prepare(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("the file could not be read"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("that does not look like an image"));
        img.onload = () => {
          const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
          if (scale === 1 && file.size <= 2 * 1024 * 1024) {
            const s = String(reader.result);
            resolve({ data: s.slice(s.indexOf(",") + 1), type: file.type || "image/png", name: file.name, preview: s });
            return;
          }
          const cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(img.width * scale));
          cv.height = Math.max(1, Math.round(img.height * scale));
          const ctx = cv.getContext("2d");
          if (!ctx) { reject(new Error("this browser cannot resize the image")); return; }
          ctx.drawImage(img, 0, 0, cv.width, cv.height);
          const url = cv.toDataURL("image/png");
          resolve({ data: url.slice(url.indexOf(",") + 1), type: "image/png", name: file.name, preview: url });
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  function wire(root) {
    const key = root.getAttribute("data-attach");
    const input = root.querySelector("[data-attach-input]");
    const holder = root.querySelector("[data-attach-held]");
    const thumb = root.querySelector("[data-attach-thumb]");
    const drop = root.querySelector("[data-attach-drop]");
    const msg = root.querySelector("[data-attach-msg]");
    const label = root.querySelector(".file-btn");
    if (!key || !input) return;

    const say = (text, bad) => {
      if (!msg) return;
      msg.textContent = text || "";
      msg.classList.toggle("is-error", Boolean(bad));
    };

    const clear = () => {
      delete held[key];
      input.value = "";
      if (holder) holder.hidden = true;
      if (thumb) thumb.src = BLANK;
      if (label) label.classList.remove("has-file");
      say("");
    };

    if (drop) drop.addEventListener("click", () => {
      clear();
      say("Starting image removed \u2014 the next one is made from the words alone.");
    });

    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) { say("That is not an image file.", true); input.value = ""; return; }
      if (file.size > MAX_BYTES) { say("That image is over 8\u00a0MB \u2014 try a smaller one.", true); input.value = ""; return; }

      say("Preparing \u2014 shrinking and uploading\u2026");
      input.disabled = true;
      const job = window.EGWork ? window.EGWork.start("a starting image is being uploaded") : null;
      try {
        const prepped = await prepare(file);
        if (thumb) thumb.src = prepped.preview;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: window.EGAuthHeaders ? window.EGAuthHeaders() : { "content-type": "application/json" },
          body: JSON.stringify({
            name: prepped.name || "reference.png",
            type: prepped.type,
            data: prepped.data,
            asker: key === "film" ? "film-reference" : "draw-reference"
          })
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.url) throw new Error(out.error || "the upload was refused");

        held[key] = { url: out.url, name: out.name || prepped.name };
        if (holder) holder.hidden = false;
        if (label) label.classList.add("has-file");
        say(key === "film"
          ? "Attached. The clip will open on this image and move from it."
          : "Attached. The picture will be built from this image and your words together.");
      } catch (err) {
        clear();
        say("That image could not be attached: " + ((err && err.message) || "unknown error"), true);
      } finally {
        if (window.EGWork) window.EGWork.end(job);
        input.disabled = false;
      }
    });
  }

  document.querySelectorAll(".attach[data-attach]").forEach(wire);
})();
