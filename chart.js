// chart.js
// Creates the main PeopleSquares instance and exposes it on window.viz

document.addEventListener("DOMContentLoaded", function () {
    const data = [
        // 7 OCT 2023 – INSIDE ISRAEL
        {
            name: "People Killed in Israel (Oct 7, 2023)",
            people: 1139,
            color: "blue",
            fill: "none",
            opacity: 1
        },
         // 7 OCT 2023 – INSIDE ISRAEL
        {
            people: 1,
            color: "blue",
            fill: "none",
            opacity: 1
        },
        {
            name: "People Taken Captive into Gaza (Oct 7, 2023)",
            people: 240,
            color: "blue",
            fill: "none",
            opacity: 1
        },

        // GAZA – KILLED & INJURED
        {
            name: "Palestinians Killed in Gaza",
            people: 67000,
            color: "red",
            fill: "none",
            opacity: 1
        },
        {
            name: "Children Killed in Gaza",
            people: 20000,
            color: "darkred",
            fill: "none",
            opacity: 1
        },
        {
            name: "People Injured in Gaza",
            people: 169000,
            color: "orange",
            fill: "none",
            opacity: 1
        },
        {
            name: "Children with Amputated Limbs (Est. 3,000–4,000)",
            people: 3500,
            color: "purple",
            fill: "none",
            opacity: 1
        },

        // HEALTH WORKERS & MEDICAL TARGETING
        {
            name: "Health and Aid Workers Killed",
            people: 1722,
            color: "green",
            fill: "none",
            opacity: 1
        },
        {
            name: "Physicians Detained",
            people: 28,
            color: "green",
            fill: "none",
            opacity: 1
        },
        {
            name: "Senior Specialists Detained",
            people: 18,
            color: "green",
            fill: "none",
            opacity: 1
        },
        {
            name: "Senior Doctors Killed Under Torture",
            people: 2,
            color: "green",
            fill: "none",
            opacity: 1
        },

        // FAMINE & MALNUTRITION
        {
            name: "People Dead from Starvation",
            people: 459,
            color: "brown",
            fill: "none",
            opacity: 1
        },
        {
            name: "Children Dead from Starvation",
            people: 154,
            color: "saddlebrown",
            fill: "none",
            opacity: 1
        },
        {
            name: "People Facing Catastrophic Hunger (Projected)",
            people: 641000,
            color: "goldenrod",
            fill: "none",
            opacity: 1
        },
        {
            name: "Acutely Malnourished Children (July 2025)",
            people: 12000,
            color: "gold",
            fill: "none",
            opacity: 1
        },

        // AID SEEKERS SHOT WHILE COLLECTING FOOD
        {
            name: "People Killed While Seeking Food at GHF Sites",
            people: 2600,
            color: "maroon",
            fill: "none",
            opacity: 1
        },
        {
            name: "People Injured While Seeking Food at GHF Sites",
            people: 19000,
            color: "maroon",
            fill: "none",
            opacity: 1
        },

        // EDUCATION
        {
            name: "School-Aged Children without Access to Education",
            people: 658000,
            color: "steelblue",
            fill: "none",
            opacity: 1
        },
        {
            name: "University Students without Access to Education",
            people: 87000,
            color: "royalblue",
            fill: "none",
            opacity: 1
        },
        {
            name: "Education Staff Killed",
            people: 780,
            color: "navy",
            fill: "none",
            opacity: 1
        },

        // PRISONERS
        {
            name: "Palestinians Imprisoned in Israeli Jails",
            people: 10800,
            color: "teal",
            fill: "none",
            opacity: 1
        },
        {
            name: "Children Imprisoned in Israeli Jails",
            people: 450,
            color: "teal",
            fill: "none",
            opacity: 1
        },
        {
            name: "Women Imprisoned in Israeli Jails",
            people: 87,
            color: "teal",
            fill: "none",
            opacity: 1
        },
        {
            name: "Administrative Detainees (No Charge or Trial)",
            people: 3629,
            color: "darkcyan",
            fill: "none",
            opacity: 1
        },

        // JOURNALISTS
        {
            name: "Journalists and Media Workers Killed in Gaza",
            people: 300,
            color: "black",
            fill: "none",
            opacity: 1
        },
        {
            name: "Al Jazeera Staff Killed",
            people: 10,
            color: "black",
            fill: "none",
            opacity: 1
        },

        // WATER & POPULATION (for water / total population zoom messages)
        {
            name: "People Surviving on <6 Litres of Water per Day",
            // approximate: about half of Gaza’s 2.1M population
            people: 1050000,
            color: "deepskyblue",
            fill: "none",
            opacity: 1
        },
        {
            name: "Population of Gaza (Approximate)",
            people: 2100000,
            color: "lightgray",
            fill: "none",
            opacity: 0.6
        }
    ];

    window.viz = new PeopleSquares("#viz-container", data);
});
