/* =========================================================
   MEMORYWALK
   Frontend logic
   server.py is NOT changed
   ========================================================= */


/* =========================================================
   CONFIG
   ========================================================= */

const STORAGE_KEY = "memorywalk_memories";


/* =========================================================
   STATE
   ========================================================= */

let selectedDuration = 15;
let selectedFocus = "surprise";

let currentMission = null;
let currentQuestions = [];
let currentEvaluation = null;

let timerInterval = null;
let experienceStartedAt = null;

let currentMemorySaved = false;


/* =========================================================
   FOCUS INFORMATION
   ========================================================= */

const FOCUS_INFO = {
    nature: {
        name: "Nature Noticer",
        icon: "🌿",
        description: "Notice plants, light, textures and small changes."
    },

    sounds: {
        name: "Sound Listener",
        icon: "👂",
        description: "Notice sounds you normally ignore."
    },

    details: {
        name: "Detail Hunter",
        icon: "🔎",
        description: "Look closely at ordinary things."
    },

    surprise: {
        name: "Curious Explorer",
        icon: "✨",
        description: "Let curiosity decide what you notice."
    }
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}


/* =========================================================
   SCREEN NAVIGATION
   ========================================================= */

function showScreen(screenId) {
    $all(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const target = $(screenId);

    if (!target) {
        console.error(`Screen not found: ${screenId}`);
        return;
    }

    target.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   HOME BUTTONS
   ========================================================= */

if ($("homeBtn")) {
    $("homeBtn").addEventListener("click", () => {
        stopTimer();
        showScreen("home");
    });
}

if ($("gardenHomeBtn")) {
    $("gardenHomeBtn").addEventListener("click", () => {
        renderGarden();
        showScreen("garden");
    });
}

if ($("gardenTextBtn")) {
    $("gardenTextBtn").addEventListener("click", () => {
        renderGarden();
        showScreen("garden");
    });
}


/* =========================================================
   BACK BUTTONS
   ========================================================= */

$all("[data-back]").forEach(button => {
    button.addEventListener("click", () => {
        const destination = button.dataset.back;

        if (destination === "home") {
            stopTimer();
            showScreen("home");
        }

        if (destination === "mission") {
            showScreen("mission");
        }

        if (destination === "garden") {
            renderGarden();
            showScreen("garden");
        }
    });
});


/* =========================================================
   TIME SELECTION
   ========================================================= */

$all(".time-choice").forEach(button => {

    button.addEventListener("click", () => {

        $all(".time-choice").forEach(item => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");

        selectedDuration =
            Number(button.dataset.time) || 15;
    });
});


/* =========================================================
   FOCUS SELECTION
   ========================================================= */

$all(".focus-choice").forEach(button => {

    button.addEventListener("click", () => {

        $all(".focus-choice").forEach(item => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");

        selectedFocus =
            button.dataset.focus || "surprise";
    });
});


/* =========================================================
   INITIAL SELECTION
   ========================================================= */

function initializeSelections() {

    const defaultTime =
        document.querySelector(
            `.time-choice[data-time="${selectedDuration}"]`
        );

    if (defaultTime) {
        defaultTime.classList.add("selected");
    }

    const defaultFocus =
        document.querySelector(
            `.focus-choice[data-focus="${selectedFocus}"]`
        );

    if (defaultFocus) {
        defaultFocus.classList.add("selected");
    }
}


/* =========================================================
   API HELPER
   ========================================================= */

async function postJSON(url, data) {

    const response = await fetch(url, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(data)
    });

    let result = null;

    try {
        result = await response.json();
    } catch (error) {
        throw new Error(
            "The server returned an invalid response."
        );
    }

    if (!response.ok) {

        const message =
            result?.error ||
            result?.message ||
            "Something went wrong.";

        throw new Error(message);
    }

    return result;
}


/* =========================================================
   GENERATE MISSION
   ========================================================= */

if ($("generateBtn")) {

    $("generateBtn").addEventListener("click", generateMission);
}


async function generateMission() {

    const button = $("generateBtn");

    if (!button) {
        return;
    }

    const originalHTML = button.innerHTML;

    button.disabled = true;

    button.innerHTML = `
        <span>Creating your mission...</span>
        <span class="loading-spinner"></span>
    `;

    try {

        /*
         IMPORTANT:
         We only send the fields already supported
         by the existing server.py.
        */

        const data = {
            duration: selectedDuration,
            focus: selectedFocus
        };

        const result =
            await postJSON(
                "/generate-mission",
                data
            );

        currentMission =
            normalizeMission(result);

        if (!currentMission) {
            throw new Error(
                "The AI did not return a usable mission."
            );
        }

        displayMission();

        showScreen("mission");

    } catch (error) {

        console.error(
            "Mission generation error:",
            error
        );

        alert(
            "I couldn't create your mission right now.\n\n" +
            "Make sure Ollama and server.py are running."
        );

    } finally {

        button.disabled = false;

        button.innerHTML = originalHTML;
    }
}


/* =========================================================
   NORMALIZE MISSION RESPONSE
   ========================================================= */

function normalizeMission(result) {

    if (!result) {
        return null;
    }

    /*
     The backend may return the mission directly
     or inside a "mission" property.
    */

    let mission = result.mission || result;

    if (typeof mission === "string") {

        return {
            title: "Your Mission",
            text: mission
        };
    }

    if (typeof mission !== "object") {
        return null;
    }

    return {
        title:
            mission.title ||
            mission.name ||
            "Your Mission",

        text:
            mission.text ||
            mission.mission ||
            mission.description ||
            mission.instruction ||
            "",

        focus:
            mission.focus ||
            selectedFocus,

        duration:
            mission.duration ||
            selectedDuration
    };
}


/* =========================================================
   DISPLAY MISSION
   ========================================================= */

function displayMission() {

    if (!currentMission) {
        return;
    }

    if ($("missionTitle")) {

        $("missionTitle").textContent =
            currentMission.title;
    }

    if ($("missionText")) {

        $("missionText").textContent =
            currentMission.text;
    }

    if ($("missionTime")) {

        $("missionTime").textContent =
            `${selectedDuration} minutes`;
    }

    if ($("missionFocus")) {

        const focus =
            FOCUS_INFO[selectedFocus] ||
            FOCUS_INFO.surprise;

        $("missionFocus").textContent =
            `${focus.icon} ${focus.name}`;
    }
}


/* =========================================================
   START OUTDOOR EXPERIENCE
   ========================================================= */

if ($("startBtn")) {

    $("startBtn").addEventListener(
        "click",
        startOutdoorExperience
    );
}


function startOutdoorExperience() {

    experienceStartedAt =
        Date.now();

    currentMemorySaved = false;

    startTimer(
        selectedDuration * 60
    );

    showScreen("phoneDown");
}


/* =========================================================
   TIMER
   ========================================================= */

function startTimer(totalSeconds) {

    stopTimer();

    let remaining = totalSeconds;

    updateTimerDisplay(remaining);

    timerInterval =
        setInterval(() => {

            remaining--;

            updateTimerDisplay(remaining);

            if (remaining <= 0) {

                stopTimer();

                updateTimerDisplay(0);

                setTimeout(() => {

                    showScreen("reflection");

                    generateReflectionQuestions();

                }, 500);
            }

        }, 1000);
}


function stopTimer() {

    if (timerInterval) {

        clearInterval(timerInterval);

        timerInterval = null;
    }
}


function updateTimerDisplay(seconds) {

    if (!$("timer")) {
        return;
    }

    const safeSeconds =
        Math.max(0, seconds);

    const minutes =
        Math.floor(safeSeconds / 60);

    const remainingSeconds =
        safeSeconds % 60;

    $("timer").textContent =
        `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}


/* =========================================================
   I'M BACK BUTTON
   ========================================================= */

if ($("backBtn")) {

    $("backBtn").addEventListener(
        "click",
        async () => {

            stopTimer();

            showScreen("reflection");

            await generateReflectionQuestions();
        }
    );
}


/* =========================================================
   GENERATE REFLECTION QUESTIONS
   ========================================================= */

async function generateReflectionQuestions() {

    const questionsContainer =
        $("questions");

    if (!questionsContainer) {
        return;
    }

    questionsContainer.innerHTML = `
        <div class="loading-card">
            <span class="loading-spinner"></span>
            <span>Thinking about what you might have noticed...</span>
        </div>
    `;

    if ($("evaluateBtn")) {
        $("evaluateBtn").disabled = true;
    }

    try {

        const result =
            await postJSON(
                "/generate-reflection",
                {
                    mission:
                        currentMission?.text ||
                        "",

                    title:
                        currentMission?.title ||
                        "",

                    focus:
                        selectedFocus,

                    duration:
                        selectedDuration
                }
            );

        currentQuestions =
            normalizeQuestions(result);

        renderQuestions();

    } catch (error) {

        console.error(
            "Reflection generation error:",
            error
        );

        /*
         Fallback questions make the app usable
         even if the local AI temporarily fails.
        */

        currentQuestions = [
            "What was the most interesting thing you noticed?",
            "What detail would you normally have missed?",
            "How did being away from your phone change what you noticed?"
        ];

        renderQuestions();

    } finally {

        if ($("evaluateBtn")) {
            $("evaluateBtn").disabled = false;
        }
    }
}


/* =========================================================
   NORMALIZE QUESTIONS
   ========================================================= */

function normalizeQuestions(result) {

    if (!result) {
        return [];
    }

    let questions =
        result.questions ||
        result.reflection_questions ||
        result.items ||
        result;

    if (typeof questions === "string") {

        /*
         Try to turn numbered/bulleted AI output
         into separate questions.
        */

        questions =
            questions
                .split(/\n+/)
                .map(line =>
                    line
                        .replace(
                            /^\s*(?:[-*•]|\d+[.)])\s*/,
                            ""
                        )
                        .trim()
                )
                .filter(Boolean);
    }

    if (!Array.isArray(questions)) {
        return [];
    }

    return questions
        .map(question => {

            if (typeof question === "string") {
                return question.trim();
            }

            if (question && typeof question === "object") {

                return (
                    question.question ||
                    question.text ||
                    question.prompt ||
                    ""
                ).trim();
            }

            return "";
        })
        .filter(Boolean)
        .slice(0, 6);
}


/* =========================================================
   RENDER QUESTIONS
   ========================================================= */

function renderQuestions() {

    const container =
        $("questions");

    if (!container) {
        return;
    }

    if (!currentQuestions.length) {

        currentQuestions = [
            "What did you notice?",
            "What surprised you?",
            "What will you remember from this experience?"
        ];
    }

    container.innerHTML = "";

    currentQuestions.forEach(
        (question, index) => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "question";

            const label =
                document.createElement("label");

            label.setAttribute(
                "for",
                `answer-${index}`
            );

            label.textContent =
                `${index + 1}. ${question}`;

            const textarea =
                document.createElement("textarea");

            textarea.id =
                `answer-${index}`;

            textarea.dataset.questionIndex =
                index;

            textarea.placeholder =
                "Write what you genuinely noticed...";

            textarea.rows = 4;

            wrapper.appendChild(label);
            wrapper.appendChild(textarea);

            container.appendChild(wrapper);
        }
    );
}


/* =========================================================
   GET REFLECTION ANSWERS
   ========================================================= */

function collectAnswers() {

    const answers = [];

    currentQuestions.forEach(
        (_, index) => {

            const textarea =
                $(`answer-${index}`);

            answers.push(
                textarea
                    ? textarea.value.trim()
                    : ""
            );
        }
    );

    return answers;
}


/* =========================================================
   EVALUATE REFLECTION
   ========================================================= */

if ($("evaluateBtn")) {

    $("evaluateBtn").addEventListener(
        "click",
        evaluateReflection
    );
}


async function evaluateReflection() {

    const answers =
        collectAnswers();

    const meaningfulAnswers =
        answers.filter(
            answer => answer.length > 0
        );

    if (!meaningfulAnswers.length) {

        alert(
            "Write at least one reflection before continuing."
        );

        return;
    }

    const button =
        $("evaluateBtn");

    const originalHTML =
        button.innerHTML;

    button.disabled = true;

    button.innerHTML = `
        <span>Reading your reflection...</span>
        <span class="loading-spinner"></span>
    `;

    try {

        const result =
            await postJSON(
                "/evaluate-reflection",
                {
                    mission:
                        currentMission?.text ||
                        "",

                    title:
                        currentMission?.title ||
                        "",

                    focus:
                        selectedFocus,

                    duration:
                        selectedDuration,

                    questions:
                        currentQuestions,

                    answers
                }
            );

        currentEvaluation =
            normalizeEvaluation(result);

        displayEvaluation();

        showScreen("result");

    } catch (error) {

        console.error(
            "Evaluation error:",
            error
        );

        /*
         Simple local fallback.
         This does not replace the AI when it works.
        */

        currentEvaluation =
            createFallbackEvaluation(
                answers
            );

        displayEvaluation();

        showScreen("result");

    } finally {

        button.disabled = false;

        button.innerHTML = originalHTML;
    }
}


/* =========================================================
   NORMALIZE EVALUATION
   ========================================================= */

function normalizeEvaluation(result) {

    if (!result) {
        return null;
    }

    let evaluation =
        result.evaluation ||
        result.result ||
        result;

    if (typeof evaluation === "string") {

        return {
            score: 0,
            feedback: evaluation,
            takeaway:
                "You made time to notice something outside your screen."
        };
    }

    if (typeof evaluation !== "object") {
        return null;
    }

    let score =
        evaluation.score ??
        evaluation.rating ??
        evaluation.points ??
        0;

    score =
        Number(
            String(score)
                .replace(/[^\d.]/g, "")
        );

    /*
     Keep score between 0 and 10.
    */

    if (!Number.isFinite(score)) {
        score = 0;
    }

    score =
        Math.max(
            0,
            Math.min(10, Math.round(score))
        );

    return {
        score,

        feedback:
            evaluation.feedback ||
            evaluation.comment ||
            evaluation.message ||
            "You took time to notice the world around you.",

        takeaway:
            evaluation.takeaway ||
            evaluation.insight ||
            evaluation.lesson ||
            "You noticed something worth remembering."
    };
}


/* =========================================================
   FALLBACK EVALUATION
   ========================================================= */

function createFallbackEvaluation(answers) {

    const wordCount =
        answers.join(" ")
            .split(/\s+/)
            .filter(Boolean)
            .length;

    let score = 5;

    if (wordCount >= 15) {
        score = 7;
    }

    if (wordCount >= 35) {
        score = 8;
    }

    if (wordCount >= 60) {
        score = 9;
    }

    return {
        score,

        feedback:
            "You took the time to step away from the screen and describe what you noticed. The value of this experience is in paying attention to something that might normally pass unnoticed.",

        takeaway:
            "A small moment became something you can remember."
    };
}


/* =========================================================
   DISPLAY EVALUATION
   ========================================================= */

function displayEvaluation() {

    if (!currentEvaluation) {
        return;
    }

    const score =
        currentEvaluation.score;

    if ($("score")) {
        $("score").textContent = score;
    }

    if ($("feedback")) {
        $("feedback").textContent =
            currentEvaluation.feedback;
    }

    if ($("takeaway")) {
        $("takeaway").textContent =
            currentEvaluation.takeaway;
    }

    if ($("resultTitle")) {

        if (score >= 9) {
            $("resultTitle").textContent =
                "You really noticed.";
        } else if (score >= 7) {
            $("resultTitle").textContent =
                "A moment worth keeping.";
        } else if (score >= 5) {
            $("resultTitle").textContent =
                "You slowed down.";
        } else {
            $("resultTitle").textContent =
                "You made the time.";
        }
    }

    if ($("resultIcon")) {

        if (score >= 9) {
            $("resultIcon").textContent = "🌳";
        } else if (score >= 7) {
            $("resultIcon").textContent = "🌿";
        } else if (score >= 5) {
            $("resultIcon").textContent = "🍃";
        } else {
            $("resultIcon").textContent = "🌱";
        }
    }

    if ($("saveMessage")) {
        $("saveMessage").textContent = "";
    }

    currentMemorySaved = false;
}


/* =========================================================
   SAVE MEMORY
   ========================================================= */

if ($("saveMemoryBtn")) {

    $("saveMemoryBtn").addEventListener(
        "click",
        saveCurrentMemory
    );
}


function saveCurrentMemory() {

    if (!currentMission || !currentEvaluation) {
        return;
    }

    if (currentMemorySaved) {
        return;
    }

    const answers =
        collectAnswers();

    const memory = {

        id:
            Date.now().toString() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 8),

        createdAt:
            new Date().toISOString(),

        date:
            new Date().toLocaleDateString(
                undefined,
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            ),

        duration:
            selectedDuration,

        focus:
            selectedFocus,

        focusName:
            (
                FOCUS_INFO[selectedFocus] ||
                FOCUS_INFO.surprise
            ).name,

        focusIcon:
            (
                FOCUS_INFO[selectedFocus] ||
                FOCUS_INFO.surprise
            ).icon,

        title:
            currentMission.title,

        mission:
            currentMission.text,

        questions:
            [...currentQuestions],

        answers,

        reflection:
            answers
                .filter(Boolean)
                .join(" "),

        score:
            currentEvaluation.score,

        feedback:
            currentEvaluation.feedback,

        takeaway:
            currentEvaluation.takeaway
    };

    const memories =
        getMemories();

    memories.unshift(memory);

    saveMemories(memories);

    currentMemorySaved = true;

    if ($("saveMessage")) {

        $("saveMessage").textContent =
            "🌱 Saved to your Memory Garden.";
    }

    updateHomeCount();
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function getMemories() {

    try {

        const stored =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!stored) {
            return [];
        }

        const memories =
            JSON.parse(stored);

        return Array.isArray(memories)
            ? memories
            : [];

    } catch (error) {

        console.error(
            "Could not read memories:",
            error
        );

        return [];
    }
}


function saveMemories(memories) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(memories)
        );

    } catch (error) {

        console.error(
            "Could not save memories:",
            error
        );
    }
}


/* =========================================================
   GARDEN BUTTONS
   ========================================================= */

if ($("gardenResultBtn")) {

    $("gardenResultBtn").addEventListener(
        "click",
        () => {

            renderGarden();

            showScreen("garden");
        }
    );
}


if ($("anotherBtn")) {

    $("anotherBtn").addEventListener(
        "click",
        () => {

            resetCurrentExperience();

            showScreen("home");
        }
    );
}


if ($("firstMissionBtn")) {

    $("firstMissionBtn").addEventListener(
        "click",
        () => {

            showScreen("home");
        }
    );
}


/* =========================================================
   RESET EXPERIENCE
   ========================================================= */

function resetCurrentExperience() {

    stopTimer();

    currentMission = null;
    currentQuestions = [];
    currentEvaluation = null;

    experienceStartedAt = null;
    currentMemorySaved = false;

    if ($("questions")) {
        $("questions").innerHTML = "";
    }

    if ($("saveMessage")) {
        $("saveMessage").textContent = "";
    }
}


/* =========================================================
   GARDEN RENDERING
   ========================================================= */

function renderGarden() {

    const memories =
        getMemories();

    updateGardenStats(memories);
    renderPattern(memories);
    renderPlants(memories);
    renderMemoryList(memories);

    updateHomeCount();
}


/* =========================================================
   GARDEN STATS
   ========================================================= */

function updateGardenStats(memories) {

    if (!$("gardenStats")) {
        return;
    }

    const total =
        memories.length;

    const average =
        total
            ? memories.reduce(
                (sum, memory) =>
                    sum +
                    Number(memory.score || 0),
                0
            ) / total
            : 0;

    const totalMinutes =
        memories.reduce(
            (sum, memory) =>
                sum +
                Number(memory.duration || 0),
            0
        );

    const uniqueDays =
        new Set(
            memories.map(memory => {

                if (memory.createdAt) {

                    return new Date(
                        memory.createdAt
                    ).toDateString();
                }

                return memory.date || "";
            })
        ).size;

    $("gardenStats").innerHTML = `
        <div>
            <b>${total}</b>
            <span>moments</span>
        </div>

        <div>
            <b>${average ? average.toFixed(1) : "—"}</b>
            <span>average score</span>
        </div>

        <div>
            <b>${totalMinutes}</b>
            <span>minutes outside</span>
        </div>

        <div>
            <b>${uniqueDays}</b>
            <span>days noticed</span>
        </div>
    `;
}


/* =========================================================
   PATTERN ANALYSIS
   ========================================================= */

function renderPattern(memories) {

    const panel =
        $("patternPanel");

    if (!panel) {
        return;
    }

    if (!memories.length) {

        panel.innerHTML = `
            <div class="pattern-title">
                YOUR OBSERVATION STYLE
            </div>

            <div class="pattern-main">
                Your pattern will grow here.
            </div>

            <p>
                Complete a few MemoryWalks and your
                garden will start noticing what
                <strong>you</strong> tend to notice.
            </p>
        `;

        return;
    }

    const focusCounts = {};

    memories.forEach(memory => {

        const focus =
            memory.focus || "surprise";

        focusCounts[focus] =
            (focusCounts[focus] || 0) + 1;
    });

    const favoriteFocus =
        Object.entries(focusCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0]
        || "surprise";

    const focusInfo =
        FOCUS_INFO[favoriteFocus] ||
        FOCUS_INFO.surprise;

    const averageScore =
        memories.reduce(
            (sum, memory) =>
                sum +
                Number(memory.score || 0),
            0
        ) / memories.length;

    let observationStyle =
        "Curious Explorer";

    if (favoriteFocus === "nature") {
        observationStyle =
            "You notice living things.";
    }

    if (favoriteFocus === "sounds") {
        observationStyle =
            "You notice what others hear past.";
    }

    if (favoriteFocus === "details") {
        observationStyle =
            "You notice the small things.";
    }

    if (favoriteFocus === "surprise") {
        observationStyle =
            "You follow curiosity.";
    }

    const bars =
        Object.keys(FOCUS_INFO)
            .map(key => {

                const count =
                    focusCounts[key] || 0;

                const percentage =
                    Math.round(
                        (count / memories.length) *
                        100
                    );

                const info =
                    FOCUS_INFO[key];

                return `
                    <div>
                        <span>
                            ${info.icon} ${info.name}
                        </span>

                        <i>
                            <b style="width:${percentage}%"></b>
                        </i>

                        <small>${count}</small>
                    </div>
                `;
            })
            .join("");

    panel.innerHTML = `
        <div class="pattern-title">
            YOUR OBSERVATION STYLE
        </div>

        <div class="pattern-main">
            ${observationStyle}
        </div>

        <p>
            Your most-used lens is
            <strong>${focusInfo.icon} ${focusInfo.name}</strong>.
            Across ${memories.length}
            ${memories.length === 1 ? "moment" : "moments"},
            your average reflection score is
            <strong>${averageScore.toFixed(1)}/10</strong>.
        </p>

        <div class="focus-bars">
            ${bars}
        </div>
    `;
}


/* =========================================================
   LIVING PLANT GARDEN
   ========================================================= */

function renderPlants(memories) {

    const row =
        $("plantRow");

    if (!row) {
        return;
    }

    if (!memories.length) {

        row.innerHTML = `
            <div class="plant">
                <span>🌱</span>
                <small>Start growing</small>
            </div>
        `;

        return;
    }

    /*
     Every saved experience becomes a plant.
     Better score = more developed plant.
    */

    row.innerHTML =
        memories
            .slice(0, 30)
            .map(memory => {

                const score =
                    Number(memory.score || 0);

                let plant = "🌱";

                if (score >= 4) {
                    plant = "🌿";
                }

                if (score >= 6) {
                    plant = "🌱";
                }

                if (score >= 8) {
                    plant = "🌳";
                }

                if (score >= 9) {
                    plant = "🌸";
                }

                const focus =
                    FOCUS_INFO[memory.focus] ||
                    FOCUS_INFO.surprise;

                return `
                    <div
                        class="plant"
                        title="${escapeHTML(
                            focus.name
                        )} — ${score}/10"
                    >
                        <span>${plant}</span>
                        <small>${score}/10</small>
                    </div>
                `;
            })
            .join("");
}


/* =========================================================
   MEMORY CARDS
   ========================================================= */

function renderMemoryList(memories) {

    const list =
        $("memoryList");

    const empty =
        $("emptyGarden");

    if (!list) {
        return;
    }

    if (!memories.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    list.innerHTML =
        memories
            .map(createMemoryCard)
            .join("");

    /*
     Attach delete handlers after
     the cards have been inserted.
    */

    list.querySelectorAll(
        ".delete-btn"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteMemory(
                    button.dataset.id
                );
            }
        );
    });
}


/* =========================================================
   CREATE MEMORY CARD
   ========================================================= */

function createMemoryCard(memory) {

    const focus =
        FOCUS_INFO[memory.focus] ||
        FOCUS_INFO.surprise;

    const date =
        memory.date ||
        formatDate(memory.createdAt);

    const reflection =
        memory.reflection ||
        "No reflection recorded.";

    const escapedTitle =
        escapeHTML(
            memory.title ||
            "Untitled moment"
        );

    return `
        <article class="memory-card">

            <div class="memory-top">

                <span>
                    ${focus.icon}
                    ${escapeHTML(focus.name)}
                </span>

                <time>
                    ${escapeHTML(date)}
                </time>

            </div>

            <h3 class="memory-title">
                ${escapedTitle}
            </h3>

            <div class="memory-meta">
                ${Number(memory.duration || 0)} min outside
                ·
                <b>${Number(memory.score || 0)}/10</b>
            </div>

            <p>
                ${escapeHTML(
                    truncateText(
                        reflection,
                        230
                    )
                )}
            </p>

            <details>

                <summary>
                    Open this memory
                </summary>

                <p>
                    <strong>Mission:</strong><br>
                    ${escapeHTML(
                        memory.mission ||
                        ""
                    )}
                </p>

                <p>
                    <strong>Your reflection:</strong><br>
                    ${escapeHTML(
                        reflection
                    )}
                </p>

                <div class="takeaway-inline">
                    <strong>🌱 Takeaway</strong><br>
                    ${escapeHTML(
                        memory.takeaway ||
                        ""
                    )}
                </div>

                <p>
                    <strong>AI feedback:</strong><br>
                    ${escapeHTML(
                        memory.feedback ||
                        ""
                    )}
                </p>

            </details>

            <button
                class="delete-btn"
                type="button"
                data-id="${escapeHTML(
                    memory.id
                )}"
            >
                Delete memory
            </button>

        </article>
    `;
}


/* =========================================================
   DELETE MEMORY
   ========================================================= */

function deleteMemory(id) {

    const memories =
        getMemories();

    const memory =
        memories.find(
            item => item.id === id
        );

    if (!memory) {
        return;
    }

    const confirmed =
        confirm(
            "Remove this memory from your Memory Garden?"
        );

    if (!confirmed) {
        return;
    }

    const remaining =
        memories.filter(
            item => item.id !== id
        );

    saveMemories(remaining);

    renderGarden();

    updateHomeCount();
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    try {

        return new Date(
            dateValue
        ).toLocaleDateString(
            undefined,
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );

    } catch (error) {

        return "";
    }
}


/* =========================================================
   TEXT HELPERS
   ========================================================= */

function truncateText(text, maxLength) {

    const clean =
        String(text || "")
            .replace(/\s+/g, " ")
            .trim();

    if (clean.length <= maxLength) {
        return clean;
    }

    return (
        clean.slice(0, maxLength)
        .trim() +
        "..."
    );
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   HOME MEMORY COUNT
   ========================================================= */

function updateHomeCount() {

    const count =
        getMemories().length;

    if ($("homeCount")) {
        $("homeCount").textContent =
            count;
    }
}


/* =========================================================
   KEYBOARD SUPPORT
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        /*
         Escape closes the active experience
         and returns home.
        */

        if (event.key === "Escape") {

            const active =
                document.querySelector(
                    ".screen.active"
                );

            if (
                active &&
                active.id !== "home"
            ) {

                stopTimer();

                showScreen("home");
            }
        }
    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeApp() {

    initializeSelections();

    updateHomeCount();

    /*
     Make sure the home screen is visible
     when the page first loads.
    */

    const activeScreen =
        document.querySelector(
            ".screen.active"
        );

    if (!activeScreen) {
        showScreen("home");
    }
}


/* =========================================================
   START APP
   ========================================================= */

initializeApp();