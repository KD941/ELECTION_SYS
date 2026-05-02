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
  { num:1, badge:'pre', badgeText:'Pre-Election', title:'Election Commission Announcement', icon:'🗳️',
    summary:'The Election Commission of India (ECI) announces the election schedule, triggering the Model Code of Conduct immediately.',
    detail:'The ECI, an independent constitutional body under Article 324, issues the election schedule including polling dates, nomination deadlines, and result dates. The moment the schedule is announced, the Model Code of Conduct (MCC) comes into force — restricting the ruling government from making policy announcements, using government machinery for campaigns, or launching new schemes that could influence voters.'},
  { num:2, badge:'pre', badgeText:'Pre-Election', title:'Nomination of Candidates', icon:'📋',
    summary:'Candidates file their nomination papers with the Returning Officer, along with security deposits and sworn affidavits.',
    detail:'For Lok Sabha elections, general category candidates deposit ₹25,000 and SC/ST candidates deposit ₹12,500. Every candidate must submit a statutory affidavit (Form 26) disclosing criminal antecedents, assets, liabilities, and educational qualifications — making this information public. Independent candidates require 10 proposers from the constituency.'},
  { num:3, badge:'pre', badgeText:'Pre-Election', title:'Scrutiny & Withdrawal of Nominations', icon:'🔍',
    summary:'The Returning Officer examines all nominations for validity. Candidates may withdraw within a specified window.',
    detail:'After scrutiny, candidates who find the contest unviable may withdraw by the last date for withdrawal. After this date, the final list of contesting candidates is published. The ECI allots election symbols — recognised national and state parties get reserved symbols (e.g., BJP\'s lotus, Congress\'s hand), while independent and smaller party candidates get symbols from a pool.'},
  { num:4, badge:'pre', badgeText:'Campaign', title:'Election Campaign Period', icon:'📣',
    summary:'Political parties and candidates campaign across constituencies — subject to strict spending limits and the Model Code of Conduct.',
    detail:'The campaign period typically lasts 2–3 weeks. Lok Sabha candidates can spend a maximum of ₹95 lakh per constituency (in larger states). The MCC prohibits: bribery, appealing to voters on communal/caste lines, use of government vehicles/aircraft for campaigning, and booth-capturing. Campaigning ends 48 hours before polling (the "silent period").'},
  { num:5, badge:'vote', badgeText:'Election', title:'Voter Verification & EPIC Cards', icon:'🪪',
    summary:'Eligible voters must be on the Electoral Roll and possess valid identity proof — most commonly the Voter ID (EPIC) card.',
    detail:'India uses Electronic Photo Identity Cards (EPIC), issued free of cost by the ECI. Voters not yet issued EPIC can use 12 alternative documents including Aadhaar, PAN card, passport, driving licence, bank passbook with photo, and MNREGA job card. The electoral roll is prepared ward/village-wise by the Booth Level Officer (BLO), and citizens can check or update their registration at voterportal.eci.gov.in.'},
  { num:6, badge:'vote', badgeText:'Election', title:'Election Day — EVM Voting', icon:'🗳️',
    summary:'Voters cast ballots using Electronic Voting Machines (EVMs) at their designated polling booths. India pioneered EVM use globally.',
    detail:'India uses EVMs manufactured by BEL and ECIL — standalone, non-networked, battery-operated machines not connected to the internet. Since 2019, every EVM is paired with a Voter Verifiable Paper Audit Trail (VVPAT) that prints a paper slip showing the candidate and symbol voted for, which the voter can verify for 7 seconds. Polling typically runs 7 AM to 6 PM. Officials stamp your finger with indelible ink to prevent double voting.'},
  { num:7, badge:'vote', badgeText:'Election', title:'Phased Polling (India\'s Multi-Phase System)', icon:'📅',
    summary:'General Elections are conducted in multiple phases across different states to allow adequate deployment of security forces.',
    detail:'India\'s General Elections are the world\'s largest democratic exercise — over 96 crore (960 million) eligible voters in 2024. The election is held in phases (e.g., 7 phases in 2024) so that central paramilitary forces can be deployed across all states for security. Different states poll on different dates, with results declared together after the final phase.'},
  { num:8, badge:'post', badgeText:'Post-Election', title:'Counting of Votes & Results', icon:'📊',
    summary:'Votes are counted at counting centres on a designated date. EVM results are cross-checked with VVPAT slips.',
    detail:'Counting happens under strict security. For each Assembly/Lok Sabha segment, 5 randomly selected VVPAT slip counts are cross-matched with EVM totals as a mandatory audit. Candidates and their counting agents are present. The Returning Officer declares the winner by issuing a formal certificate of election. Results are simultaneously uploaded to the ECI website in real-time.'},
  { num:9, badge:'post', badgeText:'Post-Election', title:'Formation of Government', icon:'🏛️',
    summary:'The party or coalition winning a majority (272+ seats in Lok Sabha) forms the government. The President invites the leader to be Prime Minister.',
    detail:'If one party wins a clear majority of 272 seats in the 543-seat Lok Sabha, its leader is invited by the President. If no single party wins a majority (hung Parliament), coalition negotiations begin. The leader who can demonstrate majority support is invited to form the government. The Prime Minister is sworn in at Rashtrapati Bhavan by the President of India.'},
  { num:10, badge:'post', badgeText:'Post-Election', title:'Swearing-In Ceremony', icon:'🎖️',
    summary:'The Prime Minister and Council of Ministers are sworn in by the President of India at Rashtrapati Bhavan.',
    detail:'The President administers the oath of office and secrecy to the Prime Minister and each Cabinet Minister. Ministers take an oath to uphold the Constitution, discharge duties faithfully, and maintain secrecy of Cabinet proceedings. The newly formed government then presents itself before Parliament and wins a vote of confidence within 30 days.'},
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
  { icon:'🗳️', bg:'#0d1f3c', title:'The Voter',
    desc:'Every Indian citizen aged 18 or above who is registered on the Electoral Roll can vote. Voting is a fundamental right under Article 326 of the Constitution. Your EPIC card (Voter ID) is your key to the polling booth.' },
  { icon:'🏛️', bg:'#1a5c33', title:'Election Commission of India (ECI)',
    desc:'An independent constitutional body under Article 324, headed by the Chief Election Commissioner. The ECI manages the entire election process — issuing the schedule, enforcing the Model Code of Conduct, recognising parties, allotting symbols, and certifying results.' },
  { icon:'🎯', bg:'#283593', title:'The Candidate',
    desc:'Any Indian citizen who meets constitutional eligibility — age 25+ for Lok Sabha/Vidhan Sabha, 30+ for Rajya Sabha/Vidhan Parishad — can contest. Candidates file nominations with the Returning Officer, submit Form 26 affidavits, and pay a security deposit.' },
  { icon:'🏳️', bg:'#5c3317', title:'Political Parties',
    desc:'The ECI recognises parties as National, State, or Registered-Unrecognised. Recognised parties get reserved election symbols and free time on Doordarshan/AIR. The Anti-Defection Law (10th Schedule) prevents elected members from switching parties after winning.' },
  { icon:'📋', bg:'#6a1e55', title:'Returning Officer (RO)',
    desc:'A senior government official (usually District Collector) appointed for each constituency. The RO receives nominations, conducts scrutiny, oversees polling, supervises counting, and formally declares the winning candidate by issuing a certificate of election.' },
  { icon:'🔵', bg:'#1a4a5c', title:'Election Observers',
    desc:'Senior IAS, IPS, and IRS officers deployed by the ECI to independently monitor elections in constituencies. General Observers check overall conduct; Expenditure Observers track campaign spending; Police Observers oversee law and order.' },
  { icon:'🤝', bg:'#4a3c17', title:'Booth Level Officers (BLOs)',
    desc:'Government employees responsible for a cluster of polling booths — updating the electoral roll, removing dead/migrated voters, and enrolling new eligible voters. BLOs are the grassroots link between citizens and the electoral system.' },
  { icon:'⚖️', bg:'#1a3a5c', title:'Micro-Observers & Polling Personnel',
    desc:'Presiding Officers and Polling Officers (usually government teachers and officials) staff each polling booth. They verify voter identity, operate EVMs, apply indelible ink, and maintain a complete record of the day\'s proceedings in Form 17C.' },
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
  { q:'The minimum age to vote in Indian elections is 18 years.', a:true,
    explain:'The 61st Constitutional Amendment (1989) lowered the voting age from 21 to 18 years. Any Indian citizen aged 18 or above on the qualifying date can register to vote.' },
  { q:'The Election Commission of India is a permanent, independent constitutional body.', a:true,
    explain:'The ECI is established under Article 324 of the Constitution. It is independent of the government — the Chief Election Commissioner can only be removed through a process similar to removing a Supreme Court judge.' },
  { q:'India uses paper ballots in all General Elections today.', a:false,
    explain:'India uses Electronic Voting Machines (EVMs) in all elections. EVMs were first used nationwide in the 2004 General Elections. They are paired with VVPATs since 2019 for added transparency.' },
  { q:'A candidate contesting a Lok Sabha seat must be at least 25 years old.', a:true,
    explain:'Article 84(b) of the Constitution requires Lok Sabha candidates to be at least 25. For Rajya Sabha, the age is 30. For the President and Vice President, it is also 35.' },
  { q:'The Model Code of Conduct (MCC) has statutory backing under Indian law.', a:false,
    explain:'The MCC is a set of guidelines evolved through consensus — it does NOT have statutory backing. However, it is enforced by the ECI using its powers under Articles 324 and other election laws. Violations can lead to candidate disqualification or FIRs.' },
  { q:'Indelible ink used on voters\' fingers during Indian elections is manufactured in Mysuru, Karnataka.', a:true,
    explain:'The Mysore Paints and Varnish Limited (MPVL), a Government of Karnataka enterprise, is the sole manufacturer of the indelible ink used in Indian elections — a tradition since 1962.' },
  { q:'In India, a candidate forfeits their security deposit if they fail to secure 1/6 of the total valid votes.', a:true,
    explain:'A Lok Sabha candidate forfeits the ₹25,000 security deposit if they fail to get more than 1/6 (about 16.67%) of the total valid votes polled in their constituency.' },
  { q:'India uses the Proportional Representation system for Lok Sabha elections.', a:false,
    explain:'Lok Sabha and all Vidhan Sabha elections use First-Past-the-Post (FPTP) — the candidate with the most votes wins. Proportional Representation (Single Transferable Vote) is used only for Rajya Sabha and President/Vice President elections.' },
  { q:'The Voter Verifiable Paper Audit Trail (VVPAT) was first used in all constituencies in the 2019 General Elections.', a:true,
    explain:'VVPAT machines were used in all 543 Lok Sabha constituencies for the first time in the 2019 General Elections. They allow voters to see a paper slip confirming their vote for 7 seconds before it falls into a sealed box.' },
  { q:'A person convicted and sentenced to 2 or more years in prison is disqualified from contesting elections.', a:true,
    explain:'Under Section 8 of the Representation of the People Act 1951, a person convicted of certain offences and sentenced to imprisonment of 2 years or more is disqualified from contesting for 6 years after serving the sentence.' },
  { q:'The "silent period" before Indian elections means no campaigning is allowed 48 hours before polling.', a:true,
    explain:'Section 126 of the Representation of the People Act 1951 prohibits election campaigning — including public meetings, processions, and TV/radio ads — within 48 hours of the close of polling.' },
  { q:'Political parties in India must declare all donations above ₹20,000 to the ECI.', a:true,
    explain:'Under Section 29C of the RPA 1951, parties must report contributions above ₹20,000 to the ECI. However, the Electoral Bond scheme (operative 2018–2024) allowed anonymous corporate donations before being struck down by the Supreme Court in February 2024.' },
  { q:'India has reserved constituencies for Scheduled Castes (SCs) and Scheduled Tribes (STs) in Lok Sabha.', a:true,
    explain:'The Constitution provides reserved constituencies for SCs (84 seats) and STs (47 seats) in the Lok Sabha. Only candidates belonging to these communities can contest from reserved seats, though all voters in the constituency vote.' },
  { q:'The Chief Election Commissioner can be removed by the President of India at will.', a:false,
    explain:'The Chief Election Commissioner enjoys security of tenure similar to a Supreme Court judge — they can only be removed through a process of impeachment by Parliament. This protects the ECI\'s independence from government pressure.' },
  { q:'NOTA (None of the Above) option was introduced in Indian elections in 2013.', a:true,
    explain:'The Supreme Court directed the ECI to introduce NOTA in its September 2013 judgment. NOTA was first used in five state assembly elections in November 2013. However, NOTA votes do not elect any candidate — the highest vote-getter among candidates wins even if NOTA gets more votes.' },
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
  'ECI Announces Election Schedule & MCC',
  'Nomination Filing by Candidates',
  'Scrutiny & Withdrawal of Nominations',
  'Campaign Period (max 3 weeks)',
  'Silent Period (48 hrs before polling)',
  'Election Day — EVM Voting',
  'Counting of Votes & VVPAT Audit',
  'Swearing-In of Government',
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
  { term:'Electoral Roll',        def:'The official list of all eligible voters in a constituency, maintained by the Election Commission of India.', ex:'Ramesh checked the Electoral Roll online at voterportal.eci.gov.in to confirm his name before voting.' },
  { term:'EPIC Card',             def:'Electronic Photo Identity Card — the Voter ID card issued free by the ECI to registered voters.', ex:'Priya carried her EPIC card to the polling booth to prove her identity before voting.' },
  { term:'EVM',                   def:'Electronic Voting Machine — a standalone, battery-operated device used in all Indian elections since 2004 to record votes digitally.', ex:'The voter pressed the button next to her chosen candidate\'s name and symbol on the EVM.' },
  { term:'VVPAT',                 def:'Voter Verifiable Paper Audit Trail — a machine attached to the EVM that prints a paper slip showing the candidate voted for, visible for 7 seconds.', ex:'After pressing the EVM button, Arun saw the VVPAT paper slip confirm his vote before it dropped into the sealed box.' },
  { term:'Model Code of Conduct', def:'A set of guidelines issued by the ECI that governs the conduct of political parties and candidates from the announcement of elections till results.', ex:'The MCC prevented the ruling party from announcing new welfare schemes or transferring senior officials after the election schedule was released.' },
  { term:'Lok Sabha',             def:'The lower house of Parliament — the House of the People. It has 543 elected seats; a party needs 272 to form a majority government.', ex:'After winning 303 seats in the Lok Sabha, the party had a clear majority to form the government.' },
  { term:'Rajya Sabha',           def:'The upper house of Parliament — the Council of States. Members are elected by state legislative assemblies, not directly by the public.', ex:'The bill was passed by the Lok Sabha but faced debate in the Rajya Sabha before becoming law.' },
  { term:'Constituency',          def:'A geographic division of the country from which one representative is elected to Parliament or a state legislature.', ex:'The candidate campaigned door-to-door across every village in her Lok Sabha constituency.' },
  { term:'Returning Officer',     def:'A government official (usually the District Collector) responsible for conducting the election in a constituency — from nominations to declaration of results.', ex:'The Returning Officer declared the winning candidate after completing the vote count and VVPAT audit.' },
  { term:'Anti-Defection Law',    def:'The 10th Schedule of the Constitution, which disqualifies elected members who voluntarily leave their party or vote against party directives without permission.', ex:'The MLA was disqualified under the Anti-Defection Law after voting against his party\'s whip in the state assembly.' },
  { term:'NOTA',                  def:'None of the Above — a ballot option introduced in 2013 that allows voters to reject all candidates. NOTA does not affect the result; the leading candidate still wins.', ex:'Frustrated with all candidates, Meena pressed NOTA on the EVM — but the winning candidate was still declared.' },
  { term:'Delimitation',          def:'The process of redrawing the boundaries of parliamentary and assembly constituencies, carried out by the Delimitation Commission after each census.', ex:'After the 2001 census, the Delimitation Commission redrew constituency boundaries to reflect population changes.' },
  { term:'By-Election',           def:'An election held to fill a vacancy in a constituency caused by the death, resignation, or disqualification of the sitting member.', ex:'A by-election was held in the constituency after the MP passed away six months into the term.' },
  { term:'Booth Capturing',       def:'The illegal act of seizing control of a polling booth and casting fraudulent votes — a serious electoral offence under Section 135A of the RPA 1951.', ex:'The election in that booth was cancelled and re-polled after reports of booth capturing by armed groups.' },
  { term:'Hung Parliament',       def:'A situation where no single party or pre-election coalition wins an outright majority (272+ seats) in the Lok Sabha after a General Election.', ex:'The 1989 and 1996 elections produced hung Parliaments, leading to coalition governments and political instability.' },
  { term:'Form 26',               def:'A statutory affidavit that every candidate must file along with their nomination, disclosing criminal records, assets, liabilities, and educational qualifications.', ex:'Voters read the Form 26 affidavit online to learn about their candidates\' declared assets before deciding whom to vote for.' },
  { term:'Indelible Ink',         def:'A chemical ink applied to the left index finger of every voter after casting their ballot, to prevent double voting. It cannot be washed off for several weeks.', ex:'After voting, the poll officer applied indelible ink to Kavya\'s finger — a visible mark of civic participation.' },
  { term:'Silent Period',         def:'The 48 hours before the close of polling during which all campaigning — rallies, TV ads, and social media appeals — is strictly prohibited.', ex:'The political party pulled down all its digital ads on the day the silent period began.' },
  { term:'Reserved Constituency', def:'A parliamentary or assembly seat where only candidates from Scheduled Castes (SC) or Scheduled Tribes (ST) may contest, though all voters in the area vote.', ex:'The MP representing the reserved SC constituency championed the rights of Dalit communities in Parliament.' },
  { term:'Voter Turnout',         def:'The percentage of registered voters who actually cast their ballot in a given election. India\'s 2024 General Election saw a turnout of about 65.79%.', ex:'High voter turnout in rural areas was credited with deciding the outcome in several closely contested constituencies.' },
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
    scene: 'It\'s <strong>Election Day</strong> in your constituency. You are 18 and this is your very first time voting in a Lok Sabha election. You wake up excited. What do you do first?',
    choices: [
      { text: 'Check the Electoral Roll online to confirm my name and booth number', next: 'registered' },
      { text: 'Head straight to any polling booth nearby',                           next: 'wrong_booth' },
    ]
  },
  registered: {
    scene: 'Smart move! You find your name on the Electoral Roll at <strong>voterportal.eci.gov.in</strong> and note your booth number. You pack your <strong>EPIC (Voter ID) card</strong>. What next?',
    choices: [
      { text: 'Reach the booth, join the queue for my gender, and wait my turn', next: 'in_queue' },
      { text: 'Try to cut the queue — I\'m in a hurry',                          next: 'queue_jump' },
    ]
  },
  wrong_booth: {
    scene: 'The Polling Officer checks the voter list. <strong>Your name is not in this booth\'s list</strong> — each voter is assigned a specific booth. You must go to your correct booth.',
    choices: [
      { text: 'Ask the officer for help locating my correct booth', next: 'registered' },
      { text: 'Give up and go home without voting',                 next: 'bad_end' },
    ]
  },
  in_queue: {
    scene: 'You are in the queue. The Polling Officer checks your name, verifies your <strong>EPIC card</strong>, and marks your name in the register. What happens next?',
    choices: [
      { text: 'Sign/put thumb impression in Form 17A and receive a voter slip', next: 'evm_booth' },
    ]
  },
  queue_jump: {
    scene: 'The Booth Level Officer asks you to join the proper queue. <strong>Disrupting polling order is an offence</strong> under Section 132 of the RPA 1951. You rejoin the queue.',
    choices: [
      { text: 'Wait patiently in the correct queue', next: 'in_queue' },
    ]
  },
  evm_booth: {
    scene: 'You enter the <strong>voting compartment</strong>. The Presiding Officer activates the EVM\'s Ballot Unit. You see buttons next to candidate names and their party symbols. How do you vote?',
    choices: [
      { text: 'Press the button next to my chosen candidate — I see the VVPAT light up!', next: 'voted_well' },
      { text: 'Press multiple buttons — I want to vote for two candidates',               next: 'multi_press' },
    ]
  },
  multi_press: {
    scene: 'The EVM <strong>registers only the first press</strong> and locks automatically — you cannot vote twice on the same machine. Your vote for the first candidate you pressed has been recorded.',
    choices: [{ text: 'I understand — the system is designed to prevent double voting', next: 'voted_well' }]
  },
  voted_well: {
    scene: 'You pressed the button, saw the VVPAT paper slip show your candidate\'s name and symbol for 7 seconds, and the "beep" confirmed your vote. The officer applies <strong>indelible ink</strong> to your left index finger.',
    choices: [{ text: 'Thank the polling staff and leave — my vote is cast!', next: 'great_end' }]
  },
  bad_end:   { scene:'', choices:[], end:{ icon:'🔔', title:'Lesson Learned', desc:'You didn\'t vote this time. Remember: check your name on the Electoral Roll at voterportal.eci.gov.in, carry your EPIC card or any of 12 valid alternative IDs, and reach your correct assigned booth.' } },
  great_end: { scene:'', choices:[], end:{ icon:'🇮🇳', title:'पहला वोट! First Vote Cast Successfully', desc:'You checked the roll, carried your EPIC card, went to the correct booth, verified your identity, pressed the EVM button, and confirmed via VVPAT. The indelible ink on your finger is your badge of citizenship. जय हिन्द!' } },
  ok_end:    { scene:'', choices:[], end:{ icon:'✅', title:'Vote Recorded', desc:'Your vote was cast — well done! Next time, remember to confirm your booth number in advance and bring your EPIC card or a valid alternative identity document.' } },
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
  { term:'Anti-Defection Law',      def:'The 10th Schedule of the Constitution that disqualifies elected members who defect from their party or defy its whip without authorisation.' },
  { term:'Article 324',             def:'The constitutional provision that establishes the Election Commission of India and vests it with superintendence, direction, and control of all elections.' },
  { term:'Article 326',             def:'The constitutional provision that grants the right to vote to every Indian citizen aged 18 or above, subject to eligibility criteria.' },
  { term:'By-Election',             def:'An election held to fill a single vacant seat in Parliament or a state legislature caused by death, resignation, or disqualification of the sitting member.' },
  { term:'Booth Capturing',         def:'The criminal act of seizing a polling booth and casting fraudulent votes — an offence under Section 135A of the Representation of the People Act 1951.' },
  { term:'Booth Level Officer',     def:'A government employee responsible for a cluster of polling booths, maintaining the electoral roll and enrolling eligible voters.' },
  { term:'Candidate',               def:'A person who contests an election. Lok Sabha candidates must be Indian citizens aged 25+, file a nomination, pay a security deposit, and submit a Form 26 affidavit.' },
  { term:'Chief Election Commissioner', def:'The head of the Election Commission of India, enjoying security of tenure equivalent to a Supreme Court judge. Cannot be removed except by Parliamentary impeachment.' },
  { term:'Constituency',            def:'A geographic division from which one representative is elected to Parliament (Lok Sabha) or a state legislature (Vidhan Sabha).' },
  { term:'Delimitation',            def:'The periodic redrawing of electoral constituency boundaries by the Delimitation Commission, based on population data from the latest census.' },
  { term:'Deposit Forfeiture',      def:'A candidate forfeits their security deposit (₹25,000 for Lok Sabha) if they fail to secure more than 1/6 of the total valid votes polled in their constituency.' },
  { term:'Electoral Roll',          def:'The official voter list for a constituency maintained by the ECI. Citizens can check and update their registration at voterportal.eci.gov.in.' },
  { term:'EPIC Card',               def:'Electronic Photo Identity Card — the Voter ID card issued free by the ECI. The primary identity document for voting, though 12 alternatives are also accepted.' },
  { term:'EVM',                     def:'Electronic Voting Machine — a standalone, battery-operated, non-networked machine used to record votes in all Indian elections since 2004.' },
  { term:'Exit Poll',               def:'A survey of voters conducted as they leave polling booths, used to predict election results before the official count. Exit polls are banned from publication during the polling period.' },
  { term:'First Past the Post',     def:'India\'s voting system for Lok Sabha and Vidhan Sabha elections — the candidate with the most votes in a constituency wins, even without a majority.' },
  { term:'Form 26',                 def:'A mandatory affidavit filed by every candidate disclosing criminal history, assets, liabilities, and educational qualifications — publicly available on the ECI website.' },
  { term:'General Election',        def:'The nationwide election for all 543 Lok Sabha seats, held every 5 years. India\'s 2024 General Election involved over 96 crore eligible voters.' },
  { term:'Hung Parliament',         def:'When no single party or pre-poll coalition wins 272+ seats in the Lok Sabha — requiring post-election coalition negotiations to form a government.' },
  { term:'Indelible Ink',           def:'A chemical ink applied to the left index finger of every voter after casting their ballot to prevent double voting. Manufactured by MPVL, Mysuru since 1962.' },
  { term:'Lok Sabha',               def:'The House of the People — India\'s lower house of Parliament with 543 elected seats. A majority (272+) is required to form the government.' },
  { term:'Model Code of Conduct',   def:'Guidelines issued by the ECI upon announcement of the election schedule, governing party and candidate conduct. It lacks statutory backing but is powerfully enforced by the ECI.' },
  { term:'NOTA',                    def:'None of the Above — the option to reject all candidates on an EVM ballot, introduced by Supreme Court order in 2013. NOTA does not prevent the highest vote-getter from winning.' },
  { term:'Nomination',              def:'The formal process by which a candidate files papers with the Returning Officer to contest an election, along with a security deposit and Form 26 affidavit.' },
  { term:'Observer',                def:'A senior IAS/IPS/IRS officer deployed by the ECI to independently monitor election conduct, expenditure, and law-and-order in a constituency.' },
  { term:'Polling Booth',           def:'The designated location where voters in a specific area cast their ballots. Each booth serves approximately 1,200–1,500 voters. India had 10.5 lakh polling stations in 2024.' },
  { term:'Rajya Sabha',             def:'India\'s upper house of Parliament — the Council of States. Members are indirectly elected by state legislative assemblies for 6-year terms.' },
  { term:'Representation of the People Act', def:'The key legislation (passed in 1951) governing elections in India — covering qualifications, disqualifications, conduct of elections, and election offences.' },
  { term:'Reserved Constituency',   def:'A constituency where only SC or ST candidates may contest. India has 84 reserved SC seats and 47 reserved ST seats in the Lok Sabha.' },
  { term:'Returning Officer',       def:'The government official (usually District Collector) responsible for conducting the election in a constituency — from nominations to results declaration.' },
  { term:'Security Deposit',        def:'A refundable fee paid by candidates on nomination: ₹25,000 for Lok Sabha (₹12,500 for SC/ST). Forfeited if less than 1/6 of votes are obtained.' },
  { term:'Silent Period',           def:'The 48-hour window before the close of polling during which all campaigning is prohibited under Section 126 of the RPA 1951.' },
  { term:'Symbol',                  def:'An icon allotted by the ECI to each candidate — reserved symbols for recognised parties, free symbols for others — to help illiterate voters identify candidates.' },
  { term:'Voter Turnout',           def:'The percentage of registered voters who actually vote. India\'s 2024 Lok Sabha election turnout was approximately 65.79%.' },
  { term:'VVPAT',                   def:'Voter Verifiable Paper Audit Trail — a device attached to EVMs that prints a paper slip displaying the candidate voted for, visible to the voter for 7 seconds.' },
  { term:'Vidhan Sabha',            def:'A state legislative assembly. Members (MLAs) are elected by voters in state constituencies using the First Past the Post system.' },
  { term:'Whip',                    def:'A directive issued by a political party to its elected members to vote in a specific way. Defying a whip can trigger disqualification under the Anti-Defection Law.' },
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
  'How does voting work in India?',
  'What is the Model Code of Conduct?',
  'How do EVMs and VVPATs work?',
  'What is the Anti-Defection Law?',
  'How do I register to vote in India?',
  'What are reserved constituencies?',
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
  addBotMessage('नमस्ते! I am your Indian Election AI, powered by Google Gemini. Ask me anything about Indian elections, the Election Commission of India, EVMs, the Representation of the People Act, voter registration, or your constitutional rights as a citizen. I am here to educate — not to take political sides.');
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
