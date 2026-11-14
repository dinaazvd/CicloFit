// Estado global do ciclo menstrual e calendário estilo Flo
let totalCycleDays = 28;
let currentWorkoutVersion = 1;
let cachedApiExercises = null;

// Datas normalizadas (meia-noite local)
function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateInput(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const todayDate = normalizeDate(new Date());
let lastPeriodStartDate = normalizeDate(new Date()); // Padrão: ciclo iniciando hoje
let selectedCalendarDate = normalizeDate(new Date());
let viewedMonth = todayDate.getMonth();
let viewedYear = todayDate.getFullYear();

// Calcula o dia do ciclo (1 até totalCycleDays) para qualquer data do calendário
function getCycleDayForDate(targetDate) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((normalizeDate(targetDate) - lastPeriodStartDate) / msPerDay);
  const mod = ((diffDays % totalCycleDays) + totalCycleDays) % totalCycleDays;
  return mod + 1;
}

// Retorna a fase estilo Flo (Menstrual, Folicular, Fértil, Ovulatória, Lútea)
function getPhaseFromCycleDay(cycleDay, totalDays) {
  const menstrualEnd = Math.max(1, Math.round(totalDays * 0.18)); // ~5 dias num ciclo de 28
  const ovulationDay = Math.max(menstrualEnd + 2, totalDays - 14); // Ovulação ~14 dias antes do próximo ciclo
  const fertileStart = Math.max(menstrualEnd + 1, ovulationDay - 4);
  const fertileEnd = Math.min(totalDays, ovulationDay + 1);

  if (cycleDay >= 1 && cycleDay <= menstrualEnd) {
    return {
      key: "menstrual",
      label: "Fase Menstrual",
      badge: `Dia ${cycleDay} do ciclo (Fase Menstrual): Musculação com intensidade moderada (50-60% 1RM), intervalos de descanso de 90s a 120s e cadência suave para evitar sobrecarga pélvica e lombar.`
    };
  }

  if (cycleDay === ovulationDay) {
    return {
      key: "ovulatory",
      label: "Dia da Ovulação (Pico Fértil)",
      badge: `Dia ${cycleDay} do ciclo (Dia da Ovulação): Pico hormonal e força máxima. Período indicado para cargas elevadas (80-85% 1RM) e maior rendimento nos exercícios compostos.`
    };
  }

  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) {
    return {
      key: "fertile",
      label: "Período Fértil",
      badge: `Dia ${cycleDay} do ciclo (Período Fértil / Ovulatório): Estrogénio elevado e ótima disposição neuromuscular. Excelente momento para progressão de cargas (75-85% 1RM).`
    };
  }

  if (cycleDay > menstrualEnd && cycleDay < fertileStart) {
    return {
      key: "follicular",
      label: "Fase Folicular",
      badge: `Dia ${cycleDay} do ciclo (Fase Folicular): Subida gradual de estrogénio. Fase propícia para hipertrofia com progressão constante de carga (70-80% 1RM) e recuperação acelerada.`
    };
  }

  return {
    key: "luteal",
    label: "Fase Lútea",
    badge: `Dia ${cycleDay} do ciclo (Fase Lútea): Progesterona elevada. Priorize cadência controlada (3s na descida excêntrica), máquinas guiadas e prevenção de sobrecarga articular.`
  };
}

// Filtro de grupos musculares na API externa
const muscleFilterMap = {
  pernas: ["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"],
  superiores: ["chest", "lats", "middle back", "lower back", "shoulders", "biceps", "triceps", "forearms", "traps"],
  core: ["abdominals"],
  fullbody: ["quadriceps", "chest", "lats", "shoulders", "hamstrings", "glutes", "biceps", "triceps"]
};

// Dicionário de tradução para nomes de musculação
const termsTranslationPT = {
  "Barbell Squat": "Agachamento Livre com Barra Olímpica",
  "Leg Press": "Leg Press 45º Tradicional",
  "Romanian Deadlift": "Levantamento Terra Romeno (Stiff)",
  "Leg Extensions": "Cadeira Extensora de Joelhos",
  "Lying Leg Curls": "Mesa Flexora Deitada",
  "Seated Leg Curl": "Cadeira Flexora Sentada",
  "Calf Press On The Leg Press Machine": "Panturrilhas no Leg Press 45º",
  "Standing Calf Raises": "Elevação de Panturrilhas em Pé",
  "Glute Ham Raise": "Elevação Pélvica com Barra Acolchoada",
  "Barbell Lunge": "Avanço / Passada com Barra",
  "Dumbbell Lunges": "Passada com Halteres",
  "Hack Squat": "Agachamento no Aparelho Hack",
  "Thigh Abductor": "Cadeira Abdutora Sentada",
  "Thigh Adductor": "Cadeira Adutora Sentada",
  "Sumo Deadlift": "Levantamento Terra Sumô",
  "Front Barbell Squat": "Agachamento Frontal com Barra",
  "Barbell Bench Press": "Supino Reto com Barra Olímpica",
  "Dumbbell Bench Press": "Supino Reto com Halteres",
  "Incline Dumbbell Bench Press": "Supino Inclinado com Halteres",
  "Incline Barbell Bench Press": "Supino Inclinado com Barra",
  "Decline Barbell Bench Press": "Supino Declinado com Barra",
  "Lat Pulldown": "Puxada Frontal na Polia Alta",
  "Wide-Grip Lat Pulldown": "Puxada Frontal Aberta com Barra",
  "Close-Grip Lat Pulldown": "Puxada com Triângulo na Polia",
  "Bent Over Barbell Row": "Remada Curvada com Barra",
  "Seated Cable Rows": "Remada Baixa Sentada no Cabo",
  "One-Arm Dumbbell Row": "Remada Unilateral com Halter (Serrote)",
  "Dumbbell Shoulder Press": "Desenvolvimento com Halteres no Banco",
  "Side Lateral Raise": "Elevação Lateral com Halteres",
  "Standing Military Press": "Desenvolvimento Militar em Pé com Barra",
  "Triceps Pushdown": "Tríceps Corda no Pulley Alto",
  "Cable Rope Overhead Triceps Extension": "Tríceps Francês na Polia com Corda",
  "Barbell Curl": "Rosca Direta com Barra Olímpica",
  "Dumbbell Bicep Curl": "Rosca Alternada com Halteres",
  "Hammer Curls": "Rosca Martelo com Halteres",
  "Preacher Curl": "Rosca Scott no Banco",
  "Concentration Curls": "Rosca Concentrada com Halter",
  "Dumbbell Incline Row": "Remada Inclinada com Halteres",
  "Cable Crossover": "Crucifixo no Crossover com Cabos",
  "Butterfly": "Voador / Peck Deck Peitoral",
  "Dips": "Mergulho em Paralelas",
  "Face Pull": "Face Pull na Polia Alta com Corda",
  "Reverse Flyes": "Crucifixo Invertido na Máquina",
  "Cable Crunch": "Abdominal na Polia Alta com Corda",
  "Hanging Leg Raise": "Elevação de Pernas na Cadeira do Capitão",
  "Plank": "Prancha Frontal Isométrica Tradicional",
  "Russian Twist": "Rotação Russa com Anilha",
  "Decline Crunch": "Abdominal Declinado no Banco",
  "Ab Roller": "Rolo Abdominal",
  "Side Plank": "Prancha Lateral Estática",
  "Hyperextensions": "Hiperextensão no Banco Romano",
  "Dead Bug": "Deadbug com Peso",
  "Mountain Climbers": "Escalador na Prancha Alta",
  "Smith Machine Squat": "Agachamento no Aparelho Smith",
  "Smith Machine Calf Raise": "Panturrilhas no Aparelho Smith",
  "Barbell Shrug": "Encolhimento de Ombros com Barra",
  "Dumbbell Shrug": "Encolhimento de Ombros com Halteres"
};

// Elementos do DOM
const calendarGrid = document.getElementById("calendarGrid");
const currentMonthLabel = document.getElementById("currentMonthLabel");
const cycleDaySummary = document.getElementById("cycleDaySummary");
const lastPeriodInput = document.getElementById("lastPeriodInput");
const cycleLengthInput = document.getElementById("cycleLengthInput");
const btnLogPeriod = document.getElementById("btnLogPeriod");
const btnPrevMonth = document.getElementById("btnPrevMonth");
const btnNextMonth = document.getElementById("btnNextMonth");
const muscleSelect = document.getElementById("muscleSelect");
const btnConsultar = document.getElementById("btnConsultar");
const btnMudarPlanilha = document.getElementById("btnMudarPlanilha");
const quoteText = document.getElementById("quoteText");
const quoteAuthor = document.getElementById("quoteAuthor");
const phaseDescription = document.getElementById("phaseDescription");
const sheetBadge = document.getElementById("sheetBadge");
const exerciseList = document.getElementById("exerciseList");

// Inicializa o input de data com o dia de hoje
lastPeriodInput.value = formatDateInput(lastPeriodStartDate);

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function translateExerciseName(name) {
  if (termsTranslationPT[name]) return termsTranslationPT[name];

  try {
    const encoded = encodeURIComponent(name);
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|pt-br`);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (e) {
    // Fallback regex abaixo
  }

  let translated = name;
  const replacements = [
    [/Barbell/gi, "com Barra"],
    [/Dumbbell/gi, "com Halteres"],
    [/Cable/gi, "na Polia / Cabo"],
    [/Machine/gi, "na Máquina"],
    [/Smith Machine/gi, "no Smith"],
    [/Squat/gi, "Agachamento"],
    [/Bench Press/gi, "Supino"],
    [/Deadlift/gi, "Levantamento Terra"],
    [/Curl/gi, "Rosca"],
    [/Row/gi, "Remada"],
    [/Press/gi, "Desenvolvimento"],
    [/Raise/gi, "Elevação"],
    [/Extension/gi, "Extensão"],
    [/Lunge/gi, "Avanço / Passada"],
    [/Incline/gi, "Inclinado"],
    [/Decline/gi, "Declinado"],
    [/Standing/gi, "em Pé"],
    [/Seated/gi, "Sentada"],
    [/Lying/gi, "Deitada"]
  ];

  replacements.forEach(([regex, replacement]) => {
    translated = translated.replace(regex, replacement);
  });

  return translated.trim();
}

async function fetchQuoteAPI() {
  try {
    const res = await fetch("https://dummyjson.com/quotes/random");
    if (!res.ok) throw new Error("Erro na API de frases");
    const data = await res.json();
    const encoded = encodeURIComponent(data.quote);
    const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|pt-br`);
    const transData = await transRes.json();
    return {
      text: transData?.responseData?.translatedText || data.quote,
      author: data.author || "Anónimo"
    };
  } catch (err) {
    return {
      text: "A consistência nos treinos de musculação transforma esforço em superação diária.",
      author: "CicloFit"
    };
  }
}

async function fetchExercisesAPI(muscleGroup) {
  try {
    if (!cachedApiExercises) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("Erro ao consultar base de treinos");
      cachedApiExercises = await res.json();
    }

    const targetMuscles = muscleFilterMap[muscleGroup] || [];
    const filtered = cachedApiExercises.filter((ex) => {
      const matchPrimary = targetMuscles.includes(ex.primaryMuscles?.[0]);
      const isStrength = !ex.category || ex.category === "strength" || ex.category === "weightlifting";
      return matchPrimary && isStrength;
    });

    const selected = shuffleArray(filtered).slice(0, 6);

    return await Promise.all(
      selected.map(async (ex) => {
        const namePT = await translateExerciseName(ex.name);
        return {
          name: namePT,
          series: "3 a 4 séries",
          reps: "10 a 12 reps",
          rest: "60s a 90s"
        };
      })
    );
  } catch (err) {
    return [
      { name: "Agachamento Livre com Barra Olímpica", series: "4 séries", reps: "8 a 10 reps", rest: "90s" },
      { name: "Leg Press 45º Tradicional", series: "4 séries", reps: "10 a 12 reps", rest: "75s" },
      { name: "Supino Reto com Halteres", series: "4 séries", reps: "10 reps", rest: "60s" },
      { name: "Puxada Frontal na Polia Alta", series: "4 séries", reps: "10 a 12 reps", rest: "60s" },
      { name: "Desenvolvimento com Halteres no Banco", series: "3 séries", reps: "10 a 12 reps", rest: "60s" },
      { name: "Abdominal na Polia Alta com Corda", series: "3 séries", reps: "15 reps", rest: "45s" }
    ];
  }
}

// Renderização do Calendário Mensal Estilo Flo
function renderFloCalendar() {
  calendarGrid.innerHTML = "";

  const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  currentMonthLabel.textContent = monthFormatter.format(new Date(viewedYear, viewedMonth, 1));

  const firstDayOfMonth = new Date(viewedYear, viewedMonth, 1).getDay(); // 0 (Dom) a 6 (Sáb)
  const daysInMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();

  // Espaços vazios antes do dia 1
  for (let i = 0; i < firstDayOfMonth; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "flo-day-cell empty";
    calendarGrid.appendChild(emptyCell);
  }

  // Dias do mês
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(viewedYear, viewedMonth, day);
    const cycleDay = getCycleDayForDate(cellDate);
    const phase = getPhaseFromCycleDay(cycleDay, totalCycleDays);

    const cell = document.createElement("div");
    cell.className = `flo-day-cell flo-phase-${phase.key}`;
    cell.title = `${day}/${viewedMonth + 1} • Dia ${cycleDay} do ciclo (${phase.label})`;

    if (cellDate.getTime() === todayDate.getTime()) {
      cell.classList.add("is-today");
    }

    if (cellDate.getTime() === selectedCalendarDate.getTime()) {
      cell.classList.add("selected");
    }

    cell.innerHTML = `
      <span class="flo-day-number">${day}</span>
      <span class="flo-cycle-tag">D${cycleDay}</span>
    `;

    cell.addEventListener("click", () => {
      selectedCalendarDate = cellDate;
      renderFloCalendar();
      updatePhaseDescription();
    });

    calendarGrid.appendChild(cell);
  }
}

function updatePhaseDescription() {
  const cycleDay = getCycleDayForDate(selectedCalendarDate);
  const currentPhase = getPhaseFromCycleDay(cycleDay, totalCycleDays);
  const formattedDate = selectedCalendarDate.toLocaleDateString("pt-BR");

  cycleDaySummary.textContent = `${formattedDate} • Dia ${cycleDay} do ciclo (${currentPhase.label})`;
  phaseDescription.textContent = currentPhase.badge;
  sheetBadge.textContent = `Ficha #${currentWorkoutVersion} (Ciclo de ${totalCycleDays} Dias)`;
}

// Renderização dos cards de exercícios
function renderWorkoutExercises(workoutPlan) {
  exerciseList.innerHTML = "";

  workoutPlan.forEach((exercise, index) => {
    const colDiv = document.createElement("div");
    colDiv.className = "col-12 col-md-6 col-lg-4";

    const card = document.createElement("div");
    card.className = "exercise-card h-100 d-flex flex-column justify-content-between";

    const numberBadge = document.createElement("span");
    numberBadge.className = "exercise-number align-self-start";
    numberBadge.textContent = `EXERCÍCIO ${index + 1}`;

    const title = document.createElement("h3");
    title.className = "exercise-title flex-grow-1";
    title.textContent = exercise.name;

    const metaBox = document.createElement("div");
    metaBox.className = "exercise-meta-box d-flex justify-content-between align-items-center mb-0 mt-3";
    metaBox.innerHTML = `
      <p class="exercise-meta-item"><strong>Séries:</strong> ${exercise.series || "3 a 4"}</p>
      <p class="exercise-meta-item"><strong>Reps:</strong> ${exercise.reps || "10 a 12"}</p>
      <p class="exercise-meta-item"><strong>Pausa:</strong> ${exercise.rest || "60s"}</p>
    `;

    card.appendChild(numberBadge);
    card.appendChild(title);
    card.appendChild(metaBox);

    colDiv.appendChild(card);
    exerciseList.appendChild(colDiv);
  });
}

// Eventos do Calendário Flo
btnPrevMonth.addEventListener("click", () => {
  viewedMonth--;
  if (viewedMonth < 0) {
    viewedMonth = 11;
    viewedYear--;
  }
  renderFloCalendar();
});

btnNextMonth.addEventListener("click", () => {
  viewedMonth++;
  if (viewedMonth > 11) {
    viewedMonth = 0;
    viewedYear++;
  }
  renderFloCalendar();
});

lastPeriodInput.addEventListener("change", (e) => {
  if (!e.target.value) return;
  lastPeriodStartDate = parseDateInput(e.target.value);
  viewedMonth = lastPeriodStartDate.getMonth();
  viewedYear = lastPeriodStartDate.getFullYear();
  renderFloCalendar();
  updatePhaseDescription();
});

btnLogPeriod.addEventListener("click", () => {
  lastPeriodStartDate = normalizeDate(selectedCalendarDate);
  lastPeriodInput.value = formatDateInput(lastPeriodStartDate);
  renderFloCalendar();
  updatePhaseDescription();
});

cycleLengthInput.addEventListener("change", (e) => {
  let val = parseInt(e.target.value, 10);
  if (isNaN(val) || val < 15) val = 15;
  if (val > 60) val = 60;
  totalCycleDays = val;
  e.target.value = val;

  renderFloCalendar();
  updatePhaseDescription();
});

// Evento 1: Gerar Treino
btnConsultar.addEventListener("click", async () => {
  btnConsultar.disabled = true;
  btnConsultar.textContent = "A carregar treino...";

  const selectedMuscle = muscleSelect.value;
  currentWorkoutVersion = 1;

  try {
    const [quoteData, exercises] = await Promise.all([
      fetchQuoteAPI(),
      fetchExercisesAPI(selectedMuscle)
    ]);

    quoteText.textContent = `"${quoteData.text}"`;
    quoteAuthor.textContent = `- ${quoteData.author}`;

    updatePhaseDescription();
    renderWorkoutExercises(exercises);
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    btnConsultar.disabled = false;
    btnConsultar.textContent = "Gerar Treino";
  }
});

// Evento 2: Gerar Nova Ficha de Treino
btnMudarPlanilha.addEventListener("click", async () => {
  btnMudarPlanilha.disabled = true;
  btnMudarPlanilha.textContent = "A gerar nova ficha de treino...";

  currentWorkoutVersion++;
  const selectedMuscle = muscleSelect.value;

  try {
    const novosExercicios = await fetchExercisesAPI(selectedMuscle);
    updatePhaseDescription();
    renderWorkoutExercises(novosExercicios);
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    btnMudarPlanilha.disabled = false;
    btnMudarPlanilha.textContent = "Gerar nova ficha de treino";
  }
});

// Inicialização imediata
renderFloCalendar();
updatePhaseDescription();