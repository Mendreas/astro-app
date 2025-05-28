// script.js completo atualizado
let db;
let tipoFiltro = null;
let magFiltro = null;
let searchTerm = '';
let sortBy = 'nome';
let sortAsc = true;

const { openDB } = window.idb;

window.onload = async () => {
  db = await openDB('astroApp', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('observacoes')) {
        db.createObjectStore('observacoes', { keyPath: 'id', autoIncrement: true });
      }
    }
  });

  configurarEventosUI();
  configurarFiltros();
  traduzir(document.documentElement.lang);
  render();
	
};

document.getElementById('searchToggle').onclick = () => {
  const barra = document.getElementById('searchBar');
  barra.classList.toggle('visible');
};


function traduzir(lang) {
  const t = window.i18n?.[lang] || {};
  document.title = t.appTitle;
  document.querySelector('[data-tab="observacoes"]').textContent = t.tabObservacoes;
  document.querySelector('[data-tab="favoritos"]').textContent = t.tabFavoritos;
  document.querySelector('[data-tab="adicionar"]').textContent = t.tabAdicionar;
  document.querySelector('[data-tab="config"]').textContent = t.tabConfig;
  document.querySelectorAll('.chip').forEach((chip, i) => {
    if (i < t.tipos.length) chip.textContent = t.tipos[i];
    if (i === t.tipos.length) chip.textContent = t.magChip;
  });
}

document.getElementById('toggleLang').onclick = () => {
  const lang = document.documentElement.lang === 'pt' ? 'en' : 'pt';
  document.documentElement.lang = lang;
  document.getElementById('toggleLang').textContent = lang.toUpperCase();
  traduzir(lang);
};

function configurarEventosUI() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'favoritos') renderFavoritos();
      if (btn.dataset.tab === 'observacoes') render();
    };
  });

  document.getElementById('addForm').onsubmit = guardarObservacao;

  document.querySelector('[data-tab="adicionar"]').addEventListener('click', () => {
    document.getElementById('addForm').reset();
    document.getElementById('editObject').value = '';
    document.getElementById('preview').innerHTML = '';
  });

  document.getElementById('foto').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById('preview').innerHTML = `<img class="observation-photo" src="${reader.result}">`;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('searchInput').oninput = e => {
    searchTerm = e.target.value.toLowerCase();
    document.querySelector('[data-tab="observacoes"]').click();
    setTimeout(render, 30);
  };

  document.getElementById('themeToggle').onclick = () => {
  document.body.classList.toggle('light-mode');
  document.body.classList.remove('red-mode');
  document.body.classList.toggle('dark-mode', !document.body.classList.contains('light-mode'));
  localStorage.setItem('tema', document.body.classList.contains('light-mode') ? 'light' : 'dark');
  };

  document.getElementById('toggleRed').onclick = () => {
    const red = document.body.classList.toggle('red-mode');
    document.body.classList.remove('light-mode', 'dark-mode');
    localStorage.setItem('tema', red ? 'red' : 'dark');
  };

  document.getElementById('sortToggle').onclick = () => {
    const ordem = ['nome', 'data', 'tipo'];
    const i = ordem.indexOf(sortBy);
    sortBy = ordem[(i + 1) % ordem.length];
    sortAsc = !sortAsc;
    render();
  };

  const temaSalvo = localStorage.getItem('tema') || 'dark';
  document.body.classList.add(`${temaSalvo}-mode`);
}

function configurarFiltros() {
  const chipContainer = document.createElement('div');
  chipContainer.className = 'favoritos-grid';
  chipContainer.style.margin = '1rem 1rem 0 1rem';

  const lang = document.documentElement.lang;
  const tipos = window.i18n?.[lang]?.tipos || [];

  tipos.forEach((tipoTrad, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = tipoTrad;
    chip.onclick = () => {
      tipoFiltro = i === 0 ? null : i18n['pt'].tipos[i];
      if (i === 0) magFiltro = null;
      render();
    };
    chipContainer.appendChild(chip);
  });

  const magChip = document.createElement('button');
  magChip.className = 'chip';
  magChip.textContent = window.i18n?.[lang]?.magChip || 'Mag ≤ 8';
  magChip.onclick = () => {
    magFiltro = magFiltro ? null : 8;
    render();
  };
  chipContainer.appendChild(magChip);

  document.getElementById('observacoes').before(chipContainer);
}

async function guardarObservacao(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('editObject').value);
  let obs = id ? await db.get('observacoes', id) : { favorito: false };

  obs.nome = document.getElementById('nome').value;
  obs.tipo = document.getElementById('tipo').value;
  obs.data = document.getElementById('data').value;
  obs.local = document.getElementById('local').value;
  obs.ra = document.getElementById('ra').value;
  obs.dec = document.getElementById('dec').value;
  obs.magnitude = document.getElementById('magnitude').value;
  obs.elongacao = document.getElementById('elongacao').value;
  obs.distancia = document.getElementById('distancia').value;
  obs.distUnidade = document.getElementById('distUnidade').value;
  obs.descricao = document.getElementById('descricao').value;

  const file = document.getElementById('foto').files[0];
  if (file) {
    obs.foto = await toBase64(file);
  }

  await db.put('observacoes', obs);

  document.getElementById('addForm').reset();
  document.getElementById('editObject').value = '';
  document.getElementById('preview').innerHTML = '';
  document.querySelector('[data-tab="observacoes"]').click();
  setTimeout(render, 50); // previne duplicação temporária
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = err => rej(err);
    reader.readAsDataURL(file);
  });
}

window.editar = async function(id) {
  const obs = await db.get('observacoes', id);
  ativarEdicao(obs);
};

function ativarEdicao(obs) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.getElementById('editar').classList.add('active');
  document.getElementById('editObjectId').value = obs.id;
  document.getElementById('editNome').value = obs.nome;
  document.getElementById('editTipo').value = obs.tipo;
  document.getElementById('editData').value = obs.data;
  document.getElementById('editLocal').value = obs.local;
  document.getElementById('editRa').value = obs.ra;
  document.getElementById('editDec').value = obs.dec;
  document.getElementById('editMagnitude').value = obs.magnitude;
  document.getElementById('editElongacao').value = obs.elongacao;
  document.getElementById('editDistancia').value = obs.distancia;
  document.getElementById('editDistUnidade').value = obs.distUnidade;
  document.getElementById('editDescricao').value = obs.descricao;
  document.getElementById('editPreview').innerHTML = obs.foto ? `<img src="${obs.foto}" class="thumbnail" onclick="window.open('${obs.foto}', '_blank')">` : '';
}

window.apagar = async function(id) {
  if (confirm('Eliminar esta observação?')) {
    await db.delete('observacoes', id);
    render();
  }
};

window.favoritar = async function(id) {
  const obs = await db.get('observacoes', id);
  obs.favorito = !obs.favorito;
  await db.put('observacoes', obs);
  render();
};

async function render() {
  const container = document.getElementById('observacoes');
  container.innerHTML = '';
  const dados = await db.getAll('observacoes');

  let filtrados = dados.filter(o =>
    (!tipoFiltro || o.tipo === tipoFiltro) &&
    (!magFiltro || parseFloat(o.magnitude) <= magFiltro) &&
    (o.nome?.toLowerCase().includes(searchTerm) || o.descricao?.toLowerCase().includes(searchTerm))
  );

  const grid = document.createElement('div');
  grid.className = 'favoritos-grid';

  filtrados.forEach(obs => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      ${obs.foto ? `<img class="thumbnail" src="${obs.foto}" onclick="window.open('${obs.foto}', '_blank')">` : ''}
      <strong>${obs.nome}</strong>
      <div class="meta">${obs.data}</div>
    `;
    div.onclick = () => mostrarDetalhe(obs);
    grid.appendChild(div);
  });

  container.appendChild(grid);
}

function mostrarDetalhe(obs) {
  const container = document.getElementById('observacoes');
  container.innerHTML = `<h2>${obs.nome}</h2>`;
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <p><strong>Tipo:</strong> ${obs.tipo}</p>
    <p><strong>Data:</strong> ${obs.data}</p>
    <p><strong>Local:</strong> ${obs.local}</p>
    <p><strong>RA:</strong> ${obs.ra}</p>
    <p><strong>DEC:</strong> ${obs.dec}</p>
    <p><strong>Magnitude:</strong> ${obs.magnitude}</p>
    <p><strong>Elongação:</strong> ${obs.elongacao}</p>
    <p><strong>Distância:</strong> ${obs.distancia} ${obs.distUnidade}</p>
    <p><strong>Descrição:</strong> ${obs.descricao}</p>
    ${obs.foto ? `<img class="thumbnail" src="${obs.foto}" onclick="window.open('${obs.foto}', '_blank')">` : ''}
    <div class="actions">
      <button onclick="editar(${obs.id})">✏️ Editar</button>
      <button onclick="favoritar(${obs.id})">${obs.favorito ? '⭐ Remover Favorito' : '☆ Marcar Favorito'}</button>
      <button onclick="apagar(${obs.id})">🗑️ Apagar</button>
    </div>
  `;
  const back = document.createElement('button');
  back.textContent = '🔙 Voltar';
  back.onclick = render;
  container.appendChild(div);
  container.appendChild(back);
}

async function renderFavoritos() {
  const fav = document.getElementById('favoritos');
  fav.innerHTML = '';
  const dados = await db.getAll('observacoes');
  const favoritos = dados.filter(o => o.favorito);

  const grid = document.createElement('div');
  grid.className = 'favoritos-grid';

  favoritos.forEach(obs => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      ${obs.foto ? `<img class="thumbnail" src="${obs.foto}" onclick="window.open('${obs.foto}', '_blank')">` : ''}
      <strong>${obs.nome}</strong>
      <div class="meta">${obs.data}</div>
    `;
    div.onclick = () => {
      document.querySelector('[data-tab="observacoes"]').click();
      setTimeout(() => mostrarDetalhe(obs), 50);
    };
    grid.appendChild(div);
  });

  fav.appendChild(grid);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log("✅ Service Worker registado"))
    .catch(err => console.error("❌ Falha ao registar SW", err));
}