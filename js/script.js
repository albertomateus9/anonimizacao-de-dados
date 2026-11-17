(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const readPreference = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const savePreference = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* A página continua funcional sem armazenamento. */ }
  };

  // Exibe apenas o painel escolhido. As três tabelas continuam visíveis sem JavaScript.
  const tabs = $$('.seg [role="tab"]');
  const panels = $$('.switch [role="tabpanel"]');
  function showTab(index, focus = false) {
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[tabIndex].hidden = !selected;
    });
    if (focus) tabs[index].focus();
  }
  if (tabs.length === panels.length && tabs.length > 0) {
    showTab(0);
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => showTab(index));
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        showTab(next, true);
      });
    });
  }

  // Menu compacto.
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

  // Preferências de leitura.
  let fontSize = Number(readPreference('anon-font-size')) || 100;
  fontSize = Math.max(90, Math.min(150, fontSize));
  function applyFontSize() {
    document.documentElement.style.fontSize = `${fontSize}%`;
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

  // Demonstração de ruído com dados fictícios. A variação de idade é compensada
  // entre as duas linhas para preservar a média deste pequeno exemplo.
  const noiseRows = $$('.linha-ruido');
  const bases = noiseRows.map((row) => row.dataset.base.split('|').map(Number));
  const formatDecimal = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const randomInt = (minimum, maximum) => Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  function updateMean() {
    const mean = bases.reduce((total, base) => total + base[0], 0) / bases.length;
    const noisyMean = noiseRows.reduce((total, row) => total + Number(row.cells[1].textContent), 0) / noiseRows.length;
    $('#mediaOriginal').textContent = mean.toLocaleString('pt-BR');
    $('#mediaRuido').textContent = noisyMean.toLocaleString('pt-BR');
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
      });
      updateMean();
      $('#ruidoStatus').textContent = 'Novo exemplo sorteado. A média de idade foi preservada; os valores individuais mudaram.';
    });
  } else {
    $('#sortearRuido').disabled = true;
  }

  // O experimento usa as mesmas seis linhas fictícias da tabela de generalização.
  // Os números descrevem apenas esta amostra, não uma população real.
  const sampleRows = $$('#painel-general .dados tbody tr');
  const samples = sampleRows.map((row) => ({
    city: row.cells[1]?.textContent.trim(),
    state: row.cells[2]?.textContent.trim(),
    age: Number(row.cells[3]?.textContent.trim()),
    decade: row.cells[4]?.textContent.trim()
  }));
  const riskDemo = $('#riskDemo');
  const precision = $('#precision');
  if (samples.length === 6 && samples.every((sample) => sample.city && sample.state && Number.isFinite(sample.age) && sample.decade)) {
    riskDemo.classList.add('is-enhanced');
    const descriptions = {
      city_age: 'Cidade e idade exata formam seis combinações únicas nesta amostra. Mais detalhe pode facilitar a ligação com outras fontes.',
      state_decade: 'Estado e faixa de dez anos ainda formam seis combinações únicas nesta amostra. Reduzir a precisão nem sempre reduz a singularidade.',
      state_only: 'Cada estado reúne dois registros nesta amostra. A idade e a cidade deixam de ser visíveis, mas grupos de dois ainda são pequenos e não garantem anonimização.'
    };
    function groupLabel(sample, level) {
      if (level === 'city_age') return `${sample.city} · ${sample.age} anos`;
      if (level === 'state_only') return sample.state;
      return `${sample.state} · ${sample.decade}`;
    }
    function renderRisk(level) {
      const groups = new Map();
      samples.forEach((sample) => {
        const label = groupLabel(sample, level);
        groups.set(label, (groups.get(label) || 0) + 1);
      });
      const bars = $('#riskBars');
      bars.replaceChildren();
      const scale = Math.max(2, ...groups.values());
      groups.forEach((count, label) => {
        const item = document.createElement('li');
        const name = document.createElement('span');
        const bar = document.createElement('span');
        const value = document.createElement('strong');
        name.textContent = label;
        bar.className = 'risk-bar';
        bar.style.setProperty('--bar-width', `${count / scale * 100}%`);
        bar.setAttribute('aria-hidden', 'true');
        value.textContent = String(count);
        item.append(name, bar, value);
        bars.append(item);
      });
      $('#riskRecords').textContent = String(samples.length);
      $('#riskUnique').textContent = String([...groups.values()].filter((count) => count === 1).length);
      $('#riskExplain').textContent = descriptions[level];
    }
    renderRisk(precision.value);
    precision.addEventListener('change', () => renderRisk(precision.value));
  }

  // Marca a seção em leitura e permite avançar com as setas fora dos controles.
  const sections = $$('[data-step]');
  const sectionLinks = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        sectionLinks.forEach((link) => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach((section) => observer.observe(section));
  }
  document.addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest('button, a, input, select, textarea, [role="tab"], .table-wrap')) return;
    const current = sections.reduce((index, section, nextIndex) => section.getBoundingClientRect().top <= innerHeight * 0.4 ? nextIndex : index, 0);
    const next = Math.max(0, Math.min(sections.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
    if (next !== current) {
      event.preventDefault();
      sections[next].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  });
})();
