window.PeopleSquares = class PeopleSquares {
    constructor(containerSelector, data) {
        this.container = d3.select(containerSelector);

        // 1 pixel = 1 person at scale = 1
        this.personsPerPixel = 1;
        this.items = data || [];

        // Default zoom
        this.initialScale = 1000;

        // flag to disable trivia during animations
        this.skipAnimation = false;

        // Trivia messages now use PEOPLE ON SCREEN instead of raw zoom scale.
        // peopleThreshold is the approximate minimum number of people currently
        // represented inside the COUNTED AREA (the red dashed box) when this
        // message should fire. Adjust these values as you like.
        this.zoomMessages = [
    {
        peopleThreshold: 1.04,
        message:
            "What you see right now represents a single life, 1 person that should have grown old, laughed, loved, and Lived.",
        triggered: false
    },
        {
        peopleThreshold: 2,
        message:
            " 2 senior doctors have reportedly died under torture in Israeli custody",
        triggered: false
    },

    {
        peopleThreshold: 10,
        message:
            "10 Al Jazeera staff members were killed while reporting from Gaza.",
        triggered: false
    },

    {
        peopleThreshold: 18,
        message:
            "18 senior specialists in vital fields such as surgery, anaesthesiology, intensive care and paediatrics, were taken from Gaza’s hospitals and disappeared into Israeli detention. Depriving Gaza’s devastated health system of critical expertise.",
        triggered: false
    },

    {
        peopleThreshold: 28,
        message:
            "28 physicians in total are detained by Israeli forces. 125 Hospitals and Clinics are damaged. ",
        triggered: false
    },

    {
        peopleThreshold: 87,
        message:
            "87 Palestinian women are currently imprisoned in Israeli jails, held far from their families.",
        triggered: false
    },

    {
        peopleThreshold: 154,
        message:
            "154 children in Gaza have died from starvation under siege conditions.",
        triggered: false
    },

       {
        peopleThreshold: 240,
        message:
            "240 Israelis Hostages were taken into Gaza as captives by Hamas during the Oct 7 attack.",
        triggered: false
    },

    {
        peopleThreshold: 300,
        message:
            "300 journalists and media workers have been killed in Gaza while documenting the violence. More than in any conflict in history.",
        triggered: false
    },

    {
        peopleThreshold: 459,
        message:
            "459 people in Gaza have died of starvation as famine deepens.",
        triggered: false
    },

    {
        peopleThreshold: 780,
        message:
            "780 teachers and education staff in Gaza have been killed, 92 percent of schools now require complete reconstruction.",
        triggered: false
    },

    {
        peopleThreshold: 1139,
        message:
            "Israel cites the 1,139 people killed on October 7 as justification, even as its response has escalated into genocide.",
        triggered: false
    },

    {
        peopleThreshold: 1722,
        message:
            "1,722 health and aid workers have been killed in Gaza while trying to save lives.",
        triggered: false
    },

    {
        peopleThreshold: 2600,
        message:
            "2,600 people were killed by Israeli fire while trying to collect food at aid and GHF sites.",
        triggered: false
    },

    {
        peopleThreshold: 3500,
        message:
            "An estimated 3,500 children in Gaza now live with amputated limbs after Israeli attacks.",
        triggered: false
    },

    {
        peopleThreshold: 10800,
        message:
            "10,800 Palestinians are imprisoned in Israel, including 450 children, many without charge or trial.",
        triggered: false
    },

    {
        peopleThreshold: 12000,
        message:
            "12,000 children in Gaza are acutely malnourished as food scarcity intensifies. That is 1 in 4 children.",
        triggered: false
    },
        {
        peopleThreshold: 19000,
        message:
            "More than 19000 injured while trying to collect food aid.",
        triggered: false
    },

    {
        peopleThreshold: 20000,
        message:
            "20,000 children have been killed in Gaza, that's one child killed every hour for 2 years.",
        triggered: false
    },

    {
        peopleThreshold: 67000,
        message:
            "67,000 Palestinians have been killed in Gaza, with thousands still under the rubble. 1 out of every 33 Gazans has been killed.",
        triggered: false
    },

    {
        peopleThreshold: 87000,
        message:
            "87,000 university students in Gaza no longer have access to education, all 63 Universities in Gaza have been damaged or destroyed.",
        triggered: false
    },

    {
        peopleThreshold: 169000,
        message:
            "169,000 people in Gaza have been injured, many with life-altering wounds.",
        triggered: false
    },

    {
        peopleThreshold: 641000,
        message:
            "641,000 people in Gaza are projected to face catastrophic hunger.",
        triggered: false
    },

    {
        peopleThreshold: 658000,
        message:
            "658,000 school-aged children in Gaza have lost all access to education. More than 2,300 educational facilities have been destroyed.",
        triggered: false
    },
       {
        peopleThreshold: 1050000,
        message:
            "89% of Gaza's Water and sanitation infrastructure is damaged. Half of Gaza's population survives on less than 6 liters of water per day, below the emergency 20 liter standard set for 'short term survival' ",
        triggered: false
    },
       {
        peopleThreshold: 2100000,
        message:
            "This is the population of Gaza, 2.1 million people  trapped under siege, facing devastation.",
        triggered: false
    }
];


        // external hook for other scripts (main.js) to listen to zoom changes
        this.onZoomChange = null;

        // D3 zoom
        this.zoom = d3.zoom()
            .scaleExtent([0.5, 1000])
            .wheelDelta(event => {
                const dy = -event.deltaY;

                // crude trackpad vs mouse detection:
                // mouse wheel usually has large jumps (~100),
                // trackpad is often tiny (1–10 per tick)
                const isTrackpad = Math.abs(dy) < 40;

                const factor = isTrackpad ? 0.0025 : 0.0003;
                return dy * factor;
            })
            .on("zoom", event => {
                if (this.containerGroup && !this.containerGroup.selectAll("rect").empty()) {
                    this.updateZoom(event.transform.k);
                }
            });

        this.svg = null;
        this.width = 1000;
        this.height = 1000;
        this.containerGroup = null;
        this.textGroup = null;
        this.legendGroup = null;
        this.triviaDisplay = null;

        // Legend labels
        this.currentPeopleLabel = null;

        this.init();
    }

    init() {
        this.createSVG();
        this.createTriviaDisplay();
        this.updateVis();

        const initialScale = this.initialScale;

        // Apply default zoom
        this.skipAnimation = true;
        this.svg.call(this.zoom.transform, d3.zoomIdentity.scale(initialScale));
        this.updateZoom(initialScale);
        this.skipAnimation = false;
    }

    createSVG() {
        this.svg = this.container.append("svg")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .style("border", "1px solid #ccc")  // thin outer border for the whole SVG
            .style("width", "100%")
            .style("height", "100%");

        // 🔹 Glow filter for the counted-area border
        const defs = this.svg.append("defs");
        const glowFilter = defs.append("filter")
            .attr("id", "viewport-glow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%");
        glowFilter.append("feGaussianBlur")
            .attr("stdDeviation", "3")
            .attr("result", "coloredBlur");
        const feMerge = glowFilter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Main zoom group (everything that zooms lives inside here)
        this.zoomGroup = this.svg.append("g").attr("class", "zoom-group");
        this.containerGroup = this.zoomGroup.append("g").attr("class", "squares-group");
        this.textGroup = this.zoomGroup.append("g").attr("class", "labels-group");
        this.legendGroup = this.svg.append("g").attr("class", "legend-group");

        // Legend: Zoom + Scale
        this.xAxisLabel = this.legendGroup.append("text")
            .attr("class", "x-axis-label")
            .attr("x", this.width / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text(`Zoom: 1.00× (from default) | Scale: 1.00 people per pixel`);

        // Legend: people on screen counter
        this.currentPeopleLabel = this.legendGroup.append("text")
            .attr("class", "current-people-label")
            .attr("x", this.width / 2)
            .attr("y", 35)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text("People currently represented on screen: ≈ 1");

        // Legend: sample square
        this.pixelSample = this.legendGroup.append("rect")
            .attr("x", this.width / 2 - 60)
            .attr("y", 45)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "lightgray")
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // Legend: sample square label
        this.pixelSampleLabel = this.legendGroup.append("text")
            .attr("x", this.width / 2 - 30)
            .attr("y", 60)
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .text("= 400 people");

        //  COUNTED AREA BORDER (what your counter is measuring)
        this.viewportBorder = this.svg.append("rect")
            .attr("class", "viewport-border")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", "none")
            .attr("stroke", "#ff4444")
            .attr("stroke-width", 6)
            .attr("stroke-dasharray", "12,6")
            .attr("filter", "url(#viewport-glow)")
            .style("pointer-events", "none"); // never block zoom/pan

        //  Label background for readability
        this.viewportLabelBg = this.svg.append("rect")
            .attr("class", "viewport-label-bg")
            .attr("x", this.width - 170)
            .attr("y", 10)
            .attr("width", 160)
            .attr("height", 26)
            .attr("rx", 4)
            .attr("ry", 4)
            .style("fill", "rgba(0,0,0,0.65)")
            .style("pointer-events", "none");

        //  "COUNTED AREA" label text
        this.viewportLabel = this.svg.append("text")
            .attr("class", "viewport-label")
            .attr("x", this.width - 15)
            .attr("y", 28)
            .attr("text-anchor", "end")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#ffdddd")
            .style("pointer-events", "none")
            .text("COUNTED AREA");

        this.svg.call(this.zoom);
    }

    createTriviaDisplay() {
        this.triviaDisplay = d3.select("body").append("div")
            .attr("class", "trivia-display")
            .style("position", "fixed")
            .style("bottom", "10px")
            .style("left", "50%")
            .style("transform", "translateX(-50%)")
            .style("padding", "10px 16px")
            .style("background", "#222")
            .style("color", "#fff")
            .style("border-radius", "8px")
            .style("border", "1px solid #999")
            .style("font-size", "16px")
            .style("text-align", "center")
            .style("width", "auto")
            .style("min-width", "300px")
            .style("visibility", "hidden")
            .style("opacity", "0")
            .style("z-index", "9999");
    }

    setData(data) {
        this.items = data;
        this.updateVis();

        const initialScale = this.initialScale;
        this.skipAnimation = true;
        this.svg.call(this.zoom.transform, d3.zoomIdentity.scale(initialScale));
        this.updateZoom(initialScale);
        this.skipAnimation = false;

        // Reset trivia triggers whenever data changes
        this.zoomMessages.forEach(m => (m.triggered = false));
    }

    updateVis() {
        if (!this.containerGroup || !this.textGroup) return;

        this.containerGroup.selectAll("*").remove();
        this.textGroup.selectAll("*").remove();

        // Largest → smallest
        this.items.sort((a, b) => b.people - a.people);

        this.items.forEach((item, i) => {
            const area = item.people / this.personsPerPixel;
            const side = Math.sqrt(area);

            // All squares start at top-left; zoom + labels distinguish them
            this.containerGroup.append("rect")
                .attr("class", "people-square")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", side)
                .attr("height", side)
                .attr("stroke", item.color || "black")
                .attr("stroke-width", 2)
                .attr("fill", item.fill || "none")
                .attr("opacity", item.opacity || 1)
                .append("title")
                .text(`${item.name}: ${item.people.toLocaleString()} people`);

            // Label to the right of each square
            this.textGroup.append("text")
                .attr("x", side + 10)
                .attr("y", 40 + i * 22)
                .style("fill", "black")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text(item.name);
        });
    }

    updateZoom(scale) {
        if (!this.containerGroup || !this.textGroup) return;

        // Normalize zoom relative to default view
        const normalizedScale = this.initialScale / scale; // 1 at default, >1 when zoomed out

        // Resize squares according to zoom scale
        this.containerGroup.selectAll(".people-square").each((d, i, nodes) => {
            const item = this.items[i];
            const baseSide = Math.sqrt(item.people / this.personsPerPixel);
            const side = baseSide * scale;

            d3.select(nodes[i])
                .attr("width", side)
                .attr("height", side);
        });

        // Reposition labels based on zoom scale
        this.textGroup.selectAll("text").each((d, i, nodes) => {
            const item = this.items[i];
            const baseSide = Math.sqrt(item.people / this.personsPerPixel);
            const side = baseSide * scale;
            const x = side + 10;
            const y = 100 + i * 22;

            d3.select(nodes[i])
                .attr("x", x)
                .attr("y", y)
                .style("font-size", "12px");
        });

        // Legend: effective people per pixel
        const peoplePerPixel = this.personsPerPixel / (scale * scale);

        // Viewport people count
        const viewportArea = this.width * this.height; // 1000 x 1000
        const peopleOnScreen = viewportArea * peoplePerPixel;

        // Update legend text
        this.xAxisLabel.text(
            `Zoom: ${normalizedScale.toFixed(2)}× (from default) | Scale: ${peoplePerPixel.toFixed(6)} people per pixel`
        );

        if (this.currentPeopleLabel) {
            let displayVal;
            if (peopleOnScreen >= 10) {
                displayVal = Math.round(peopleOnScreen).toLocaleString();
            } else {
                displayVal = peopleOnScreen.toFixed(2);
            }
            this.currentPeopleLabel.text(
                "People currently represented on screen: ≈ " + displayVal
            );
        }

        // Legend: sample square
        const rectArea = 20 * 20;
        const rectValue = rectArea * peoplePerPixel;
        this.pixelSampleLabel.text(`= ${Math.round(rectValue).toLocaleString()} people`);

        // 🎯 Trivia system based on PEOPLE ON SCREEN
        if (!this.skipAnimation) {
            let triggeredMessage = null;
            for (let msg of this.zoomMessages) {
                // fire when the counted area holds at least peopleThreshold people
                if (peopleOnScreen >= msg.peopleThreshold && !msg.triggered) {
                    triggeredMessage = msg.message;
                    msg.triggered = true;
                } else if (peopleOnScreen < msg.peopleThreshold) {
                    // reset so it can fire again if you zoom back out and cross it again
                    msg.triggered = false;
                }
            }
            if (triggeredMessage) {
                this.animateTriviaMessage(triggeredMessage);
            }
        }

        // 🔗 notify listeners (main.js) so the names can scroll
        if (typeof this.onZoomChange === "function") {
            this.onZoomChange({
                scale,
                normalizedScale,
                peoplePerPixel,
                peopleOnScreen
            });
        }
    }

    animateTriviaMessage(message) {
        this.triviaDisplay
            .html(message)
            .style("font-size", "1.6rem")
            .style("visibility", "visible")
            .style("opacity", "1")
            .style("right", "-400px")
            .style("bottom", "100px")
            .transition()
            .duration(2000)
            .style("right", "0px")
            .style("bottom", "100px")
            .transition()
            .delay(5000)
            .duration(1000)
            .style("opacity", "0")
            .on("end", () => {
                this.triviaDisplay.style("visibility", "hidden");
            });
    }
};
