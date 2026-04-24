'use strict';
/* ═══════════════════════════════════════════════════════════════
   ElectED — Main Application Script
   Sections: Navigation · Theme · Timeline · Roles · Games ×4 · Glossary · Chat
   ═══════════════════════════════════════════════════════════════ */

// ─── Navigation ──────────────────────────────────────────────────────────────
const NAV_IDS = ['home', 'timeline', 'roles', 'games', 'glossary', 'chat'];

function showSection(id) {
  NAV_IDS.forEach(sid => {
    const el = document.getElementById('sec-' + sid);
    if (el) {
      el.classList.toggle('active', sid === id);
    }
    const btn = document.getElementById('nav-' + sid);
    if (btn) btn.setAttribute('aria-current', sid === id ? 'true' : 'false');
  });

  // Lazy-init sections
  if (id === 'timeline' && !timelineBuilt) buildTimeline();
  if (id === 'roles'    && !rolesBuilt)    buildRoles();
  if (id === 'glossary' && !glossaryBuilt) buildGlossary();
  if (id === 'chat'     && !chatBuilt)     buildChat();

  // Close mobile nav
  document.getElementById('nav-links').classList.remove('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleNav() {
  const links = document.getElementById('nav-links');
  const btn   = document.getElementById('hamburger');
  const open  = links.classList.toggle('open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  btn.textContent = open ? '✕' : '☰';
}

// ─── Dark Mode ────────────────────────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const dark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', dark ? 'light' : 'dark');
  document.getElementById('theme-icon').textContent = dark ? '🌙' : '☀️';
}

// Respect system preference
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.getElementById('theme-icon').textContent = '☀️';
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────────────────────────────────────
let timelineBuilt = false;

const TIMELINE_DATA = [
  { num:1, badge:'pre', badgeText:'Pre-Election', title:'Candidate Announcement', icon:'📢',
    summary:'Potential candidates officially announce their intention to run, forming campaign committees and beginning fundraising.',
    detail:'Candidates file paperwork with the electoral commission, declare their candidacy publicly, and begin assembling their campaign team — including campaign managers, communications directors, and fundraisers. This phase can start years before the actual election.'},
  { num:2, badge:'pre', badgeText:'Pre-Election', title:'Primary Elections / Caucuses', icon:'🏛️',
    summary:'Voters within each party choose their preferred candidate through primaries (direct voting) or caucuses (public meetings).',
    detail:'Primaries are state-run elections where any registered party member can vote privately. Caucuses are party-organized public gatherings where voters openly group by candidate preference. Winners earn "delegates" who represent them at the national convention.'},
  { num:3, badge:'pre', badgeText:'Pre-Election', title:'Party Conventions & Nominations', icon:'🎉',
    summary:'Each major party holds a national convention where delegates formally nominate their presidential and vice-presidential candidates.',
    detail:'Conventions are also where parties adopt their official platform — a detailed document outlining their policy positions and goals for the country. Running mates are typically announced just before or during the convention.'},
  { num:4, badge:'pre', badgeText:'Campaign', title:'General Election Campaign', icon:'📣',
    summary:'Nominated candidates campaign nationwide — holding rallies, debating opponents, and running advertisements.',
    detail:'This phase includes presidential debates (and VP debates), intense media coverage, and billions in advertising spending. Campaign strategy focuses heavily on swing states or key constituencies that could go either way.'},
  { num:5, badge:'vote', badgeText:'Election', title:'Voter Registration Deadline', icon:'📝',
    summary:'Most regions require voters to register ahead of time. Deadlines vary — usually 15–30 days before Election Day.',
    detail:'Registration confirms your eligibility to vote and ensures your name appears on the official voter roll at your polling place. Some places offer same-day registration on Election Day itself. Check your state or country\'s specific rules at your electoral authority\'s website.'},
  { num:6, badge:'vote', badgeText:'Election', title:'Election Day Voting', icon:'🗳️',
    summary:'Registered voters cast their ballots at polling stations or via mail/absentee ballots. Democracy in action.',
    detail:'Polling stations open in the morning and close in the evening. Officials check voter IDs, guide voters through the ballot, and ensure the process is secure and accessible. Many jurisdictions also allow early voting in the days leading up to Election Day.'},
  { num:7, badge:'post', badgeText:'Post-Election', title:'Vote Counting & Certification', icon:'🔢',
    summary:'Ballots are counted by election officials. Results are certified by state/national authorities — often taking days.',
    detail:'Absentee and mail-in ballots may take longer to process than in-person votes. Either candidate can request a recount if the margin is extremely close. Election observers (domestic and international) monitor this process for fairness.'},
  { num:8, badge:'post', badgeText:'Post-Election', title:'Electoral College Vote (U.S.)', icon:'🏛️',
    summary:'In the U.S., electors in the Electoral College cast official votes for president based on their state\'s results.',
    detail:'Electors are generally pledged to vote for the candidate who won their state. Most states use a winner-take-all model; Maine and Nebraska use proportional allocation. A candidate needs 270 of 538 electoral votes to win. In parliamentary systems, this step works differently — the parliament or legislature selects the government leader.'},
  { num:9, badge:'post', badgeText:'Post-Election', title:'Congressional Certification', icon:'📜',
    summary:'Congress meets in a joint session to officially count and certify electoral votes, formally confirming the result.',
    detail:'The Vice President presides over this joint session. Objections can be raised by members of Congress, but they require a majority vote in both chambers to be sustained — an extremely high bar. This is the final formal confirmation of who won.'},
  { num:10, badge:'post', badgeText:'Post-Election', title:'Inauguration Day', icon:'🎖️',
    summary:'The winner is officially sworn into office, takes the constitutional oath, and delivers an inaugural address to the nation.',
    detail:'In the U.S., Inauguration Day is January 20th. The outgoing president facilitates a peaceful transfer of power by tradition — a cornerstone of democratic governance. The incoming president\'s first acts and speech set the tone for their administration.'},
];

function buildTimeline() {
  timelineBuilt = true;
  const el = document.getElementById('timeline-steps');

  el.innerHTML = TIMELINE_DATA.map(t => `
    <div class="tl-item" role="listitem" data-num="${t.num}">
      <div class="tl-dot" aria-hidden="true">${t.num}</div>
      <div class="tl-card" role="button" tabindex="0"
        aria-expanded="false"
        aria-label="${t.title} — click to expand"
        onclick="toggleExpand(this)"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleExpand(this);}">
        <span class="tl-badge badge-${t.badge}">${t.badgeText}</span>
        <h2 style="font-size:.97rem;font-weight:600">${t.icon} <span>${t.title}</span></h2>
        <p class="tl-summary">${t.summary}</p>
        <div class="tl-expand" role="region">
          <div class="tl-expand-inner">${t.detail}</div>
        </div>
        <p class="tl-hint" aria-hidden="true">↓ Click to expand</p>
      </div>
    </div>
  `).join('');

  // Animate in
  setTimeout(() => {
    document.querySelectorAll('.tl-item').forEach((item, i) => {
      setTimeout(() => item.classList.add('visible'), i * 75);
    });
  }, 50);
}

function toggleExpand(card) {
  const exp  = card.querySelector('.tl-expand');
  const hint = card.querySelector('.tl-hint');
  const open = card.getAttribute('aria-expanded') === 'true';

  if (open) {
    exp.style.maxHeight = '0px';
    hint.textContent = '↓ Click to expand';
    card.setAttribute('aria-expanded', 'false');
  } else {
    exp.style.maxHeight = exp.scrollHeight + 'px';
    hint.textContent = '↑ Click to collapse';
    card.setAttribute('aria-expanded', 'true');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────────────────────
let rolesBuilt = false;

const ROLES_DATA = [
  { icon:'🙋', bg:'#0d1f3c', title:'The Voter',
    desc:'The most important participant in any democracy. Eligible citizens cast ballots to select their representatives. Voting is both a fundamental right and a civic responsibility — and one that many people in history fought hard to obtain.' },
  { icon:'🎤', bg:'#1a5c33', title:'The Candidate',
    desc:'A person who runs for elected office. Candidates build campaign teams, raise funds, develop policy platforms, hold public events, and ask voters for their support. They may run independently or be nominated by a political party.' },
  { icon:'🏛️', bg:'#283593', title:'Political Parties',
    desc:'Organizations that share ideological values and nominate candidates for election. They coordinate campaign strategy, develop policy platforms, and mobilize voters. Common party types range from center-right to center-left, with many variations globally.' },
  { icon:'⚖️', bg:'#5c3317', title:'Electoral Commission',
    desc:'An independent government body that oversees the entire election process — managing voter rolls, certifying candidates, running and monitoring polling stations, counting ballots, and certifying final results. Independence from government is crucial for credibility.' },
  { icon:'📰', bg:'#6a1e55', title:'The Media',
    desc:'Journalists, newspapers, TV networks, and digital outlets inform the public about candidates, policies, debates, and results. A free and independent press is widely considered essential to a healthy democracy.' },
  { icon:'🔍', bg:'#1a4a5c', title:'Election Observers',
    desc:'Trained monitors — international or domestic — who watch the election process to verify it is free, fair, and transparent. They are permitted to observe voting, counting, and certification. They report irregularities to authorities and the public.' },
  { icon:'🧑‍⚖️', bg:'#4a3c17', title:'Poll Workers',
    desc:'Trained volunteers or employees who staff polling stations on election day — verifying voter IDs, distributing ballots, maintaining order, answering questions, and ensuring the voting process runs smoothly and accessibly for all.' },
  { icon:'💰', bg:'#1a3a5c', title:'Campaign Donors &amp; Funders',
    desc:'Individuals, organisations, or PACs that provide financial support to candidates or parties. Campaign finance rules vary significantly by country — some have strict spending limits and donor transparency requirements; others are more permissive.' },
];

function buildRoles() {
  rolesBuilt = true;
  const el = document.getElementById('roles-list');
  el.innerHTML = ROLES_DATA.map(r => `
    <article class="role-card" role="listitem">
      <div class="role-icon" style="background:${r.bg}" aria-hidden="true">${r.icon}</div>
      <div class="role-info">
        <h2 class="role-info" style="font-size:.97rem;font-weight:600;color:var(--text);margin-bottom:.3rem">${r.title}</h2>
        <p style="font-size:.84rem;color:var(--muted);line-height:1.55">${r.desc}</p>
      </div>
    </article>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// GAMES — Shared
// ─────────────────────────────────────────────────────────────────────────────
function startGame(id) {
  document.getElementById('game-selector').style.display = 'none';
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
  document.getElementById('game-selector').style.display = '';
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 1: True or False Buzz
// ─────────────────────────────────────────────────────────────────────────────
const QUIZ_DATA = [
  { q:'You must be a registered voter to cast a ballot in most elections.', a:true,
    explain:'Registration confirms eligibility and places you on the official voter roll. Some states offer same-day registration, but most require signing up in advance.' },
  { q:'The candidate with the most popular votes always wins the U.S. presidency.', a:false,
    explain:'The U.S. uses the Electoral College. A candidate can win the most votes nationally but lose the election, as happened in 2000 and 2016.' },
  { q:'Primary elections determine which candidate represents their party in the general election.', a:true,
    explain:'Primaries let party members or registered voters choose their preferred candidate before the main nationwide election.' },
  { q:'Gerrymandering means drawing district boundaries to give one party an unfair advantage.', a:true,
    explain:'The term comes from Governor Elbridge Gerry who approved oddly shaped districts in 1812. It remains a hotly debated issue in electoral reform.' },
  { q:'The U.S. President is limited to two terms in office by the Constitution.', a:true,
    explain:'The 22nd Amendment (ratified 1951) limits the President to two four-year terms, for a maximum of eight years in office.' },
  { q:'Absentee ballots are only for people who are physically unable to go to a polling station.', a:false,
    explain:'Many states allow any registered voter to request an absentee or mail-in ballot — no special reason required. Rules vary by state.' },
  { q:'Exit polls are conducted as voters leave the polling station after casting their ballot.', a:true,
    explain:'Exit polls sample voters as they exit — they\'re used to predict results before official counting is complete. They can occasionally be wrong.' },
  { q:'Proportional representation means parties receive seats roughly equal to their vote share.', a:true,
    explain:'Unlike winner-take-all systems, proportional representation lets smaller parties gain seats based on their percentage of the total vote.' },
  { q:'A "swing state" is one that reliably votes for the same party every election.', a:false,
    explain:'Swing states (battleground states) are competitive — they could go to either party, making them key campaign targets.' },
  { q:'In a plurality voting system, a candidate needs more than 50% of votes to win.', a:false,
    explain:'Plurality (first-past-the-post) means the candidate with the MOST votes wins — even without a majority. Just more than any other candidate.' },
  { q:'A runoff election occurs when no candidate wins the required majority in the first round.', a:true,
    explain:'Runoffs narrow the field to the top two candidates so voters can choose a clear majority winner in a second round.' },
  { q:'The electoral college was established by the U.S. Bill of Rights.', a:false,
    explain:'The Electoral College was established by Article II, Section 1 of the U.S. Constitution — not the Bill of Rights, which covers individual liberties.' },
  { q:'Voter suppression refers to strategies that make it harder for certain groups to vote.', a:true,
    explain:'Voter suppression tactics have historically included strict ID laws, poll taxes, limited polling hours, and purging voter rolls — all of which disproportionately affect certain communities.' },
  { q:'A landslide victory means a candidate won by a very small margin.', a:false,
    explain:'A landslide is an overwhelming electoral victory — winning by a very large margin, often carrying most districts or states.' },
  { q:'Same-day voter registration exists in some U.S. states.', a:true,
    explain:'Over 20 U.S. states allow voters to register at the polls on Election Day, increasing participation among those who missed earlier deadlines.' },
];

const quizState = { cur: 0, score: 0, answered: false, qs: [], timer: null, timeLeft: 10 };

function initQuiz() {
  clearInterval(quizState.timer);
  quizState.qs = [...QUIZ_DATA].sort(() => Math.random() - .5).slice(0, 10);
  quizState.cur = 0;
  quizState.score = 0;
  quizState.answered = false;
  renderQuiz();
}

function renderQuiz() {
  const el = document.getElementById('quiz-inner');
  const { qs, cur, score } = quizState;

  if (cur >= qs.length) {
    clearInterval(quizState.timer);
    const pct = Math.round(score / qs.length * 100);
    const msg = pct >= 80 ? '🎉 Election expert! Impressive knowledge.' :
                pct >= 50 ? '👍 Good effort! Keep learning.' :
                            '📚 Keep studying — you\'ll get there!';
    el.innerHTML = `
      <div class="quiz-card">
        <div class="score-display">
          <div class="score-num">${score}/${qs.length}</div>
          <div class="score-label">${pct}% correct</div>
          <p class="score-msg">${msg}</p>
          <button class="btn-primary" onclick="initQuiz()">Play Again</button>
          <button class="share-badge-btn" onclick="copyScore(${score},${qs.length})">📋 Copy Score</button>
        </div>
      </div>`;
    return;
  }

  const q = qs[cur];
  const pips = qs.map((_, i) =>
    `<div class="quiz-pip ${i < cur ? 'done' : i === cur ? 'active' : ''}"></div>`
  ).join('');

  el.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-timer-bar" aria-hidden="true">
        <div class="quiz-timer-inner" id="quiz-timer-bar" style="width:100%"></div>
      </div>
      <div class="quiz-meta">
        <div class="quiz-progress-pips" role="progressbar" aria-valuenow="${cur+1}" aria-valuemax="${qs.length}" aria-label="Question ${cur+1} of ${qs.length}">${pips}</div>
        <span class="quiz-time-display" id="quiz-time-txt" aria-live="off">⏱ 10s</span>
      </div>
      <p class="quiz-q">Question ${cur + 1}: ${q.q}</p>
      <div class="quiz-options">
        <button class="quiz-opt" onclick="answerQuiz(true, this)" aria-label="True">✓ True</button>
        <button class="quiz-opt" onclick="answerQuiz(false, this)" aria-label="False">✗ False</button>
      </div>
      <div class="quiz-feedback" id="qfb" role="alert"></div>
      <div id="qnext" style="display:none;margin-top:1rem;text-align:right">
        <button class="btn-primary" onclick="nextQuiz()">Next →</button>
      </div>
    </div>`;

  quizState.answered = false;
  startTimer();
}

function startTimer() {
  clearInterval(quizState.timer);
  quizState.timeLeft = 10;
  const bar = document.getElementById('quiz-timer-bar');
  const txt = document.getElementById('quiz-time-txt');

  quizState.timer = setInterval(() => {
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
      if (!quizState.answered) {
        // Auto-reveal on timeout
        const opts = document.querySelectorAll('.quiz-opt');
        opts.forEach(b => b.disabled = true);
        const q = quizState.qs[quizState.cur];
        opts[q.a ? 0 : 1].classList.add('correct');
        opts[q.a ? 1 : 0].classList.add('wrong');
        const fb = document.getElementById('qfb');
        if (fb) {
          fb.className = 'quiz-feedback show wrong';
          fb.textContent = '⏰ Time\'s up! ' + q.explain;
        }
        const nxt = document.getElementById('qnext');
        if (nxt) nxt.style.display = 'block';
        quizState.answered = true;
      }
    }
  }, 1000);
}

function answerQuiz(val, btn) {
  if (quizState.answered) return;
  clearInterval(quizState.timer);
  quizState.answered = true;
  const q = quizState.qs[quizState.cur];
  const correct = val === q.a;
  if (correct) quizState.score++;

  document.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true);
  btn.classList.add(correct ? 'correct' : 'wrong');
  if (!correct) {
    const other = document.querySelectorAll('.quiz-opt')[val ? 1 : 0];
    if (other) other.classList.add('correct');
  }

  const fb = document.getElementById('qfb');
  if (fb) {
    fb.className = 'quiz-feedback show ' + (correct ? 'correct' : 'wrong');
    fb.textContent = (correct ? '✓ Correct! ' : '✗ Not quite. ') + q.explain;
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
  const pct = Math.round(score / total * 100);
  const text = `I scored ${score}/${total} (${pct}%) on the ElectED Election Quiz! 🗳️ Test your civic knowledge at ElectED.`;
  navigator.clipboard.writeText(text).then(() => {
    // Brief visual feedback
    const btn = document.querySelector('.share-badge-btn');
    if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = '📋 Copy Score', 2000); }
  }).catch(() => alert(`Your score: ${score}/${total} (${pct}%)`));
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 2: Timeline Scramble
// ─────────────────────────────────────────────────────────────────────────────
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

  el.innerHTML = `
    <div class="scramble-layout">
      <div>
        <p class="gap-label">Shuffled Cards — drag these</p>
        <div id="sc-source" style="display:flex;flex-direction:column;gap:.6rem">
          ${shuffled.map(i => `
            <div class="scramble-card" draggable="true" data-idx="${i}"
              ondragstart="scDragStart(event)" ondragend="scDragEnd(event)"
              role="button" tabindex="0" aria-label="${SCRAMBLE_STEPS[i]}, draggable card">
              ${SCRAMBLE_STEPS[i]}
            </div>`).join('')}
        </div>
      </div>
      <div>
        <p class="gap-label">Drop into correct order</p>
        <div id="sc-target" style="display:flex;flex-direction:column;gap:.6rem">
          ${SCRAMBLE_STEPS.map((_, i) => `
            <div class="drop-zone" data-slot="${i}"
              ondragover="scDragOver(event)" ondragleave="scDragLeave(event)" ondrop="scDrop(event)"
              role="listitem" aria-label="Slot ${i + 1}">
              <span class="drop-zone-num">${i + 1}.</span>
              <span class="dz-label">Drop here</span>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div id="sc-result" style="margin-top:1.5rem;text-align:center" aria-live="polite"></div>
    <div style="text-align:center;margin-top:1rem;display:flex;gap:.7rem;justify-content:center">
      <button class="btn-primary" onclick="checkScramble()">Check My Order</button>
      <button class="btn-outline"  onclick="initScramble()">Reset</button>
    </div>`;
}

function scDragStart(e) {
  dragSrc = e.currentTarget;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text', e.currentTarget.dataset.idx);
}
function scDragEnd(e)  { e.currentTarget.classList.remove('dragging'); }
function scDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('over'); }
function scDragLeave(e){ e.currentTarget.classList.remove('over'); }

function scDrop(e) {
  e.preventDefault();
  const zone   = e.currentTarget;
  zone.classList.remove('over');
  const idx    = e.dataTransfer.getData('text');
  const prev   = zone.dataset.placed;

  // If zone already has a card, return it to source
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
  const zones   = document.querySelectorAll('.drop-zone');
  const filled  = document.querySelectorAll('.drop-zone[data-placed]');
  const res     = document.getElementById('sc-result');

  if (filled.length < SCRAMBLE_STEPS.length) {
    res.innerHTML = '<p style="color:var(--muted)">Fill all slots before checking!</p>';
    return;
  }

  let correct = 0;
  zones.forEach((zone, i) => {
    const placed = parseInt(zone.dataset.placed);
    if (placed === i) {
      zone.style.borderColor = 'var(--green)';
      zone.style.background  = 'var(--green-bg, #e8f5e9)';
      correct++;
    } else {
      zone.style.borderColor = 'var(--red)';
      zone.style.background  = 'var(--red-bg, #fdecea)';
    }
  });

  if (correct === SCRAMBLE_STEPS.length) {
    res.innerHTML = '<div style="background:var(--green-bg,#e8f5e9);border:1px solid var(--green);border-radius:12px;padding:1rem;color:var(--green);font-weight:600">🎉 Perfect! All steps in the correct order!</div>';
  } else {
    res.innerHTML = `<div style="background:var(--red-bg,#fdecea);border:1px solid var(--red);border-radius:12px;padding:1rem;color:#8b1a1a">${correct}/${SCRAMBLE_STEPS.length} correct. Try again!</div>`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME 3: Term Decoder (Flashcards)
// ─────────────────────────────────────────────────────────────────────────────
const FLASHCARD_DATA = [
  { term:'Ballot',           def:'A document (paper or electronic) on which voters record their choices in an election.', ex:'She filled out her ballot carefully before placing it in the scanner.' },
  { term:'Primary',         def:'An election in which voters choose a political party\'s candidate to run in the general election.', ex:'The primary narrowed five candidates down to one nominee.' },
  { term:'Electoral College',def:'A body of electors established by the U.S. Constitution who formally elect the President and Vice President.', ex:'A candidate needs 270 of 538 electoral votes to win the presidency.' },
  { term:'Caucus',           def:'A meeting of party members to discuss and vote on candidates — an alternative to a primary election.', ex:'Iowa holds its famous caucuses early in the presidential election cycle.' },
  { term:'Gerrymandering',   def:'Manipulating electoral district boundaries to give one political party an unfair competitive advantage.', ex:'Gerrymandering in that state created strangely shaped, non-contiguous districts.' },
  { term:'Incumbent',        def:'A politician who currently holds a political office and is running for re-election.', ex:'As the incumbent senator, she had significant name recognition and fundraising advantages.' },
  { term:'Suffrage',         def:'The right to vote in political elections. Also called the franchise.', ex:'Women\'s suffrage in the U.S. was achieved with the 19th Amendment in 1920.' },
  { term:'Swing State',      def:'A U.S. state where either party could plausibly win, making it a key focus of campaigns.', ex:'Pennsylvania, Michigan, and Wisconsin are classic swing states in presidential elections.' },
  { term:'Recount',          def:'A second official count of votes, typically triggered when the margin of victory is very slim.', ex:'The razor-thin margin of 200 votes triggered an automatic statewide recount.' },
  { term:'Proportional Representation', def:'An electoral system where parties receive parliamentary seats proportional to their share of the popular vote.', ex:'Germany\'s Bundestag uses proportional representation, giving smaller parties fair representation.' },
  { term:'Mandate',          def:'The authority granted to an elected official by the voters to carry out their stated policy agenda.', ex:'Winning by 20 points gave her a clear mandate to pursue healthcare reform.' },
  { term:'Runoff',           def:'A second election held when no candidate wins the required threshold (usually a majority) in the first round.', ex:'Neither candidate won 50%, so a runoff election was scheduled for the following month.' },
  { term:'Poll Worker',      def:'A trained volunteer or employee who assists voters and oversees the voting process at a polling station.', ex:'Thousands of poll workers volunteered to staff stations across the county.' },
  { term:'Exit Poll',        def:'A survey of voters conducted as they leave the polling station, used to estimate results before official counts.', ex:'Early exit polls pointed to a very close race, which the final tally confirmed.' },
  { term:'Plurality',        def:'When a candidate receives more votes than any other candidate, but not necessarily a majority (50%+1).', ex:'With three strong candidates, she won with just 38% — a plurality, not a majority.' },
  { term:'Delegate',         def:'A person chosen to represent and vote on behalf of a group, such as at a party nominating convention.', ex:'Each state sends a proportional number of delegates to the national convention.' },
  { term:'Absentee Ballot',  def:'A ballot cast in advance by a voter who cannot or chooses not to vote in person on Election Day.', ex:'Living overseas, he always votes using an absentee ballot mailed from his home state.' },
  { term:'Constituency',     def:'A specific geographic area whose residents are represented by one elected official.', ex:'The newly elected MP represents a constituency of 80,000 registered voters.' },
  { term:'Voter Turnout',    def:'The percentage of eligible voters who actually cast a ballot in a given election.', ex:'Turnout hit 67% — the highest in two decades — driven by record youth participation.' },
  { term:'Redistricting',    def:'The process of redrawing electoral district boundaries, usually after a census to reflect population changes.', ex:'After the 2020 census, several states underwent significant redistricting that shifted political maps.' },
];

const fcState = { idx: 0, learned: new Set(), review: new Set(), flipped: false };

function initFlashcards() {
  fcState.idx = 0; fcState.learned.clear(); fcState.review.clear(); fcState.flipped = false;
  renderFlashcard();
}

function renderFlashcard() {
  const el   = document.getElementById('flashcard-inner');
  const card = FLASHCARD_DATA[fcState.idx];
  const pct  = Math.round(fcState.learned.size / FLASHCARD_DATA.length * 100);

  el.innerHTML = `
    <div class="fc-progress" role="progressbar" aria-valuenow="${fcState.learned.size}" aria-valuemax="${FLASHCARD_DATA.length}" aria-label="${fcState.learned.size} of ${FLASHCARD_DATA.length} learned">
      <div class="fc-progress-bar" style="width:${pct}%"></div>
    </div>
    <div class="flashcard-scene">
      <div class="flashcard" id="fc-card" role="button" tabindex="0"
        aria-label="Flashcard for ${card.term}. Click or press Enter to flip."
        onclick="flipCard()"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipCard();}">
        <div class="fc-face fc-front" aria-hidden="false">
          <h2 style="font-family:'Playfair Display',serif;font-size:1.6rem;color:#fff">${card.term}</h2>
          <p style="color:var(--gold2);font-size:.8rem;margin-top:.5rem;text-transform:uppercase;letter-spacing:.1em">Click to reveal definition</p>
        </div>
        <div class="fc-face fc-back" aria-hidden="true">
          <p>${card.def}</p>
          <p class="fc-example">"${card.ex}"</p>
        </div>
      </div>
    </div>
    <div class="fc-controls">
      <button class="fc-btn review" onclick="markCard('review')" aria-label="Mark for review">👎 Review again</button>
      <span class="fc-counter" aria-live="polite">${fcState.idx + 1} / ${FLASHCARD_DATA.length} · ${fcState.learned.size} learned</span>
      <button class="fc-btn know"   onclick="markCard('learned')" aria-label="Mark as learned">👍 Got it!</button>
    </div>
    <div style="text-align:center;margin-top:1rem;display:flex;gap:.6rem;justify-content:center">
      <button class="btn-outline" onclick="fcNav(-1)" aria-label="Previous card">← Prev</button>
      <button class="btn-outline" onclick="fcNav(1)"  aria-label="Next card">Next →</button>
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
  front.setAttribute('aria-hidden', fcState.flipped ? 'true' : 'false');
  back.setAttribute('aria-hidden',  fcState.flipped ? 'false' : 'true');
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

// ─────────────────────────────────────────────────────────────────────────────
// GAME 4: Voter Journey (Choose Your Adventure)
// ─────────────────────────────────────────────────────────────────────────────
const JOURNEY_NODES = {
  start: {
    scene: 'It\'s <strong>Election Day</strong>! You\'re 18 years old and this is your very first time voting. You wake up excited but nervous. What do you do first?',
    choices: [
      { text: '✅ Check online if I\'m registered to vote', next: 'registered' },
      { text: '🏃 Head straight to the polling station', next: 'not_registered' },
    ]
  },
  registered: {
    scene: 'Smart move! You check online and confirm you\'re registered. You find your <strong>polling station address</strong> and see it\'s open until 8pm. Do you bring ID?',
    choices: [
      { text: '🪪 Yes — I grab my photo ID and head out', next: 'with_id' },
      { text: '🤷 I didn\'t think I needed it, so I go without', next: 'no_id' },
    ]
  },
  not_registered: {
    scene: 'When you arrive, the poll worker searches for your name and <strong>can\'t find you on the voter roll</strong>. You forgot to register before the deadline!',
    choices: [
      { text: '📋 Ask whether same-day registration is available', next: 'same_day' },
      { text: '😔 Leave without voting — nothing I can do', next: 'bad_end' },
    ]
  },
  with_id: {
    scene: 'The poll worker verifies your ID and checks you off the roll. They hand you a <strong>ballot</strong>. You step into a private voting booth. How do you approach it?',
    choices: [
      { text: '📝 Take my time, read every race carefully', next: 'voted_well' },
      { text: '⚡ Rush through — I\'ll just pick quickly', next: 'rushed' },
    ]
  },
  no_id: {
    scene: 'The poll worker explains your state requires ID. But they offer you a <strong>provisional ballot</strong> — a special ballot counted after your identity is verified.',
    choices: [
      { text: '✅ I\'ll accept the provisional ballot and vote', next: 'provisional' },
      { text: '❌ It seems too complicated — I\'ll skip it', next: 'bad_end' },
    ]
  },
  same_day: {
    scene: 'Great thinking! Your state allows <strong>same-day registration</strong>. You fill out a short form, show your ID, and receive a provisional ballot to cast right now.',
    choices: [
      { text: '🗳️ Complete registration and cast my ballot!', next: 'voted_well' },
    ]
  },
  provisional: {
    scene: 'You cast your <strong>provisional ballot</strong>. The poll worker gives you a receipt and explains you can track your ballot online to confirm it was counted.',
    choices: [
      { text: '🎉 I voted — thank the workers and leave!', next: 'ok_end' },
    ]
  },
  voted_well: {
    scene: 'You carefully review every race on your ballot, make your selections, and feed it into the scanner. The machine beeps, accepting it. A worker hands you an <strong>"I Voted" sticker!</strong> 🎉',
    choices: [
      { text: '🥳 I did it — wear my sticker proudly!', next: 'great_end' },
    ]
  },
  rushed: {
    scene: 'You rushed and accidentally <strong>skipped one race entirely</strong>, leaving it blank. The ballot was already submitted before you noticed.',
    choices: [
      { text: '📋 It still counts — lesson learned for next time', next: 'ok_end' },
    ]
  },
  bad_end: {
    scene: '',
    choices: [],
    end: {
      icon: '📋',
      title: 'Lesson Learned!',
      desc: 'You didn\'t vote this time — but now you know what to do. Register early, bring ID, and check your polling station location in advance. Many states allow online registration, and some offer same-day registration. Your vote matters!'
    }
  },
  great_end: {
    scene: '',
    choices: [],
    end: {
      icon: '🗳️',
      title: 'First Vote Successfully Cast!',
      desc: 'You prepared well, brought your ID, read every race carefully, and voted successfully. Your voice is now part of the democratic process! Share your experience to encourage others to vote.'
    }
  },
  ok_end: {
    scene: '',
    choices: [],
    end: {
      icon: '✅',
      title: 'Vote Recorded!',
      desc: 'You voted — that\'s what matters most! Next time, bring notes or a completed sample ballot to help you review every race carefully. Many states let you bring written notes into the booth.'
    }
  },
};

let journeyNode = 'start';

function initJourney() {
  journeyNode = 'start';
  renderJourney();
}

function renderJourney() {
  const el   = document.getElementById('journey-inner');
  const node = JOURNEY_NODES[journeyNode];

  if (node.end) {
    el.innerHTML = `
      <div class="journey-card">
        <div class="journey-end">
          <div class="big-emoji" aria-hidden="true">${node.end.icon}</div>
          <h2 style="font-family:'Playfair Display',serif;font-size:1.4rem;color:var(--text);margin-bottom:.5rem">${node.end.title}</h2>
          <p>${node.end.desc}</p>
          <button class="btn-primary" onclick="initJourney()">Play Again</button>
        </div>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="journey-card">
      <div class="journey-scene">${node.scene}</div>
      <div class="journey-choices">
        ${node.choices.map(c =>
          `<button class="journey-choice" onclick="journeyChoose('${c.next}')">${c.text}</button>`
        ).join('')}
      </div>
    </div>`;
}

function journeyChoose(next) {
  journeyNode = next;
  renderJourney();
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOSSARY
// ─────────────────────────────────────────────────────────────────────────────
let glossaryBuilt = false;

const GLOSSARY_DATA = [
  { term:'Absentee Ballot',    def:'A ballot cast by a voter who cannot be present at their polling place on Election Day. Many states allow any voter to request one.' },
  { term:'Ballot',             def:'A document, paper or electronic, on which voters record their choices in an election.' },
  { term:'Ballot Initiative',  def:'A process by which citizens can place proposed legislation or constitutional amendments directly on the ballot for voters to decide.' },
  { term:'Candidate',          def:'A person who runs for election to a public office, either independently or as a party\'s nominee.' },
  { term:'Caucus',             def:'A meeting of party members to select candidates or determine party policy — an alternative to a primary election.' },
  { term:'Constituency',       def:'A geographic area whose residents are represented by an elected official in a legislature or parliament.' },
  { term:'Delegate',           def:'A person chosen to represent a group and vote on their behalf, such as at a party convention.' },
  { term:'Electoral College',  def:'The body of 538 electors who formally elect the U.S. President and Vice President based on state results.' },
  { term:'Electoral Roll',     def:'The official list of registered voters eligible to vote in an election. Also called the voter roll or register.' },
  { term:'Exit Poll',          def:'A survey of voters conducted as they leave polling stations, used to estimate election outcomes before official counts.' },
  { term:'First Past the Post',def:'A voting system where the candidate with the most votes wins, even without a majority. Used in the U.S. and UK.' },
  { term:'Franchise',          def:'The right to vote in public elections. Also called suffrage.' },
  { term:'General Election',   def:'The main nationwide election in which voters choose between candidates from all parties for government positions.' },
  { term:'Gerrymandering',     def:'Manipulating electoral district boundaries to give one political party an unfair advantage over others.' },
  { term:'Incumbent',          def:'A politician who currently holds office and is seeking re-election to that same position.' },
  { term:'Inauguration',       def:'The formal ceremony in which an elected official is sworn into office and officially begins their term.' },
  { term:'Landslide',          def:'An election in which one candidate wins by an overwhelmingly large margin of votes over all opponents.' },
  { term:'Mandate',            def:'The authority granted to an elected official by voters to implement their stated policies and agenda.' },
  { term:'Nomination',         def:'The process by which a political party formally selects a candidate to represent them in an election.' },
  { term:'Party Platform',     def:'An official document stating a political party\'s positions on major policy issues and their governing intentions.' },
  { term:'Plurality',          def:'When a candidate wins more votes than any other candidate but not necessarily a majority (50%+1).' },
  { term:'Poll Worker',        def:'A trained volunteer or employee who staffs a polling station on Election Day, assisting voters and overseeing the process.' },
  { term:'Polling Station',    def:'A designated physical location where registered voters go to cast their ballots on Election Day.' },
  { term:'Primary Election',   def:'An election in which party members or registered voters choose which candidate will represent their party in the general election.' },
  { term:'Proportional Representation', def:'An electoral system in which parties receive parliamentary seats in proportion to their share of the total vote.' },
  { term:'Recount',            def:'A second official count of election ballots, usually triggered when the margin of victory is very small.' },
  { term:'Redistricting',      def:'The process of redrawing electoral district boundaries, typically after a census to reflect population shifts.' },
  { term:'Runoff Election',    def:'A second election held between the top candidates when no one wins the required threshold (usually 50%) in the first round.' },
  { term:'Suffrage',           def:'The fundamental right to vote in political elections. Universal suffrage means all adult citizens have this right.' },
  { term:'Swing State',        def:'A U.S. state that is highly competitive and could vote for either major party, making it a key campaign battleground.' },
  { term:'Term Limit',         def:'A legal restriction on how many terms or years a person may hold a specific elected office.' },
  { term:'Voter ID',           def:'Government-issued identification required in some jurisdictions to verify a voter\'s identity at the polling station.' },
  { term:'Voter Registration', def:'The process by which eligible citizens officially sign up to vote, adding their name to the electoral roll.' },
  { term:'Voter Suppression',  def:'Strategies or policies that make it harder for certain groups of citizens to vote, undermining democratic participation.' },
  { term:'Voter Turnout',      def:'The percentage of eligible voters who actually cast a ballot in a given election.' },
];

function buildGlossary() {
  glossaryBuilt = true;

  // Build A–Z filter buttons
  const letters = [...new Set(GLOSSARY_DATA.map(g => g.term[0].toUpperCase()))].sort();
  const azNav   = document.querySelector('.glossary-az');
  letters.forEach(l => {
    const btn = document.createElement('button');
    btn.className = 'az-btn';
    btn.textContent = l;
    btn.setAttribute('aria-label', `Filter by letter ${l}`);
    btn.setAttribute('aria-pressed', 'false');
    btn.onclick = () => filterByLetter(l, btn);
    azNav.appendChild(btn);
  });

  renderGlossary(GLOSSARY_DATA);
}

function renderGlossary(data) {
  const el = document.getElementById('glossary-content');
  if (data.length === 0) {
    el.innerHTML = '<div class="glossary-empty">No terms match your search. Try a different keyword.</div>';
    return;
  }

  // Group by first letter
  const groups = {};
  data.forEach(g => {
    const letter = g.term[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(g);
  });

  el.innerHTML = Object.entries(groups).sort(([a],[b]) => a.localeCompare(b)).map(([letter, terms]) => `
    <div class="glossary-group" role="listitem">
      <div class="glossary-group-letter" aria-label="Terms starting with ${letter}">${letter}</div>
      <div class="glossary-grid">
        ${terms.map(g => `
          <article class="glos-card" role="article">
            <div class="glos-term">${g.term}</div>
            <div class="glos-def">${g.def}</div>
            <button class="glos-ask" onclick="askAbout('${g.term.replace(/'/g, "\\'")}')">→ Ask AI about this</button>
          </article>`).join('')}
      </div>
    </div>
  `).join('');
}

function filterGlossary(query) {
  const q = query.toLowerCase().trim();
  // Reset letter filter
  document.querySelectorAll('.az-btn').forEach(b => {
    b.classList.toggle('active', b.textContent === 'All' && !q);
    b.setAttribute('aria-pressed', b.textContent === 'All' && !q ? 'true' : 'false');
  });
  const filtered = q
    ? GLOSSARY_DATA.filter(g =>
        g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q)
      )
    : GLOSSARY_DATA;
  renderGlossary(filtered);
}

function filterByLetter(letter, clickedBtn) {
  document.querySelectorAll('.az-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  if (clickedBtn) {
    clickedBtn.classList.add('active');
    clickedBtn.setAttribute('aria-pressed', 'true');
  } else {
    // 'All' button
    document.querySelector('.az-btn').classList.add('active');
    document.querySelector('.az-btn').setAttribute('aria-pressed', 'true');
  }
  document.getElementById('glossary-search').value = '';

  const filtered = letter === 'all'
    ? GLOSSARY_DATA
    : GLOSSARY_DATA.filter(g => g.term[0].toUpperCase() === letter);
  renderGlossary(filtered);
}

function askAbout(term) {
  showSection('chat');
  if (!chatBuilt) buildChat();
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = `Can you explain what "${term}" means in the context of elections?`;
    input.focus();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CHAT
// ─────────────────────────────────────────────────────────────────────────────
let chatBuilt = false;
const chatHistory = []; // [ { role: 'user'|'model', parts: [{ text }] } ]

const CHAT_SUGGESTIONS = [
  'How does the Electoral College work?',
  'What is gerrymandering?',
  'How do I register to vote?',
  'What happens if election results are disputed?',
  'What is proportional representation?',
  'What\'s the difference between a primary and a caucus?',
];

function buildChat() {
  chatBuilt = true;

  // Suggestion chips
  const sugEl = document.getElementById('chat-suggestions');
  sugEl.innerHTML = CHAT_SUGGESTIONS.map(s =>
    `<button class="chat-sug" onclick="sendSuggestion(this.textContent)" aria-label="Ask: ${s}">${s}</button>`
  ).join('');

  // Welcome message
  addMsg('bot', 'Hello! I\'m your election guide 🗳️ Ask me anything about how elections work — from voter registration to vote counting to electoral systems. What would you like to know?');
}

function addMsg(role, text) {
  const log  = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

function sendSuggestion(text) {
  const input = document.getElementById('chat-input');
  input.value = text;
  sendChat();
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;
  document.querySelector('.chat-send').disabled = true;

  addMsg('user', text);

  // Push to history (Gemini format)
  chatHistory.push({ role: 'user', parts: [{ text }] });

  // Typing indicator
  const log     = document.getElementById('chat-messages');
  const typingEl = document.createElement('div');
  typingEl.className = 'msg bot';
  typingEl.innerHTML = '<span class="typing-dots">Thinking</span>';
  log.appendChild(typingEl);
  log.scrollTop = log.scrollHeight;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: chatHistory.slice(0, -1), // exclude the message we just added
      }),
    });

    typingEl.remove();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errMsg = err.error || `Server error: ${res.status}. Please try again.`;
      addMsg('bot', '⚠️ ' + errMsg);
      chatHistory.pop(); // remove failed message from history
    } else {
      const data  = await res.json();
      const reply = data.reply || 'Sorry, I couldn\'t get a response. Please try again.';
      addMsg('bot', reply);
      chatHistory.push({ role: 'model', parts: [{ text: reply }] });
    }
  } catch (e) {
    typingEl.remove();
    addMsg('bot', '⚠️ I\'m having trouble connecting. Please check your network and try again.');
    chatHistory.pop();
  } finally {
    input.disabled = false;
    document.querySelector('.chat-send').disabled = false;
    input.focus();
  }

  // Keep history manageable (last 20 turns)
  if (chatHistory.length > 20) chatHistory.splice(0, chatHistory.length - 20);
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT — runs on page load
// ─────────────────────────────────────────────────────────────────────────────
(function init() {
  // Show home by default (already active in HTML)
  // Pre-build sections that are visible immediately
  // (Timeline, Roles, Glossary, Chat are lazy-initialized)

  // Keyboard trap for nav: close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('nav-links').classList.remove('open');
      document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
      document.getElementById('hamburger').textContent = '☰';
    }
  });
})();
