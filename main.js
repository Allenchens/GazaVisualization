// main.js
// Virtualized names list UI + curated photo strip.
// Key features:
// - Detects row height automatically for accurate virtualization
// - Smooth continuous auto-scroll downward for names (stops at bottom)
// - Zoom-driven virtualization: zoom level maps to list position
// - Left photo strip populated from a static PHOTO_ITEMS list (no user uploads)
// - Photo strip gently scrolls downward when zooming out of the chart
//
// To add/change photos, just edit the PHOTO_ITEMS array below and make sure the
// image files exist at the specified paths in your project (e.g. /images/...).

// ---------------------------------------
// Curated photo configuration
// ---------------------------------------
const PHOTO_ITEMS = [
    // Example entries — replace these with your actual files / captions / credits
    // Make sure these paths match your folder structure (e.g. "images/..." or "assets/...").
    {
        src: "images/gaza_001.webp",
        caption: "Palestinians flee from the city of Khan Younis in southern Gaza after an Israeli ground and air offensive",
        credit: "AP Photo"
    },
    {
        src: "images/download.webp",
        caption: "Palestinians inspect the rubble of destroyed buildings following Israeli airstrikes on the town of Khan Younis.",
        credit: "AP Photo"
    },
    {
        src: "images/download (1).webp",
        caption: "Israeli Lt. Col. Ido Ben Anat stands in an apartment during a ground operation in the Gaza Strip",
        credit: "AP Photo"
    },
        {
        src: "images/download (2).webp",
        caption: "Palestinians flee from northern Gaza as Israeli tanks block the Salah al-Din road in the central Gaza Strip",
        credit: "AP Photo"
    },
        {
        src: "images/download (3).webp",
        caption: "Palestinians look at the destruction after an Israeli strike on residential buildings and a mosque in Rafah",
        credit: "AP Photo"
    },
               {
        src: "images/download (4).webp",
        caption: "Palestinian women wash clothes with seawater at the beach in Deir al Balah, Gaza Strip,",
        credit: "AP Photo"
    },        {
        src: "images/download (5).webp",
        caption: "Palestinians line up for a meal in Rafah, Gaza Strip.",
        credit: "AP Photo"
    },        {
        src: "images/download (6).webp",
        caption: "Palestinians line up for a meal in Rafah, Gaza Strip.",
        credit: "AP Photo"
    },        {
        src: "images/download (7).webp",
        caption: "Humanitarian aid is airdropped to Palestinians over Gaza City",
        credit: "AP Photo"
    },        {
        src: "images/download (8).webp",
        caption: "Palestinians flee to the southern Gaza Strip on Salah al-Din Street in Bureij, Gaza Strip",
        credit: "AP Photo"
    },        {
        src: "images/download (9).webp",
        caption: "A tent camp housing Palestinians displaced by the Israeli offensive in Rafah, Gaza Strip,",
        credit: "AP Photo"
    },        {
        src: "images/download (10).webp",
        caption: "Israeli female soldiers pose for a photo on a position on the Gaza Strip border, in southern Israel",
        credit: "AP Photo"
    },
    {
        src: "images/download (11).webp",
        caption: "",
        credit: "AP Photo"
    },
    {
        src: "images/download (12).webp",
        caption: "Members of the Al-Rabaya family break their fast during the Muslim holy month of Ramadan outside their destroyed home by the Israeli airstrikes in Rafah, Gaza Strip",
        credit: "AP Photo"
    },
        {
        src: "images/download (13).webp",
        caption: "A child looks through a broken window in Rafah, Gaza Strip",
        credit: "AP Photo"
    },
        {
        src: "images/download (14).webp",
        caption: "Destroyed buildings are seen through the window of an airplane from the U.S. Air Force overflying the Gaza Strip",
        credit: "AP Photo"
    }
];

document.addEventListener("DOMContentLoaded", function () {
    const NAMES_CSV_PATH = "T4P-KiG-Names-2025-07-31-full.csv";

    const namesContainer = document.getElementById("names-container");
    const photoStripInner = document.getElementById("photo-strip-inner");
    const VISIBLE_COUNT = 80; // Number of rows rendered in the viewport buffer

    let victims = [];

    // Estimated per-row pixel height; updated by detectRowHeight()
    let ROW_HEIGHT = 30;

    // ---------------------------------------
    // Render photo strip from PHOTO_ITEMS
    // ---------------------------------------
    function renderPhotoStrip() {
        if (!photoStripInner) return;

        photoStripInner.innerHTML = "";

        PHOTO_ITEMS.forEach(item => {
            const wrapper = document.createElement("div");
            wrapper.className = "photo-item";

            const img = document.createElement("img");
            img.src = item.src;
            img.alt = item.caption || "";

            const caption = document.createElement("div");
            caption.className = "photo-caption";
            caption.textContent = item.caption || "";

            const credit = document.createElement("div");
            credit.className = "photo-credit";
            credit.textContent = item.credit || "";

            wrapper.appendChild(img);
            if (item.caption) wrapper.appendChild(caption);
            if (item.credit) wrapper.appendChild(credit);

            photoStripInner.appendChild(wrapper);
        });
    }

    renderPhotoStrip();

    // -----------------------------
    // AUTO-DETECT ROW HEIGHT
    // -----------------------------
    // Creates a hidden sample row to measure its rendered height and
    // updates ROW_HEIGHT accordingly. This ensures translateY calculations
    // remain accurate across different fonts, sizes, and CSS.
    function detectRowHeight() {
        const temp = document.createElement("div");
        temp.className = "victim-row";
        temp.style.visibility = "hidden";
        temp.style.position = "absolute";

        temp.innerHTML = `
            <div class="victim-name">Example Name</div>
            <div class="victim-meta">Gender • Age</div>
        `;

        document.body.appendChild(temp);
        ROW_HEIGHT = temp.offsetHeight || ROW_HEIGHT;
        temp.remove();

        console.log("Auto-detected ROW_HEIGHT =", ROW_HEIGHT);
    }

    detectRowHeight();

    // -----------------------------------------
    // VIRTUAL SCROLL ENGINE (names, right panel)
    // -----------------------------------------
    let currentOffset = 0;   // logical row offset (can be fractional)
    let targetOffset = 0;    // desired offset used by zoom easing
    let offsetAnimating = false;
    let zoomAnimating = false;

    // namesContainer will hold an inner element that we actually translate.
    let inner = null;
    function ensureInner() {
        if (!inner) {
            inner = document.createElement("div");
            inner.id = "names-inner";
            namesContainer.appendChild(inner);
        }
        return inner;
    }

    // Render visible rows given a fractional offset in rows.
    // Only a slice of the victims array (startIndex..endIndex) is rendered.
    // The fractional part (frac) is implemented by translating the inner container
    // upward by frac * ROW_HEIGHT so rows appear to smoothly scroll.
    function renderVirtual(offsetRows) {
        if (!victims.length) return;

        const inner = ensureInner();

        const total = victims.length;
        const maxOffset = Math.max(0, total - VISIBLE_COUNT);

        const clampedOffset = Math.min(maxOffset, Math.max(0, offsetRows));

        const startIndex = Math.floor(clampedOffset);
        const frac = clampedOffset - startIndex;

        const endIndex = Math.min(total, startIndex + VISIBLE_COUNT + 2);

        let html = "";
        for (let i = startIndex; i < endIndex; i++) {
            const v = victims[i];
            html += `
                <div class="victim-row">
                    <div class="victim-name">${i + 1}. ${v.name}</div>
                    <div class="victim-meta">
                        ${v.sexLabel}${v.age ? ` • Age: ${v.age}` : ""}
                    </div>
                </div>
            `;
        }

        inner.innerHTML = html;

        // Apply sub-row translation for the fractional offset to achieve smooth motion.
        inner.style.transform = `translateY(${-frac * ROW_HEIGHT}px)`;
    }

    // Eases currentOffset toward targetOffset using a simple exponential-like easing.
    // Uses requestAnimationFrame for smooth updates. When the difference becomes
    // sufficiently small we snap to the target and stop animating.
    function animateOffset() {
        if (!offsetAnimating) return;

        const diff = targetOffset - currentOffset;

        if (Math.abs(diff) < 0.05) {
            currentOffset = targetOffset;
            renderVirtual(currentOffset);
            offsetAnimating = false;
            zoomAnimating = false;  // zoom easing complete
            return;
        }

        currentOffset += diff * 0.18;  // Easing factor (0..1)
        renderVirtual(currentOffset);

        requestAnimationFrame(animateOffset);
    }

    // -----------------------------------------
    // ZOOM → list position mapping
    // -----------------------------------------
    // Maps a zoom scale (e.g., k from d3.zoomTransform) to a row offset in the
    // victims array using a logarithmic mapping. Higher zoom (larger scale)
    // maps to near the start of the list, while zooming out maps toward the end.
    function updateTargetFromScale(scale) {
        if (!victims.length) return;

        // Clamp scale to sane bounds to avoid log issues.
        const MIN_K = 0.2, MAX_K = 1000;
        const clamped = Math.min(MAX_K, Math.max(MIN_K, scale));

        // Normalize via log so doubling the scale has a roughly uniform effect.
        // We invert it so zooming in moves toward index 0, and zooming out moves
        // toward the bottom of the list.
        const t = 1 - ((Math.log(clamped) - Math.log(MIN_K)) /
                       (Math.log(MAX_K) - Math.log(MIN_K)));

        const maxOffset = Math.max(0, victims.length - VISIBLE_COUNT);
        targetOffset = t * maxOffset;

        zoomAnimating = true;
        if (!offsetAnimating) {
            offsetAnimating = true;
            requestAnimationFrame(animateOffset);
        }
    }

    // -----------------------------
    // AUTO-SCROLL (DOWN ONLY) for names
    // -----------------------------
    // When not in the middle of a zoom-based animation, gently auto-scroll the
    // list downward. This loop runs every frame via requestAnimationFrame.
    const AUTO_SPEED = 0.006; // rows per frame

    function autoScrollLoop() {
        if (victims.length > 0 && !zoomAnimating) {
            const maxOffset = Math.max(0, victims.length - VISIBLE_COUNT);

            // Only scroll if we haven't reached the last row.
            if (currentOffset < maxOffset) {
                currentOffset += AUTO_SPEED;

                if (currentOffset > maxOffset) {
                    currentOffset = maxOffset;
                }

                renderVirtual(currentOffset);
            }
        }

        requestAnimationFrame(autoScrollLoop);
    }

    requestAnimationFrame(autoScrollLoop);

    // -----------------------------
    // LOAD CSV
    // -----------------------------
    // Loads the CSV file (via d3.csv), normalizes fields, and builds the victims array.
    // After loading we render the initial viewport and, if available, apply the
    // initial zoom-derived target offset.
    d3.csv(NAMES_CSV_PATH).then(function (dataRows) {
        victims = dataRows.map(d => {
            const sex = (d.sex || "").toLowerCase();
            let sexLabel = "Unknown";
            if (sex === "m") sexLabel = "Male";
            else if (sex === "f") sexLabel = "Female";

            const name =
                d.en_name && d.en_name.trim()
                    ? d.en_name.trim()
                    : (d.ar_name || "Unnamed").trim();

            return {
                name,
                age: d.age,
                sexLabel
            };
        });

        currentOffset = 0;
        targetOffset = 0;
        renderVirtual(0);

        // If a global viz controller exists, use its initial scale to position the list.
        if (window.viz) updateTargetFromScale(window.viz.initialScale);
    }).catch(err => {
        console.error("Failed to load names CSV:", err);
        if (namesContainer) {
            namesContainer.textContent = "Unable to load names data.";
        }
    });

    // ---------------------------------------
    // PHOTO STRIP: gentle scrolling on zoom-out
    // ---------------------------------------
    let photoScrollVelocity = 0;
    const PHOTO_FRICTION = 0.96;

    function photoScrollLoop() {
        if (!photoStripInner) {
            requestAnimationFrame(photoScrollLoop);
            return;
        }

        if (Math.abs(photoScrollVelocity) > 0.02) {
            const maxScroll =
                photoStripInner.scrollHeight - photoStripInner.clientHeight;

            if (maxScroll > 0) {
                photoStripInner.scrollTop += photoScrollVelocity;

                // Clamp and stop at edges
                if (photoStripInner.scrollTop >= maxScroll && photoScrollVelocity > 0) {
                    photoStripInner.scrollTop = maxScroll;
                    photoScrollVelocity = 0;
                } else if (photoStripInner.scrollTop <= 0 && photoScrollVelocity < 0) {
                    photoStripInner.scrollTop = 0;
                    photoScrollVelocity = 0;
                } else {
                    photoScrollVelocity *= PHOTO_FRICTION;
                }
            } else {
                // No scrollable content
                photoScrollVelocity = 0;
            }
        }

        requestAnimationFrame(photoScrollLoop);
    }

    if (photoStripInner) {
        requestAnimationFrame(photoScrollLoop);
    }

    // Called whenever zoom changes; we give a small downward "push"
    // when the chart is zoomed OUT (scale decreases).
function handlePhotoZoomScroll(scale, prevScale) {
    if (!photoStripInner) return;

    // Only care about zooming OUT
    if (scale < prevScale) {
        // Relative zoom change (e.g. 0.2 = 20% change, 0.02 = 2% change)
        const relChange = Math.abs(scale - prevScale) / Math.max(prevScale, 1e-6);

        // Convert that into a boost:
        // - big wheel jumps (large relChange) → bigger boost
        // - tiny touchpad steps (small relChange) → tiny boost
        let boost = relChange * 17;   // ← main sensitivity knob

        // Keep it within a reasonable range
        boost = Math.min(2.5, Math.max(0.05, boost));

        photoScrollVelocity += boost;
    }
}


    // -----------------------------
    // HOOK ZOOM CHANGES
    // -----------------------------
    // If a global `window.viz` object exists (e.g., an external zoom controller),
    // connect to its onZoomChange callback so zoom updates drive both the
    // names list position and the photo strip scroll behaviour.
    let lastZoomScale = null;

    function attachZoomListener() {
        if (!window.viz) return;

        lastZoomScale = window.viz.initialScale || 1;

        window.viz.onZoomChange = ({ scale }) => {
            updateTargetFromScale(scale);

            if (lastZoomScale != null) {
                handlePhotoZoomScroll(scale, lastZoomScale);
            }
            lastZoomScale = scale;
        };

        // Also apply the current scale immediately
        updateTargetFromScale(window.viz.initialScale);
    }

    if (window.viz) attachZoomListener();
    else setTimeout(attachZoomListener, 0);
});
