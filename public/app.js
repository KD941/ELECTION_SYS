'use strict';
/* ═══════════════════════════════════════════════════════════════
   ElectED — App v2.0 (CSP-compliant, event-delegation based)
   No inline onclick handlers anywhere.
   ═══════════════════════════════════════════════════════════════ */

// ─── Lazy-init flags ────────────────────────────────────────────────────────
let timelineBuilt = false;
let rolesBuilt    = false;
let glossaryBuilt = false;
let chatBuilt     = false;

// ─── NAV / ROUTING ──────────────────────────────────────────────────────────
const NAV_IDS = ['home', 'timeline', 'roles', 'games', 'glossary', 'chat'];

function showSection(id) {
  NAV_IDS.forEach(sid => {
    const el  = document.getElementById('sec-' + sid);
    const btn = document.getElementById('nav-' + sid);
    if (el)  el.classList.toggle('active', sid === id);
    if (btn) btn.setAttribute('aria-current', sid === id ? 'true' : 'false');
  });

  if (id === 'timeline' && !timelineBuilt) buildTimeline();
  if (id === 'roles'    && !rolesBuilt)    buildRoles();
  if (id === 'glossary' && !glossaryBuilt) buildGlossary();
  if (id === 'chat'     && !chatBuilt)     buildChat();

  const nav = document.getElementById('nav-links');
  const ham = document.getElementById('hamburger');
  if (nav) nav.classList.remove('open');
  if (ham) {
    ham.setAttribute('aria-expanded', 'false');
    ham.innerHTML = HAM_ICON_CLOSED;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── DARK MODE ───────────────────────────────────────────────────────────────
function setThemeIcon(dark) {
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = dark ? '☀️' : '🌙';
}

function toggleTheme() {
  const html = document.documentElement;
  const dark = html.getAttribute('data-theme') !== 'dark';
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  setThemeIcon(dark);
  try { localStorage.setItem('elected-theme', dark ? 'dark' : 'light'); } catch(e) {}
}

// Respect saved pref or system preference — also sets icon for both modes
(function initTheme() {
  let pref;
  try { pref = localStorage.getItem('elected-theme'); } catch(e) {}
  if (!pref && window.matchMedia('(prefers-color-scheme: dark)').matches) pref = 'dark';
  const dark = pref === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  // Icon set after DOM ready (script is at end of body, so getElementById works)
  document.addEventListener('DOMContentLoaded', () => setThemeIcon(dark), { once: true });
  // Fallback: if DOMContentLoaded already fired (shouldn't happen here but safe)
  if (document.readyState !== 'loading') setThemeIcon(dark);
})();

// ─── HAMBURGER ───────────────────────────────────────────────────────────────
// Use innerHTML to set icon so we don't clobber child SVG nodes
const HAM_ICON_OPEN   = '<svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="M1 1L17 13M1 13L17 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const HAM_ICON_CLOSED = '<svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true"><path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

function toggleNav() {
  const links = document.getElementById('nav-links');
  const ham   = document.getElementById('hamburger');
  if (!links || !ham) return;
  const open  = links.classList.toggle('open');
  ham.setAttribute('aria-expanded', open ? 'true' : 'false');
  ham.innerHTML = open ? HAM_ICON_OPEN : HAM_ICON_CLOSED;
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL EVENT DELEGATION
// All clicks throughout the app are routed through this ONE listener.
// No inline onclick handlers exist in the HTML or generated templates.
// ═══════════════════════════════════════════════════════════════════════════
document.addEventListener('click', e => {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const action = t.dataset.action;

  switch (action) {
    case 'nav':      { e.preventDefault(); showSection(t.dataset.section); break; }
    case 'theme':    { toggleTheme(); break; }
    case 'hamburger':{ toggleNav(); break; }
    case 'game':     { startGame(t.dataset.game); break; }
    case 'backgame': { backToGames(); break; }
    case 'az':       { onAZClick(t); break; }

    // Quiz
    case 'quiz-answer': { answerQuiz(t.dataset.answer === 'true', t); break; }
    case 'quiz-next':   { nextQuiz(); break; }
    case 'quiz-restart':{ initQuiz(); break; }
    case 'quiz-copy':   { copyScore(parseInt(t.dataset.score), parseInt(t.dataset.total)); break; }

    // Scramble
    case 'scramble-check': { checkScramble(); break; }
    case 'scramble-reset': { initScramble(); break; }

    // Flashcards
    case 'fc-flip':    { flipCard(); break; }
    case 'fc-know':    { markCard('learned'); break; }
    case 'fc-review':  { markCard('review');  break; }
    case 'fc-prev':    { fcNav(-1); break; }
    case 'fc-next':    { fcNav(1);  break; }

    // Journey
    case 'journey-choice': { journeyChoose(t.dataset.next); break; }
    case 'journey-restart':{ initJourney(); break; }

    // Glossary → chat
    case 'glos-ask': { askFromGlossary(t.dataset.term); break; }

    // Chat send — routed through delegation so it works even before buildChat()
    case 'chat-send': { sendChat(); break; }

    // Chat suggestion pills (also via delegation)
    case 'chat-sug': {
      if (!chatBuilt) buildChat();
      const input = document.getElementById('chat-input');
      if (input) input.value = t.dataset.text;
      sendChat();
      break;
    }
  }
});

// Keyboard support: Enter/Space activates anything with data-action
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const role = t.getAttribute('role');
  const tag  = t.tagName;
  // Buttons already handle Enter/Space natively — only intercept non-button roles
  if (tag === 'BUTTON' || tag === 'A') return;
  if (role === 'button' || role === 'listitem') {
    e.preventDefault();
    t.click();
  }
});

// ═══════════════════════════════════════════════════════════════
// TIMELINE
// ═══════════════════════════════════════════════════════════════
const TIMELINE_DATA = [
  { num:1, badge:'pre', badgeText:'Pre-Election', title:'Candidate Announcement', icon:'',
    summary:'Potential candidates officially announce their intention to run, forming campaign committees and beginning fundraising.',
    detail:'Candidates file paperwork with the electoral commission, declare their candidacy publicly, and begin assembling their campaign team — including campaign managers, communications directors, and fundraisers. This phase can start years before the actual election.'},
  { num:2, badge:'pre', badgeText:'Pre-Election', title:'Primary Elections / Caucuses', icon:'',
    summary:'Voters within each party choose their preferred candidate through primaries (direct voting) or caucuses (public meetings).',
    detail:'Primaries are state-run elections where any registered party member can vote privately. Caucuses are party-organized public gatherings where voters openly group by candidate preference. Winners earn "delegates" who represent them at the national convention.'},
  { num:3, badge:'pre', badgeText:'Pre-Election', title:'Party Conventions & Nominations', icon:'',
    summary:'Each major party holds a national convention where delegates formally nominate their presidential and vice-presidential candidates.',
    detail:'Conventions are also where parties adopt their official platform — a detailed document outlining their policy positions and goals for the country. Running mates are typically announced just before or during the convention.'},
  { num:4, badge:'pre', badgeText:'Campaign', title:'General Election Campaign', icon:'',
    summary:'Nominated candidates campaign nationwide — holding rallies, debating opponents, and running advertisements.',
    detail:'This phase includes presidential debates (and VP debates), intense media coverage, and billions in advertising spending. Campaign strategy focuses heavily on swing states or key constituencies that could go either way.'},
  { num:5, badge:'vote', badgeText:'Election', title:'Voter Registration Deadline', icon:'',
    summary:'Most regions require voters to register ahead of time. Deadlines vary — usually 15–30 days before Election Day.',
    detail:'Registration confirms your eligibility to vote and ensures your name appears on the official voter roll at your polling place. Some places offer same-day registration on Election Day itself. Check your state or country\'s specific rules at your electoral authority\'s website.'},
  { num:6, badge:'vote', badgeText:'Election', title:'Election Day Voting', icon:'',
    summary:'Registered voters cast their ballots at polling stations or via mail/absentee ballots. Democracy in action.',
    detail:'Polling stations open in the morning and close in the evening. Officials check voter IDs, guide voters through the ballot, and ensure the process is secure and accessible. Many jurisdictions also allow early voting in the days leading up to Election Day.'},
  { num:7, badge:'post', badgeText:'Post-Election', title:'Vote Counting & Certification', icon:'',
    summary:'Ballots are counted by election officials. Results are certified by state/national authorities — often taking days.',
    detail:'Absentee and mail-in ballots may take longer to process than in-person votes. Either candidate can request a recount if the margin is extremely close. Election observers (domestic and international) monitor this process for fairness.'},
  { num:8, badge:'post', badgeText:'Post-Election', title:'Electoral College Vote (U.S.)', icon:'',
    summary:'In the U.S., electors in the Electoral College cast official votes for president based on their state\'s results.',
    detail:'Electors are generally pledged to vote for the candidate who won their state. Most states use a winner-take-all model; Maine and Nebraska use proportional allocation. A candidate needs 270 of 538 electoral votes to win.'},
  { num:9, badge:'post', badgeText:'Post-Election', title:'Congressional Certification', icon:'',
    summary:'Congress meets in a joint session to officially count and certify electoral votes, formally confirming the result.',
    detail:'The Vice President presides over this joint session. Objections can be raised by members of Congress, but they require a majority vote in both chambers to be sustained — an extremely high bar.'},
  { num:10, badge:'post', badgeText:'Post-Election', title:'Inauguration Day', icon:'',
    summary:'The winner is officially sworn into office, takes the constitutional oath, and delivers an inaugural address to the nation.',
    detail:'In the U.S., Inauguration Day is January 20th. The outgoing president facilitates a peaceful transfer of power — a cornerstone of democratic governance. The incoming president\'s first acts and speech set the tone for their administration.'},
];

function buildTimeline() {
  timelineBuilt = true;
  const el = document.getElementById('timeline-steps');
  if (!el) return;

  el.innerHTML = TIMELINE_DATA.map(t => `
    <div class="tl-item" role="listitem" data-num="${t.num}">
      <div class="tl-dot" aria-hidden="true">${t.num}</div>
      <div class="tl-card" role="button" tabindex="0"
        data-action="tl-expand"
        aria-expanded="false"
        aria-label="${t.title} — press Enter to expand">
        <span class="tl-badge badge-${t.badge}">${t.badgeText}</span>
        <h2 style="font-size:.97rem;font-weight:600;margin:.3rem 0">${t.title}</h2>
        <p class="tl-summary">${t.summary}</p>
        <div class="tl-expand" role="region" aria-label="Details for ${t.title}">
          <div class="tl-expand-inner">${t.detail}</div>
        </div>
        <p class="tl-hint" aria-hidden="true">
          <span class="tl-hint-icon">▼</span> Click to expand
        </p>
      </div>
    </div>
  `).join('');

  // Wire up expand/collapse via delegation on the container
  el.addEventListener('click', e => {
    const card = e.target.closest('.tl-card');
    if (card) toggleExpand(card);
  });
  el.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.tl-card');
    if (card) { e.preventDefault(); toggleExpand(card); }
  });

  // Staggered animation
  setTimeout(() => {
    document.querySelectorAll('.tl-item').forEach((item, i) => {
      setTimeout(() => item.classList.add('visible'), i * 80);
    });
  }, 60);
}

function toggleExpand(card) {
  const exp  = card.querySelector('.tl-expand');
  const hint = card.querySelector('.tl-hint');
  const icon = card.querySelector('.tl-hint-icon');
  const open = card.getAttribute('aria-expanded') === 'true';

  if (open) {
    exp.style.maxHeight = '0';
    if (hint) hint.childNodes[hint.childNodes.length - 1].textContent = ' Click to expand';
    if (icon) icon.textContent = '▼';
    card.setAttribute('aria-expanded', 'false');
  } else {
    exp.style.maxHeight = exp.scrollHeight + 'px';
    if (hint) hint.childNodes[hint.childNodes.length - 1].textContent = ' Click to collapse';
    if (icon) icon.textContent = '▲';
    card.setAttribute('aria-expanded', 'true');
  }
}

// ═══════════════════════════════════════════════════════════════
// ROLES
// ═══════════════════════════════════════════════════════════════
const ROLES_DATA = [
  { icon:'V', bg:'#0d1f3c', title:'The Voter',
    desc:'The most important participant in any democracy. Eligible citizens cast ballots to select their representatives. Voting is both a fundamental right and a civic responsibility.' },
  { icon:'C', bg:'#1a5c33', title:'The Candidate',
    desc:'A person who runs for elected office. Candidates build campaign teams, raise funds, develop policy platforms, hold public events, and ask voters for their support.' },
  { icon:'P', bg:'#283593', title:'Political Parties',
    desc:'Organizations that share ideological values and nominate candidates for election. They coordinate campaign strategy, develop policy platforms, and mobilize voters.' },
  { icon:'E', bg:'#5c3317', title:'Electoral Commission',
    desc:'An independent government body that oversees elections — managing voter rolls, certifying candidates, running polling stations, and certifying results.' },
  { icon:'M', bg:'#6a1e55', title:'The Media',
    desc:'Journalists, newspapers, TV networks, and digital outlets inform the public about candidates, policies, debates, and results. A free press is essential to democracy.' },
  { icon:'O', bg:'#1a4a5c', title:'Election Observers',
    desc:'Trained monitors who watch the election process to verify it is free, fair, and transparent. They report irregularities to authorities and the public.' },
  { icon:'W', bg:'#4a3c17', title:'Poll Workers',
    desc:'Trained volunteers or employees who staff polling stations — verifying voter IDs, distributing ballots, maintaining order, and ensuring the process runs smoothly.' },
  { icon:'D', bg:'#1a3a5c', title:'Campaign Donors & Funders',
    desc:'Individuals, organisations, or PACs that provide financial support to candidates. Campaign finance rules vary significantly by country.' },
];

function buildRoles() {
  rolesBuilt = true;
  const el = document.getElementById('roles-list');
  if (!el) return;
  el.innerHTML = ROLES_DATA.map((r, i) => `
    <article class="role-card" role="listitem" style="animation-delay:${i * 0.07}s">
      <div class="role-icon" style="background:${r.bg}20;border:1px solid ${r.bg}40" aria-hidden="true">${r.icon}</div>
      <div class="role-info">
        <h2>${r.title}</h2>
        <p>${r.desc}</p>
      </div>
    </article>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════
// GAMES — orchestrator
// ═══════════════════════════════════════════════════════════════
function startGame(id) {
  const sel = document.getElementById('game-selector');
  if (sel) sel.style.display = 'none';
  document.querySelectorAll('.game-area').forEach(g => g.classList.remove('active'));
  const gameEl = document.getElementById('game-' + id);
  if (gameEl) gameEl.classList.add('active');

  switch (id) {
    case 'quiz':       initQuiz();       break;
    case 'scramble':   initScramble();   break;
    case 'flashcards': initFlashcards(); break;
    case 'journey':    initJourney();    break;
  }
}

function backToGames() {
  document.querySelectorAll('.game-area').forEach(g => g.classList.remove('active'));
  const sel = document.getElementById('game-selector');
  if (sel) sel.style.display = '';
}

// ═══════════════════════════════════════════════════════════════
// GAME 1: True or False Buzz
// ═══════════════════════════════════════════════════════════════
const QUIZ_DATA = [
  { q:'You must be a registered voter to cast a ballot in most elections.', a:true,
    explain:'Registration confirms eligibility and places you on the official voter roll. Some states offer same-day registration, but most require signing up in advance.' },
  { q:'The candidate with the most popular votes always wins the U.S. presidency.', a:false,
    explain:'The U.S. uses the Electoral College. A candidate can win the most votes nationally but lose the election, as happened in 2000 and 2016.' },
  { q:'Primary elections determine which candidate represents their party in the general election.', a:true,
    explain:'Primaries let party members or registered voters choose their preferred candidate before the main nationwide election.' },
  { q:'Gerrymandering means drawing district boundaries to give one party an unfair advantage.', a:true,
    explain:'The term comes from Governor Elbridge Gerry who approved oddly shaped districts in 1812.' },
  { q:'The U.S. President is limited to two terms in office by the Constitution.', a:true,
    explain:'The 22nd Amendment (ratified 1951) limits the President to two four-year terms.' },
  { q:'Absentee ballots are only for people who are physically unable to go to a polling station.', a:false,
    explain:'Many states allow any registered voter to request an absentee or mail-in ballot without a special reason.' },
  { q:'Exit polls are conducted as voters leave the polling station after casting their ballot.', a:true,
    explain:'Exit polls sample voters as they exit — used to predict results before official counting is complete.' },
  { q:'Proportional representation means parties receive seats roughly equal to their vote share.', a:true,
    explain:'Unlike winner-take-all systems, proportional representation lets smaller parties gain seats based on vote percentage.' },
  { q:'A "swing state" is one that reliably votes for the same party every election.', a:false,
    explain:'Swing states are competitive — they could go to either party, making them key campaign targets.' },
  { q:'In a plurality voting system, a candidate needs more than 50% of votes to win.', a:false,
    explain:'Plurality (first-past-the-post) means the candidate with the MOST votes wins — even without a majority.' },
  { q:'A runoff election occurs when no candidate wins the required majority in the first round.', a:true,
    explain:'Runoffs narrow the field to the top two candidates for a second round.' },
  { q:'The electoral college was established by the U.S. Bill of Rights.', a:false,
    explain:'The Electoral College was established by Article II, Section 1 of the Constitution — not the Bill of Rights.' },
  { q:'Voter suppression refers to strategies that make it harder for certain groups to vote.', a:true,
    explain:'Voter suppression tactics have included strict ID laws, poll taxes, limited polling hours, and purging voter rolls.' },
  { q:'A landslide victory means a candidate won by a very small margin.', a:false,
    explain:'A landslide is an overwhelming electoral victory — winning by a very large margin.' },
  { q:'Same-day voter registration exists in some U.S. states.', a:true,
    explain:'Over 20 U.S. states allow voters to register at the polls on Election Day.' },
];

const quizState = { cur:0, score:0, answered:false, qs:[], timer:null, timeLeft:10 };

function initQuiz() {
  clearInterval(quizState.timer);
  quizState.qs       = [...QUIZ_DATA].sort(() => Math.random() - .5).slice(0, 10);
  quizState.cur      = 0;
  quizState.score    = 0;
  quizState.answered = false;
  renderQuiz();
}

function renderQuiz() {
  const el = document.getElementById('quiz-inner');
  if (!el) return;
  const { qs, cur, score } = quizState;

  if (cur >= qs.length) {
    clearInterval(quizState.timer);
    const pct = Math.round(score / qs.length * 100);
    const msg = pct >= 80 ? 'Election expert — impressive knowledge.' :
                pct >= 50 ? 'Good effort! Keep learning.' :
                            'Keep studying — you\'ll get there!';
    el.innerHTML = `
      <div class="quiz-card">
        <div class="score-display">
          <div class="score-big-num">${score}<span class="score-out-of">/${qs.length}</span></div>
          <div class="score-label">Questions answered</div>
          <div class="score-pct">${pct}% correct</div>
          <p class="score-msg">${msg}</p>
          <div style="display:flex;gap:.7rem;justify-content:center;flex-wrap:wrap">
            <button class="btn-primary" data-action="quiz-restart">Play Again</button>
            <button class="share-badge-btn" data-action="quiz-copy" data-score="${score}" data-total="${qs.length}">Copy Score</button>
          </div>
        </div>
      </div>`;
    return;
  }

  const q    = qs[cur];
  const pips = qs.map((_, i) =>
    `<div class="quiz-pip ${i < cur ? 'done' : i === cur ? 'active' : ''}"></div>`
  ).join('');

  el.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-timer-bar" aria-hidden="true">
        <div class="quiz-timer-inner" id="quiz-timer-bar" style="width:100%"></div>
      </div>
      <div class="quiz-meta">
        <div class="quiz-progress-pips"
          role="progressbar" aria-valuenow="${cur+1}" aria-valuemax="${qs.length}"
          aria-label="Question ${cur+1} of ${qs.length}">${pips}</div>
        <span class="quiz-time-display" id="quiz-time-txt" aria-live="off">⏱ 10s</span>
      </div>
      <p class="quiz-q">Question ${cur+1}: ${q.q}</p>
      <div class="quiz-options">
        <button class="quiz-opt" data-action="quiz-answer" data-answer="true"  aria-label="True">✓ True</button>
        <button class="quiz-opt" data-action="quiz-answer" data-answer="false" aria-label="False">✗ False</button>
      </div>
      <div class="quiz-feedback" id="qfb" role="alert"></div>
      <div id="qnext" style="display:none;margin-top:1rem;text-align:right">
        <button class="btn-primary" data-action="quiz-next">Next →</button>
      </div>
    </div>`;

  quizState.answered = false;
  startTimer();
}

function startTimer() {
  clearInterval(quizState.timer);
  quizState.timeLeft = 10;
  const update = () => {
    const bar = document.getElementById('quiz-timer-bar');
    const txt = document.getElementById('quiz-time-txt');
    quizState.timeLeft--;
    const pct = (quizState.timeLeft / 10) * 100;
    if (bar) {
      bar.style.width = pct + '%';
      bar.className = 'quiz-timer-inner' +
        (quizState.timeLeft <= 3 ? ' danger' : quizState.timeLeft <= 6 ? ' warning' : '');
    }
    if (txt) txt.textContent = `⏱ ${quizState.timeLeft}s`;
    if (quizState.timeLeft <= 0) {
      clearInterval(quizState.timer);
      if (!quizState.answered) revealTimeout();
    }
  };
  quizState.timer = setInterval(update, 1000);
}

function revealTimeout() {
  quizState.answered = true;
  const opts = document.querySelectorAll('.quiz-opt');
  opts.forEach(b => { b.disabled = true; });
  const q = quizState.qs[quizState.cur];
  if (opts[0]) opts[0].classList.add(q.a ? 'correct' : 'wrong');
  if (opts[1]) opts[1].classList.add(q.a ? 'wrong'   : 'correct');
  const fb = document.getElementById('qfb');
  if (fb) { fb.className = 'quiz-feedback show wrong'; fb.textContent = 'Time\'s up. ' + q.explain; }
  const nxt = document.getElementById('qnext');
  if (nxt) nxt.style.display = 'block';
}

function answerQuiz(val, btn) {
  if (quizState.answered) return;
  clearInterval(quizState.timer);
  quizState.answered = true;
  const q       = quizState.qs[quizState.cur];
  const correct = val === q.a;
  if (correct) quizState.score++;

  document.querySelectorAll('.quiz-opt').forEach(b => { b.disabled = true; });
  btn.classList.add(correct ? 'correct' : 'wrong');
  const opts = document.querySelectorAll('.quiz-opt');
  if (!correct) {
    const other = val ? opts[1] : opts[0];
    if (other) other.classList.add('correct');
  }

  const fb = document.getElementById('qfb');
  if (fb) {
    fb.className = 'quiz-feedback show ' + (correct ? 'correct' : 'wrong');
    fb.textContent = (correct ? 'Correct. ' : 'Not quite. ') + q.explain;
  }
  const nxt = document.getElementById('qnext');
  if (nxt) nxt.style.display = 'block';
}

function nextQuiz() {
  quizState.cur++;
  quizState.answered = false;
  renderQuiz();
}

function copyScore(score, total) {
  const pct  = Math.round(score / total * 100);
  const text = 'I scored ' + score + '/' + total + ' (' + pct + '%) on the ElectED Election Quiz! Test your civic knowledge.';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('[data-action="quiz-copy"]');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy Score', 2200); }
  }).catch(() => alert('Your score: ' + score + '/' + total + ' (' + pct + '%)'));
}

// ═══════════════════════════════════════════════════════════════
// GAME 2: Timeline Scramble
// ═══════════════════════════════════════════════════════════════
const SCRAMBLE_STEPS = [
  'Candidate Announcement',
  'Primary Elections / Caucuses',
  'Party Convention & Nomination',
  'General Election Campaign',
  'Voter Registration Deadline',
  'Election Day Voting',
  'Vote Counting & Certification',
  'Inauguration Day',
];

let dragSrc = null;

function initScramble() {
  const shuffled = [...Array(SCRAMBLE_STEPS.length).keys()].sort(() => Math.random() - .5);
  const el = document.getElementById('scramble-inner');
  if (!el) return;

  el.innerHTML = `
    <div class="scramble-layout">
      <div>
        <p class="gap-label">Shuffled Cards — drag these</p>
        <div id="sc-source" style="display:flex;flex-direction:column;gap:.6rem">
          ${shuffled.map(i => `
            <div class="scramble-card" draggable="true" data-idx="${i}"
              role="button" tabindex="0" aria-label="${SCRAMBLE_STEPS[i]}, draggable card">
              ${SCRAMBLE_STEPS[i]}
            </div>`).join('')}
        </div>
      </div>
      <div>
        <p class="gap-label">Drop into correct order</p>
        <div id="sc-target" style="display:flex;flex-direction:column;gap:.6rem">
          ${SCRAMBLE_STEPS.map((_, i) => `
            <div class="drop-zone" data-slot="${i}" aria-label="Slot ${i + 1}">
              <span class="drop-zone-num">${i + 1}.</span>
              <span class="dz-label">Drop here</span>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div id="sc-result" style="margin-top:1.5rem;text-align:center" aria-live="polite"></div>
    <div style="text-align:center;margin-top:1rem;display:flex;gap:.7rem;justify-content:center">
      <button class="btn-primary" data-action="scramble-check">Check My Order</button>
      <button class="btn-outline"  data-action="scramble-reset">Reset</button>
    </div>`;

  // Drag events
  const src = document.getElementById('sc-source');
  const tgt = document.getElementById('sc-target');

  src.addEventListener('dragstart', e => {
    const card = e.target.closest('.scramble-card');
    if (!card) return;
    dragSrc = card;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text', card.dataset.idx);
  });
  src.addEventListener('dragend', e => {
    const card = e.target.closest('.scramble-card');
    if (card) card.classList.remove('dragging');
  });
  tgt.addEventListener('dragover',  e => { e.preventDefault(); const z = e.target.closest('.drop-zone'); if (z) z.classList.add('over'); });
  tgt.addEventListener('dragleave', e => { const z = e.target.closest('.drop-zone'); if (z) z.classList.remove('over'); });
  tgt.addEventListener('drop', scDrop);
}

function scDrop(e) {
  e.preventDefault();
  const zone = e.target.closest('.drop-zone');
  if (!zone) return;
  zone.classList.remove('over');
  const idx  = e.dataTransfer.getData('text');
  const prev = zone.dataset.placed;

  if (prev !== undefined) {
    const returning = document.querySelector(`.scramble-card[data-idx="${prev}"]`);
    if (returning) {
      returning.style.display = '';
      document.getElementById('sc-source').appendChild(returning);
    }
  }
  zone.dataset.placed = idx;
  zone.classList.add('filled');
  zone.querySelector('.dz-label').textContent = SCRAMBLE_STEPS[parseInt(idx)];
  if (dragSrc) dragSrc.style.display = 'none';
}

function checkScramble() {
  const zones  = document.querySelectorAll('.drop-zone');
  const filled = document.querySelectorAll('.drop-zone[data-placed]');
  const res    = document.getElementById('sc-result');
  if (!res) return;

  if (filled.length < SCRAMBLE_STEPS.length) {
    res.innerHTML = '<p style="color:var(--muted)">Fill all slots before checking!</p>';
    return;
  }

  let correct = 0;
  zones.forEach((zone, i) => {
    const placed = parseInt(zone.dataset.placed);
    if (placed === i) {
      zone.style.borderColor = 'var(--green)';
      zone.style.background  = 'var(--green-bg)';
      correct++;
    } else {
      zone.style.borderColor = 'var(--red)';
      zone.style.background  = 'var(--red-bg)';
    }
  });

  if (correct === SCRAMBLE_STEPS.length) {
    res.innerHTML = '<div style="background:var(--green-bg);border:1px solid var(--green);border-radius:12px;padding:1rem;color:var(--green);font-weight:600">🎉 Perfect! All steps in the correct order!</div>';
  } else {
    res.innerHTML = `<div style="background:var(--red-bg);border:1px solid var(--red);border-radius:12px;padding:1rem;color:var(--red)">${correct}/${SCRAMBLE_STEPS.length} correct. Try rearranging and check again!</div>`;
  }
}

// ═══════════════════════════════════════════════════════════════
// GAME 3: Term Decoder Flashcards
// ═══════════════════════════════════════════════════════════════
const FLASHCARD_DATA = [
  { term:'Ballot',          def:'A document (paper or electronic) on which voters record their choices in an election.', ex:'She filled out her ballot carefully before placing it in the scanner.' },
  { term:'Primary',         def:'An election in which voters choose a political party\'s candidate to run in the general election.', ex:'The primary narrowed five candidates down to one nominee.' },
  { term:'Electoral College',def:'A body of electors established by the U.S. Constitution who formally elect the President and Vice President.', ex:'A candidate needs 270 of 538 electoral votes to win the presidency.' },
  { term:'Caucus',           def:'A meeting of party members to select candidates — an alternative to a primary election.', ex:'Iowa holds its famous caucuses early in the presidential election cycle.' },
  { term:'Gerrymandering',   def:'Manipulating electoral district boundaries to give one political party an unfair competitive advantage.', ex:'Gerrymandering created strangely shaped, non-contiguous districts.' },
  { term:'Incumbent',        def:'A politician who currently holds office and is running for re-election.', ex:'As the incumbent senator, she had name recognition and fundraising advantages.' },
  { term:'Suffrage',         def:'The right to vote in political elections. Also called the franchise.', ex:'Women\'s suffrage in the U.S. was achieved with the 19th Amendment in 1920.' },
  { term:'Swing State',      def:'A U.S. state where either party could plausibly win — a key campaign target.', ex:'Pennsylvania, Michigan, and Wisconsin are classic swing states.' },
  { term:'Recount',          def:'A second official count of votes, triggered when the margin of victory is very slim.', ex:'The 200-vote margin triggered an automatic statewide recount.' },
  { term:'Proportional Representation', def:'An electoral system where parties receive seats proportional to their share of the vote.', ex:'Germany\'s Bundestag uses proportional representation.' },
  { term:'Mandate',          def:'The authority granted to an elected official by voters to carry out their stated agenda.', ex:'Winning by 20 points gave her a clear mandate to pursue healthcare reform.' },
  { term:'Runoff',           def:'A second election held when no candidate wins the required threshold in the first round.', ex:'Neither candidate won 50%, so a runoff was scheduled.' },
  { term:'Poll Worker',      def:'A trained volunteer who assists voters and oversees the voting process at polling stations.', ex:'Thousands of poll workers staffed stations across the county.' },
  { term:'Exit Poll',        def:'A survey of voters as they leave polling stations, used to estimate results early.', ex:'Early exit polls pointed to a very close race.' },
  { term:'Plurality',        def:'When a candidate receives more votes than any other, but not necessarily a majority.', ex:'With three candidates, she won with just 38% — a plurality, not a majority.' },
  { term:'Delegate',         def:'A person chosen to represent and vote on behalf of a group at a party convention.', ex:'Each state sends a proportional number of delegates to the national convention.' },
  { term:'Absentee Ballot',  def:'A ballot cast in advance by a voter who cannot or chooses not to vote in person.', ex:'Living overseas, he always votes using an absentee ballot.' },
  { term:'Constituency',     def:'A geographic area whose residents are represented by one elected official.', ex:'The new MP represents a constituency of 80,000 registered voters.' },
  { term:'Voter Turnout',    def:'The percentage of eligible voters who actually cast a ballot in a given election.', ex:'Turnout hit 67% — the highest in two decades.' },
  { term:'Redistricting',    def:'Redrawing electoral district boundaries, usually after a census.', ex:'After the 2020 census, several states underwent significant redistricting.' },
];

const fcState = { idx:0, learned:new Set(), review:new Set(), flipped:false };

function initFlashcards() {
  fcState.idx = 0; fcState.learned.clear(); fcState.review.clear(); fcState.flipped = false;
  renderFlashcard();
}

function renderFlashcard() {
  const el   = document.getElementById('flashcard-inner');
  if (!el) return;
  const card = FLASHCARD_DATA[fcState.idx];
  const pct  = Math.round(fcState.learned.size / FLASHCARD_DATA.length * 100);

  el.innerHTML = `
    <div class="fc-progress" role="progressbar"
      aria-valuenow="${fcState.learned.size}" aria-valuemax="${FLASHCARD_DATA.length}"
      aria-label="${fcState.learned.size} of ${FLASHCARD_DATA.length} learned">
      <div class="fc-progress-bar" style="width:${pct}%"></div>
    </div>
    <div class="flashcard-scene">
      <div class="flashcard" id="fc-card" role="button" tabindex="0"
        data-action="fc-flip"
        aria-label="Flashcard: ${card.term}. Press Enter to flip.">
        <div class="fc-face fc-front" aria-hidden="false">
          <h2 style="font-family:'Playfair Display',serif;font-size:1.6rem;color:#fff;text-align:center">${card.term}</h2>
          <p style="color:var(--gold2);font-size:.78rem;margin-top:.7rem;text-transform:uppercase;letter-spacing:.1em">Click / press Enter to reveal</p>
        </div>
        <div class="fc-face fc-back" aria-hidden="true">
          <p>${card.def}</p>
          <p class="fc-example">"${card.ex}"</p>
        </div>
      </div>
    </div>
    <div class="fc-controls">
      <button class="fc-btn review" data-action="fc-review" aria-label="Mark for review">Review again</button>
      <span class="fc-counter" aria-live="polite">${fcState.idx + 1} / ${FLASHCARD_DATA.length} · ${fcState.learned.size} learned</span>
      <button class="fc-btn know"   data-action="fc-know"   aria-label="Mark as learned">Got it</button>
    </div>
    <div style="text-align:center;margin-top:1rem;display:flex;gap:.6rem;justify-content:center">
      <button class="btn-outline" data-action="fc-prev" aria-label="Previous card">← Prev</button>
      <button class="btn-outline" data-action="fc-next" aria-label="Next card">Next →</button>
    </div>`;

  fcState.flipped = false;
}

function flipCard() {
  const c = document.getElementById('fc-card');
  if (!c) return;
  fcState.flipped = !fcState.flipped;
  c.classList.toggle('flipped', fcState.flipped);
  const front = c.querySelector('.fc-front');
  const back  = c.querySelector('.fc-back');
  if (front) front.setAttribute('aria-hidden', fcState.flipped ? 'true' : 'false');
  if (back)  back.setAttribute('aria-hidden',  fcState.flipped ? 'false' : 'true');
}

function markCard(type) {
  if (type === 'learned') fcState.learned.add(fcState.idx);
  else fcState.review.add(fcState.idx);
  fcNav(1);
}

function fcNav(dir) {
  fcState.idx = (fcState.idx + dir + FLASHCARD_DATA.length) % FLASHCARD_DATA.length;
  renderFlashcard();
}

// ═══════════════════════════════════════════════════════════════
// GAME 4: Voter Journey
// ═══════════════════════════════════════════════════════════════
const JOURNEY_NODES = {
  start: {
    scene: 'It\'s <strong>Election Day</strong>. You\'re 18 and this is your very first time voting. You wake up excited but a little nervous. What do you do first?',
    choices: [
      { text: 'Check online whether I\'m registered to vote', next: 'registered' },
      { text: 'Head straight to the polling station',          next: 'not_registered' },
    ]
  },
  registered: {
    scene: 'Smart move. You confirm you\'re registered and find your <strong>polling station address</strong> — open until 8 pm. Do you bring ID?',
    choices: [
      { text: 'Yes — grab my photo ID and head out',    next: 'with_id' },
      { text: 'I go without — I didn\'t think I needed it', next: 'no_id' },
    ]
  },
  not_registered: {
    scene: 'The poll worker searches for your name and <strong>cannot find you on the voter roll</strong>. You forgot to register before the deadline.',
    choices: [
      { text: 'Ask whether same-day registration is available', next: 'same_day' },
      { text: 'Leave without voting — there\'s nothing I can do', next: 'bad_end' },
    ]
  },
  with_id: {
    scene: 'Your ID is verified and you\'re handed a <strong>ballot</strong>. You step into a private voting booth. How do you approach it?',
    choices: [
      { text: 'Take my time and read every race carefully', next: 'voted_well' },
      { text: 'Rush through and pick quickly',             next: 'rushed' },
    ]
  },
  no_id: {
    scene: 'Your state requires ID. The poll worker offers a <strong>provisional ballot</strong> — it will be counted once your identity is verified.',
    choices: [
      { text: 'Accept the provisional ballot and vote', next: 'provisional' },
      { text: 'It seems complicated — skip it',         next: 'bad_end' },
    ]
  },
  same_day: {
    scene: 'Your state allows <strong>same-day registration</strong>. You fill out a short form and receive a provisional ballot.',
    choices: [
      { text: 'Complete registration and cast my ballot', next: 'voted_well' },
    ]
  },
  provisional: {
    scene: 'You cast your <strong>provisional ballot</strong> and receive a receipt. You can track it online to confirm it was counted.',
    choices: [{ text: 'Thank the poll workers and leave', next: 'ok_end' }]
  },
  voted_well: {
    scene: 'You carefully review every race, make your selections, and feed the ballot into the scanner. A worker hands you an <strong>"I Voted" sticker</strong>.',
    choices: [{ text: 'Head home — your vote is cast', next: 'great_end' }]
  },
  rushed: {
    scene: 'You rushed and accidentally <strong>left one race blank</strong>. The ballot was already submitted before you noticed.',
    choices: [{ text: 'It still counts — lesson learned for next time', next: 'ok_end' }]
  },
  bad_end:   { scene:'', choices:[], end:{ icon:'', title:'Lesson Learned', desc:'You didn\'t vote this time — but now you know what to do. Register early, bring ID, and locate your polling station in advance.' } },
  great_end: { scene:'', choices:[], end:{ icon:'', title:'First Vote Successfully Cast', desc:'You prepared well, brought your ID, read every race carefully, and voted. Your voice is now part of the democratic process.' } },
  ok_end:    { scene:'', choices:[], end:{ icon:'', title:'Vote Recorded', desc:'You voted — that\'s what matters most. Next time bring notes or a sample ballot to review every race carefully.' } },
};

let journeyNode = 'start';

function initJourney() {
  journeyNode = 'start';
  renderJourney();
}

function renderJourney() {
  const el   = document.getElementById('journey-inner');
  if (!el) return;
  const node = JOURNEY_NODES[journeyNode];

  if (node.end) {
    el.innerHTML = `
      <div class="journey-card">
        <div class="journey-end">
          <h2>${node.end.title}</h2>
          <p>${node.end.desc}</p>
          <button class="btn-primary" data-action="journey-restart">Play Again</button>
        </div>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="journey-card">
      <div class="journey-scene">${node.scene}</div>
      <div class="journey-choices">
        ${node.choices.map(c =>
          `<button class="journey-choice" data-action="journey-choice" data-next="${c.next}">${c.text}</button>`
        ).join('')}
      </div>
    </div>`;
}

function journeyChoose(next) {
  journeyNode = next;
  renderJourney();
}

// ═══════════════════════════════════════════════════════════════
// GLOSSARY
// ═══════════════════════════════════════════════════════════════
const GLOSSARY_DATA = [
  { term:'Absentee Ballot',    def:'A ballot cast by a voter who cannot be present at their polling place. Many states allow any voter to request one.' },
  { term:'Ballot',             def:'A document, paper or electronic, on which voters record their choices in an election.' },
  { term:'Ballot Initiative',  def:'A process allowing citizens to place proposed legislation directly on the ballot for voters to decide.' },
  { term:'Candidate',          def:'A person who runs for election to a public office, independently or as a party\'s nominee.' },
  { term:'Caucus',             def:'A meeting of party members to select candidates or determine party policy — an alternative to a primary.' },
  { term:'Constituency',       def:'A geographic area whose residents are represented by an elected official.' },
  { term:'Delegate',           def:'A person chosen to represent a group and vote on their behalf at a party convention.' },
  { term:'Electoral College',  def:'The body of 538 electors who formally elect the U.S. President and Vice President.' },
  { term:'Electoral Roll',     def:'The official list of registered voters eligible to vote in an election.' },
  { term:'Exit Poll',          def:'A survey of voters conducted as they leave polling stations to estimate election outcomes.' },
  { term:'First Past the Post',def:'A voting system where the candidate with the most votes wins, even without a majority.' },
  { term:'Franchise',          def:'The right to vote in public elections. Also called suffrage.' },
  { term:'General Election',   def:'The main nationwide election in which voters choose between candidates from all parties.' },
  { term:'Gerrymandering',     def:'Manipulating electoral district boundaries to give one party an unfair advantage.' },
  { term:'Incumbent',          def:'A politician who currently holds office and is seeking re-election.' },
  { term:'Inauguration',       def:'The formal ceremony in which an elected official is sworn into office.' },
  { term:'Landslide',          def:'An election in which one candidate wins by an overwhelmingly large margin.' },
  { term:'Mandate',            def:'The authority granted to an elected official by voters to implement their stated policies.' },
  { term:'Nomination',         def:'The process by which a party formally selects a candidate to represent them in an election.' },
  { term:'Party Platform',     def:'An official document stating a political party\'s positions on major policy issues.' },
  { term:'Plurality',          def:'When a candidate wins more votes than any other but not necessarily a majority (50%+1).' },
  { term:'Poll Worker',        def:'A trained volunteer who staffs a polling station on Election Day, assisting voters.' },
  { term:'Polling Station',    def:'A designated location where registered voters go to cast their ballots on Election Day.' },
  { term:'Primary Election',   def:'An election in which party members choose which candidate will represent their party in the general election.' },
  { term:'Proportional Representation', def:'An electoral system where parties receive seats proportional to their share of the total vote.' },
  { term:'Recount',            def:'A second official count of ballots, usually triggered when the margin of victory is very small.' },
  { term:'Redistricting',      def:'Redrawing electoral district boundaries, typically after a census to reflect population shifts.' },
  { term:'Runoff Election',    def:'A second election held between top candidates when no one reaches the required threshold in the first round.' },
  { term:'Suffrage',           def:'The fundamental right to vote in political elections.' },
  { term:'Swing State',        def:'A U.S. state that is highly competitive — either major party could win — making it a key campaign target.' },
  { term:'Term Limit',         def:'A legal restriction on how many terms a person may hold a specific elected office.' },
  { term:'Voter ID',           def:'Government-issued identification required in some jurisdictions to verify a voter\'s identity.' },
  { term:'Voter Registration', def:'The process by which eligible citizens officially sign up to vote, placing their name on the electoral roll.' },
  { term:'Voter Suppression',  def:'Strategies or policies that make it harder for certain groups of citizens to vote.' },
  { term:'Voter Turnout',      def:'The percentage of eligible voters who actually cast a ballot in a given election.' },
];

let activeAZBtn = null;
let currentFilter = 'all';

function buildGlossary() {
  glossaryBuilt = true;

  // Build A–Z buttons
  const letters = [...new Set(GLOSSARY_DATA.map(g => g.term[0].toUpperCase()))].sort();
  const azNav   = document.querySelector('.glossary-az');
  if (azNav) {
    // The "All" button is already in HTML — wire it up
    const allBtn = azNav.querySelector('[data-letter="all"]');
    if (allBtn) { activeAZBtn = allBtn; }

    letters.forEach(l => {
      const btn = document.createElement('button');
      btn.className    = 'az-btn';
      btn.textContent  = l;
      btn.dataset.action = 'az';
      btn.dataset.letter = l;
      btn.setAttribute('aria-label',   `Filter by letter ${l}`);
      btn.setAttribute('aria-pressed', 'false');
      azNav.appendChild(btn);
    });
  }

  // Search listener
  const input = document.getElementById('glossary-search');
  if (input) {
    input.addEventListener('input', () => {
      currentFilter = 'all';
      document.querySelectorAll('.az-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      const allBtn = document.querySelector('[data-letter="all"]');
      if (allBtn) { allBtn.classList.add('active'); allBtn.setAttribute('aria-pressed', 'true'); }
      renderGlossary(filterGlossary(input.value, 'all'));
    });
  }

  renderGlossary(GLOSSARY_DATA);
}

function onAZClick(btn) {
  const letter = btn.dataset.letter;
  document.querySelectorAll('.az-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-pressed', 'true');
  currentFilter = letter;
  const input   = document.getElementById('glossary-search');
  const search  = input ? input.value : '';
  renderGlossary(filterGlossary(search, letter));
}

function filterGlossary(search, letter) {
  let data = GLOSSARY_DATA;
  if (letter && letter !== 'all') {
    data = data.filter(g => g.term[0].toUpperCase() === letter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    data = data.filter(g => g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q));
  }
  return data;
}

function renderGlossary(data) {
  const el = document.getElementById('glossary-content');
  if (!el) return;

  if (data.length === 0) {
    el.innerHTML = '<div class="glossary-empty">No terms match your search. Try a different keyword.</div>';
    return;
  }

  const groups = {};
  data.forEach(g => {
    const letter = g.term[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(g);
  });

  el.innerHTML = Object.entries(groups)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([letter, terms]) => `
      <div class="glossary-group" role="listitem">
        <div class="glossary-group-letter" aria-label="Terms starting with ${letter}">${letter}</div>
        <div class="glossary-grid">
          ${terms.map(g => `
            <article class="glos-card">
              <div class="glos-term">${g.term}</div>
              <div class="glos-def">${g.def}</div>
              <button class="glos-ask" data-action="glos-ask" data-term="${g.term}" aria-label="Ask AI about ${g.term}">
                Ask AI →
              </button>
            </article>`).join('')}
        </div>
      </div>`).join('');
}

function askFromGlossary(term) {
  showSection('chat');
  setTimeout(() => {
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = `Can you explain the term "${term}" in more detail with an example?`;
      input.focus();
    }
  }, 200);
}

// ═══════════════════════════════════════════════════════════════
// AI CHAT
// ═══════════════════════════════════════════════════════════════
const SUGGESTIONS = [
  'How does voting work?',
  'What is the Electoral College?',
  'What are primaries?',
  'How do other countries hold elections?',
  'How do I register to vote?',
  'What is gerrymandering?',
];

let chatHistory  = [];

function buildChat() {
  chatBuilt = true;

  // Suggestion pills — data-action="chat-sug" is handled by global delegation
  const sugsEl = document.getElementById('chat-suggestions');
  if (sugsEl) {
    sugsEl.innerHTML = SUGGESTIONS.map(s =>
      `<button class="chat-sug" type="button" data-action="chat-sug" data-text="${s}">${s}</button>`
    ).join('');
  }

  // Enter key on chat input
  const input = document.getElementById('chat-input');
  if (input) {
    // Guard against double-binding if somehow called twice
    input.removeEventListener('keydown', chatInputKeydown);
    input.addEventListener('keydown', chatInputKeydown);
  }

  // Welcome message
  addBotMessage('Hello! I am your Election AI, powered by Google Gemini. Ask me anything about elections, voting rights, civic processes, or democratic systems. I am here to educate — not to take political sides.');
}

function chatInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
}

function addBotMessage(text) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.textContent = text;
  div.setAttribute('role', 'status');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addUserMessage(text) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'msg user';
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = 'msg bot typing-dots';
  div.id = 'typing-indicator';
  div.setAttribute('aria-label', 'AI is typing');
  div.textContent = 'Thinking';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

async function sendChat() {
  const input  = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  addUserMessage(text);
  chatHistory.push({ role: 'user', parts: [{ text }] });
  input.value = '';
  if (sendBtn) sendBtn.disabled = true;
  const typing = showTyping();

  try {
    const res  = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory.slice(-10) }),
    });
    const data = await res.json();
    if (typing) typing.remove();

    if (res.ok && data.reply) {
      chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
      addBotMessage(data.reply);
    } else {
      addBotMessage('⚠️ ' + (data.error || 'Something went wrong. Please try again.'));
    }
  } catch (err) {
    if (typing) typing.remove();
    addBotMessage('⚠️ Could not reach the server. Please check your connection.');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
  }
}
