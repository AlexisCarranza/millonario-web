// ===================================================
// ¿Quién Quiere Ser Millonario? - Motor del juego (JS puro)
// Todo el estado vive en el navegador. No requiere backend.
// ===================================================

const MILESTONES = [5, 10]; // índices (0-based) que son "peldaños seguros": pregunta 5 y 10

let questions = [];
let state = {
  current: 0,
  won: 0,
  selected: null,
  revealed: false,
  lifelines: { fifty: true, audience: true, phone: true },
  eliminated: []
};

const el = (id) => document.getElementById(id);
const screens = document.querySelectorAll('.screen');

function showScreen(id) {
  screens.forEach(s => s.classList.remove('active'));
  el(id).classList.add('active');
}

function playSound(id) {
  const audio = el(id);
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {}); // ignora error si el navegador bloquea autoplay
}

// ---------- Carga de preguntas ----------
async function loadQuestions() {
  try {
    const res = await fetch('data/questions.json');
    questions = await res.json();
    el('load-status').textContent = `${questions.length} preguntas cargadas correctamente.`;
  } catch (e) {
    el('load-status').textContent = 'No se pudo cargar data/questions.json. Revisa que el archivo exista.';
  }
}

// ---------- Pantalla de juego ----------
function startGame() {
  state = {
    current: 0,
    won: 0,
    selected: null,
    revealed: false,
    lifelines: { fifty: true, audience: true, phone: true },
    eliminated: []
  };
  el('ll-5050').disabled = false;
  el('ll-audience').disabled = false;
  el('ll-phone').disabled = false;
  showScreen('screen-game');
  renderLadder();
  renderQuestion();
}

function renderLadder() {
  const ladder = el('money-ladder');
  ladder.innerHTML = '';
  questions.forEach((q, i) => {
    const row = document.createElement('div');
    row.className = 'money-row';
    if (MILESTONES.includes(i + 1)) row.classList.add('milestone');
    if (i === state.current) row.classList.add('current');
    else if (i < state.current) row.classList.add('passed');
    row.textContent = `${i + 1}.  $${q.valor.toLocaleString('es-CO')}`;
    ladder.appendChild(row);
  });
}

function renderQuestion() {
  const q = questions[state.current];
  state.selected = null;
  state.revealed = false;
  state.eliminated = [];

  el('question-text').textContent = q.pregunta;
  ['A', 'B', 'C', 'D'].forEach(letra => {
    el('ans-' + letra).textContent = q.opciones[letra];
    const btn = document.querySelector(`.answer-btn[data-letter="${letra}"]`);
    btn.classList.remove('selected', 'correct', 'wrong', 'eliminated');
    btn.disabled = false;
  });

  el('btn-reveal').disabled = false;
  el('btn-continue').disabled = true;
  renderLadder();

  // Música de suspenso mientras el presentador espera la respuesta del jugador
  const tension = el('snd-tension');
  tension.currentTime = 0;
  tension.volume = 0.5;
  tension.play().catch(() => {});
}

function stopTension() {
  const tension = el('snd-tension');
  tension.pause();
  tension.currentTime = 0;
}

function selectAnswer(letra) {
  if (state.revealed) return;
  state.selected = letra;
  document.querySelectorAll('.answer-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector(`.answer-btn[data-letter="${letra}"]`).classList.add('selected');
  playSound('snd-select');
}

function revealAnswer() {
  if (!state.selected) {
    alert('Selecciona una respuesta antes de revelar.');
    return;
  }
  const q = questions[state.current];
  state.revealed = true;
  el('btn-reveal').disabled = true;
  stopTension();
  playSound('snd-reveal');

  document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
  document.querySelector(`.answer-btn[data-letter="${q.correcta}"]`).classList.add('correct');

  if (state.selected === q.correcta) {
    state.won = q.valor;
    setTimeout(() => playSound('snd-correct'), 900);
    el('btn-continue').disabled = false;
  } else {
    document.querySelector(`.answer-btn[data-letter="${state.selected}"]`).classList.add('wrong');
    setTimeout(() => playSound('snd-wrong'), 900);
    // Calcula el último peldaño seguro alcanzado
    const safe = MILESTONES.filter(m => m <= state.current).pop();
    state.won = safe ? questions[safe - 1].valor : 0;
    setTimeout(() => endGame(false), 1800);
  }
}

function nextQuestion() {
  state.current++;
  if (state.current >= questions.length) {
    endGame(true);
  } else {
    renderQuestion();
  }
}

function walkAway() {
  stopTension();
  endGame(false, true);
}

function endGame(won, walked = false) {
  stopTension();
  showScreen('screen-end');
  playSound('snd-final');
  if (won) {
    el('end-title').textContent = '¡FELICIDADES, ERES MILLONARIO!';
  } else if (walked) {
    el('end-title').textContent = 'Te retiraste del juego';
  } else {
    el('end-title').textContent = '¡Juego terminado!';
  }
  el('end-amount').textContent = `Ganaste: $${state.won.toLocaleString('es-CO')}`;
}

// ---------- Ayudas (lifelines) ----------
function useFiftyFifty() {
  if (!state.lifelines.fifty || state.revealed) return;
  state.lifelines.fifty = false;
  el('ll-5050').disabled = true;

  const q = questions[state.current];
  const wrongLetters = ['A', 'B', 'C', 'D'].filter(l => l !== q.correcta);
  // elimina 2 de las 3 incorrectas al azar
  const toRemove = wrongLetters.sort(() => Math.random() - 0.5).slice(0, 2);
  toRemove.forEach(l => {
    document.querySelector(`.answer-btn[data-letter="${l}"]`).classList.add('eliminated');
  });
}

function useAudience() {
  if (!state.lifelines.audience || state.revealed) return;
  state.lifelines.audience = false;
  el('ll-audience').disabled = true;

  const q = questions[state.current];
  const visibleLetters = ['A', 'B', 'C', 'D'].filter(l =>
    !document.querySelector(`.answer-btn[data-letter="${l}"]`).classList.contains('eliminated')
  );
  // genera porcentajes simulados, favoreciendo la correcta
  let pcts = {};
  let remaining = 100;
  visibleLetters.forEach((l, i) => {
    if (l === q.correcta) return; // se asigna al final
  });
  const correctShare = Math.floor(45 + Math.random() * 35); // 45-80%
  pcts[q.correcta] = correctShare;
  remaining -= correctShare;
  const others = visibleLetters.filter(l => l !== q.correcta);
  others.forEach((l, i) => {
    if (i === others.length - 1) { pcts[l] = remaining; }
    else {
      const share = Math.floor(Math.random() * remaining);
      pcts[l] = share;
      remaining -= share;
    }
  });

  const bars = el('audience-bars');
  bars.innerHTML = '';
  ['A', 'B', 'C', 'D'].forEach(l => {
    if (pcts[l] === undefined) return;
    const wrap = document.createElement('div');
    wrap.className = 'audience-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'audience-bar';
    bar.style.height = '0px';
    wrap.innerHTML = `<div>${pcts[l]}%</div>`;
    wrap.appendChild(bar);
    const label = document.createElement('div');
    label.textContent = l;
    wrap.appendChild(label);
    bars.appendChild(wrap);
    setTimeout(() => { bar.style.height = (pcts[l] * 2) + 'px'; }, 100);
  });

  showScreen('screen-audience');
}

function usePhone() {
  if (!state.lifelines.phone || state.revealed) return;
  state.lifelines.phone = false;
  el('ll-phone').disabled = true;

  const q = questions[state.current];
  const confident = Math.random() < 0.7; // 70% de las veces tu amigo acierta
  const guess = confident ? q.correcta : ['A', 'B', 'C', 'D'].filter(l => l !== q.correcta)[Math.floor(Math.random() * 3)];
  const frases = confident
    ? [`Mmm... estoy bastante seguro que es la ${guess}.`, `¡Sin duda es la ${guess}!`, `Yo diría que la ${guess}, pero confirma.`]
    : [`No estoy muy seguro, pero creo que es la ${guess}...`, `Tal vez la ${guess}, no me acuerdo bien.`];
  el('phone-text').textContent = frases[Math.floor(Math.random() * frases.length)];
  showScreen('screen-phone');
}

// ---------- Eventos ----------
document.addEventListener('DOMContentLoaded', () => {
  loadQuestions();

  el('btn-start').addEventListener('click', () => {
    el('snd-intro').pause();
    startGame();
  });
  playSound('snd-intro');
  el('btn-settings').addEventListener('click', () => showScreen('screen-settings'));
  el('btn-back-start').addEventListener('click', () => showScreen('screen-start'));

  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => selectAnswer(btn.dataset.letter));
  });

  el('btn-reveal').addEventListener('click', revealAnswer);
  el('btn-continue').addEventListener('click', nextQuestion);
  el('btn-walk').addEventListener('click', walkAway);

  el('ll-5050').addEventListener('click', useFiftyFifty);
  el('ll-audience').addEventListener('click', useAudience);
  el('ll-phone').addEventListener('click', usePhone);

  el('btn-audience-back').addEventListener('click', () => showScreen('screen-game'));
  el('btn-phone-back').addEventListener('click', () => showScreen('screen-game'));

  el('btn-restart').addEventListener('click', () => showScreen('screen-start'));
});
