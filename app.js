/* Raj in JP · Kanji of the day + Kana quiz */

/* ================= KANJI PRACTICE (flashcards + quiz) =================
   Data: assets/kanji-data.js (all JLPT N5–N3). "Learn about this kanji" opens the detail pop-up. */
(() => {
  const root = document.getElementById('kp'), dlg = document.getElementById('kmodal');
  if (!root || !dlg || !window.KANJI_POOL) return;
  const ALL = KANJI_POOL, $ = (s) => dlg.querySelector(s), q = (s) => root.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lvClass = (lv) => 'lv lv-' + lv.toLowerCase();
  const shuffle = (a) => { for (let j = a.length - 1; j > 0; j--) { const r = Math.floor(Math.random() * (j + 1)); [a[j], a[r]] = [a[r], a[j]]; } return a; };
  const cap = (t) => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  function builtFrom(k) {
    return k.p.length === 1 && k.p[0][0] === k.k
      ? 'A single picture (pictograph), not built from other parts.'
      : 'Built from ' + k.p.map(([c, m]) => m ? `${c} (${m})` : c).join(' + ') + '.';
  }

  /* ---------- detail pop-up ---------- */
  let timers = []; const strokeCache = {};
  const drawStrokes = async (k) => {
    timers.forEach(clearTimeout); timers = [];
    const svg = $('.km-stroke svg');
    svg.innerHTML = '<path d="M54.5 2v105M2 54.5h105" class="grid"/>';
    let paths = strokeCache[k.k];
    if (!paths) {
      try { paths = strokeCache[k.k] = await (await fetch(`assets/strokes/${k.k.codePointAt(0).toString(16).padStart(5, '0')}.json`)).json(); }
      catch (e) { svg.innerHTML += `<text x="54.5" y="76" text-anchor="middle" font-size="64" class="fallback">${esc(k.k)}</text>`; return; }
    }
    if ($('.km-k').textContent !== k.k) return;
    svg.innerHTML += paths.map((d) => `<path d="${d}" class="st"/>`).join('');
    svg.querySelectorAll('.st').forEach((p, i) => {
      const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      timers.push(setTimeout(() => { p.style.transition = 'stroke-dashoffset .5s ease'; p.style.strokeDashoffset = 0; }, 250 + i * 480));
    });
  };
  let shown = null;
  const learn = (k) => {
    shown = k;
    $('.km-k').textContent = k.k; $('.km-m').textContent = k.m.map(cap).join(', ');
    const l = $('.km-lv'); l.textContent = 'JLPT ' + k.lv; l.className = lvClass(k.lv) + ' km-lv';
    $('.km-sc').textContent = `${k.sc} stroke${k.sc === 1 ? '' : 's'}`;
    $('.km-on').textContent = k.on.join('・') || '—'; $('.km-kun').textContent = k.kun.join('・') || '—';
    $('.km-h').textContent = k.h || ''; $('.km-h').hidden = $('.km-hh').hidden = !k.h;
    const single = k.p.length === 1 && k.p[0][0] === k.k;
    $('.km-p').innerHTML = single
      ? `<span class="whole"><b>${esc(k.k)}</b>${esc(k.p[0][1])}</span><em class="km-note">A single picture (pictograph), not built from other parts.</em>`
      : `<span class="whole"><b>${esc(k.k)}</b></span><i>=</i>` + k.p.map(([c, m]) => `<span><b>${esc(c)}</b>${m ? esc(m) : ''}</span>`).join('<i>+</i>');
    $('.km-ex').innerHTML = k.ex.length ? k.ex.map((e) => `<li><b>${esc(e.w)}</b><span>${esc(e.r)}</span><em>${esc(e.m)}</em></li>`).join('') : '<li class="none">No example words yet.</li>';
    const reel = $('.km-reel'); reel.hidden = !k.reel; if (k.reel) reel.href = k.reel;
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
    drawStrokes(k);
  };
  $('.km-replay').addEventListener('click', () => shown && drawStrokes(shown));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => timers.forEach(clearTimeout));

  /* ---------- level + mode ---------- */
  let level = 'N5';
  try { const s = localStorage.getItem('kanjiLevel'); if (['N5', 'N4', 'N3', 'ALL'].includes(s)) level = s; } catch (e) {}
  const pool = () => ALL.filter((k) => level === 'ALL' || k.lv === level);
  root.querySelectorAll('[data-lv]').forEach((b) => {
    b.setAttribute('aria-pressed', b.dataset.lv === level);
    b.addEventListener('click', () => {
      level = b.dataset.lv; try { localStorage.setItem('kanjiLevel', level); } catch (e) {}
      root.querySelectorAll('[data-lv]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      resetCards(); nextQ();
    });
  });
  root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-mode]').forEach((x) => x.setAttribute('aria-selected', x === b));
    root.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.mode; });
  }));

  /* ---------- flashcards ---------- */
  const fc = q('#fc'); let deck = [], idx = 0;
  const showCard = () => {
    const k = deck[idx];
    fc.classList.remove('flipped');
    const l = q('.fc-lv'); l.textContent = 'JLPT ' + k.lv; l.className = lvClass(k.lv) + ' fc-lv';
    q('.fc-k').textContent = k.k; q('.fc-k-small').textContent = k.k;
    q('.fc-m').textContent = k.m.slice(0, 3).map(cap).join(', ');
    q('.fc-read').innerHTML = `<span><small>On</small>${esc(k.on.join('・') || '—')}</span><span><small>Kun</small>${esc(k.kun.join('・') || '—')}</span>`;
    const e = k.ex[0]; q('.fc-ex').innerHTML = e ? `<b>${esc(e.w)}</b> ${esc(e.r)} · ${esc(e.m)}` : esc(builtFrom(k));
    q('.fc-count').textContent = `${idx + 1} / ${deck.length}`;
  };
  function resetCards() { deck = shuffle(pool().slice()); idx = 0; showCard(); }
  fc.addEventListener('click', () => fc.classList.toggle('flipped'));
  q('.fc-next').addEventListener('click', () => { idx = (idx + 1) % deck.length; showCard(); });
  q('.fc-prev').addEventListener('click', () => { idx = (idx - 1 + deck.length) % deck.length; showCard(); });
  q('.fc-shuffle').addEventListener('click', resetCards);
  q('.fc-learn').addEventListener('click', () => learn(deck[idx]));
  root.addEventListener('keydown', (e) => {
    if (q('[data-panel="cards"]').hidden || dlg.open) return;
    if (e.key === 'ArrowRight') q('.fc-next').click();
    if (e.key === 'ArrowLeft') q('.fc-prev').click();
  });

  /* ---------- quiz ---------- */
  let cur = null, last = null, score = 0, total = 0, streak = 0, best = 0, done = false;
  try { best = +localStorage.getItem('kanjiBest') || 0; } catch (e) {}
  const opts = q('.kq-opts'), fb = q('.kq-fb'), after = q('.kq-after');
  function nextQ() {
    done = false; fb.textContent = ''; fb.className = 'kq-fb'; after.hidden = true;
    const p = pool();
    do { cur = p[Math.floor(Math.random() * p.length)]; } while (p.length > 1 && cur === last);
    last = cur;
    const right = cap(cur.m[0]);
    const choices = new Set([right]);
    for (const k of shuffle(p.slice())) { if (choices.size >= 4) break; const m = cap(k.m[0]); if (k !== cur && m) choices.add(m); }
    const kk = q('.kq-k'); kk.textContent = cur.k; kk.classList.remove('pop'); void kk.offsetWidth; kk.classList.add('pop');
    opts.innerHTML = '';
    shuffle([...choices]).forEach((m, n) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'q-opt kq-opt';
      b.innerHTML = `<kbd>${n + 1}</kbd>${esc(m)}`; b.dataset.m = m;
      b.addEventListener('click', () => answer(b)); opts.appendChild(b);
    });
  }
  function answer(b) {
    if (done) return; done = true; total++;
    const right = cap(cur.m[0]), ok = b.dataset.m === right;
    opts.querySelectorAll('.kq-opt').forEach((x) => { x.disabled = true; if (x.dataset.m === right) x.classList.add('right'); });
    const read = [cur.kun[0], cur.on[0]].filter(Boolean).join(' · ');
    if (ok) {
      score++; streak++; if (streak > best) { best = streak; try { localStorage.setItem('kanjiBest', best); } catch (e) {} }
      fb.innerHTML = `正解! <b>${esc(cur.k)}</b> = ${esc(right)} <span>(${esc(read)})</span>`; fb.className = 'kq-fb ok';
    } else {
      b.classList.add('wrong'); streak = 0;
      fb.innerHTML = `<b>${esc(cur.k)}</b> means <b>${esc(right)}</b> <span>(${esc(read)})</span>`; fb.className = 'kq-fb no';
    }
    q('.kq-score').textContent = `${score}/${total}`; q('.kq-streak').textContent = streak; q('.kq-best').textContent = best;
    after.hidden = false; q('.kq-next').focus({ preventScroll: true });
  }
  q('.kq-next').addEventListener('click', nextQ);
  q('.kq-skip').addEventListener('click', () => { streak = 0; q('.kq-streak').textContent = 0; nextQ(); });
  q('.kq-learn').addEventListener('click', () => learn(cur));
  root.addEventListener('keydown', (e) => {
    if (q('[data-panel="quiz"]').hidden || dlg.open) return;
    const n = +e.key; if (n >= 1 && n <= 4 && !done) { const b = opts.children[n - 1]; if (b) b.click(); }
  });
  q('.kq-best').textContent = best;

  resetCards(); nextQ();
})();

/* ================= KANA QUIZ ================= */
(() => {
  const root = document.getElementById('quiz');
  if (!root || !window.KANA) return;
  const $ = (s) => root.querySelector(s);
  const charEl = $('.q-char'), opts = $('.q-opts'), fb = $('.q-feedback');
  const scoreEl = $('.q-score'), streakEl = $('.q-streak'), bestEl = $('.q-best');
  let script = 'hiragana', extra = false, score = 0, total = 0, streak = 0, answered = false, current, last;
  let deck = [], roundScore = 0, roundDone = 0;
  const progEl = $('.q-prog');
  let best = 0; try { best = +localStorage.getItem('kanaBest') || 0; } catch (e) {}

  const pool = () => {
    const pick = (sc) => [...KANA[sc].basic, ...(extra ? KANA[sc].extra : [])];
    return script === 'both' ? [...pick('hiragana'), ...pick('katakana')] : pick(script);
  };
  const shuffle = (a) => { for (let j = a.length - 1; j > 0; j--) { const r = Math.floor(Math.random() * (j + 1)); [a[j], a[r]] = [a[r], a[j]]; } return a; };

  const next = () => {
    answered = false; fb.textContent = ''; fb.className = 'q-feedback';
    const p = pool();
    if (!deck.length) { deck = shuffle(p.slice()); roundScore = 0; roundDone = 0; }   // new round: every kana once
    current = deck.pop(); last = current;
    progEl.textContent = `${p.length - deck.length}/${p.length}`;
    const choices = new Set([current[1]]);
    const others = shuffle(p.map((x) => x[1]).filter((r) => r !== current[1]));
    for (const r of others) { if (choices.size >= 4) break; choices.add(r); }
    charEl.textContent = current[0];
    charEl.classList.remove('pop'); void charEl.offsetWidth; charEl.classList.add('pop');
    opts.innerHTML = '';
    shuffle([...choices]).forEach((r, n) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'q-opt'; b.innerHTML = `<kbd>${n + 1}</kbd>${r}`; b.dataset.r = r;
      b.addEventListener('click', () => answer(b));
      opts.appendChild(b);
    });
  };

  const answer = (b) => {
    if (answered) return;
    answered = true; total++;
    const ok = b.dataset.r === current[1];
    opts.querySelectorAll('.q-opt').forEach((x) => { x.disabled = true; if (x.dataset.r === current[1]) x.classList.add('right'); });
    if (ok) {
      score++; streak++;
      if (streak > best) { best = streak; try { localStorage.setItem('kanaBest', best); } catch (e) {} }
      fb.textContent = ['正解! Correct!', 'すごい! Great!', 'いいね! Nice!', 'その調子! Keep going!'][Math.floor(Math.random() * 4)];
      fb.className = 'q-feedback ok';
    } else {
      b.classList.add('wrong'); streak = 0;
      fb.innerHTML = `${current[0]} is <b>${current[1]}</b>. Practise it on the <a href="#free">writing sheet</a>.`;
      fb.className = 'q-feedback no';
    }
    roundDone++; if (ok) roundScore++;
    scoreEl.textContent = `${score}/${total}`; streakEl.textContent = streak; bestEl.textContent = best;
    if (!deck.length) {
      const n = roundDone, r = roundScore;
      setTimeout(() => { fb.innerHTML = `🎉 Round complete! You got <b>${r}/${n}</b>. A new round starts now.`; fb.className = 'q-feedback ok'; }, ok ? 500 : 1600);
      setTimeout(next, ok ? 2600 : 3800);
    } else setTimeout(next, ok ? 900 : 2200);
  };

  root.querySelectorAll('[data-script]').forEach((t) => t.addEventListener('click', () => {
    root.querySelectorAll('[data-script]').forEach((x) => x.setAttribute('aria-pressed', x === t));
    script = t.dataset.script; deck = []; next();
  }));
  $('#q-extra').addEventListener('change', (e) => { extra = e.target.checked; deck = []; next(); });
  $('.q-skip').addEventListener('click', () => { streak = 0; streakEl.textContent = 0; next(); });
  document.addEventListener('keydown', (e) => {
    if (!root.matches(':hover') && !root.contains(document.activeElement) && document.activeElement !== document.body) return;
    const r = root.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const n = +e.key; if (n >= 1 && n <= 4) { const b = opts.children[n - 1]; if (b) b.click(); }
  });
  bestEl.textContent = best;
  next();
})();
