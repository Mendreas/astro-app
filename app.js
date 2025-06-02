// ======================================================
// app.js (versão revisada)
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

// Atenção: obsList será definido dentro de DOMContentLoaded
let obsList = null;

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
// FUNÇÕES AUXILIARES
// =========================
function normalizarDataLocal(data) {
  // Retorna “YYYY-MM-DD” (formato usado no calendário)
  return new Date(data).toLocaleDateString('sv-SE');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
// RENDERIZAR OBSERVAÇÕES
// =========================
function renderObservacoes() {
  if (!obsList) return; // Se obsList for null, interrompe
  obsList.innerHTML = '';

  let list = [...observacoes];

  // Aplica filtro “Favoritos”
  if (currentFilter === 'favoritos') {
    list = list.filter(o => o.favorito);
  }
  // Aplica filtro “Recentes” (ordena por data decrescente)
  else if (currentFilter === 'recentes') {
    list = list.sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  // Aplica pesquisa de texto
  if (searchQuery) {
    list = list.filter(o =>
      o.nome.toLowerCase().includes(searchQuery) ||
      o.tipo.toLowerCase().includes(searchQuery) ||
      o.local.toLowerCase().includes(searchQuery)
    );
  }

  // Renderiza cada observação como “card”
  list.forEach(obs => {
    const card = document.createElement('div');
    card.className = 'observation-card';

    const icon = getIcon(obs.tipo);
    const dataFormatada = new Date(obs.data).toLocaleDateString();

    // Se houver imagem, cria <img> clicável
    const imgHTML = obs.imagem
      ? `<img 
           src="${obs.imagem}"
           style="max-width: 100%; max-height: 100px; cursor: pointer;"
           onclick="window.open('${obs.imagem}', '_blank')" />`
      : '';

    const viewBtn   = `<button class="view-btn" onclick="viewObservation(${obs.id})">🔍 ${i18n[currentLang].ver}</button>`;
    const editBtn   = `<button onclick="editObservation(${obs.id})">✏️ ${i18n[currentLang].edit}</button>`;
    const deleteBtn = `<button onclick="deleteObservacao(${obs.id})">🗑️ ${i18n[currentLang].delete}</button>`;

    card.innerHTML = `
      <div class="title">${icon} ${obs.nome} ${obs.favorito ? '⭐' : ''}</div>
      <div><small>${obs.tipo}</small></div>
      <div><small>${dataFormatada} - ${obs.local}</small></div>
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
// MODAL: VISUALIZAR OBSERVAÇÃO
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
      <p><strong>Local:</strong> ${obs.local}</p>
      <p><strong>RA:</strong> ${obs.ra || ''}</p>
      <p><strong>DEC:</strong> ${obs.dec || ''}</p>
      <p><strong>Distância:</strong> ${obs.distancia || ''} ${obs.unidadeDistancia || ''}</p>
      <p><strong>Magnitude:</strong> ${obs.magnitude || ''}</p>
      <p><strong>Descrição:</strong> ${obs.descricao || ''}</p>
      ${obs.imagem
        ? `<img 
             src="${obs.imagem}" 
             style="max-width:100%; max-height:200px; margin-top:1rem; cursor:pointer"
             onclick="openImageModal('${obs.imagem}')" />`
        : ''}
      <button onclick="closeModal()">${i18n[currentLang].close}</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Fecha se clicar fora do conteúdo
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModalById('view-modal');
    }
  });
};

// =========================
// MODAL: VISUALIZAR IMAGEM EM TELA CHEIA
// =========================
window.openImageModal = function(imgSrc) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <img 
        src="${imgSrc}" 
        style="max-width:100%; max-height:80vh; display:block; margin: 0 auto 1rem;"
      />
      <div style="text-align:center">
        <button onclick="closeModalById('image-modal')">${i18n[currentLang].close}</button>
        <button onclick="closeModalById('image-modal'); closeModalById('view-modal')">
          ${i18n[currentLang].close} tudo
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

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
// FECHAR QUALQUER MODAL
// =========================
window.closeModal = function() {
  document.querySelectorAll('.modal').forEach(m => m.remove());
};

// =========================
// MODAL: EDITAR OBSERVAÇÃO
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
            <option${obs.tipo === 'Estrela'      ? ' selected' : ''}>Estrela</option>
            <option${obs.tipo === 'Galáxia'      ? ' selected' : ''}>Galáxia</option>
            <option${obs.tipo === 'Aglomerado'   ? ' selected' : ''}>Aglomerado</option>
            <option${obs.tipo === 'Nebulosa'     ? ' selected' : ''}>Nebulosa</option>
            <option${obs.tipo === 'Sistema Solar'? ' selected' : ''}>Sistema Solar</option>
            <option${obs.tipo === 'Outro'        ? ' selected' : ''}>Outro</option>
          </select>
        </label>
        <label>
          Data:
          <input name="data" type="date" value="${obs.data}" required />
        </label>
        <label>
          Local:
          <input name="local" value="${obs.local}" required />
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

  // Fecha se clicar fora do conteúdo
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Submissão do formulário de edição
  const modalForm = modal.querySelector('#modalForm');
  modalForm.addEventListener('submit', async e => {
    e.preventDefault();
    const dataForm = new FormData(modalForm);
    const newObs   = Object.fromEntries(dataForm.entries());
    newObs.id      = id;
    newObs.favorito= !!dataForm.get('favorito');

    const file = dataForm.get('imagem');
    async function saveEdit() {
      // Se não carregou nova imagem, preserva a antiga
      const original = observacoes.find(o => o.id === id);
      if (original?.imagem && !newObs.imagem) {
        newObs.imagem = original.imagem;
      }
      await saveObservacao(newObs);
      observacoes = await getAllObservacoes();
      renderObservacoes();
      closeModal();
    }

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
// RENDERIZAR CALENDÁRIO
// =========================
function renderCalendario() {
  const container = document.getElementById('calendarContainer');
  const title     = document.getElementById('calendarMonthYear');
  if (!container || !title) return;

  container.innerHTML = '';
  const firstDay    = new Date(calendarioAno, calendarioMes, 1).getDay();
  const daysInMonth = new Date(calendarioAno, calendarioMes + 1, 0).getDate();

  // Atualiza o título (“Maio 2025”, etc.)
  const nomeMes = new Date(calendarioAno, calendarioMes)
                    .toLocaleString('pt-PT', { month: 'long' });
  title.textContent = `${capitalize(nomeMes)} ${calendarioAno}`;

  // Coleta datas (YYYY-MM-DD) que contêm observações
  const diasComObservacoes = new Set(
    observacoes.map(o => normalizarDataLocal(o.data))
  );

  // Adiciona “células vazias” até o primeiro dia da semana
  for (let i = 0; i < firstDay; i++) {
    container.appendChild(document.createElement('div'));
  }

  // Preenche cada dia do mês
  for (let d = 1; d <= daysInMonth; d++) {
    const date    = new Date(calendarioAno, calendarioMes, d);
    const dateStr = normalizarDataLocal(date);

    const divDay = document.createElement('div');
    divDay.className = 'calendar-day';
    divDay.textContent = d;

    if (diasComObservacoes.has(dateStr)) {
      divDay.classList.add('highlight');
      divDay.addEventListener('click', () => mostrarObservacoesDoDia(dateStr));
    }

    container.appendChild(divDay);
  }
}

function mostrarObservacoesDoDia(dataISO) {
  const lista     = observacoes.filter(o => o.data.startsWith(dataISO));
  const container = document.getElementById('calendarResults');
  if (!container) return;

  if (!lista.length) {
    container.innerHTML = `<p>Sem observações para ${dataISO}</p>`;
    return;
  }

  container.innerHTML = `<h3>Observações em ${dataISO}:</h3><ul>` +
    lista.map(o => `<li>${getIcon(o.tipo)} ${o.nome}</li>`).join('') +
    `</ul>`;
}

// =========================
// TRADUZIR UI (botões, placeholders, etc.)
// =========================
function translateUI() {
  const t = i18n[currentLang];

  // Placeholder da pesquisa
  const searchInputElem = document.getElementById('searchInput');
  if (searchInputElem) searchInputElem.placeholder = t.searchPlaceholder;

  // Botões rápidos “Todos”, “Recentes”, “Favoritos”
  const btnTodos     = document.querySelector('[data-filter="todos"]');
  const btnRecentes  = document.querySelector('[data-filter="recentes"]');
  const btnFavoritos = document.querySelector('[data-filter="favoritos"]');
  if (btnTodos)     btnTodos.textContent    = t.all;
  if (btnRecentes)  btnRecentes.textContent = t.recent;
  if (btnFavoritos) btnFavoritos.textContent= t.favorites;

  // Botão “Filtrar por tipo”
  const filterBtnElem = document.getElementById('filterByType');
  if (filterBtnElem) filterBtnElem.textContent = t.filterType;

  // Botões “Cancelar” e “Guardar” nos formulários
  const cancelBtn = document.querySelector('button[type="reset"]');
  const saveBtn   = document.querySelector('button[type="submit"]');
  if (cancelBtn) cancelBtn.textContent = t.cancel;
  if (saveBtn)   saveBtn.textContent   = t.save;

  // Labels do footer (Filtro Vermelho / Intensidade)
  const redFilterLabel = document.querySelector('footer label:first-child');
  const intensityLabel = document.querySelector('footer label:last-of-type');
  if (redFilterLabel) redFilterLabel.textContent = t.redFilter;
  if (intensityLabel) intensityLabel.textContent = t.intensity;

  // Traduz nomes das abas (nav buttons data-tab="...")
  document.querySelectorAll('nav button[data-tab]').forEach(btn => {
    const key = btn.getAttribute('data-tab');
    if (t[key]) {
      btn.textContent = t[key];
    }
  });

  // Traduz botões “🔍 Ver” nos cartões de observação (caso já existam no DOM)
  document.querySelectorAll('.observation-card button.view-btn').forEach(btn => {
    btn.textContent = `🔍 ${t.ver}`;
  });

  // Se o calendário estiver visível, atualiza o título
  const calendarioVisivel = document.getElementById('tab-calendario')
                              ?.classList.contains('active');
  if (calendarioVisivel) {
    const tituloCalendario = document.querySelector('#tab-calendario h2');
    if (tituloCalendario) tituloCalendario.textContent = t.calendarTitle;
    renderCalendario();
  }
}

// =========================
// FILTRO VERMELHO / INTENSIDADE
// =========================
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

function updateRedFilterClass() {
  document.body.classList.remove(
    'intensity-20', 'intensity-40', 'intensity-60', 'intensity-80', 'intensity-100'
  );
  if (redToggle?.checked) {
    document.body.classList.add('red-filter');
    const val = parseInt(redSlider.value);
    if (val > 80)       document.body.classList.add('intensity-100');
    else if (val > 60)  document.body.classList.add('intensity-80');
    else if (val > 40)  document.body.classList.add('intensity-60');
    else if (val > 20)  document.body.classList.add('intensity-40');
    else                document.body.classList.add('intensity-20');
  } else {
    document.body.classList.remove('red-filter');
  }
}

// Guardamos referências aqui, mas só funcionam de verdade depois do DOMContentLoaded
let redToggle = null;
let redSlider = null;
let redButton = null;

// =========================
// INICIALIZAÇÃO: DOMContentLoaded
// =========================
document.addEventListener('DOMContentLoaded', async () => {
  // Agora que o DOM carregou, podemos obter o elemento observationsList
  obsList = document.getElementById('observationsList');

  // Carrega observações do IndexedDB e renderiza
  observacoes = await getAllObservacoes();
  renderObservacoes();

  // Traduzir a interface para o idioma atual (pt/e n)
  translateUI();

  // Configurar controle do Filtro Vermelho
  redToggle = document.getElementById('redFilterToggle');
  redSlider = document.getElementById('redFilterIntensity');
  redButton = document.getElementById('toggleRedFilter');

  redButton?.addEventListener('click', () => {
    if (!redToggle) return;
    redToggle.checked = !redToggle.checked;
    applyRedFilter(redToggle.checked);
    updateRedFilterClass();
  });
  redToggle?.addEventListener('change', () => {
    applyRedFilter(redToggle.checked);
    updateRedFilterClass();
  });
  redSlider?.addEventListener('input', () => {
    if (redToggle.checked) {
      applyRedFilter(true);
      updateRedFilterClass();
    }
  });

  // ========== MODAL DE ADICIONAR OBSERVAÇÃO ==========
  const addBtn       = document.getElementById('addObservationBtn');
  const modal        = document.getElementById('addObservationModal');
  const closeModalBtn= document.getElementById('closeAddModal');
  const cancelBtn    = document.getElementById('cancelAdd');
  const form         = document.getElementById('addObservationForm');
  const successMsg   = document.getElementById('addSuccessMsg');

  function openModal() {
    if (modal) modal.style.display = 'flex'; // exibe como flex (centra vertical/horizontal)
  }
  function closeAddForm() {
    if (form) form.reset();
    if (modal) modal.style.display = 'none';
    if (successMsg) successMsg.style.display = 'none';
  }

  // Abrir modal ao clicar em “＋”
  if (addBtn) {
    addBtn.addEventListener('click', openModal);
  }
  // Fechar ao clicar no “×”
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeAddForm);
  }
  // Fechar ao clicar em “Cancelar”
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeAddForm);
  }
  // Fechar se clicar fora da .modal-content
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeAddForm();
      }
    });
  }

  // Submissão do formulário de adicionar observação
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(form);
      const obs = Object.fromEntries(formData.entries());
      obs.favorito = !!formData.get('favorito');
      obs.id = Date.now();

      const file = formData.get('imagem');
      async function saveObs() {
        await saveObservacao(obs);
        observacoes = await getAllObservacoes();
        renderObservacoes();
        atualizarBackupJSON();
        if (successMsg) successMsg.style.display = 'block';
        setTimeout(closeAddForm, 1500);
      }

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

  // ========== FILTRO POR TIPO (dropdown) ==========
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

      // “Todos”
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

  // ========== CAMPO DE PESQUISA ==========
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.toLowerCase();
      renderObservacoes();
    });
  }

  // ========== FILTROS RÁPIDOS (Todos, Recentes, Favoritos) ==========
  const filterButtons = document.querySelectorAll('[data-filter]');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderObservacoes();
    });
  });

  // ========== EXPORTAR JSON ==========
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

  // ========== IMPORTAR JSON ==========
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

  // ========== NAVEGAÇÃO ENTRE ABAS ==========
  const navButtons  = document.querySelectorAll('nav button[data-tab]');
  const tabSections = document.querySelectorAll('.tab');
  const footer      = document.querySelector('footer');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const alvo = btn.dataset.tab; // “objectos”, “recursos”, “links”, “calendario”, “configuracoes”

      // 1) Atualiza classe “active” nos botões
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 2) Mostra apenas a <section> cujo id seja “tab-” + alvo
      tabSections.forEach(sec => sec.classList.remove('active'));
      const sectionAlvo = document.getElementById(`tab-${alvo}`);
      if (sectionAlvo) {
        sectionAlvo.classList.add('active');
      }

      // 3) Se for aba “configuracoes”, mostra o footer; senão, esconde
      if (footer) {
        footer.style.display = (alvo === 'configuracoes') ? 'flex' : 'none';
      }

      // 4) Se voltar para “objectos”, renderiza as observações de novo
      if (alvo === 'objectos') {
        renderObservacoes();
      }

      // 5) Se for aba “calendario”, renderiza o calendário
      if (alvo === 'calendario') {
        renderCalendario();
      }
    });
  });

  // ========== CONTROLES DO CALENDÁRIO ==========
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      calendarioMes--;
      if (calendarioMes < 0) {
        calendarioMes = 11;
        calendarioAno--;
      }
      renderCalendario();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      calendarioMes++;
      if (calendarioMes > 11) {
        calendarioMes = 0;
        calendarioAno++;
      }
      renderCalendario();
    });
  }
}); // fim DOMContentLoaded

// =========================
// ATUALIZA BACKUP NO localStorage
// =========================
function atualizarBackupJSON() {
  const json = JSON.stringify(observacoes, null, 2);
  localStorage.setItem('backupAstroLog', json);
}
