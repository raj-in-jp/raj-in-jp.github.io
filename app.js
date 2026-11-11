/* Raj in JP · Kanji of the day + Kana quiz */

/* ================= KANJI OF THE DAY =================
   A different kanji every day, picked at random from KANJI_POOL (assets/kanji-data.js).
   Tap the card to open its level, meaning, history, breakdown, examples and stroke order. */
(() => {
  const card = document.getElementById('kotd'), dlg = document.getElementById('kmodal');
  if (!card || !window.KANJI_POOL) return;
  const P = KANJI_POOL, $ = (s) => dlg.querySelector(s);
  const now = new Date();
  const dayNum = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 864e5);
  // same "random" kanji for everyone on the same day, different every day
  const rand = (n) => { let x = (n * 2654435761) >>> 0; x ^= x >>> 16; x = Math.imul(x, 2246822507) >>> 0; x ^= x >>> 13; return x >>> 0; };
  let today = rand(dayNum) % P.length;
  if (today === rand(dayNum - 1) % P.length) today = (today + 1) % P.length;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lvClass = (lv) => 'lv lv-' + lv.toLowerCase();

  const kTd = P[today];
  card.querySelector('.kotd-date').textContent = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  card.querySelector('.kotd-kanji').textContent = kTd.k;
  const lv = card.querySelector('.kotd-lv'); lv.textContent = 'JLPT ' + kTd.lv; lv.className = lvClass(kTd.lv) + ' kotd-lv';
  card.querySelector('.kotd-reading').textContent = [...kTd.kun.slice(0, 1), ...kTd.on.slice(0, 1)].join(' · ');
  card.querySelector('.kotd-meaning').textContent = kTd.m.join(', ');
  card.querySelector('.kotd-story').textContent = kTd.h;

  let timers = [];
  const drawStrokes = (k) => {
    timers.forEach(clearTimeout); timers = [];
    const svg = $('.km-stroke svg');
    svg.innerHTML = '<path d="M54.5 2v105M2 54.5h105" class="grid"/>' + k.st.map((d) => `<path d="${d}" class="st"/>`).join('');
    svg.querySelectorAll('.st').forEach((p, i) => {
      const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      timers.push(setTimeout(() => { p.style.transition = 'stroke-dashoffset .5s ease'; p.style.strokeDashoffset = 0; }, 250 + i * 520));
    });
  };
  const open = (k) => {
    $('.km-k').textContent = k.k; $('.km-m').textContent = k.m.join(', ');
    const l = $('.km-lv'); l.textContent = 'JLPT ' + k.lv; l.className = lvClass(k.lv) + ' km-lv';
    $('.km-sc').textContent = `${k.sc} stroke${k.sc === 1 ? '' : 's'}`;
    $('.km-on').textContent = k.on.join('・') || '—'; $('.km-kun').textContent = k.kun.join('・') || '—';
    $('.km-h').textContent = k.h;
    const single = k.p.length === 1 && k.p[0][0] === k.k;
    $('.km-p').innerHTML = single
      ? `<span class="whole"><b>${esc(k.k)}</b>${esc(k.p[0][1])}</span><em class="km-note">A single picture (pictograph), not built from other parts.</em>`
      : `<span class="whole"><b>${esc(k.k)}</b></span><i>=</i>` + k.p.map(([c, m]) => `<span><b>${esc(c)}</b>${m ? esc(m) : ''}</span>`).join('<i>+</i>');
    $('.km-ex').innerHTML = k.ex.length ? k.ex.map((e) => `<li><b>${esc(e.w)}</b><span>${esc(e.r)}</span><em>${esc(e.m)}</em></li>`).join('') : '<li>—</li>';
    const reel = $('.km-reel'); reel.hidden = !k.reel; if (k.reel) reel.href = k.reel;
    if (!dlg.open) dlg.showModal();
    drawStrokes(k);
  };
  card.addEventListener('click', () => open(kTd));
  $('.km-replay').addEventListener('click', () => drawStrokes(P.find((x) => x.k === $('.km-k').textContent)));
  $('.km-random').addEventListener('click', () => { let r; do { r = P[Math.floor(Math.random() * P.length)]; } while (r.k === $('.km-k').textContent); open(r); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });   // tap outside to close
  dlg.addEventListener('close', () => { timers.forEach(clearTimeout); });
})();

/* ================= KANA QUIZ ================= */
(() => {
  const root = document.getElementById('quiz');
  if (!root || !window.KANA) return;
  const $ = (s) => root.querySelector(s);
  const charEl = $('.q-char'), opts = $('.q-opts'), fb = $('.q-feedback');
  const scoreEl = $('.q-score'), streakEl = $('.q-streak'), bestEl = $('.q-best');
  let script = 'hiragana', extra = false, score = 0, total = 0, streak = 0, answered = false, current, last;
  let best = 0; try { best = +localStorage.getItem('kanaBest') || 0; } catch (e) {}

  const pool = () => {
    const pick = (sc) => [...KANA[sc].basic, ...(extra ? KANA[sc].extra : [])];
    return script === 'both' ? [...pick('hiragana'), ...pick('katakana')] : pick(script);
  };
  const shuffle = (a) => { for (let j = a.length - 1; j > 0; j--) { const r = Math.floor(Math.random() * (j + 1)); [a[j], a[r]] = [a[r], a[j]]; } return a; };

  const next = () => {
    answered = false; fb.textContent = ''; fb.className = 'q-feedback';
    const p = pool();
    do { current = p[Math.floor(Math.random() * p.length)]; } while (p.length > 1 && current === last);
    last = current;
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
    scoreEl.textContent = `${score}/${total}`; streakEl.textContent = streak; bestEl.textContent = best;
    setTimeout(next, ok ? 900 : 2200);
  };

  root.querySelectorAll('[data-script]').forEach((t) => t.addEventListener('click', () => {
    root.querySelectorAll('[data-script]').forEach((x) => x.setAttribute('aria-pressed', x === t));
    script = t.dataset.script; next();
  }));
  $('#q-extra').addEventListener('change', (e) => { extra = e.target.checked; next(); });
  $('.q-skip').addEventListener('click', () => { streak = 0; streakEl.textContent = 0; next(); });
  document.addEventListener('keydown', (e) => {
    if (!root.matches(':hover') && !root.contains(document.activeElement) && document.activeElement !== document.body) return;
    const r = root.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const n = +e.key; if (n >= 1 && n <= 4) { const b = opts.children[n - 1]; if (b) b.click(); }
  });
  bestEl.textContent = best;
  next();
})();
