// AstroLog – app.js consolidado

// =========================
// VARIÁVEIS GLOBAIS
// =========================
let observacoes = [];
let currentLang = 'pt';
let currentFilter = 'todos';
let searchQuery = '';
let editId = null;
let calendarioMes = new Date().getMonth();
let calendarioAno = new Date().getFullYear();

const obsList = document.getElementById('observationsList');

// =========================
// TRADUÇÕES (i18n)
// =========================
const i18n = {
  pt: {
    searchPlaceholder: "Pesquisar observações...",
    all: "Todos",
    recent: "Recentes",
    favorites: "Favoritos",
    filterType: "Filtrar por tipo",
    cancel: "Cancelar",
    save: "Guardar",
    redFilter: "Filtro Vermelho",
    intensity: "Intensidade do Filtro",
    edit: "Editar",
    delete: "Eliminar",
    close: "Fechar",
    objectos: "Objectos",
    adicionar: "Adicionar",
    calendario: "Calendário",
    calendarTitle: "Calendário de Observações",
    recursos: "Recursos",
    configuracoes: "Configurações",
    links: "Links Úteis",
    ver: "Ver",
  },
  en: {
    searchPlaceholder: "Search observations...",
    all: "All",
    recent: "Recent",
    favorites: "Favorites",
    filterType: "Filter by type",
    cancel: "Cancel",
    save: "Save",
    redFilter: "Red Filter",
    intensity: "Filter Intensity",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    objectos: "Objects",
    adicionar: "Add",
    calendario: "Calendar",
    calendarTitle: "Observation Calendar",
    recursos: "Resources",
    configuracoes: "Settings",
    links: "Useful Links",
    ver: "View",
  }
};

// =========================
// INDEXEDDB SETUP
// =========================
const DB_NAME = 'AstroLogDB';
const DB_VERSION = 1;
const STORE_NAME = 'observacoes';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function getAllObservacoes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveObservacao(obs) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(obs);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteObservacao(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// =========================
// CARREGAR OBSERVAÇÕES AO INICIAR
// =========================
async function loadObservacoes() {
  observacoes = await getAllObservacoes();
  renderObservacoes();
}
loadObservacoes();

// =========================
// EVENTOS GERAIS E INICIALIZAÇÃO
// =========================
document.addEventListener('DOMContentLoaded', async () => {
  observacoes = await getAllObservacoes();
  renderObservacoes();
  translateUI();
  updateRedFilterClass();

  // === Botão “＋” abre modal de adição
  const addBtn = document.getElementById('addObservationBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      document.getElementById('addObservationModal').style.display = 'block';
    });
  }

  // === Fechar modal de adição
  document.getElementById('closeAddModal').onclick = closeAddForm;
  document.getElementById('cancelAdd').onclick = closeAddForm;

  // === Submissão do formulário de adição
  document.getElementById('addObservationForm').onsubmit = async function (e) {
    e.preventDefault();
    const form = this;
    const data = new FormData(form);
    const obs = Object.fromEntries(data.entries());
    obs.favorito = !!data.get('favorito');
    obs.id = Date.now();

    const file = data.get('imagem');
    const saveObs = async () => {
      await saveObservacao(obs);
      observacoes = await getAllObservacoes();
      renderObservacoes();
      atualizarBackupJSON();
      document.getElementById('addSuccessMsg').style.display = 'block';
      setTimeout(closeAddForm, 1500);
    };

    if (file && file.name && file.size > 0) {
      const reader = new FileReader();
      reader.onload = async () => {
        obs.imagem = reader.result;
        await saveObs();
      };
      reader.onerror = async () => {
        alert("Erro ao carregar imagem.");
        await saveObs();
      };
      reader.readAsDataURL(file);
    } else {
      await saveObs();
    }
  };
});

// =========================
// FECHAR O MODAL DE ADIÇÃO
// =========================
function closeAddForm() {
  document.getElementById('addObservationForm').reset();
  document.getElementById('addObservationModal').style.display = 'none';
  document.getElementById('addSuccessMsg').style.display = 'none';
}

// =========================
// BACKUP LOCALSTORAGE (JSON) – para download rápido
// =========================
function atualizarBackupJSON() {
  const json = JSON.stringify(observacoes, null, 2);
  localStorage.setItem('backupAstroLog', json);
}

// =========================
// FUNÇÕES AUXILIARES
// =========================

// Traduz UI (placeholders, labels e botões) conforme currentLang (pt/en).
function translateUI() {
  const t = i18n[currentLang];

  document.getElementById('searchInput').placeholder = t.searchPlaceholder;
  document.querySelector('[data-filter="todos"]').textContent = t.all;
  document.querySelector('[data-filter="recentes"]').textContent = t.recent;
  document.querySelector('[data-filter="favoritos"]').textContent = t.favorites;
  document.getElementById('filterByType').textContent = t.filterType;
  document.querySelector('button[type="reset"]').textContent = t.cancel;
  document.querySelector('button[type="submit"]').textContent = t.save;
  document.querySelector('footer label:first-child').textContent = t.redFilter;
  document.querySelector('footer label:last-of-type').textContent = t.intensity;

  // Tabs
  document.querySelectorAll("nav button[data-tab]").forEach(btn => {
    const key = btn.getAttribute("data-tab");
    if (t[key]) {
      btn.textContent = t[key];
    }
  });

  // Botões “🔍 Ver” dentro dos cards
  document.querySelectorAll(".observation-card button.view-btn").forEach(btn => {
    btn.textContent = `🔍 ${t.ver}`;
  });

  // Atualizar título do calendário se já estiver visível
  const calendarioVisivel = document.getElementById('tab-calendario').classList.contains('active');
  if (calendarioVisivel) {
    document.querySelector('#tab-calendario h2').textContent = t.calendarTitle;
    renderCalendario();
  }
}

// Aplica ou remove a classe `red-filter` no BODY e define a cor de fundo “vermelha” conforme intensity.
function applyRedFilter(active) {
  if (active) {
    document.body.classList.add('red-filter');
    const intensity = parseInt(redSlider.value);
    document.body.style.backgroundColor = `rgba(255, 0, 0, ${intensity / 100})`;
  } else {
    document.body.classList.remove('red-filter');
    document.body.style.backgroundColor = '';
  }
}

// Atualiza a classe de intensidade (20/40/60/80/100) quando o toggle ou slider mudam.
function updateRedFilterClass() {
  document.body.classList.remove('intensity-20', 'intensity-40', 'intensity-60', 'intensity-80', 'intensity-100');
  if (redToggle.checked) {
    document.body.classList.add('red-filter');
    const val = parseInt(redSlider.value);
    if (val > 80) document.body.classList.add('intensity-100');
    else if (val > 60) document.body.classList.add('intensity-80');
    else if (val > 40) document.body.classList.add('intensity-60');
    else if (val > 20) document.body.classList.add('intensity-40');
    else document.body.classList.add('intensity-20');
  } else {
    document.body.classList.remove('red-filter');
  }
}

// Retorna data no formato YYYY-MM-DD (sv-SE) para comparação no calendário.
function normalizarDataLocal(data) {
  return new Date(data).toLocaleDateString('sv-SE');
}

// Capitaliza a primeira letra de uma palavra
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Map de ícones por tipo
function getIcon(tipo) {
  const icons = {
    'Estrela': '⭐',
    'Galáxia': '🌌',
    'Planeta': '🪐',
    'Cometa': '☁️',
    'Outro': '🔭'
  };
  return icons[tipo] || '❔';
}

// =========================
// MANIPULAÇÃO DO RED FILTER
// =========================
const redToggle = document.getElementById('redFilterToggle');
const redSlider = document.getElementById('redFilterIntensity');
const redButton = document.getElementById('toggleRedFilter');

redButton.addEventListener('click', () => {
  redToggle.checked = !redToggle.checked;
  applyRedFilter(redToggle.checked);
});
redToggle.addEventListener('change', () => {
  applyRedFilter(redToggle.checked);
});
redSlider.addEventListener('input', () => {
  if (redToggle.checked) applyRedFilter(true);
});
redToggle.addEventListener('change', updateRedFilterClass);
redSlider.addEventListener('input', updateRedFilterClass);

// =========================
// FILTROS, PESQUISA E VISUALIZAÇÃO DE TABS
// =========================
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('[data-filter]');
const filterBtnByType = document.getElementById('filterByType');

// Pesquisa em tempo real
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.toLowerCase();
  renderObservacoes();
});

// Filtrar por “Todos/Recentes/Favoritos”
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderObservacoes();
  });
});

// Filtrar por tipo (exibe dropdown dos tipos únicos presentes)
filterBtnByType.addEventListener('click', async () => {
  if (!observacoes || observacoes.length === 0) observacoes = await getAllObservacoes();
  if (!observacoes.length) {
    alert("Sem observações para filtrar.");
    return;
  }
  document.querySelectorAll('.dropdown-menu').forEach(m => m.remove());

  const tipos = [...new Set(observacoes.map(o => o.tipo).filter(Boolean))];
  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';

  tipos.forEach(tipo => {
    const item = document.createElement('div');
    item.textContent = tipo;
    item.addEventListener('click', () => {
      currentFilter = 'tipo';
      searchQuery = tipo.toLowerCase();
      renderObservacoes();
      menu.remove();
    });
    menu.appendChild(item);
  });

  const allItem = document.createElement('div');
  allItem.textContent = i18n[currentLang].all;
  allItem.addEventListener('click', () => {
    currentFilter = 'todos';
    searchQuery = '';
    renderObservacoes();
    menu.remove();
  });
  menu.appendChild(allItem);

  const rect = filterBtnByType.getBoundingClientRect();
  menu.style.position = 'absolute';
  menu.style.top = `${rect.bottom + window.scrollY}px`;
  menu.style.left = `${rect.left + window.scrollX}px`;
  menu.style.zIndex = 1000;

  document.body.appendChild(menu);
});

// Troca de Tabs
const tabs = document.querySelectorAll('nav button[data-tab]');
const tabSections = document.querySelectorAll('.tab');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    tabSections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(`tab-${target}`).classList.add('active');

    // Exibir rodapé apenas em “configurações”
    document.querySelector('footer').style.display = (target === 'configuracoes') ? 'flex' : 'none';

    // Fechar qualquer dropdown ainda aberto
    document.querySelectorAll('.dropdown-menu').forEach(m => m.remove());

    // Se mudar para Calendário, renderiza-o
    if (target === 'calendario') renderCalendario();
  });
});

// =========================
// EXPORTAR / IMPORTAR OBSERVAÇÕES (JSON)
// =========================
document.getElementById('exportJson').addEventListener('click', async () => {
  const data = await getAllObservacoes();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'astro-observacoes.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('importJson').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("Formato inválido");
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const obs of data) {
        if (obs.id && obs.nome) {
          store.put(obs);
        }
      }
      tx.oncomplete = async () => {
        alert("Importação concluída!");
        observacoes = await getAllObservacoes();
        renderObservacoes();
        event.target.value = '';
      };
    } catch (err) {
      alert("Erro ao importar: " + err.message);
    }
  };
  reader.readAsText(file);
});

// =========================
// RENDERIZAÇÃO DAS OBSERVAÇÕES
// =========================
function renderObservacoes() {
  obsList.innerHTML = '';
  let list = observacoes.slice(); // clone

  // Filtrar Favoritos ou Ordenar Recentes
  if (currentFilter === 'favoritos') {
    list = list.filter(o => o.favorito);
  } else if (currentFilter === 'recentes') {
    list = list.sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  // Filtro por tipo (já armazenado em searchQuery se for o caso)
  if (currentFilter === 'tipo' && searchQuery) {
    list = list.filter(o => o.tipo.toLowerCase() === searchQuery);
  }

  // Filtro de texto (nome, tipo ou local)
  if (searchQuery && currentFilter !== 'tipo') {
    list = list.filter(o =>
      o.nome.toLowerCase().includes(searchQuery) ||
      (o.tipo && o.tipo.toLowerCase().includes(searchQuery)) ||
      (o.local && o.local.toLowerCase().includes(searchQuery))
    );
  }

  list.forEach(obs => {
    const card = document.createElement('div');
    card.className = 'observation-card';

    const icon = getIcon(obs.tipo);
    const dataStr = new Date(obs.data).toLocaleDateString();

    const imgHTML = obs.imagem
      ? `<img src="${obs.imagem}" style="max-width: 100%; max-height: 100px; cursor: pointer;" onclick="window.open('${obs.imagem}', '_blank')" />`
      : '';

    const viewBtn = `<button class="view-btn" onclick="viewObservation(${obs.id})">🔍 ${i18n[currentLang].ver}</button>`;
    const editBtn = `<button onclick="editObservation(${obs.id})">✏️ ${i18n[currentLang].edit}</button>`;
    const deleteBtn = `<button onclick="deleteObservation(${obs.id})">🗑️ ${i18n[currentLang].delete}</button>`;

    card.innerHTML = `
      <div class="title">${icon} ${obs.nome} ${obs.favorito ? '⭐' : ''}</div>
      <div><small>${obs.tipo}</small></div>
      <div><small>${dataStr} - ${obs.local || ''}</small></div>
      ${imgHTML}
      <div style="margin-top: 0.5rem">
        ${viewBtn}
        ${editBtn}
        ${deleteBtn}
      </div>
    `;
    obsList.appendChild(card);
  });
}

// =========================
// VIEW OBSERVATION (Modal de visualização detalhada)
// =========================
window.viewObservation = function(id) {
  const obs = observacoes.find(o => o.id === id);
  if (!obs) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'view-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${obs.nome}</h3>
      <p><strong>Tipo:</strong> ${obs.tipo}</p>
      <p><strong>Data:</strong> ${new Date(obs.data).toLocaleString()}</p>
      <p><strong>Local:</strong> ${obs.local || ''}</p>
      <p><strong>RA:</strong> ${obs.ra || ''}</p>
      <p><strong>DEC:</strong> ${obs.dec || ''}</p>
      <p><strong>Distância:</strong> ${obs.distancia || ''} ${obs.unidadeDistancia || ''}</p>
      <p><strong>Magnitude:</strong> ${obs.magnitude || ''}</p>
      <p><strong>Elongação:</strong> ${obs.elongacao || ''}</p>
      <p><strong>Descrição:</strong> ${obs.descricao || ''}</p>
      ${obs.imagem ? `<img src="${obs.imagem}" style="max-width:100%; max-height:200px; margin-top:1rem; cursor:pointer" onclick="openImageModal('${obs.imagem}')" />` : ''}
      <button onclick="closeModal()">${i18n[currentLang].close}</button>
    </div>
  `;
  document.body.appendChild(modal);
};

window.openImageModal = function(imgSrc) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <img src="${imgSrc}" style="max-width:100%; max-height:80vh; display: block; margin: 0 auto 1rem;" />
      <div style="text-align:center;">
        <button onclick="closeModalById('image-modal')">${i18n[currentLang].close}</button>
        <button onclick="closeModalById('image-modal'); closeModalById('view-modal')">${i18n[currentLang].close} tudo</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.closeModalById = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
};

window.closeModal = function() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
};

// =========================
// EDIT OBSERVATION (Modal de edição)
// =========================
window.editObservation = function(id) {
  const obs = observacoes.find(o => o.id === id);
  if (!obs) return;

  editId = id;
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${i18n[currentLang].edit}</h3>
      <form id="modalForm">
        <label>Nome
          <input name="nome" value="${obs.nome}" required />
        </label>

        <label>Tipo
          <select name="tipo" required>
            <option${obs.tipo === 'Estrela' ? ' selected' : ''}>Estrela</option>
            <option${obs.tipo === 'Galáxia' ? ' selected' : ''}>Galáxia</option>
            <option${obs.tipo === 'Planeta' ? ' selected' : ''}>Planeta</option>
            <option${obs.tipo === 'Cometa' ? ' selected' : ''}>Cometa</option>
            <option${obs.tipo === 'Outro' ? ' selected' : ''}>Outro</option>
          </select>
        </label>

        <label>Data
          <input name="data" type="date" value="${obs.data.substring(0,10)}" required />
        </label>
        <label>Local
          <input name="local" value="${obs.local || ''}" />
        </label>
        <label>RA
          <input name="ra" value="${obs.ra || ''}" placeholder="RA" />
        </label>
        <label>DEC
          <input name="dec" value="${obs.dec || ''}" placeholder="DEC" />
        </label>
        <label>Distância
          <input name="distancia" value="${obs.distancia || ''}" placeholder="Distância" />
          <select name="unidadeDistancia">
            <option${obs.unidadeDistancia === 'ly' ? ' selected' : ''} value="ly">ly</option>
            <option${obs.unidadeDistancia === 'AU' ? ' selected' : ''} value="AU">AU</option>
          </select>
        </label>
        <label>Magnitude
          <input name="magnitude" value="${obs.magnitude || ''}" placeholder="Magnitude" step="0.1" />
        </label>
        <label>Descrição
          <textarea name="descricao">${obs.descricao || ''}</textarea>
        </label>
        <label>
          <input type="checkbox" name="favorito" ${obs.favorito ? 'checked' : ''}/> Favorito
        </label>
        <label>Imagem (opcional)
          <input type="file" name="imagem" accept="image/*" />
        </label>

        <button type="submit">${i18n[currentLang].save}</button>
        <button type="button" onclick="closeModal()">${i18n[currentLang].cancel}</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const modalForm = modal.querySelector('form');
  modalForm.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(modalForm);
    const newObs = Object.fromEntries(data.entries());
    newObs.id = id;
    newObs.favorito = !!data.get('favorito');

    // Conservar a imagem anterior se o usuário não inserir arquivo novo
    const file = data.get('imagem');
    const saveEdit = async () => {
      const original = observacoes.find(o => o.id === id);
      if (original?.imagem && !newObs.imagem) newObs.imagem = original.imagem;
      await saveObservacao(newObs);
      observacoes = await getAllObservacoes();
      renderObservacoes();
      closeModal();
    };

    if (file && file.size > 0) {
      const reader = new FileReader();
      reader.onload = async () => {
        newObs.imagem = reader.result;
        await saveEdit();
      };
      reader.onerror = async () => {
        alert("Erro ao carregar imagem. A observação será guardada sem imagem nova.");
        await saveEdit();
      };
      reader.readAsDataURL(file);
    } else {
      await saveEdit();
    }
  });
};

// =========================
// DELETE OBSERVATION
// =========================
window.deleteObservacao = async function(id) {
  if (confirm('Eliminar esta observação?')) {
    await deleteObservacao(id);
    observacoes = await getAllObservacoes();
    renderObservacoes();
  }
};

// =========================
// CALENDÁRIO (MÊS ATUAL & CLASSES “highlight”)
// =========================
function renderCalendario() {
  const container = document.getElementById('calendarContainer');
  const title = document.getElementById('calendarMonthYear');
  container.innerHTML = '';

  const firstDay = new Date(calendarioAno, calendarioMes, 1).getDay();
  const daysInMonth = new Date(calendarioAno, calendarioMes + 1, 0).getDate();

  // Atualizar TÍTULO do mês (em pt ou en dependendo de currentLang)
  const locale = (currentLang === 'pt') ? 'pt-PT' : 'en-US';
  const nomeMes = new Date(calendarioAno, calendarioMes).toLocaleString(locale, { month: 'long' });
  title.textContent = `${capitalize(nomeMes)} ${calendarioAno}`;

  // Dias que têm observações
  const diasComObservacoes = new Set(
    observacoes.map(o => normalizarDataLocal(o.data))
  );

  // Adicionar “células vazias” antes do primeiro dia
  for (let i = 0; i < firstDay; i++) {
    container.appendChild(document.createElement('div'));
  }

  // Adicionar cada dia do mês
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calendarioAno, calendarioMes, d);
    const dateStr = normalizarDataLocal(date);

    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.textContent = d;

    if (diasComObservacoes.has(dateStr)) {
      div.classList.add('highlight');
      div.addEventListener('click', () => mostrarObservacoesDoDia(dateStr));
    }
    container.appendChild(div);
  }
}

// Mostrar lista de observações no dia clicado
function mostrarObservacoesDoDia(dataISO) {
  const lista = observacoes.filter(o => o.data.startsWith(dataISO));
  const container = document.getElementById('calendarResults');

  if (!lista.length) {
    container.innerHTML = `<p>Sem observações para ${dataISO}</p>`;
    return;
  }

  container.innerHTML = `<h3>Observações em ${dataISO}:</h3><ul>` +
    lista.map(o => `<li>${getIcon(o.tipo)} ${o.nome}</li>`).join('') +
    `</ul>`;
}

// Navegação de mês anterior / próximo
document.getElementById('prevMonth').addEventListener('click', () => {
  calendarioMes--;
  if (calendarioMes < 0) {
    calendarioMes = 11;
    calendarioAno--;
  }
  renderCalendario();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  calendarioMes++;
  if (calendarioMes > 11) {
    calendarioMes = 0;
    calendarioAno++;
  }
  renderCalendario();
});