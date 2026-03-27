/**
 * RBI Assistant Exam Preparation App
 * Main JavaScript Application
 */

// ===================== APP STATE =====================
const AppState = {
  currentSubject: 'reasoning',
  currentPage: 'dashboard',
  quizState: {
    questions: [],
    currentIndex: 0,
    answers: {},
    startTime: null,
    timerInterval: null,
    timeLimit: 0,
    submitted: false,
    mode: 'practice' // 'practice' | 'mock' | 'timed'
  },
  progress: JSON.parse(localStorage.getItem('rbi_progress') || '{}'),
  studyPlan: null,
  allData: {}
};

// ===================== DATA LOADING =====================
const SUBJECTS = [
  { id: 'reasoning', name: 'Reasoning Ability', icon: '🧩', file: 'reasoning.json', color: '#2980b9' },
  { id: 'quantitative', name: 'Numerical Ability', icon: '🔢', file: 'quantitative.json', color: '#27ae60' },
  { id: 'english', name: 'English Language', icon: '📝', file: 'english.json', color: '#8e44ad' },
  { id: 'general-awareness', name: 'General Awareness', icon: '🌐', file: 'general-awareness.json', color: '#e67e22' },
  { id: 'computer-knowledge', name: 'Computer Knowledge', icon: '💻', file: 'computer-knowledge.json', color: '#e74c3c' }
];

async function loadData() {
  try {
    const [studyPlan, ...subjects] = await Promise.all([
      fetch('data/study-plan.json').then(r => r.json()),
      ...SUBJECTS.map(s => fetch(`data/pyqs/${s.file}`).then(r => r.json()))
    ]);
    AppState.studyPlan = studyPlan;
    SUBJECTS.forEach((s, i) => {
      AppState.allData[s.id] = subjects[i];
    });
    return true;
  } catch (e) {
    console.error('Failed to load data:', e);
    return false;
  }
}

function getAllQuestions(subjectId) {
  const data = AppState.allData[subjectId];
  if (!data) return [];
  return data.topics.flatMap(t =>
    t.questions.map(q => ({ ...q, topic: t.name, subject: data.subject }))
  );
}

function getAllQuestionsAll() {
  return SUBJECTS.flatMap(s => getAllQuestions(s.id));
}

// ===================== NAVIGATION =====================
function navigate(page, params = {}) {
  AppState.currentPage = page;
  window.location.hash = page + (params.subject ? '/' + params.subject : '');
  renderPage(page, params);
}

function handleHash() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  const [page, subject] = hash.split('/');
  renderPage(page, subject ? { subject } : {});
}

function renderPage(page, params = {}) {
  const main = document.getElementById('main-content');
  updateNavActive(page);

  switch (page) {
    case 'dashboard': main.innerHTML = renderDashboard(); bindDashboard(); break;
    case 'schedule': main.innerHTML = renderSchedule(); bindSchedule(); break;
    case 'pyqs': main.innerHTML = renderPYQs(params.subject); bindPYQs(params.subject); break;
    case 'practice': main.innerHTML = renderPractice(params.subject); bindPractice(params.subject); break;
    case 'mock': main.innerHTML = renderMockSetup(); bindMockSetup(); break;
    case 'concepts': main.innerHTML = renderConcepts(params.subject); break;
    case 'results': main.innerHTML = renderResults(); bindResults(); break;
    default: main.innerHTML = renderDashboard(); bindDashboard();
  }
}

function updateNavActive(page) {
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}

// ===================== DASHBOARD =====================
function renderDashboard() {
  const totalPYQs = SUBJECTS.reduce((sum, s) => sum + getAllQuestions(s.id).length, 0);
  const answered = Object.keys(AppState.progress).length;
  const correct = Object.values(AppState.progress).filter(v => v.correct).length;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  const examDate = getExamCountdown();
  const subjectCards = SUBJECTS.map(s => {
    const qs = getAllQuestions(s.id).length;
    const done = Object.keys(AppState.progress).filter(k => k.startsWith(s.id)).length;
    const pct = qs > 0 ? Math.round((done / qs) * 100) : 0;
    return `
      <a class="subject-card" onclick="navigate('pyqs', {subject:'${s.id}'}); return false;" href="#">
        <div class="subject-icon">${s.icon}</div>
        <div class="subject-name">${s.name}</div>
        <div class="subject-info">${qs} PYQs · ${done} attempted</div>
        <div class="subject-progress">
          <div class="subject-progress-bar" style="width: ${pct}%"></div>
        </div>
      </a>`;
  }).join('');

  return `
    <div class="hero">
      <div class="hero-content">
        <h2>🏦 RBI Assistant Exam Prep</h2>
        <p>Your personalized study portal. Daily 6–8 PM sessions, PYQs, concept notes, and full mock tests — everything you need to crack RBI Assistant!</p>
        <div class="hero-actions" style="margin-top:16px">
          <button class="btn btn-accent" onclick="navigate('mock')">🎯 Start Mock Test</button>
          <button class="btn btn-outline" style="border-color:white;color:white" onclick="navigate('schedule')">📅 Study Schedule</button>
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div class="countdown-box">
          <div class="countdown-number" id="cd-days">--</div>
          <div class="countdown-label">Days Left</div>
        </div>
        <div class="countdown-box">
          <div class="countdown-number">${totalPYQs}</div>
          <div class="countdown-label">Total PYQs</div>
        </div>
        <div class="countdown-box">
          <div class="countdown-number">${accuracy}%</div>
          <div class="countdown-label">Accuracy</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <h3>Total PYQs</h3>
          <div class="stat-value">${totalPYQs}</div>
        </div>
      </div>
      <div class="stat-card accent">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>Attempted</h3>
          <div class="stat-value">${answered}</div>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">🎯</div>
        <div class="stat-info">
          <h3>Accuracy</h3>
          <div class="stat-value">${accuracy}%</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">⏰</div>
        <div class="stat-info">
          <h3>Study Time</h3>
          <div class="stat-value">6–8 PM</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:24px">
      <div class="card-header">
        <h2>📋 Exam Pattern</h2>
      </div>
      ${renderExamPattern()}
    </div>

    <div class="page-header">
      <h1>📖 Subjects</h1>
      <p>Click on a subject to view PYQs and practice questions</p>
    </div>
    <div class="subjects-grid">${subjectCards}</div>

    <div class="card">
      <div class="card-header">
        <h2>⚡ Today's Plan (6:00–8:00 PM)</h2>
      </div>
      ${renderTodayPlan()}
    </div>
  `;
}

function renderExamPattern() {
  if (!AppState.studyPlan) return '';
  const phases = AppState.studyPlan.examPattern.phases;
  return phases.map(phase => `
    <div style="margin-bottom:20px">
      <h3 style="font-size:1rem;color:var(--primary);margin-bottom:10px">${phase.name}
        <span style="font-size:0.8rem;color:var(--text-light);font-weight:normal"> — ${phase.duration} min | ${phase.totalMarks} marks</span>
      </h3>
      <table class="pattern-table">
        <thead><tr><th>Section</th><th>Questions</th><th>Marks</th><th>Time</th></tr></thead>
        <tbody>${phase.sections.map(s => `
          <tr><td>${s.name}</td><td>${s.questions}</td><td>${s.marks}</td><td>${s.time} min</td></tr>
        `).join('')}</tbody>
      </table>
    </div>
  `).join('');
}

function renderTodayPlan() {
  if (!AppState.studyPlan) return '<p>Loading...</p>';
  const allDays = AppState.studyPlan.studyPlan.schedule.flatMap(w => w.days);
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayMap = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' };
  const todayName = dayMap[dayOfWeek];
  const todayDay = allDays.find(d => d.day.includes(todayName)) || allDays[0];

  return `
    <p style="color:var(--text-light);font-size:0.85rem;margin-bottom:12px">
      📅 ${todayDay.day} · ${todayDay.time}
    </p>
    <div class="day-tasks">
      ${todayDay.tasks.map(t => `
        <div class="task-item">
          <span class="task-time">${t.duration}</span>
          <span class="task-badge ${t.type}">${t.type.toUpperCase()}</span>
          <span>${t.activity}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function getExamCountdown() {
  // Approximate exam date (1 month from now)
  const target = new Date();
  target.setDate(target.getDate() + 28);
  return target;
}

function bindDashboard() {
  const target = getExamCountdown();
  const cdEl = document.getElementById('cd-days');
  if (cdEl) {
    const days = Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24));
    cdEl.textContent = days > 0 ? days : 0;
  }
}

// ===================== SCHEDULE =====================
function renderSchedule() {
  if (!AppState.studyPlan) return '<p>Loading...</p>';
  const { schedule } = AppState.studyPlan.studyPlan;

  const weeksHtml = schedule.map(week => `
    <div class="schedule-week">
      <div class="week-header">
        <h3>📅 Week ${week.week}</h3>
        <span class="week-badge">${week.theme}</span>
      </div>
      ${week.days.map(day => `
        <div class="day-row">
          <div>
            <div class="day-label">${day.day}</div>
            <div style="font-size:0.8rem;color:var(--text-light)">${day.time}</div>
          </div>
          <div class="day-tasks">
            ${day.tasks.map(t => `
              <div class="task-item">
                <span class="task-time">${t.duration}</span>
                <span class="task-badge ${t.type}">${t.type.toUpperCase()}</span>
                <span style="font-size:0.88rem">${t.activity}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  return `
    <div class="page-header">
      <h1>📅 4-Week Study Schedule</h1>
      <p>Daily 6:00 PM – 8:00 PM slot · Maximum 2 hours per day · Exam-aligned preparation</p>
    </div>
    <div class="card" style="margin-bottom:20px;padding:16px 20px">
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <span class="task-badge concept" style="padding:5px 14px">CONCEPT = Theory</span>
        <span class="task-badge quiz" style="padding:5px 14px">QUIZ = Practice Set</span>
        <span class="task-badge mock" style="padding:5px 14px">MOCK = Full Test</span>
        <span class="task-badge revision" style="padding:5px 14px">REVISION = Review</span>
        <span class="task-badge pyq" style="padding:5px 14px">PYQ = Previous Year</span>
      </div>
    </div>
    ${weeksHtml}
  `;
}

function bindSchedule() {}

// ===================== PYQs =====================
function renderPYQs(subjectId) {
  const subject = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0];
  const data = AppState.allData[subject.id];

  const tabsHtml = SUBJECTS.map(s => `
    <button class="tab-btn ${s.id === subject.id ? 'active' : ''}"
      onclick="navigate('pyqs', {subject:'${s.id}'})">
      ${s.icon} ${s.name}
    </button>
  `).join('');

  if (!data) return `<p>Loading...</p>`;

  const topicsHtml = data.topics.map(topic => {
    const qHtml = topic.questions.map(q => {
      const prog = AppState.progress[`${subject.id}_${q.id}`];
      return `
        <div class="question-card" id="qcard-${q.id}">
          <div class="question-meta">
            <span class="question-badge q-id">Q${q.id}</span>
            <span class="question-badge q-year">📅 ${q.year}</span>
            <span class="question-badge q-topic">${topic.name}</span>
            ${prog ? `<span class="question-badge" style="background:${prog.correct?'#e8f8f5':'#fde8e8'};color:${prog.correct?'#27ae60':'#e74c3c'}">${prog.correct ? '✓ Correct' : '✗ Wrong'}</span>` : ''}
          </div>
          <div class="question-text">${escHtml(q.question)}</div>
          <div class="options-list">
            ${q.options.map((opt, i) => `
              <button class="option-btn ${getOptionClass(subject.id, q, i)}"
                onclick="selectOption('${subject.id}', '${q.id}', ${i}, ${q.answer}, this)">
                <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                <span>${escHtml(opt)}</span>
              </button>
            `).join('')}
          </div>
          <div class="explanation-box ${prog ? 'show' : ''}" id="exp-${q.id}">
            <strong>Explanation:</strong> ${escHtml(q.explanation)}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="concept-section">
        <h3>${topic.name} <span style="color:var(--text-light);font-size:0.85rem;font-weight:normal">(${topic.questions.length} questions)</span></h3>
        ${qHtml}
      </div>
    `;
  }).join('');

  return `
    <div class="page-header">
      <h1>📚 Previous Year Questions</h1>
      <p>Subject-wise PYQs from RBI Assistant examinations (2021–2023)</p>
    </div>
    <div class="tabs">${tabsHtml}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <h2 style="color:var(--primary)">${subject.icon} ${data.subject}</h2>
      <button class="btn btn-primary btn-sm" onclick="startPracticeMode('${subject.id}')">
        🎯 Practice Mode
      </button>
    </div>
    <div id="pyq-questions">${topicsHtml}</div>
  `;
}

function bindPYQs(subjectId) {}

function getOptionClass(subjectId, q, optIndex) {
  const prog = AppState.progress[`${subjectId}_${q.id}`];
  if (!prog) return '';
  if (optIndex === q.answer) return 'correct';
  if (optIndex === prog.selected && optIndex !== q.answer) return 'incorrect';
  return '';
}

function selectOption(subjectId, qId, selectedIdx, correctIdx, btn) {
  const key = `${subjectId}_${qId}`;
  if (AppState.progress[key]) return; // already answered

  const card = btn.closest('.question-card');
  const options = card.querySelectorAll('.option-btn');
  options.forEach((o, i) => {
    o.classList.remove('selected');
    if (i === correctIdx) o.classList.add('correct');
    else if (i === selectedIdx && selectedIdx !== correctIdx) o.classList.add('incorrect');
  });

  const isCorrect = selectedIdx === correctIdx;
  AppState.progress[key] = { selected: selectedIdx, correct: isCorrect };
  saveProgress();

  const expBox = document.getElementById(`exp-${qId}`);
  if (expBox) expBox.classList.add('show');

  showToast(isCorrect ? '✅ Correct!' : '❌ Wrong answer', isCorrect ? 'success' : 'error');
}

function startPracticeMode(subjectId) {
  const qs = getAllQuestions(subjectId);
  startQuiz(qs, 'practice', subjectId);
}

// ===================== PRACTICE (TIMED) =====================
function renderPractice(subjectId) {
  const subject = SUBJECTS.find(s => s.id === subjectId);
  if (!subject) return renderMockSetup();

  const qs = getAllQuestions(subjectId);
  const shuffled = [...qs].sort(() => Math.random() - 0.5).slice(0, 20);
  AppState.quizState = {
    questions: shuffled,
    currentIndex: 0,
    answers: {},
    startTime: Date.now(),
    timerInterval: null,
    timeLimit: 20 * 60,
    submitted: false,
    mode: 'practice',
    subject: subjectId
  };
  return renderQuizUI();
}

function bindPractice(subjectId) {
  startTimer();
}

// ===================== QUIZ UI =====================
function renderQuizUI() {
  const { questions, currentIndex, timeLimit, mode } = AppState.quizState;
  if (!questions.length) return '<p>No questions found.</p>';

  const q = questions[currentIndex];
  const dotsHtml = questions.map((_, i) => {
    let cls = '';
    const a = AppState.quizState.answers[i];
    if (AppState.quizState.submitted) {
      cls = a !== undefined ? (a === questions[i].answer ? 'correct-dot' : 'wrong-dot') : '';
    } else {
      cls = a !== undefined ? 'answered' : '';
    }
    if (i === currentIndex) cls += ' current';
    return `<div class="q-dot ${cls}" onclick="goToQuestion(${i})">${i + 1}</div>`;
  }).join('');

  const mins = Math.floor(timeLimit / 60);
  const optHtml = q.options.map((opt, i) => {
    let cls = '';
    const selected = AppState.quizState.answers[currentIndex];
    if (AppState.quizState.submitted) {
      if (i === q.answer) cls = 'correct';
      else if (i === selected) cls = 'incorrect';
    } else if (i === selected) {
      cls = 'selected';
    }
    return `
      <button class="option-btn ${cls}" onclick="selectQuizOption(${i})" ${AppState.quizState.submitted ? 'disabled' : ''}>
        <span class="option-letter">${String.fromCharCode(65 + i)}</span>
        <span>${escHtml(opt)}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="page-header">
      <h1>🎯 Practice Test – ${q.subject || ''}</h1>
    </div>
    <div class="mock-timer">
      <div>
        <div class="mock-timer-time" id="quiz-timer">${String(mins).padStart(2,'0')}:00</div>
        <div class="mock-timer-info">⏱ Time remaining · ${questions.length} Questions</div>
      </div>
      <div style="display:flex;gap:10px">
        ${!AppState.quizState.submitted
          ? `<button class="btn btn-accent" onclick="submitQuiz()">📊 Submit</button>`
          : `<button class="btn btn-success" onclick="navigate('results')">📋 View Results</button>`
        }
        <button class="btn btn-outline" style="border-color:white;color:white" onclick="navigate('dashboard')">🏠 Home</button>
      </div>
    </div>
    <div class="question-nav">${dotsHtml}</div>
    <div class="quiz-container">
      <div class="question-card">
        <div class="question-meta">
          <span class="question-badge q-id">Q ${currentIndex + 1} / ${questions.length}</span>
          <span class="question-badge q-year">📅 ${q.year}</span>
          <span class="question-badge q-topic">${q.topic}</span>
        </div>
        <div class="question-text">${escHtml(q.question)}</div>
        <div class="options-list">${optHtml}</div>
        ${AppState.quizState.submitted ? `
          <div class="explanation-box show">
            <strong>Explanation:</strong> ${escHtml(q.explanation)}
          </div>
        ` : ''}
      </div>
      <div class="quiz-controls">
        <div class="quiz-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${((currentIndex + 1) / questions.length) * 100}%"></div>
          </div>
          <span>Q ${currentIndex + 1} of ${questions.length}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-outline btn-sm" onclick="goToQuestion(${currentIndex - 1})" ${currentIndex === 0 ? 'disabled' : ''}>◀ Prev</button>
          ${currentIndex < questions.length - 1
            ? `<button class="btn btn-primary btn-sm" onclick="goToQuestion(${currentIndex + 1})">Next ▶</button>`
            : (!AppState.quizState.submitted ? `<button class="btn btn-accent btn-sm" onclick="submitQuiz()">Submit ✓</button>` : '')
          }
        </div>
      </div>
    </div>
  `;
}

function selectQuizOption(optIdx) {
  if (AppState.quizState.submitted) return;
  AppState.quizState.answers[AppState.quizState.currentIndex] = optIdx;
  rerenderQuizUI();
}

function goToQuestion(idx) {
  const { questions } = AppState.quizState;
  if (idx < 0 || idx >= questions.length) return;
  AppState.quizState.currentIndex = idx;
  rerenderQuizUI();
}

function rerenderQuizUI() {
  const main = document.getElementById('main-content');
  main.innerHTML = renderQuizUI();
  if (!AppState.quizState.submitted) {
    const elapsed = Math.floor((Date.now() - AppState.quizState.startTime) / 1000);
    const remaining = Math.max(0, AppState.quizState.timeLimit - elapsed);
    updateTimerDisplay(remaining);
  }
}

function submitQuiz() {
  AppState.quizState.submitted = true;
  clearInterval(AppState.quizState.timerInterval);
  AppState.quizState.timerInterval = null;
  rerenderQuizUI();
  showToast('🎉 Test submitted!', 'success');
}

function startTimer() {
  if (AppState.quizState.timerInterval) clearInterval(AppState.quizState.timerInterval);
  const updateTimer = () => {
    const elapsed = Math.floor((Date.now() - AppState.quizState.startTime) / 1000);
    const remaining = Math.max(0, AppState.quizState.timeLimit - elapsed);
    updateTimerDisplay(remaining);
    if (remaining === 0) {
      clearInterval(AppState.quizState.timerInterval);
      submitQuiz();
    }
  };
  AppState.quizState.timerInterval = setInterval(updateTimer, 1000);
  updateTimer();
}

function updateTimerDisplay(remaining) {
  const el = document.getElementById('quiz-timer');
  if (!el) return;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  if (remaining <= 60) el.classList.add('timer-urgent');
}

// ===================== MOCK TEST =====================
function renderMockSetup() {
  return `
    <div class="page-header">
      <h1>🎯 Mock Tests</h1>
      <p>Simulate actual RBI Assistant exam conditions</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px">
      <div class="card">
        <div class="card-header"><h2>⚡ Quick Subject Test</h2></div>
        <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:16px">
          Practice a specific subject with 10–20 questions
        </p>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${SUBJECTS.map(s => `
            <button class="btn btn-outline btn-sm" onclick="startSubjectTest('${s.id}')">
              ${s.icon} ${s.name}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h2>📝 Prelims Mock (Full)</h2></div>
        <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:16px">
          100 Questions · 60 Minutes<br>
          English (30) + Numerical (35) + Reasoning (35)
        </p>
        <button class="btn btn-primary" onclick="startFullMock('prelims')">
          🚀 Start Prelims Mock
        </button>
      </div>
      <div class="card">
        <div class="card-header"><h2>🏆 Mains Mock (Full)</h2></div>
        <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:16px">
          200 Questions · 135 Minutes<br>
          All 5 subjects (40 each)
        </p>
        <button class="btn btn-accent" onclick="startFullMock('mains')">
          🚀 Start Mains Mock
        </button>
      </div>
      <div class="card">
        <div class="card-header"><h2>📅 PYQ Marathon</h2></div>
        <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:16px">
          All previous year questions in one sitting, sorted by year
        </p>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[2023, 2022, 2021].map(yr => `
            <button class="btn btn-outline btn-sm" onclick="startYearPYQ(${yr})">
              📅 ${yr} PYQ Set
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function bindMockSetup() {}

function startSubjectTest(subjectId) {
  const qs = getAllQuestions(subjectId).sort(() => Math.random() - 0.5).slice(0, 20);
  const subject = SUBJECTS.find(s => s.id === subjectId);
  AppState.quizState = {
    questions: qs,
    currentIndex: 0,
    answers: {},
    startTime: Date.now(),
    timerInterval: null,
    timeLimit: 20 * 60,
    submitted: false,
    mode: 'subject',
    subject: subjectId
  };
  const main = document.getElementById('main-content');
  main.innerHTML = renderQuizUI();
  startTimer();
}

function startFullMock(type) {
  let qs = [];
  let timeLimit;

  if (type === 'prelims') {
    const eng = getAllQuestions('english').sort(() => Math.random() - 0.5).slice(0, 30);
    const num = getAllQuestions('quantitative').sort(() => Math.random() - 0.5).slice(0, 35);
    const rea = getAllQuestions('reasoning').sort(() => Math.random() - 0.5).slice(0, 35);
    qs = [...eng, ...num, ...rea].sort(() => Math.random() - 0.5);
    timeLimit = 60 * 60;
  } else {
    SUBJECTS.forEach(s => {
      const subQs = getAllQuestions(s.id).sort(() => Math.random() - 0.5).slice(0, 40);
      qs.push(...subQs);
    });
    qs = qs.sort(() => Math.random() - 0.5);
    timeLimit = 135 * 60;
  }

  AppState.quizState = {
    questions: qs,
    currentIndex: 0,
    answers: {},
    startTime: Date.now(),
    timerInterval: null,
    timeLimit,
    submitted: false,
    mode: type
  };
  const main = document.getElementById('main-content');
  main.innerHTML = renderQuizUI();
  startTimer();
}

function startYearPYQ(year) {
  const qs = getAllQuestionsAll().filter(q => q.year === year);
  AppState.quizState = {
    questions: qs,
    currentIndex: 0,
    answers: {},
    startTime: Date.now(),
    timerInterval: null,
    timeLimit: qs.length * 60,
    submitted: false,
    mode: 'pyq-year'
  };
  const main = document.getElementById('main-content');
  main.innerHTML = renderQuizUI();
  startTimer();
}

function startQuiz(qs, mode, subject) {
  AppState.quizState = {
    questions: qs,
    currentIndex: 0,
    answers: {},
    startTime: Date.now(),
    timerInterval: null,
    timeLimit: qs.length * 90,
    submitted: false,
    mode,
    subject
  };
  const main = document.getElementById('main-content');
  main.innerHTML = renderQuizUI();
  startTimer();
}

// ===================== RESULTS =====================
function renderResults() {
  const { questions, answers, startTime, submitted } = AppState.quizState;
  if (!questions.length) return '<p>No test data.</p>';

  const total = questions.length;
  const attempted = Object.keys(answers).length;
  const correct = questions.filter((q, i) => answers[i] === q.answer).length;
  const wrong = attempted - correct;
  const skipped = total - attempted;
  const score = correct;
  const pct = Math.round((correct / total) * 100);
  const timeTaken = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  let grade, gradeColor;
  if (pct >= 80) { grade = '🏆 Excellent!'; gradeColor = 'var(--success)'; }
  else if (pct >= 60) { grade = '👍 Good'; gradeColor = 'var(--primary)'; }
  else if (pct >= 40) { grade = '📈 Average'; gradeColor = 'var(--warning)'; }
  else { grade = '📚 Needs Work'; gradeColor = 'var(--danger)'; }

  const wrongQs = questions.filter((q, i) => answers[i] !== undefined && answers[i] !== q.answer);

  return `
    <div class="page-header">
      <h1>📊 Test Results</h1>
    </div>
    <div class="card" style="margin-bottom:24px">
      <div class="score-board">
        <div class="score-circle">
          <div class="score-number">${score}</div>
          <div class="score-total">out of ${total}</div>
        </div>
        <div class="score-grade" style="color:${gradeColor}">${grade}</div>
        <div style="color:var(--text-light);font-size:0.9rem">Accuracy: ${pct}% · Time: ${minutes}m ${seconds}s</div>
        <div class="score-stats">
          <div class="score-stat">
            <span class="val correct-val">${correct}</span>
            <span class="lbl">Correct</span>
          </div>
          <div class="score-stat">
            <span class="val wrong-val">${wrong}</span>
            <span class="lbl">Wrong</span>
          </div>
          <div class="score-stat">
            <span class="val skip-val">${skipped}</span>
            <span class="lbl">Skipped</span>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="startSubjectTest('${AppState.quizState.subject || 'reasoning'}')">🔄 Retry</button>
          <button class="btn btn-outline" onclick="navigate('mock')">📝 New Test</button>
          <button class="btn btn-outline" onclick="navigate('dashboard')">🏠 Dashboard</button>
        </div>
      </div>
    </div>
    ${wrongQs.length > 0 ? `
      <div class="card">
        <div class="card-header"><h2>❌ Questions You Got Wrong</h2></div>
        ${wrongQs.map((q, idx) => `
          <div class="question-card" style="margin-bottom:16px">
            <div class="question-meta">
              <span class="question-badge q-topic">${q.topic}</span>
              <span class="question-badge q-year">📅 ${q.year}</span>
            </div>
            <div class="question-text">${escHtml(q.question)}</div>
            <div class="options-list">
              ${q.options.map((opt, i) => `
                <div class="option-btn ${i === q.answer ? 'correct' : (i === answers[questions.indexOf(q)] ? 'incorrect' : '')}" style="cursor:default">
                  <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                  <span>${escHtml(opt)}</span>
                </div>
              `).join('')}
            </div>
            <div class="explanation-box show">
              <strong>Explanation:</strong> ${escHtml(q.explanation)}
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function bindResults() {}

// ===================== CONCEPTS =====================
function renderConcepts(subjectId) {
  const subject = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[1];
  const tabsHtml = SUBJECTS.map(s => `
    <button class="tab-btn ${s.id === subject.id ? 'active' : ''}"
      onclick="navigate('concepts', {subject:'${s.id}'})">
      ${s.icon} ${s.name}
    </button>
  `).join('');

  const content = getConceptContent(subject.id);
  return `
    <div class="page-header">
      <h1>📖 Concept Notes</h1>
      <p>Key formulas, tips, and tricks for each subject</p>
    </div>
    <div class="tabs">${tabsHtml}</div>
    <div class="card">${content}</div>
  `;
}

function getConceptContent(subjectId) {
  const concepts = {
    'quantitative': `
      <h3 style="color:var(--primary);margin-bottom:12px">📐 Key Formulas & Shortcuts</h3>
      <div class="concept-list">
        <div class="concept-item"><strong>Simple Interest:</strong> SI = (P × R × T) / 100</div>
        <div class="concept-item"><strong>Compound Interest:</strong> A = P(1 + R/100)ⁿ · CI = A - P</div>
        <div class="concept-item"><strong>Profit %:</strong> (Profit/CP) × 100</div>
        <div class="concept-item"><strong>Loss %:</strong> (Loss/CP) × 100</div>
        <div class="concept-item"><strong>Speed:</strong> Distance / Time</div>
        <div class="concept-item"><strong>Work (A+B together):</strong> 1/(1/A + 1/B) days</div>
        <div class="concept-item"><strong>Percentage change:</strong> (New-Old)/Old × 100</div>
        <div class="concept-item"><strong>Average:</strong> Sum of observations / Number of observations</div>
      </div>
      <div class="tip-box">For DI questions: Always read axis labels and units carefully before calculating.</div>
      <div class="tip-box">For percentage: Remember 25%=1/4, 33.33%=1/3, 20%=1/5 etc. Use fractions to speed up.</div>
      <div class="formula-box">
Ratio shortcuts:
• a:b = a/(a+b) and b/(a+b) of total
• If ratio changes from a:b to c:d, find missing quantity
• Allegation: (Cost of mixture - Cheaper) / (Dearer - Cost of mixture) = qty cheap / qty dear
      </div>
    `,
    'reasoning': `
      <h3 style="color:var(--primary);margin-bottom:12px">🧩 Reasoning Tricks & Tips</h3>
      <div class="concept-list">
        <div class="concept-item"><strong>Syllogism:</strong> Use Venn diagrams. All A→B means A circle inside B circle.</div>
        <div class="concept-item"><strong>Coding-Decoding:</strong> Find pattern: +n, -n, reverse, position swap</div>
        <div class="concept-item"><strong>Blood Relations:</strong> Draw family tree for complex problems</div>
        <div class="concept-item"><strong>Direction:</strong> Always start from North facing. Right=East, Left=West when facing North</div>
        <div class="concept-item"><strong>Inequalities:</strong> Chain all symbols and check if conclusion chain holds</div>
        <div class="concept-item"><strong>Seating:</strong> Fix one person and arrange others relatively</div>
      </div>
      <div class="tip-box">For circular arrangements: Fix one person and arrange remaining (n-1)! ways</div>
      <div class="tip-box">For input-output: Observe pattern across multiple steps before solving</div>
      <div class="formula-box">
Syllogism Quick Rules:
• All A = B + Some B = A (conversion)
• No A = B → No B = A (conversion)
• Some A = B → Some B = A (conversion)
• All + All → All conclusion possible
• Some + All → Some conclusion (from Some side)
• No + All → No conclusion (from No side)
      </div>
    `,
    'english': `
      <h3 style="color:var(--primary);margin-bottom:12px">📝 English Grammar Rules</h3>
      <div class="concept-list">
        <div class="concept-item"><strong>Subject-Verb Agreement:</strong> Singular subject → singular verb. Neither...nor takes verb matching closer noun.</div>
        <div class="concept-item"><strong>Article Usage:</strong> 'a' before consonant sounds, 'an' before vowel sounds, 'the' for specific nouns</div>
        <div class="concept-item"><strong>Tense Consistency:</strong> Maintain same tense throughout unless time changes</div>
        <div class="concept-item"><strong>Prepositions:</strong> Memorize common collocations: "interested in", "good at", "responsible for"</div>
        <div class="concept-item"><strong>Conjunction:</strong> FANBOYS = For, And, Nor, But, Or, Yet, So</div>
        <div class="concept-item"><strong>Active/Passive:</strong> Active: Subject + Verb + Object → Passive: Object + was/were + V3 + by + Subject</div>
      </div>
      <div class="tip-box">For RC: Skim the passage first, then read questions, then find answers in passage. Don't rely on external knowledge.</div>
      <div class="tip-box">For Cloze Test: Read the entire passage first to understand context before filling blanks.</div>
      <div class="formula-box">
Common Banking Vocabulary:
• Monetary Policy – RBI's policy on money supply
• Fiscal Policy – Government's taxation and spending policy
• Inflation – Rise in general price level
• Deflation – Fall in general price level
• Repo Rate – Rate at which RBI lends to banks
• CRR – Cash Reserve Ratio
• SLR – Statutory Liquidity Ratio
      </div>
    `,
    'general-awareness': `
      <h3 style="color:var(--primary);margin-bottom:12px">🌐 Key Banking & Finance Facts</h3>
      <div class="concept-list">
        <div class="concept-item"><strong>RBI Founded:</strong> April 1, 1935 · HQ: Mumbai</div>
        <div class="concept-item"><strong>RBI Act:</strong> Reserve Bank of India Act, 1934</div>
        <div class="concept-item"><strong>Nationalization of Banks:</strong> 1969 (14 banks) and 1980 (6 more)</div>
        <div class="concept-item"><strong>PMJDY:</strong> Launched August 28, 2014 for financial inclusion</div>
        <div class="concept-item"><strong>NABARD:</strong> National Bank for Agriculture and Rural Development (1982)</div>
        <div class="concept-item"><strong>SEBI:</strong> Securities and Exchange Board of India (1988/1992)</div>
        <div class="concept-item"><strong>IRDAI:</strong> Insurance Regulatory and Development Authority (1999)</div>
        <div class="concept-item"><strong>PFRDA:</strong> Pension Fund Regulatory and Development Authority (2003)</div>
      </div>
      <div class="tip-box">Focus on last 6 months current affairs for banking sector (mergers, new policies, rate changes)</div>
      <div class="formula-box">
RBI Key Rates (approximate, check latest):
• Repo Rate: RBI lends to banks
• Reverse Repo: Banks park money with RBI
• CRR: % of deposits kept as cash with RBI
• SLR: % of deposits in liquid assets
• MSF: Marginal Standing Facility (above repo rate)
• Bank Rate: For rediscounting bills
      </div>
    `,
    'computer-knowledge': `
      <h3 style="color:var(--primary);margin-bottom:12px">💻 Computer Knowledge Essentials</h3>
      <div class="concept-list">
        <div class="concept-item"><strong>Generations:</strong> 1st: Vacuum tubes, 2nd: Transistors, 3rd: ICs, 4th: Microprocessors, 5th: AI</div>
        <div class="concept-item"><strong>Memory:</strong> RAM (volatile), ROM (non-volatile). 1KB=1024B, 1MB=1024KB, 1GB=1024MB</div>
        <div class="concept-item"><strong>OS Types:</strong> Windows, Linux, macOS, Android (Mobile)</div>
        <div class="concept-item"><strong>MS Word shortcuts:</strong> Ctrl+C (Copy), Ctrl+V (Paste), Ctrl+X (Cut), Ctrl+Z (Undo), Ctrl+S (Save)</div>
        <div class="concept-item"><strong>MS Excel:</strong> SUM, AVERAGE, COUNT, MAX, MIN, VLOOKUP, IF functions</div>
        <div class="concept-item"><strong>Networking:</strong> LAN (Local), WAN (Wide), MAN (Metropolitan), PAN (Personal)</div>
        <div class="concept-item"><strong>Protocols:</strong> HTTP/HTTPS (web), FTP (file), SMTP/POP3 (email), IP/TCP (internet)</div>
        <div class="concept-item"><strong>Security:</strong> Firewall, Antivirus, Encryption, SSL/TLS, 2FA</div>
      </div>
      <div class="tip-box">For banking technology: Know CBS, SWIFT, RTGS, NEFT, IMPS, UPI, ATM, PoS terminals</div>
      <div class="formula-box">
Number Systems:
• Binary (Base 2): 0,1
• Octal (Base 8): 0-7
• Decimal (Base 10): 0-9
• Hexadecimal (Base 16): 0-9, A-F
• 1 byte = 8 bits
• ASCII: American Standard Code for Information Interchange
      </div>
    `
  };
  return concepts[subjectId] || `<p>Select a subject to view concepts.</p>`;
}

// ===================== UTILITIES =====================
function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function saveProgress() {
  localStorage.setItem('rbi_progress', JSON.stringify(AppState.progress));
}

function showToast(message, type = '') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type ? type + '-toast' : ''}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  window.addEventListener('hashchange', handleHash);
  handleHash();
});
