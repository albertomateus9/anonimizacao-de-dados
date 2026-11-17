// Motor de gamificação: XP, níveis, conquistas, avisos, confete e sons.
// Tudo fica no navegador do visitante; nada é enviado para fora.
window.Game = (() => {
  'use strict';

  const STORAGE = 'anon-game-v1';
  const ACHIEVEMENTS = [
    { id: 'start', icon: '▶', title: 'Missão aceita', desc: 'Começou a explorar a apresentação.', xp: 10 },
    { id: 'k2', icon: 'k', title: 'Ninguém sozinho', desc: 'Formou grupos com pelo menos 2 registros no laboratório.', xp: 40 },
    { id: 'balance', icon: '⚖', title: 'Equilíbrio', desc: 'Chegou a k ≥ 2 preservando o máximo de detalhe possível.', xp: 60 },
    { id: 'detective', icon: '🔎', title: 'Detetive de dados', desc: 'Reidentificou a linha na tabela publicada.', xp: 40 },
    { id: 'doubt', icon: '½', title: 'Dúvida razoável', desc: 'Viu que um grupo de 2 reduz a certeza, mas não zera o risco.', xp: 30 },
    { id: 'hunter', icon: '▮', title: 'Caça aos identificadores', desc: 'Separou todos os identificadores diretos.', xp: 50 },
    { id: 'lgpd', icon: '§', title: 'Leitura da LGPD', desc: 'Acertou a pergunta rápida sobre a lei.', xp: 20 },
    { id: 'eca', icon: '⌂', title: 'Painel responsável', desc: 'Testou as três etapas e a ocultação de grupos pequenos.', xp: 40 },
    { id: 'antigolpe', icon: '⛓', title: 'Antigolpe', desc: 'Ligou os cinco vazamentos aos golpes.', xp: 50 },
    { id: 'mask', icon: '*', title: 'Máscara perfeita', desc: 'Reproduziu o padrão ***.456.789-**.', xp: 40 },
    { id: 'tech', icon: '≈', title: 'Três técnicas', desc: 'Abriu as três técnicas e sorteou um ruído.', xp: 30 },
    { id: 'explorer', icon: '◎', title: 'Explorador(a)', desc: 'Passou por todos os slides.', xp: 40 },
    { id: 'quiz', icon: '⚡', title: 'Desafio concluído', desc: 'Terminou o desafio relâmpago.', xp: 30 },
    { id: 'master', icon: '★', title: 'Mestre da privacidade', desc: 'Acertou as oito perguntas do desafio.', xp: 60 }
  ];
  const LEVELS = [
    { min: 0, name: 'Aprendiz de dados' },
    { min: 150, name: 'Analista' },
    { min: 350, name: 'Guardiã(o) de dados' },
    { min: 600, name: 'Especialista em privacidade' }
  ];

  const blank = () => ({ xp: 0, unlocked: {}, visited: [] });
  let state = blank();
  try { state = { ...blank(), ...JSON.parse(localStorage.getItem(STORAGE) || '{}') }; } catch { state = blank(); }
  const save = () => { try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch { /* segue sem salvar */ } };

  let soundOn = false;
  try { soundOn = localStorage.getItem('anon-sound') === 'true'; } catch { /* padrão: sem som */ }
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const listeners = [];

  const $ = (id) => document.getElementById(id);

  function levelFor(xp) {
    let index = 0;
    LEVELS.forEach((level, i) => { if (xp >= level.min) index = i; });
    const next = LEVELS[index + 1];
    const progress = next ? (xp - LEVELS[index].min) / (next.min - LEVELS[index].min) : 1;
    return { index, name: LEVELS[index].name, next, progress };
  }

  // ---------- Som (Web Audio, sem arquivos) ----------
  let audio;
  function tone(freqs, duration = 0.09, type = 'sine') {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((freq, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const start = audio.currentTime + i * duration;
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain).connect(audio.destination);
        osc.start(start);
        osc.stop(start + duration + 0.02);
      });
    } catch { /* navegador sem áudio */ }
  }
  const sfx = {
    good: () => tone([660, 880], 0.08),
    bad: () => tone([220, 165], 0.11, 'triangle'),
    badge: () => tone([523, 659, 784, 1047], 0.09),
    click: () => tone([520], 0.04)
  };

  // ---------- Confete ----------
  const canvas = $('confetti');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  let pieces = [];
  let running = false;
  const colors = ['#9c2a4d', '#1d2b4f', '#e6b84a', '#4f7dbf', '#d97a98'];
  function confetti(amount = 90, origin) {
    if (!ctx || reduceMotion()) return;
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const ox = origin ? origin.x : innerWidth / 2;
    const oy = origin ? origin.y : innerHeight / 3;
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 7;
      pieces.push({
        x: ox, y: oy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 5,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        c: colors[i % colors.length], life: 90 + Math.random() * 50
      });
    }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces = pieces.filter((p) => p.life > 0 && p.y < canvas.height + 40);
    pieces.forEach((p) => {
      p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 1;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.min(1, p.life / 30); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    if (pieces.length) requestAnimationFrame(frame);
    else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  // ---------- Avisos ----------
  function toast(title, detail, kind = 'badge') {
    const box = $('toasts');
    if (!box) return;
    const item = document.createElement('div');
    item.className = `toast toast--${kind}`;
    const strong = document.createElement('strong');
    strong.textContent = title;
    const span = document.createElement('span');
    span.textContent = detail;
    item.append(strong, span);
    box.append(item);
    setTimeout(() => item.classList.add('is-leaving'), 3600);
    setTimeout(() => item.remove(), 4200);
  }

  function floatXP(amount, anchor) {
    if (!anchor || reduceMotion()) return;
    const rect = anchor.getBoundingClientRect();
    const tag = document.createElement('span');
    tag.className = 'xp-float';
    tag.textContent = `+${amount} XP`;
    tag.style.left = `${rect.left + rect.width / 2}px`;
    tag.style.top = `${rect.top}px`;
    document.body.append(tag);
    setTimeout(() => tag.remove(), 1300);
  }

  // ---------- Placar no topo ----------
  function render() {
    const hud = $('hud');
    if (!hud) return;
    hud.hidden = false;
    const level = levelFor(state.xp);
    const count = Object.keys(state.unlocked).length;
    $('hudXp').textContent = String(state.xp);
    $('hudLevel').textContent = `Nível ${level.index + 1}`;
    $('hudMeter').style.width = `${Math.round(level.progress * 100)}%`;
    $('hudBadges').textContent = `${count}/${ACHIEVEMENTS.length}`;
    $('hudOpen').setAttribute('aria-label', `${state.xp} XP, nível ${level.index + 1}: ${level.name}. ${count} de ${ACHIEVEMENTS.length} conquistas. Abrir conquistas.`);
    const soundBtn = $('soundBtn');
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.title = soundOn ? 'Som ligado' : 'Som desligado';

    const grid = $('conquistasGrid');
    grid.replaceChildren();
    ACHIEVEMENTS.forEach((a) => {
      const li = document.createElement('li');
      const got = Boolean(state.unlocked[a.id]);
      li.className = got ? 'is-unlocked' : '';
      const icon = document.createElement('span');
      icon.className = 'conq__icon';
      icon.textContent = got ? a.icon : '?';
      icon.setAttribute('aria-hidden', 'true');
      const body = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = a.title;
      const desc = document.createElement('span');
      desc.textContent = a.desc;
      const xp = document.createElement('em');
      xp.textContent = got ? `+${a.xp} XP · conquistada` : `${a.xp} XP · bloqueada`;
      body.append(title, desc, xp);
      li.append(icon, body);
      grid.append(li);
    });
    $('dlgLevel').textContent = `${state.xp} XP · ${level.name}${level.next ? ` · faltam ${level.next.min - state.xp} XP para ${level.next.name}` : ' · nível máximo'}`;
    listeners.forEach((fn) => fn(api.summary()));
  }

  function addXP(amount, anchor) {
    const before = levelFor(state.xp).index;
    state.xp += amount;
    save();
    floatXP(amount, anchor);
    const after = levelFor(state.xp);
    if (after.index > before) {
      setTimeout(() => {
        toast(`Subiu de nível!`, `Agora: ${after.name}`, 'level');
        sfx.badge();
        confetti(140);
      }, 500);
    }
    render();
  }

  function unlock(id, anchor) {
    const a = ACHIEVEMENTS.find((item) => item.id === id);
    if (!a || state.unlocked[id]) return false;
    state.unlocked[id] = Date.now();
    toast(`Conquista: ${a.title}`, `+${a.xp} XP · ${a.desc}`);
    sfx.badge();
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      confetti(60, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    } else confetti(60);
    const pulse = $('hudOpen');
    pulse.classList.remove('is-pulsing');
    void pulse.offsetWidth;
    pulse.classList.add('is-pulsing');
    addXP(a.xp, anchor);
    if (Object.keys(state.unlocked).length === ACHIEVEMENTS.length) {
      setTimeout(() => { toast('Todas as conquistas!', 'Você explorou a apresentação inteira.', 'level'); confetti(220); }, 900);
    }
    return true;
  }

  function visit(id, total) {
    if (!state.visited.includes(id)) { state.visited.push(id); save(); }
    if (state.visited.length >= total) unlock('explorer');
  }

  function reset() {
    state = blank();
    save();
    render();
    listeners.forEach((fn) => fn(api.summary(), 'reset'));
  }

  // Diálogo de conquistas
  const dialog = $('conquistas');
  function openDialog() {
    if (!dialog) return;
    render();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  function closeDialog() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }
  $('hudOpen')?.addEventListener('click', openDialog);
  $('conquistasClose')?.addEventListener('click', closeDialog);
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
  $('dlgReset')?.addEventListener('click', () => { reset(); closeDialog(); location.hash = '#inicio'; });
  $('soundBtn')?.addEventListener('click', () => {
    soundOn = !soundOn;
    try { localStorage.setItem('anon-sound', String(soundOn)); } catch { /* sem preferência salva */ }
    render();
    sfx.good();
  });

  const api = {
    unlock, addXP, visit, reset, sfx, confetti, toast, openDialog,
    has: (id) => Boolean(state.unlocked[id]),
    summary: () => ({ xp: state.xp, level: levelFor(state.xp), count: Object.keys(state.unlocked).length, total: ACHIEVEMENTS.length }),
    onChange: (fn) => listeners.push(fn)
  };
  render();
  return api;
})();
