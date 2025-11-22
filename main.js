// main.js
// Virtualized names list UI.
// Key features:
// - Detects row height automatically for accurate virtualization
// - Smooth continuous auto-scroll downward (stops when reaching bottom)
// - Zoom-driven virtualization: zoom level maps to list position
// - Animations (auto-scroll and zoom easing) coordinated to avoid jitter

document.addEventListener("DOMContentLoaded", function () {
    const NAMES_CSV_PATH = "T4P-KiG-Names-2025-07-31-full.csv";

    const namesContainer = document.getElementById("names-container");
    const VISIBLE_COUNT = 80; // Number of rows rendered in the viewport buffer

    let victims = [];

    // Estimated per-row pixel height; updated by detectRowHeight()
    let ROW_HEIGHT = 30;

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
    // VIRTUAL SCROLL ENGINE (translateY slider)
    // -----------------------------------------
    // Maintains a small DOM subtree (inner) containing only the visible rows.
    // The engine computes a fractional offset (rows + fraction) and applies a
    // translateY for the fractional part to produce smooth sub-row scrolling.
    let currentOffset = 0;   // logical row offset currently rendered (can be fractional)
    let targetOffset = 0;    // desired offset used by zoom easing
    let offsetAnimating = false; // true while offset is being eased toward targetOffset
    let zoomAnimating = false;   // true while zoom-triggered easing is in progress

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

        currentOffset += diff * 0.18;  // easing factor controls smoothness / speed
        renderVirtual(currentOffset);

        requestAnimationFrame(animateOffset);
    }

    // -----------------------------------------
    // ZOOM → list position mapping (only sets a target)
    // -----------------------------------------
    // Maps a zoom scale value to a logical list offset. Uses a logarithmic
    // mapping so changes at extreme scales move more gradually and mid-range
    // scales produce more perceptible repositioning.
    function updateTargetFromScale(scale) {
        if (!victims.length) return;

        const MIN_K = 0.2, MAX_K = 1000;
        const clamped = Math.min(MAX_K, Math.max(MIN_K, scale));

        // Compute normalized parameter t in [0,1] from log-scale,
        // reversing so higher scale -> nearer to start of list
        const t = 1 - ((Math.log(clamped) - Math.log(MIN_K)) /
                       (Math.log(MAX_K) - Math.log(MIN_K)));

        const maxOffset = Math.max(0, victims.length - VISIBLE_COUNT);
        targetOffset = t * maxOffset;

        // Start easing toward the new target if not already animating.
        zoomAnimating = true;
        if (!offsetAnimating) {
            offsetAnimating = true;
            requestAnimationFrame(animateOffset);
        }
    }

    // -----------------------------
    // AUTO-SCROLL (DOWN ONLY)
    // -----------------------------
    // Continuously nudges the list downward at a small rate (rows per frame).
    // Auto-scroll is paused while a zoom animation is in progress, and it
    // stops once the viewport reaches the bottom of the list.
    const AUTO_SPEED = 0.006;      // rows per frame; smaller values => slower auto-scroll

    function autoScrollLoop() {
        if (victims.length > 0 && !zoomAnimating) {
            const maxOffset = Math.max(0, victims.length - VISIBLE_COUNT);

            // Move down only if not at the bottom
            if (currentOffset < maxOffset) {
                currentOffset += AUTO_SPEED;
                if (currentOffset > maxOffset) {
                    currentOffset = maxOffset;
                }
                renderVirtual(currentOffset);
            }
            // If at bottom, do nothing; auto-scroll resumes if zoom moves us up.
        }

        requestAnimationFrame(autoScrollLoop);
    }

    // Kick off the continuous auto-scroll loop
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


    // -----------------------------
    // HOOK ZOOM CHANGES
    // -----------------------------
    // If a global `window.viz` object exists (e.g., an external zoom controller),
    // connect to its onZoomChange callback so zoom updates drive the list position.
    function attachZoomListener() {
        if (!window.viz) return;
        window.viz.onZoomChange = ({ scale }) => {
            updateTargetFromScale(scale);
        };
        // Also apply the current scale immediately
        updateTargetFromScale(window.viz.initialScale);
    }

    if (window.viz) attachZoomListener();
    else setTimeout(attachZoomListener, 0);
});
