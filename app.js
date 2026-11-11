/* Raj in JP · Kanji of the day + Kana quiz */

/* ================= KANJI OF THE DAY =================
   ✏️ Add new kanji stories to this list. One is shown per day, in order, looping. */
const KANJI_STORIES = [
  { k: '躾', reading: 'しつけ · shitsuke', meaning: 'Discipline / good manners',
    parts: [['身', 'body'], ['美', 'beauty']],
    story: 'Body + beauty = good manners. True elegance is not just how you look, but how you behave.',
    reel: 'https://www.instagram.com/p/DfZt8gOByLu/' },
  { k: '幸', reading: 'しあわせ · shiawase', meaning: 'Happiness / good fortune',
    parts: [['辛', 'painful'], ['一', 'one stroke']],
    story: 'Add one stroke to 辛 (pain) and you get 幸 (happiness). One small change makes a big difference.',
    reel: 'https://www.instagram.com/p/DfUkVanBULO/' },
  { k: '島', reading: 'しま · shima', meaning: 'Island',
    parts: [['鳥', 'bird'], ['山', 'mountain']],
    story: 'Imagine a bird flying over a mountain surrounded by water. That is an island!',
    reel: 'https://www.instagram.com/p/DfcSsjFBSXL/' },
  { k: '烏', reading: 'からす · karasu', meaning: 'Crow',
    parts: [['鳥', 'bird'], ['、', 'eye stroke']], op: '−',
    story: 'Look closely: 烏 is 鳥 (bird) without the little stroke for the eye. A crow is so black you cannot see its eye.',
    reel: 'https://www.instagram.com/p/Dfe3gndh_58/' },
  { k: '咲', reading: 'さく · saku', meaning: 'To bloom',
    parts: [['口', 'mouth'], ['笑', 'to laugh']],
    story: 'A mouth that laughs: flowers don’t just bloom, they laugh their way into bloom.',
    reel: 'https://www.instagram.com/p/DfhcUPpB7aZ/' },
  { k: '国', reading: 'くに · kuni', meaning: 'Country',
    parts: [['國', 'old form'], ['国', 'modern form']], op: '→',
    story: 'The old form 國 had a weapon (戈) inside. The modern 国 has a jewel (玉). Weapon out, jewel in!',
    reel: 'https://www.instagram.com/p/DfkBMT_BUTa/' },
  { k: '聴', reading: 'きく · kiku', meaning: 'To listen attentively',
    parts: [['耳', 'ear'], ['心', 'heart']],
    story: '聞く is to hear; 聴く is to really listen. Listen with your ears, understand with your mind, connect with your heart.',
    reel: 'https://www.instagram.com/p/DfXJL5ThzPC/' },
];

(() => {
  const el = document.getElementById('kotd');
  if (!el) return;
  const now = new Date();
  const day = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  let i = ((day % KANJI_STORIES.length) + KANJI_STORIES.length) % KANJI_STORIES.length;
  const render = (anim) => {
    const s = KANJI_STORIES[i];
    el.querySelector('.kotd-kanji').textContent = s.k;
    el.querySelector('.kotd-reading').textContent = s.reading;
    el.querySelector('.kotd-meaning').textContent = s.meaning;
    el.querySelector('.kotd-parts').innerHTML = s.parts.map(([c, m]) => `<span><b>${c}</b>${m}</span>`).join(`<i>${s.op || '+'}</i>`);
    el.querySelector('.kotd-story').textContent = s.story;
    el.querySelector('.kotd-reel').href = s.reel;
    el.querySelector('.kotd-date').textContent = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    if (anim) { el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip'); }
  };
  render(false);
  el.querySelector('.kotd-next').addEventListener('click', () => { i = (i + 1) % KANJI_STORIES.length; render(true); });
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
