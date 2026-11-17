(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const Game = window.Game || { unlock() {}, addXP() {}, visit() {}, reset() {}, has: () => false, sfx: { good() {}, bad() {}, click() {}, badge() {} }, confetti() {}, toast() {}, openDialog() {}, summary: () => ({ xp: 0, level: { name: '' }, count: 0, total: 14 }), onChange() {} };
  const readPreference = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const savePreference = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* A página continua funcional sem armazenamento. */ }
  };
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTyping = (target) => Boolean(target.closest('input, select, textarea, [contenteditable="true"]'));

  // Número que "pula" quando muda, para chamar a atenção do público.
  function setNumber(element, value) {
    if (!element) return;
    const text = String(value);
    if (element.textContent === text) return;
    element.textContent = text;
    element.classList.remove('is-bumped');
    void element.offsetWidth;
    element.classList.add('is-bumped');
  }
  function shake(element) {
    element.classList.remove('is-shaking');
    void element.offsetWidth;
    element.classList.add('is-shaking');
  }

  // ---------- Abas das técnicas ----------
  const tabs = $$('.seg [role="tab"]');
  const panels = $$('.switch [role="tabpanel"]');
  const seenTabs = new Set();
  let noiseDrawn = false;
  const tabProgress = $('#tabProgress');
  function checkTech() {
    if (seenTabs.size === tabs.length && noiseDrawn) Game.unlock('tech', $('#sortearRuido'));
  }
  function showTab(index, focus = false) {
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[tabIndex].hidden = !selected;
    });
    seenTabs.add(index);
    if (tabProgress) {
      tabProgress.hidden = false;
      tabProgress.textContent = seenTabs.size === tabs.length
        ? (noiseDrawn ? 'Técnicas vistas: 3 de 3 ✓' : 'Técnicas vistas: 3 de 3 · falta sortear um ruído')
        : `Técnicas vistas: ${seenTabs.size} de ${tabs.length}`;
    }
    checkTech();
    if (focus) tabs[index].focus();
  }
  if (tabs.length === panels.length && tabs.length > 0) {
    showTab(0);
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => { showTab(index); Game.sfx.click(); });
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        event.stopPropagation();
        showTab(next, true);
      });
    });
  }

  // ---------- Menu compacto ----------
  const menuButton = $('#menuButton');
  const navLinks = $('#navLinks');
  function closeMenu() {
    navLinks.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  menuButton.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  navLinks.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });

  // ---------- Preferências de leitura ----------
  let fontSize = Number(readPreference('anon-font-size')) || 100;
  fontSize = Math.max(90, Math.min(150, fontSize));
  function applyFontSize() {
    document.documentElement.style.setProperty('--font-scale', String(fontSize / 100));
    document.body.classList.toggle('texto-grande', fontSize > 140);
    savePreference('anon-font-size', String(fontSize));
  }
  applyFontSize();
  $('#fontMinus').addEventListener('click', () => { fontSize = Math.max(90, fontSize - 10); applyFontSize(); });
  $('#fontPlus').addEventListener('click', () => { fontSize = Math.min(150, fontSize + 10); applyFontSize(); });

  const contrastButton = $('#contrastBtn');
  function applyContrast(enabled) {
    document.body.classList.toggle('alto-contraste', enabled);
    contrastButton.setAttribute('aria-pressed', String(enabled));
    savePreference('anon-contrast', String(enabled));
  }
  applyContrast(readPreference('anon-contrast') === 'true');
  contrastButton.addEventListener('click', () => applyContrast(contrastButton.getAttribute('aria-pressed') !== 'true'));

  // ---------- Abertura: a ficha se anonimiza diante do público ----------
  $('#startMission')?.addEventListener('click', () => Game.unlock('start', $('#startMission')));
  const fichaToggle = $('#fichaToggle');
  const fichaRows = $$('#ficha tbody tr');
  if (fichaToggle && fichaRows.length) {
    fichaToggle.hidden = false;
    fichaToggle.textContent = 'Anonimizar a ficha';
    const originals = fichaRows.map((row) => row.cells[1].innerHTML);
    const finals = fichaRows.map((row) => row.cells[2].textContent);
    let anonymized = false;
    const glyphs = '#*@%&?0123456789';
    fichaToggle.addEventListener('click', () => {
      anonymized = !anonymized;
      fichaToggle.textContent = anonymized ? 'Ver o original' : 'Anonimizar a ficha';
      $('#ficha').classList.toggle('is-anonymized', anonymized);
      Game.unlock('start', fichaToggle);
      fichaRows.forEach((row, index) => {
        const cell = row.cells[1];
        if (!anonymized) { cell.innerHTML = originals[index]; cell.classList.remove('is-anon'); return; }
        const target = finals[index];
        if (reduceMotion()) { cell.textContent = target; cell.classList.add('is-anon'); return; }
        let tick = 0;
        const timer = setInterval(() => {
          tick += 1;
          cell.textContent = [...target].map((ch, i) => (i < tick / 2 || ch === ' ' ? ch : glyphs[Math.floor(Math.random() * glyphs.length)])).join('');
          if (tick / 2 >= target.length) { clearInterval(timer); cell.textContent = target; cell.classList.add('is-anon'); }
        }, 40 + index * 8);
      });
      Game.sfx.click();
    });
  }

  // ---------- Ruído com dados fictícios ----------
  // A variação de idade é compensada entre as duas linhas para preservar a média.
  const noiseRows = $$('.linha-ruido');
  const bases = noiseRows.map((row) => row.dataset.base.split('|').map(Number));
  const formatDecimal = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const randomInt = (minimum, maximum) => Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  function updateMean() {
    const mean = bases.reduce((total, base) => total + base[0], 0) / bases.length;
    const noisyMean = noiseRows.reduce((total, row) => total + Number(row.cells[1].textContent), 0) / noiseRows.length;
    $('#mediaOriginal').textContent = mean.toLocaleString('pt-BR');
    setNumber($('#mediaRuido'), noisyMean.toLocaleString('pt-BR'));
  }
  if (noiseRows.length === 2 && bases.every((base) => base.length === 4 && base.every(Number.isFinite))) {
    updateMean();
    $('#sortearRuido').addEventListener('click', () => {
      const ageChange = [1, 2, -1, -2][randomInt(0, 3)];
      noiseRows.forEach((row, index) => {
        const [age, height, weight, children] = bases[index];
        const cells = row.cells;
        cells[1].textContent = String(age + (index === 0 ? ageChange : -ageChange));
        cells[2].textContent = formatDecimal(height + randomInt(-3, 3) / 100);
        cells[3].textContent = String(weight + randomInt(-3, 3));
        cells[4].textContent = String(Math.max(0, children + randomInt(-1, 1)));
        [...cells].slice(1).forEach((cell) => { cell.classList.remove('is-flash'); void cell.offsetWidth; cell.classList.add('is-flash'); });
      });
      updateMean();
      $('#ruidoStatus').textContent = 'Novo exemplo sorteado. A média de idade foi preservada; os valores individuais mudaram.';
      noiseDrawn = true;
      if (tabProgress && seenTabs.size === tabs.length) tabProgress.textContent = 'Técnicas vistas: 3 de 3 ✓';
      Game.sfx.click();
      checkTech();
    });
  } else {
    $('#sortearRuido').disabled = true;
  }

  // Desenha barras com animação a partir de zero.
  function drawBars(list, groups, scale, barClass, filter = () => true) {
    list.replaceChildren();
    groups.forEach((count, label) => {
      if (!filter(count)) return;
      const item = document.createElement('li');
      const name = document.createElement('span');
      const bar = document.createElement('span');
      const value = document.createElement('strong');
      name.textContent = label;
      bar.className = barClass;
      bar.style.setProperty('--bar-width', '0%');
      bar.setAttribute('aria-hidden', 'true');
      value.textContent = String(count);
      if (count === 1) item.classList.add('is-alone');
      item.append(name, bar, value);
      list.append(item);
      requestAnimationFrame(() => requestAnimationFrame(() => bar.style.setProperty('--bar-width', `${count / scale * 100}%`)));
    });
  }

  // ---------- 01. Laboratório de grupos (k-anonimato) ----------
  // Usa as seis linhas fictícias da tabela de generalização.
  const sampleRows = $$('#painel-general .dados tbody tr');
  const samples = sampleRows.map((row) => ({
    city: row.cells[1]?.textContent.trim(),
    state: row.cells[2]?.textContent.trim(),
    age: Number(row.cells[3]?.textContent.trim())
  }));
  const regionOf = { Acre: 'Norte', 'Rio Grande do Norte': 'Nordeste', 'Rio de Janeiro': 'Sudeste' };
  const LOC_WEIGHT = { city: 3, state: 2, region: 1, none: 0 };
  const AGE_WEIGHT = { exact: 4, 5: 3, 10: 2, 20: 1, none: 0 };
  const MAX_WEIGHT = 7;
  function locLabel(sample, loc) {
    if (loc === 'city') return sample.city;
    if (loc === 'state') return sample.state;
    if (loc === 'region') return regionOf[sample.state] || sample.state;
    return '';
  }
  function ageLabel(age, mode) {
    if (mode === 'none') return '';
    if (mode === 'exact') return `${age} anos`;
    const width = Number(mode);
    const low = Math.floor(age / width) * width;
    return `${low} a ${low + width - 1}`;
  }
  function groupsFor(loc, age) {
    const groups = new Map();
    samples.forEach((sample) => {
      const label = [locLabel(sample, loc), ageLabel(sample.age, age)].filter(Boolean).join(' · ') || 'Todos os registros';
      groups.set(label, (groups.get(label) || 0) + 1);
    });
    return groups;
  }
  const riskDemo = $('#riskDemo');
  if (riskDemo && samples.length === 6 && samples.every((s) => s.city && s.state && Number.isFinite(s.age))) {
    riskDemo.classList.add('is-enhanced');
    $('#kMission').hidden = false;
    // Melhor utilidade possível com k ≥ 2, calculada por força bruta.
    let bestUtil = 0;
    Object.keys(LOC_WEIGHT).forEach((loc) => Object.keys(AGE_WEIGHT).forEach((age) => {
      const k = Math.min(...groupsFor(loc, age).values());
      if (k >= 2) bestUtil = Math.max(bestUtil, LOC_WEIGHT[loc] + AGE_WEIGHT[age]);
    }));
    const hints = { city: 'a cidade', state: 'o estado', region: 'a região', none: '' };
    function renderK() {
      const loc = $('input[name="k-loc"]:checked').value;
      const age = $('input[name="k-age"]:checked').value;
      const groups = groupsFor(loc, age);
      const k = Math.min(...groups.values());
      const alone = [...groups.values()].filter((count) => count === 1).length;
      const utilWeight = LOC_WEIGHT[loc] + AGE_WEIGHT[age];
      const util = Math.round(utilWeight / MAX_WEIGHT * 100);
      setNumber($('#riskUnique'), alone);
      setNumber($('#riskK'), k);
      setNumber($('#riskUtil'), `${util}%`);
      $('#utilMeter').style.width = `${util}%`;
      riskDemo.dataset.k = k >= 2 ? 'safe' : 'risk';
      drawBars($('#riskBars'), groups, Math.max(2, ...groups.values()), 'risk-bar');

      const known = [hints[loc], age === 'none' ? '' : 'a idade'].filter(Boolean).join(' e ');
      let explain;
      let status;
      if (k === 1) {
        explain = `${alone} de 6 registros ficam sozinhos em seu grupo. Quem souber ${known || 'esses dados'} de alguém pode chegar à linha certa, mesmo sem nome.`;
        status = 'Ainda há registros sozinhos. Esconda ou generalize mais alguma coisa.';
      } else if (utilWeight === 0) {
        explain = 'Todos caem no mesmo grupo. Nesta amostra ninguém fica sozinho, mas também não sobra nenhuma informação para estudar.';
        status = 'Seguro, mas inútil. Dá para revelar alguma coisa de volta sem deixar ninguém sozinho?';
      } else if (utilWeight < bestUtil) {
        explain = `Ninguém ficou sozinho: o menor grupo tem ${k} registros. Ainda existe uma combinação que preserva mais detalhe.`;
        status = `k = ${k}. Conseguiu! Agora tente preservar mais detalhe.`;
      } else {
        explain = `Equilíbrio: cada registro está num grupo de pelo menos ${k}. Para proteger só seis pessoas foi preciso esconder a idade inteira. Amostras pequenas são difíceis de anonimizar.`;
        status = `Missão cumprida: k = ${k} com ${util}% de detalhe, o máximo possível nesta amostra.`;
      }
      $('#riskExplain').textContent = explain;
      $('#kMissionStatus').textContent = status;
      $('#kMission').dataset.state = k === 1 ? 'risk' : (utilWeight === bestUtil ? 'done' : 'ok');
      if (k >= 2) Game.unlock('k2', $('#riskK'));
      if (k >= 2 && utilWeight === bestUtil) Game.unlock('balance', $('#kMission'));
    }
    $$('#kControls input').forEach((input) => input.addEventListener('change', () => { renderK(); Game.sfx.click(); }));
    renderK();
  }

  // ---------- 02. Detetive: ataque de ligação ----------
  const detTable = $('#detTable');
  if (detTable) {
    const rows = $$('#detTable tbody tr');
    const feedback = $('#detFeedback');
    const nextButton = $('#detNext');
    let round = 1;
    let misses = 0;
    let solved = false;
    detTable.classList.add('is-game');
    rows.forEach((row, index) => {
      const head = row.cells[0];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'det-pick';
      button.textContent = head.textContent;
      button.setAttribute('aria-label', `Escolher a linha ${index + 1}`);
      head.replaceChildren(button);
      row.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        pick(row, index);
      });
    });
    function setupRound() {
      solved = false;
      misses = 0;
      rows.forEach((row) => row.classList.remove('is-hit', 'is-miss', 'is-candidate'));
      detTable.classList.toggle('no-age', round === 2);
      $('#detRound').textContent = round === 1
        ? 'Rodada 1 de 2 · Tabela publicada com estado e faixa de 10 anos'
        : 'Rodada 2 de 2 · Agora a tabela publica só o estado';
      $('#detCaption').textContent = round === 1
        ? 'Tabela publicada: consultas marcadas (dados fictícios)'
        : 'Nova versão publicada: sem a faixa etária (dados fictícios)';
      feedback.textContent = 'Toque na linha que você acha que é dela.';
      nextButton.hidden = true;
    }
    function pick(row, index) {
      if (solved || row.classList.contains('is-miss')) return;
      const isAcre = row.cells[1].textContent.trim() === 'Acre';
      if (round === 1) {
        if (row.dataset.match === '1') {
          solved = true;
          row.classList.add('is-hit');
          feedback.textContent = `Achou${misses === 0 ? ' de primeira' : ''}! Só a linha ${index + 1} combina com Acre e 80 a 89. Sem nenhum nome, a tabela revelou a consulta de dermatologia.`;
          Game.sfx.good();
          Game.unlock('detective', row);
          if (misses === 0) Game.addXP(10, row);
          nextButton.textContent = 'Próxima rodada';
          nextButton.hidden = false;
        } else {
          misses += 1;
          row.classList.add('is-miss');
          shake(row);
          Game.sfx.bad();
          feedback.textContent = isAcre
            ? `A linha ${index + 1} é do Acre, mas a faixa etária não bate com 85 anos. Tente outra.`
            : `A linha ${index + 1} não é do Acre. Tente outra.`;
        }
      } else if (isAcre) {
        solved = true;
        rows.filter((r) => r.cells[1].textContent.trim() === 'Acre').forEach((r) => r.classList.add('is-candidate'));
        feedback.textContent = 'Agora duas linhas combinam (1 e 4). Você não sabe qual é a dela: há 50% de chance de errar. Um grupo maior reduz a certeza, mas a pista ainda diz que ela tem uma dessas duas consultas.';
        Game.sfx.good();
        Game.unlock('doubt', row);
        nextButton.textContent = 'Jogar de novo';
        nextButton.hidden = false;
      } else {
        row.classList.add('is-miss');
        shake(row);
        Game.sfx.bad();
        feedback.textContent = `A linha ${index + 1} não é do Acre. Tente outra.`;
      }
    }
    nextButton.addEventListener('click', () => {
      round = round === 1 ? 2 : 1;
      setupRound();
    });
    setupRound();
  }

  // ---------- 03. Caça aos identificadores ----------
  const hunt = $('#hunt');
  if (hunt) {
    hunt.hidden = false;
    $('#conceitoLists').hidden = true;
    const chips = $$('#huntChips button');
    const huntFeedback = $('#huntFeedback');
    chips.forEach((chip) => chip.addEventListener('click', () => {
      chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
      chips.forEach((c) => c.classList.remove('is-right', 'is-wrong'));
      huntFeedback.textContent = '';
      Game.sfx.click();
    }));
    $('#huntCheck').addEventListener('click', () => {
      let errors = 0;
      chips.forEach((chip) => {
        const marked = chip.getAttribute('aria-pressed') === 'true';
        const isId = chip.dataset.id === '1';
        const ok = marked === isId;
        if (!ok) errors += 1;
        chip.classList.toggle('is-right', ok && marked);
        chip.classList.toggle('is-wrong', !ok);
      });
      if (errors === 0) {
        huntFeedback.textContent = 'Perfeito! Os cinco identificadores diretos saem do banco. Faixa etária, estado, oficina e turno ficam, mas, combinados, ainda podem formar grupos pequenos.';
        Game.sfx.good();
        Game.unlock('hunter', $('#huntCheck'));
      } else {
        huntFeedback.textContent = `${errors} ${errors === 1 ? 'campo está' : 'campos estão'} fora do lugar. Ajuste e confira de novo.`;
        Game.sfx.bad();
        shake($('#huntChips'));
      }
    });
  }

  // ---------- Perguntas rápidas ----------
  $$('[data-quick]').forEach((box) => {
    box.hidden = false;
    const fb = box.querySelector('.quick__fb');
    box.querySelectorAll('.quick__opts button').forEach((button) => button.addEventListener('click', () => {
      box.querySelectorAll('.quick__opts button').forEach((b) => b.classList.remove('is-right', 'is-wrong'));
      if (button.dataset.correct === '1') {
        button.classList.add('is-right');
        fb.textContent = 'Isso! Colunas como idade e local, combinadas com outras fontes, ainda podem levar a uma pessoa.';
        Game.sfx.good();
        Game.unlock(box.dataset.quick, button);
      } else {
        button.classList.add('is-wrong');
        shake(button);
        fb.textContent = 'Lembra do detetive? Sem nome nenhum, estado e idade bastaram para achar a linha.';
        Game.sfx.bad();
      }
    }));
  });

  // ---------- 04. Painel do ECA Digital ----------
  // Produto cartesiano de categorias inventadas; nenhum dado real entra ou sai do navegador.
  const ecaRecords = ['14–15 anos', '16–17 anos'].flatMap((age) =>
    ['Setor A', 'Setor B'].flatMap((sector) =>
      ['Robótica', 'Arte', 'Esporte'].map((activity) => ({ age, sector, activity }))
    )
  );
  const ecaLab = $('#ecaLab');
  const ecaFields = $$('#ecaLab input[name="eca-field"]');
  const ecaSuppress = $('#ecaSuppress');
  const ecaPresets = $$('#ecaPresets button');
  const presets = {
    all: ['age', 'sector', 'activity'],
    age_activity: ['age', 'activity'],
    activity: ['activity']
  };
  const presetsUsed = new Set();
  let suppressionTried = false;
  if (ecaLab && ecaFields.length === 3 && ecaSuppress) {
    ecaLab.classList.add('is-enhanced');
    function renderEca() {
      const selected = ecaFields.filter((field) => field.checked).map((field) => field.value);
      const groups = new Map();
      ecaRecords.forEach((record) => {
        const label = selected.length ? selected.map((field) => record[field]).join(' · ') : 'Todos os registros';
        groups.set(label, (groups.get(label) || 0) + 1);
      });
      const small = [...groups.values()].filter((count) => count < 3).reduce((total, count) => total + count, 0);
      const visible = [...groups.values()].filter((count) => !ecaSuppress.checked || count >= 3).reduce((total, count) => total + count, 0);
      setNumber($('#ecaGroups'), groups.size);
      setNumber($('#ecaSmall'), small);
      setNumber($('#ecaVisible'), visible);

      const bars = $('#ecaBars');
      drawBars(bars, groups, Math.max(4, ...groups.values()), 'eca-bar', (count) => !ecaSuppress.checked || count >= 3);
      if (!bars.children.length) {
        const item = document.createElement('li');
        item.className = 'eca-bars__empty';
        item.textContent = 'Nenhum grupo aparece no painel com este critério.';
        bars.append(item);
      }
      let summary;
      if (ecaSuppress.checked && visible === 0) summary = `Os ${groups.size} grupos ficaram abaixo do limiar didático de 3 registros e seriam ocultados. O painel perde detalhe, mas não expõe essas células.`;
      else if (ecaSuppress.checked) summary = `${ecaRecords.length - visible} registros seriam ocultados em grupos pequenos; ${visible} permaneceriam em grupos exibidos. É preciso avaliar outros riscos antes de publicar.`;
      else if (small === 0) summary = 'Nesta amostra, nenhum registro está em grupo menor que 3. Isso não garante anonimização: outras informações podem permitir associação.';
      else summary = `${small} dos ${ecaRecords.length} registros estão em grupos menores que 3. A combinação escolhida ainda pode facilitar a associação com outras fontes.`;
      $('#ecaSummary').textContent = summary;
      ecaPresets.forEach((button) => button.setAttribute('aria-pressed', String(JSON.stringify(selected) === JSON.stringify(presets[button.dataset.preset]))));
      if (presetsUsed.size === 3 && suppressionTried) Game.unlock('eca', $('#ecaSummary'));
    }
    ecaFields.forEach((field) => field.addEventListener('change', () => { renderEca(); Game.sfx.click(); }));
    ecaSuppress.addEventListener('change', () => {
      if (ecaSuppress.checked) suppressionTried = true;
      renderEca();
      Game.sfx.click();
    });
    ecaPresets.forEach((button) => button.addEventListener('click', () => {
      ecaFields.forEach((field) => { field.checked = presets[button.dataset.preset].includes(field.value); });
      ecaSuppress.checked = false;
      presetsUsed.add(button.dataset.preset);
      button.classList.add('is-done');
      renderEca();
      Game.sfx.click();
    }));
    renderEca();
  }

  // ---------- 05. Ligue o vazamento ao golpe ----------
  const matchGame = $('#matchGame');
  if (matchGame) {
    matchGame.hidden = false;
    $('#matchHow').hidden = false;
    $('#matchScore').hidden = false;
    $('#riscosList').hidden = true;
    const left = $$('#matchLeft button');
    const right = $$('#matchRight button');
    let chosen = null;
    let found = 0;
    let mistakes = 0;
    const score = () => { $('#matchScore').textContent = `${found} de 5 ligações${mistakes ? ` · ${mistakes} ${mistakes === 1 ? 'tentativa errada' : 'tentativas erradas'}` : ''}`; };
    function select(button) {
      if (button.classList.contains('is-matched')) return;
      if (!chosen || chosen.closest('ul') === button.closest('ul')) {
        if (chosen) chosen.classList.remove('is-chosen');
        chosen = button === chosen ? null : button;
        if (chosen) chosen.classList.add('is-chosen');
        Game.sfx.click();
        return;
      }
      const a = chosen;
      chosen.classList.remove('is-chosen');
      chosen = null;
      if (a.dataset.pair === button.dataset.pair) {
        found += 1;
        [a, button].forEach((b) => { b.classList.add('is-matched'); b.dataset.n = String(found); b.setAttribute('aria-disabled', 'true'); });
        Game.sfx.good();
        if (found === 5) {
          Game.unlock('antigolpe', button);
          $('#matchScore').textContent = `5 de 5 ligações!${mistakes === 0 ? ' Sem nenhum erro.' : ''} Cada dado vazado abre a porta para um golpe diferente.`;
          return;
        }
      } else {
        mistakes += 1;
        shake(a); shake(button);
        Game.sfx.bad();
      }
      score();
    }
    [...left, ...right].forEach((button) => button.addEventListener('click', () => select(button)));
  }

  // ---------- 06. Desafio de mascaramento ----------
  const maskGame = $('#maskGame');
  if (maskGame) {
    maskGame.hidden = false;
    const cpf = '123.456.789-10';
    const holder = $('#maskCpf');
    const digitButtons = [];
    [...cpf].forEach((ch) => {
      if (/\d/.test(ch)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mask-digit';
        button.dataset.digit = ch;
        button.textContent = ch;
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', `Dígito ${ch}`);
        holder.append(button);
        digitButtons.push(button);
      } else {
        const sep = document.createElement('span');
        sep.className = 'mask-sep';
        sep.textContent = ch;
        holder.append(sep);
      }
    });
    const target = [true, true, true, false, false, false, false, false, false, true, true];
    const maskFb = $('#maskFb');
    digitButtons.forEach((button, index) => button.addEventListener('click', () => {
      const masked = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(masked));
      button.textContent = masked ? '*' : button.dataset.digit;
      Game.sfx.click();
      const state = digitButtons.map((b) => b.getAttribute('aria-pressed') === 'true');
      const visible = state.filter((m) => !m).length;
      const hidMiddle = state.some((m, i) => m && !target[i]);
      if (state.every((m, i) => m === target[i])) {
        maskFb.textContent = 'Exatamente ***.456.789-**: seis dígitos do meio visíveis, como no exemplo. Mesmo assim, é um CPF parcial.';
        holder.classList.add('is-done');
        Game.sfx.good();
        Game.unlock('mask', holder);
      } else {
        holder.classList.remove('is-done');
        maskFb.textContent = hidMiddle
          ? `${visible} dígitos visíveis. Você escondeu dígitos do meio; o padrão do exemplo mantém os seis do meio.`
          : `${visible} ${visible === 1 ? 'dígito visível' : 'dígitos visíveis'}. Continue: o padrão esconde os três primeiros e os dois últimos.`;
      }
      void index;
    }));
  }

  // ---------- 07. Desafio relâmpago ----------
  const QUESTIONS = [
    { q: 'Tirar o nome de uma tabela garante que ela está anonimizada?', o: ['Sim, sem nome não há como identificar', 'Não, outras colunas combinadas podem identificar'], a: 1, e: 'No jogo do detetive, estado e faixa etária bastaram para achar a linha.' },
    { q: 'Qual técnica troca “34 anos” por “30 a 39 anos”?', o: ['Mascaramento', 'Generalização', 'Adição de ruído'], a: 1, e: 'Generalizar é reduzir a precisão para misturar a pessoa a um grupo maior.' },
    { q: 'No laboratório de grupos, o que significa k = 1?', o: ['Há pelo menos um registro sozinho em seu grupo', 'A tabela está totalmente anônima', 'Só uma coluna foi publicada'], a: 0, e: 'k é o tamanho do menor grupo. k = 1 quer dizer que alguém ficou sozinho.' },
    { q: 'Qual é a lei do ECA Digital?', o: ['Lei nº 13.709/2018', 'Lei nº 15.211/2025', 'Lei nº 8.069/1990'], a: 1, e: 'A 13.709/2018 é a LGPD, e a 8.069/1990 é o ECA original.' },
    { q: 'O CPF mascarado ***.456.789-** elimina sozinho todo o risco?', o: ['Sim', 'Não'], a: 1, e: 'Um CPF parcial ainda pode permitir associação a uma pessoa.' },
    { q: 'Qual relatório descreve o tratamento de dados pessoais, seus riscos e as medidas para reduzi-los?', o: ['RIPD', 'Boletim de ocorrência', 'Nota fiscal'], a: 0, e: 'RIPD: Relatório de Impacto à Proteção de Dados Pessoais.' },
    { q: 'Na adição de ruído do exemplo, o que ficou igual?', o: ['As idades individuais', 'A média de idade', 'Os nomes das pessoas'], a: 1, e: 'Os valores individuais mudam, mas a média foi preservada por construção.' },
    { q: 'Esconder grupos com menos de 3 registros num painel é exemplo de:', o: ['Supressão de grupos pequenos', 'Mascaramento de CPF', 'Vazamento de dados'], a: 0, e: 'No painel do ECA Digital, o limiar de 3 foi uma escolha didática, não uma regra legal.' }
  ];
  const TIME = 20;
  const quiz = $('#quiz');
  if (quiz) {
    const startBox = $('#quizStart');
    const playBox = $('#quizPlay');
    const endBox = $('#quizEnd');
    const optsBox = $('#quizOpts');
    let order = [];
    let current = 0;
    let points = 0;
    let correct = 0;
    let streak = 0;
    let answered = false;
    let timer = null;
    let deadline = 0;
    let lastResult = null;
    startBox.hidden = false;

    const shuffle = (list) => {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
      return copy;
    };
    function begin() {
      order = shuffle(QUESTIONS);
      current = 0; points = 0; correct = 0; streak = 0;
      startBox.hidden = true; endBox.hidden = true; playBox.hidden = false;
      $('#quizPoints').textContent = '0';
      show();
    }
    function show() {
      const item = order[current];
      answered = false;
      $('#quizCount').textContent = `Pergunta ${current + 1} de ${order.length}`;
      $('#quizStreak').textContent = streak >= 2 ? `Sequência de ${streak} · bônus ×${streak >= 3 ? 2 : 1.5}` : '';
      $('#quizQuestion').textContent = item.q;
      $('#quizFb').textContent = '';
      $('#quizFb').className = 'quiz__fb';
      $('#quizNext').hidden = true;
      optsBox.replaceChildren();
      item.o.forEach((text, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quiz__opt';
        const key = document.createElement('kbd');
        key.textContent = String(index + 1);
        const label = document.createElement('span');
        label.textContent = text;
        button.append(key, label);
        button.addEventListener('click', () => answer(index));
        optsBox.append(button);
      });
      deadline = performance.now() + TIME * 1000;
      clearInterval(timer);
      timer = setInterval(tick, 100);
      tick();
      optsBox.querySelector('button')?.focus({ preventScroll: true });
    }
    function tick() {
      const left = Math.max(0, deadline - performance.now());
      const bar = $('#quizTimer');
      bar.style.width = `${left / (TIME * 1000) * 100}%`;
      bar.parentElement.dataset.urgent = left < 5000 ? 'true' : 'false';
      if (left <= 0 && !answered) answer(-1);
    }
    function answer(index) {
      if (answered) return;
      answered = true;
      clearInterval(timer);
      const item = order[current];
      const secondsLeft = Math.max(0, (deadline - performance.now()) / 1000);
      const buttons = [...optsBox.querySelectorAll('button')];
      buttons.forEach((b, i) => {
        b.disabled = true;
        if (i === item.a) b.classList.add('is-right');
        else if (i === index) b.classList.add('is-wrong');
      });
      const fb = $('#quizFb');
      if (index === item.a) {
        correct += 1;
        streak += 1;
        const multiplier = streak >= 3 ? 2 : (streak === 2 ? 1.5 : 1);
        const gained = Math.round((100 + Math.round(secondsLeft * 5)) * multiplier);
        points += gained;
        setNumber($('#quizPoints'), points);
        fb.textContent = `Certo! +${gained} pontos. ${item.e}`;
        fb.classList.add('is-right');
        Game.sfx.good();
        if (streak >= 3) Game.confetti(30, (() => { const r = buttons[item.a].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top }; })());
      } else {
        streak = 0;
        fb.textContent = `${index === -1 ? 'Tempo esgotado.' : 'Não foi dessa vez.'} ${item.e}`;
        fb.classList.add('is-wrong');
        Game.sfx.bad();
      }
      $('#quizStreak').textContent = streak >= 2 ? `Sequência de ${streak} · bônus ×${streak >= 3 ? 2 : 1.5}` : '';
      const next = $('#quizNext');
      next.textContent = current + 1 < order.length ? 'Próxima pergunta' : 'Ver resultado';
      next.hidden = false;
      next.focus({ preventScroll: true });
    }
    function finish() {
      playBox.hidden = true;
      endBox.hidden = false;
      $('#quizFinal').textContent = `${points} pontos`;
      $('#quizSummary').textContent = `Você acertou ${correct} de ${order.length} perguntas${correct === order.length ? '. Gabaritou!' : '.'} Cada acerto também vale 10 XP.`;
      lastResult = { pts: points, correct };
      $('#quizSave').hidden = false;
      $('#quizNick').value = '';
      if (correct) Game.addXP(correct * 10, $('#quizFinal'));
      Game.unlock('quiz', $('#quizFinal'));
      if (correct === order.length) { Game.unlock('master', $('#quizFinal')); Game.confetti(200); }
      $('#quizNick').focus({ preventScroll: true });
    }
    $('#quizBegin').addEventListener('click', begin);
    $('#quizAgain').addEventListener('click', begin);
    $('#quizNext').addEventListener('click', () => {
      current += 1;
      if (current < order.length) show();
      else finish();
    });
    document.addEventListener('keydown', (event) => {
      if (playBox.hidden || answered || isTyping(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < order[current].o.length) {
        const rect = quiz.getBoundingClientRect();
        if (rect.top < innerHeight && rect.bottom > 0) { event.preventDefault(); answer(index); }
      }
    });

    // Placar local da mostra.
    const ranking = $('#ranking');
    const RANK_KEY = 'anon-ranking-v1';
    const readRank = () => { try { return JSON.parse(localStorage.getItem(RANK_KEY) || '[]'); } catch { return []; } };
    let highlight = null;
    const rankMask = $('#rankMask');
    const maskNick = (nick) => (nick.length <= 2 ? `${nick[0] || ''}*` : `${nick.slice(0, 2)}${'*'.repeat(Math.min(6, nick.length - 2))}`);
    function renderRank() {
      const list = readRank();
      ranking.hidden = false;
      const ol = $('#rankList');
      ol.replaceChildren();
      if (!list.length) {
        const li = document.createElement('li');
        li.className = 'ranking__empty';
        li.textContent = 'Ninguém no placar ainda. Seja a primeira pessoa!';
        ol.append(li);
        return;
      }
      list.slice(0, 8).forEach((entry, index) => {
        const li = document.createElement('li');
        if (entry.t === highlight) li.classList.add('is-me');
        const pos = document.createElement('span');
        pos.className = 'ranking__pos';
        pos.textContent = index < 3 ? ['1º', '2º', '3º'][index] : `${index + 1}º`;
        const name = document.createElement('span');
        name.className = 'ranking__nick';
        name.textContent = rankMask.checked ? maskNick(entry.nick) : entry.nick;
        const pts = document.createElement('strong');
        pts.textContent = `${entry.pts} pts`;
        const hits = document.createElement('span');
        hits.className = 'ranking__hits';
        hits.textContent = `${entry.correct}/8`;
        li.append(pos, name, hits, pts);
        ol.append(li);
      });
    }
    rankMask.checked = readPreference('anon-rank-mask') === 'true';
    rankMask.addEventListener('change', () => { savePreference('anon-rank-mask', String(rankMask.checked)); renderRank(); });
    $('#quizSave').addEventListener('submit', (event) => {
      event.preventDefault();
      const nick = $('#quizNick').value.replace(/\s+/g, ' ').trim().slice(0, 16);
      if (!nick || !lastResult) return;
      const entry = { nick, pts: lastResult.pts, correct: lastResult.correct, t: Date.now() };
      const list = [...readRank(), entry].sort((a, b) => b.pts - a.pts || a.t - b.t).slice(0, 20);
      savePreference(RANK_KEY, JSON.stringify(list));
      highlight = entry.t;
      lastResult = null;
      $('#quizSave').hidden = true;
      const position = list.findIndex((e) => e.t === entry.t) + 1;
      Game.toast(position ? `${position}º lugar no placar!` : 'Resultado salvo', `${nick} · ${entry.pts} pontos`, 'level');
      if (position === 1) Game.confetti(160);
      renderRank();
    });
    renderRank();
  }

  // ---------- Resultado final e novo visitante ----------
  function renderFinal(summary) {
    const card = $('#finalCard');
    if (!card) return;
    card.hidden = false;
    $('#finalXp').textContent = String(summary.xp);
    $('#finalLevel').textContent = summary.level.name;
    $('#finalBadges').textContent = `${summary.count} de ${summary.total} conquistas`;
  }
  Game.onChange((summary, why) => {
    if (why === 'reset') {
      try { history.scrollRestoration = 'manual'; } catch { /* ok */ }
      history.replaceState(null, '', location.pathname);
      window.scrollTo(0, 0);
      location.reload();
      return;
    }
    renderFinal(summary);
  });
  renderFinal(Game.summary());
  $('#finalOpen')?.addEventListener('click', () => Game.openDialog());
  $('#finalReset')?.addEventListener('click', () => Game.reset());

  // ---------- Progresso de leitura ----------
  const readProgress = $('#readProgress');
  if (readProgress) {
    let scheduled = false;
    function updateProgress() {
      const distance = document.documentElement.scrollHeight - innerHeight;
      readProgress.style.width = `${distance > 0 ? Math.min(100, Math.max(0, scrollY / distance * 100)) : 100}%`;
      scheduled = false;
    }
    window.addEventListener('scroll', () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  // ---------- Slides: seção atual, navegação e modo apresentação ----------
  const sections = $$('[data-step]');
  const sectionLinks = $$('.nav__links a');
  const slideNav = $('#slideNav');
  let currentSlide = 0;
  if (slideNav) {
    slideNav.hidden = false;
    $('#slideTotal').textContent = String(sections.length);
  }
  function currentIndex() {
    const line = innerHeight * 0.4;
    return sections.reduce((index, section, nextIndex) => (section.getBoundingClientRect().top <= line ? nextIndex : index), 0);
  }
  function markSlide() {
    currentSlide = currentIndex();
    const section = sections[currentSlide];
    sectionLinks.forEach((link) => {
      if (link.hash === `#${section.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    sections.forEach((s, i) => s.classList.toggle('is-current', i === currentSlide));
    if (slideNav) {
      $('#slideNum').textContent = String(currentSlide + 1);
      $('#slideTitle').textContent = section.dataset.title || '';
      $('#slidePrev').disabled = currentSlide === 0;
      $('#slideNext').disabled = currentSlide === sections.length - 1;
    }
  }
  let markScheduled = false;
  window.addEventListener('scroll', () => {
    if (!markScheduled) { markScheduled = true; requestAnimationFrame(() => { markScheduled = false; markSlide(); }); }
  }, { passive: true });
  markSlide();

  // Conta os slides visitados para a conquista de explorador.
  if ('IntersectionObserver' in window) {
    const visitObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-seen');
          Game.visit(entry.target.id, sections.length);
        }
      });
    }, { rootMargin: '0px 0px -25% 0px', threshold: 0 });
    sections.forEach((section) => visitObserver.observe(section));
  } else {
    sections.forEach((section) => section.classList.add('is-seen'));
  }

  function goTo(index) {
    const next = Math.max(0, Math.min(sections.length - 1, index));
    sections[next].scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  }
  $('#slidePrev')?.addEventListener('click', () => goTo(currentIndex() - 1));
  $('#slideNext')?.addEventListener('click', () => goTo(currentIndex() + 1));

  const root = document.documentElement;
  const presentButton = $('#presentBtn');
  function setPresenting(on) {
    root.classList.toggle('is-presenting', on);
    presentButton?.setAttribute('aria-pressed', String(on));
    if (presentButton) presentButton.textContent = on ? 'Sair' : 'Apresentar';
    requestAnimationFrame(() => goTo(currentSlide));
  }
  async function togglePresenting() {
    const on = !root.classList.contains('is-presenting');
    if (on && root.requestFullscreen && !document.fullscreenElement) {
      try { await root.requestFullscreen({ navigationUI: 'hide' }); } catch { /* segue sem tela cheia */ }
    } else if (!on && document.fullscreenElement && document.exitFullscreen) {
      try { await document.exitFullscreen(); } catch { /* ok */ }
    }
    setPresenting(on);
  }
  presentButton?.addEventListener('click', togglePresenting);
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && root.classList.contains('is-presenting')) setPresenting(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
    if ($('#conquistas')?.open) return;
    if (event.key === 'p' || event.key === 'P') { event.preventDefault(); togglePresenting(); return; }
    const presenting = root.classList.contains('is-presenting');
    const forward = ['ArrowRight', 'PageDown'].concat(presenting ? ['ArrowDown'] : []);
    const backward = ['ArrowLeft', 'PageUp'].concat(presenting ? ['ArrowUp'] : []);
    if (![...forward, ...backward].includes(event.key) || event.shiftKey) return;
    // Abas e tabelas roláveis usam as setas; botões e links não.
    if (event.target.closest('[role="tab"], .table-wrap') && !['PageDown', 'PageUp'].includes(event.key)) return;
    event.preventDefault();
    goTo(currentIndex() + (forward.includes(event.key) ? 1 : -1));
  });
})();
