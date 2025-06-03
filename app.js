// ======================================================
// AstroLog - app.js (versão completa com calendário corrigido)
// ======================================================

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
// TRADUÇÕES
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
// INDEXEDDB
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
// EVENTOS DE INTERFACE
// =========================

// Alternar idioma
const langBtn = document.getElementById('toggleLanguage');
if (langBtn) {
  langBtn.addEventListener('click', () => {
    currentLang = currentLang === 'pt' ? 'en' : 'pt';
    langBtn.textContent = currentLang === 'pt' ? 'EN' : 'PT';
    translateUI();
    renderObservacoes();
  });
}

// Filtro por tipo (dropdown)
const filterBtn = document.getElementById('filterByType');
if (filterBtn) {
  filterBtn.addEventListener('click', async () => {
    if (!observacoes || observacoes.length === 0) {
      observacoes = await getAllObservacoes();
    }
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

    // Adiciona opção “Todos”
    const allItem = document.createElement('div');
    allItem.textContent = i18n[currentLang].all;
    allItem.addEventListener('click', () => {
      currentFilter = 'todos';
      searchQuery = '';
      renderObservacoes();
      menu.remove();
    });
    menu.appendChild(allItem);

    const rect = filterBtn.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.style.zIndex = 1000;
    document.body.appendChild(menu);
  });
}

// Campo de pesquisa
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase();
    renderObservacoes();
  });
}

// Filtros rápidos (recentes, favoritos, todos)
const filterButtons = document.querySelectorAll('[data-filter]');
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderObservacoes();
  });
});

// Exportar JSON
const exportBtn = document.getElementById('exportJson');
if (exportBtn) {
  exportBtn.addEventListener('click', async () => {
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
}

// Importar JSON
const importInput = document.getElementById('importJson');
if (importInput) {
  importInput.addEventListener('change', async (event) => {
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
          if (obs.id && obs.nome) store.put(obs);
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
}

// =========================
// EVENTOS E INICIALIZAÇÃO
// =========================
document.addEventListener('DOMContentLoaded', async () => {
  observacoes = await getAllObservacoes();
  renderObservacoes();
  translateUI();
  updateRedFilterClass();

  // ======== MODAL DE ADICIONAR OBSERVAÇÃO ========
  const addBtn = document.getElementById('addObservationBtn');
  const modal = document.getElementById('addObservationModal');
  const closeModalBtn = document.getElementById('closeAddModal');
  const cancelBtn = document.getElementById('cancelAdd');
  const form = document.getElementById('addObservationForm');
  const successMsg = document.getElementById('addSuccessMsg');

  // Função para abrir o modal
  function openModal() {
    if (modal) {
      modal.style.display = 'flex'; // exibe como flex para centrar
    }
  }

  // Função para fechar o modal e resetar o form
  function closeAddForm() {
    if (form) form.reset();
    if (modal) modal.style.display = 'none';
    if (successMsg) successMsg.style.display = 'none';
  }

  // Abre o modal ao clicar no botão "+"
  if (addBtn) {
    addBtn.addEventListener('click', openModal);
  }

  // Fecha o modal ao clicar no "×"
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeAddForm);
  }

  // Fecha o modal ao clicar em "Cancelar"
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeAddForm);
  }

  // Fecha o modal se clicar fora da .modal-content
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAddForm();
      }
    });
  }

  // Submissão do formulário de adicionar observação
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const formData = new FormData(form);
      const obs = Object.fromEntries(formData.entries());
      obs.favorito = !!formData.get('favorito');
      obs.id = Date.now();

      const file = formData.get('imagem');
      const saveObs = async () => {
        await saveObservacao(obs);
        observacoes = await getAllObservacoes();
        renderObservacoes();
        atualizarBackupJSON();
        if (successMsg) successMsg.style.display = 'block';
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
    });
  }
  // ======== FIM DO MODAL DE ADICIONAR OBSERVAÇÃO ========

  // Botão de download de backup
  const backupBtn = document.getElementById('downloadBackup');
  if (backupBtn) {
    backupBtn.addEventListener('click', () => {
      const backupStr = localStorage.getItem('backupAstroLog');
      if (!backupStr) {
        alert('Não há backup disponível para download.');
        return;
      }
      const blob = new Blob([backupStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'astro-observacoes-backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // ========== INÍCIO: LÓGICA DE NAVEGAÇÃO ENTRE TABS ==========
  const navButtons = document.querySelectorAll('nav button[data-tab]');
  const tabSections = document.querySelectorAll('.tab');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const alvo = btn.dataset.tab;

      // Remover a classe 'active' de TODOS os botões
      navButtons.forEach(b => b.classList.remove('active'));
      // Adicionar 'active' apenas ao botão clicado
      btn.classList.add('active');

      // Remover 'active' de todas as seções
      tabSections.forEach(sec => sec.classList.remove('active'));
      // Adicionar 'active' apenas à seção cujo id seja `tab-${alvo}`
      const sectionAlvo = document.getElementById(`tab-${alvo}`);
      if (sectionAlvo) {
        sectionAlvo.classList.add('active');
      }

      // Se a aba selecionada for 'configuracoes', mostra o footer; senão, esconde
      const footer = document.querySelector('footer');
      if (footer) {
        footer.style.display = (alvo === 'configuracoes') ? 'flex' : 'none';
      }

      // Se a aba selecionada for 'calendario', renderiza o calendário
      if (alvo === 'calendario') {
        renderCalendario();
      }
    });
  });
  // =========== FIM: LÓGICA DE NAVEGAÇÃO ENTRE TABS ===========

});

// =========================
// FUNÇÃO PARA FECHAR O MODAL (fora do DOMContentLoaded)
function closeAddForm() {
  const form = document.getElementById('addObservationForm');
  const modal = document.getElementById('addObservationModal');
  const successMsg = document.getElementById('addSuccessMsg');
  if (form) form.reset();
  if (modal) modal.style.display = 'none';
  if (successMsg) successMsg.style.display = 'none';
}

// =========================
// FUNÇÃO PARA ATUALIZAR BACKUP NO localStorage
function atualizarBackupJSON() {
  const json = JSON.stringify(observacoes, null, 2);
  localStorage.setItem('backupAstroLog', json);
}

// =========================
// FUNÇÃO DE TRADUÇÃO DE UI
// =========================
function translateUI() {
  const t = i18n[currentLang];

  const searchInputElem = document.getElementById('searchInput');
  if (searchInputElem) searchInputElem.placeholder = t.searchPlaceholder;

  const btnTodos = document.querySelector('[data-filter="todos"]');
  if (btnTodos) btnTodos.textContent = t.all;
  const btnRecentes = document.querySelector('[data-filter="recentes"]');
  if (btnRecentes) btnRecentes.textContent = t.recent;
  const btnFavoritos = document.querySelector('[data-filter="favoritos"]');
  if (btnFavoritos) btnFavoritos.textContent = t.favorites; 

  const filterBtnElem = document.getElementById('filterByType');
  if (filterBtnElem) filterBtnElem.textContent = t.filterType;

  const cancelBtn = document.querySelector('button[type="reset"]');
  if (cancelBtn) cancelBtn.textContent = t.cancel;
  const saveBtn = document.querySelector('button[type="submit"]');
  if (saveBtn) saveBtn.textContent = t.save;

  const redFilterLabel = document.querySelector('footer label:first-child');
  if (redFilterLabel) redFilterLabel.textContent = t.redFilter;
  const intensityLabel = document.querySelector('footer label:last-of-type');
  if (intensityLabel) intensityLabel.textContent = t.intensity;

  // Traduzir nomes das tabs
  document.querySelectorAll("nav button[data-tab]").forEach(btn => {
    const key = btn.getAttribute("data-tab");
    if (t[key]) {
      btn.textContent = t[key];
    }
  });

  // Traduzir botões "Ver" das observações
  document.querySelectorAll(".observation-card button.view-btn").forEach(btn => {
    btn.textContent = `🔍 ${t.ver}`;
  });

  // Atualizar título do calendário se estiver visível
  const calendarioVisivel = document.getElementById('tab-calendario')?.classList.contains('active');
  if (calendarioVisivel) {
    const tituloCalendario = document.getElementById('calendarMonthYear');
    if (tituloCalendario) tituloCalendario.textContent = t.calendarTitle;
    renderCalendario();
  }
}

// =========================
// FILTRO VERMELHO
// =========================
const redToggle = document.getElementById('redFilterToggle');
const redSlider = document.getElementById('redFilterIntensity');
const redButton = document.getElementById('toggleRedFilter');

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

redButton?.addEventListener('click', () => {
  if (!redToggle) return;
  redToggle.checked = !redToggle.checked;
  applyRedFilter(redToggle.checked);
});

redToggle?.addEventListener('change', () => {
  applyRedFilter(redToggle.checked);
});

redSlider?.addEventListener('input', () => {
  if (redToggle.checked) applyRedFilter(true);
});

function updateRedFilterClass() {
  document.body.classList.remove('intensity-20', 'intensity-40', 'intensity-60', 'intensity-80', 'intensity-100');
  if (redToggle?.checked) {
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

redToggle?.addEventListener('change', updateRedFilterClass);
redSlider?.addEventListener('input', updateRedFilterClass);

// =========================
// RENDERIZAR CALENDÁRIO
// =========================
function renderCalendario() {
  const title = document.getElementById('calendarMonthYear');
  const displaySpan = document.getElementById('calendarMonthYearDisplay');
  const container = document.getElementById('calendarContainer');
  const results = document.getElementById('calendarResults');
  if (!title || !container || !results) return;

  container.innerHTML = '';
  results.innerHTML = '';

  // Calcula o primeiro dia e quantos dias tem o mês
  const firstDay = new Date(calendarioAno, calendarioMes, 1).getDay();
  const daysInMonth = new Date(calendarioAno, calendarioMes + 1, 0).getDate();

  // Atualiza o título principal <h2>
  const nomeMes = new Date(calendarioAno, calendarioMes).toLocaleString('pt-PT', { month: 'long' });
  const textoMesAno = `${capitalize(nomeMes)} ${calendarioAno}`;
  title.textContent = textoMesAno;

  // (Opcional) se quiser mostrar também dentro do header (entre as setas):
  if (displaySpan) {
    displaySpan.textContent = textoMesAno;
  }

  // Conjunto de datas (YYYY-MM-DD) que têm observações
  const diasComObservacoes = new Set(
    observacoes.map(o => normalizarDataLocal(o.data))
  );

  // Preenche os "espaços vazios" até a primeira coluna do mês
  for (let i = 0; i < firstDay; i++) {
    const vazio = document.createElement('div');
    vazio.className = 'calendar-day';
    vazio.textContent = '';
    container.appendChild(vazio);
  }

  // Cria cada célula do dia (1..daysInMonth)
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calendarioAno, calendarioMes, d);
    const dateStr = normalizarDataLocal(date); // "YYYY-MM-DD"

    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = d;

    if (diasComObservacoes.has(dateStr)) {
      // Se houver observação, destacamos com classe .highlight
      dayDiv.classList.add('highlight');
      dayDiv.addEventListener('click', () => mostrarObservacoesDoDia(dateStr));
    }

    container.appendChild(dayDiv);
  }
}

// Ao clicar num dia que tenha observações, listamos abaixo
function mostrarObservacoesDoDia(dataISO) {
  const lista = observacoes.filter(o => o.data.startsWith(dataISO));
  const container = document.getElementById('calendarResults');
  if (!container) return;

  if (!lista.length) {
    container.innerHTML = `<p>Sem observações para ${dataISO}</p>`;
    return;
  }

  container.innerHTML = `
    <h3>Observações em ${dataISO}:</h3>
    <ul>
      ${lista.map(o => `<li>${getIcon(o.tipo)} ${o.nome}</li>`).join('')}
    </ul>`;
}

function getIcon(tipo) {
  const icons = {
    'Estrela': '⭐',
    'Galáxia': '🌌',
    'Aglomerado': '✨',
    'Nebulosa': '☁️',
    'Sistema Solar': '🪐',
    'Outro': '🔭'
  };
  return icons[tipo] || '❔';
}

// =========================
// RENDERIZAR OBSERVAÇÕES (aba “Objectos”)
// =========================
function renderObservacoes() {
  if (!obsList) return;
  obsList.innerHTML = '';
  let list = [...observacoes];

  if (currentFilter === 'favoritos') {
    list = list.filter(o => o.favorito);
  } else if (currentFilter === 'recentes') {
    list = list.sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  if (searchQuery) {
    list = list.filter(o =>
      o.nome.toLowerCase().includes(searchQuery) ||
      o.tipo.toLowerCase().includes(searchQuery) ||
      (o.local || '').toLowerCase().includes(searchQuery)
    );
  }

  list.forEach(obs => {
    const card = document.createElement('div');
    card.className = 'observation-card';

    const icon = getIcon(obs.tipo);
    const dataFormatada = new Date(obs.data).toLocaleDateString();

    const imgHTML = obs.imagem
      ? `<img src="${obs.imagem}" style="max-width: 100%; max-height: 100px; cursor: pointer;" onclick="window.open('${obs.imagem}', '_blank')" />`
      : '';

    const viewBtn = `<button class="view-btn" onclick="viewObservation(${obs.id})">🔍 ${i18n[currentLang].ver}</button>`;
    const editBtn = `<button onclick="editObservation(${obs.id})">✏️ ${i18n[currentLang].edit}</button>`;
    const deleteBtn = `<button onclick="deleteObservacao(${obs.id})">🗑️ ${i18n[currentLang].delete}</button>`;

    card.innerHTML = `
      <div class="title">${icon} ${obs.nome} ${obs.favorito ? '⭐' : ''}</div>
      <div><small>${obs.tipo}</small></div>
      <div><small>${dataFormatada} - ${obs.local || ''}</small></div>
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
// VISUALIZAR OBSERVAÇÃO (modal)
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
      <p><strong>Descrição:</strong> ${obs.descricao || ''}</p>
      ${obs.imagem ? `<img src="${obs.imagem}" style="max-width:100%; max-height:200px; margin-top:1rem; cursor:pointer" onclick="openImageModal('${obs.imagem}')" />` : ''}
      <button onclick="closeModal()">${i18n[currentLang].close}</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Fecha ao clicar fora do conteúdo
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModalById('view-modal');
    }
  });
};

// =========================
// VISUALIZAR IMAGEM EM MODAL
// =========================
window.openImageModal = function(imgSrc) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <img src="${imgSrc}" style="max-width:100%; max-height:80vh; display:block; margin: 0 auto 1rem;" />
      <div style="text-align:center">
        <button onclick="closeModalById('image-modal')">${i18n[currentLang].close}</button>
        <button onclick="closeModalById('image-modal'); closeModalById('view-modal')">${i18n[currentLang].close} tudo</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Fecha ao clicar fora do conteúdo
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModalById('image-modal');
    }
  });
};

// =========================
// FECHAR MODAL POR ID
// =========================
window.closeModalById = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
};

// =========================
// FECHAR MODAL QUALQUER
// =========================
window.closeModal = function() {
  document.querySelectorAll('.modal').forEach(m => m.remove());
};

// =========================
// EDITAR OBSERVAÇÃO (modal)
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
        <label>
          Nome:
          <input name="nome" value="${obs.nome}" required />
        </label>
        <label>
          Tipo:
          <select name="tipo" required>
            <option${obs.tipo === 'Estrela' ? ' selected' : ''}>Estrela</option>
            <option${obs.tipo === 'Galáxia' ? ' selected' : ''}>Galáxia</option>
            <option${obs.tipo === 'Aglomerado' ? ' selected' : ''}>Aglomerado</option>
            <option${obs.tipo === 'Nebulosa' ? ' selected' : ''}>Nebulosa</option>
            <option${obs.tipo === 'Sistema Solar' ? ' selected' : ''}>Sistema Solar</option>
            <option${obs.tipo === 'Outro' ? ' selected' : ''}>Outro</option>
          </select>
        </label>
        <label>
          Data:
          <input name="data" type="date" value="${obs.data}" required />
        </label>
        <label>
          Local:
          <input name="local" value="${obs.local || ''}" required />
        </label>
        <label>
          RA:
          <input name="ra" value="${obs.ra || ''}" placeholder="RA" />
        </label>
        <label>
          DEC:
          <input name="dec" value="${obs.dec || ''}" placeholder="DEC" />
        </label>
        <label>
          Distância:
          <input name="distancia" value="${obs.distancia || ''}" placeholder="Distância" />
          <select name="unidadeDistancia">
            <option${obs.unidadeDistancia === 'ly' ? ' selected' : ''}>ly</option>
            <option${obs.unidadeDistancia === 'AU' ? ' selected' : ''}>AU</option>
          </select>
        </label>
        <label>
          Magnitude:
          <input name="magnitude" type="number" value="${obs.magnitude || ''}" placeholder="Magnitude" />
        </label>
        <label>
          Descrição:
          <textarea name="descricao">${obs.descricao || ''}</textarea>
        </label>
        <label>
          <input type="checkbox" name="favorito" ${obs.favorito ? 'checked' : ''}/> Favorito
        </label>
        <label>
          Imagem (opcional):
          <input type="file" name="imagem" accept="image/*" />
        </label>
        <div style="margin-top: 1rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button type="submit">${i18n[currentLang].save}</button>
          <button type="button" onclick="closeModal()">${i18n[currentLang].cancel}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Fecha ao clicar fora do conteúdo
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Submissão do formulário de edição
  const modalForm = modal.querySelector('#modalForm');
  modalForm.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(modalForm);
    const newObs = Object.fromEntries(data.entries());
    newObs.id = id;
    newObs.favorito = !!data.get('favorito');

    const file = data.get('imagem');
    const saveEdit = async () => {
      const original = observacoes.find(o => o.id === id);
      if (original?.imagem && !newObs.imagem) {
        newObs.imagem = original.imagem;
      }
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
// EXCLUIR OBSERVAÇÃO
// =========================
window.deleteObservacao = async function(id) {
  if (confirm('Eliminar esta observação?')) {
    await deleteObservacao(id);
    observacoes = await getAllObservacoes();
    renderObservacoes();
  }
};

// =========================
// UTILITÁRIOS
// =========================
function normalizarDataLocal(data) {
  // Retorna string “YYYY-MM-DD”
  return new Date(data).toLocaleDateString('sv-SE');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
