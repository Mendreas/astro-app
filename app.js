// ======================================================
// AstroLog - app.js (complete, cleaned up)
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

// Vamos pegar o container onde as "observation-card" serão inseridas:
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
    ver: "Ver"
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
    ver: "View"
  }
};

// =========================
// INDEXEDDB (CRUD)
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
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
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
// RENDER DE OBSERVAÇÕES
// =========================
function renderObservacoes() {
  if (!obsList) return;
  obsList.innerHTML = '';

  let list = [...observacoes];

  if (currentFilter === 'favoritos') {
    list = list.filter(o => o.favorito);
  } else if (currentFilter === 'recentes') {
    // Ordenar por data mais recente primeiro
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
    const dataBr = new Date(obs.data).toLocaleDateString();

    // Montando o HTML interno de cada cartão
    const imgHTML = obs.imagem
      ? `<img src="${obs.imagem}"
              style="max-width:100%; max-height:100px; cursor:pointer;"
              onclick="window.open('${obs.imagem}', '_blank')" />`
      : '';

    const viewBtn = `<button class="view-btn" onclick="viewObservation(${obs.id})">
                       🔍 ${i18n[currentLang].ver}
                     </button>`;
    const editBtn = `<button onclick="editObservation(${obs.id})">
                       ✏️ ${i18n[currentLang].edit}
                     </button>`;
    const deleteBtn = `<button onclick="deleteObservation(${obs.id})">
                         🗑️ ${i18n[currentLang].delete}
                       </button>`;

    card.innerHTML = `
      <div class="title">${icon} ${obs.nome} ${obs.favorito ? '⭐' : ''}</div>
      <div><small>${obs.tipo}</small></div>
      <div><small>${dataBr} - ${obs.local || ''}</small></div>
      ${imgHTML}
      <div style="margin-top:0.5rem;">
        ${viewBtn}
        ${editBtn}
        ${deleteBtn}
      </div>
    `;

    obsList.appendChild(card);
  });
}

// =========================
// ÍCONES POR TIPO
// =========================
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
// FUNÇÃO PARA NORMALIZAR DATA COMO "YYYY-MM-DD"
// =========================
function normalizarDataLocal(data) {
  // Podemos usar toLocaleDateString('sv-SE') para obter formato YYYY-MM-DD
  return new Date(data).toLocaleDateString('sv-SE');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// =========================
// RENDER DO CALENDÁRIO
// =========================
function renderCalendario() {
  const container = document.getElementById('calendarContainer');
  const title = document.getElementById('calendarMonthYear');
  if (!container || !title) return;

  container.innerHTML = '';

  // Primeiro dia da semana do mês atual
  const firstDayOfWeek = new Date(calendarioAno, calendarioMes, 1).getDay();
  const daysInMonth = new Date(calendarioAno, calendarioMes + 1, 0).getDate();

  // Atualizar título do calendário (ex.: "Maio 2025" ou "May 2025")
  const nomeMes = new Date(calendarioAno, calendarioMes).toLocaleString('pt-PT', { month: 'long' });
  title.textContent = `${capitalize(nomeMes)} ${calendarioAno}`;

  // Conjunto de datas que possuem observações
  const diasComObs = new Set(
    observacoes.map(o => normalizarDataLocal(o.data))
  );

  // Preencher células vazias até o primeiro dia
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyDiv = document.createElement('div');
    container.appendChild(emptyDiv);
  }

  // Agora preencher dias do mês
  for (let dia = 1; dia <= daysInMonth; dia++) {
    const dataObj = new Date(calendarioAno, calendarioMes, dia);
    const dataStr = normalizarDataLocal(dataObj);

    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = dia;

    if (diasComObs.has(dataStr)) {
      dayDiv.classList.add('highlight');
      dayDiv.addEventListener('click', () => mostrarObservacoesDoDia(dataStr));
    }

    container.appendChild(dayDiv);
  }
}

function mostrarObservacoesDoDia(dataISO) {
  const listaDia = observacoes.filter(o => o.data.startsWith(dataISO));
  const container = document.getElementById('calendarResults');
  if (!container) return;

  if (!listaDia.length) {
    container.innerHTML = `<p>Sem observações para ${dataISO}</p>`;
    return;
  }

  container.innerHTML = `<h3>Observações em ${dataISO}:</h3><ul>` +
    listaDia.map(o => `<li>${getIcon(o.tipo)} ${o.nome}</li>`).join('') +
    `</ul>`;
}

// =========================
// FUNÇÕES DE MODAL “VIEW OBSERVATION”
// =========================
window.viewObservation = function(id) {
  const obs = observacoes.find(o => o.id === id);
  if (!obs) return;

  // Criar modal para visualizar
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
      ${obs.imagem
        ? `<img src="${obs.imagem}"
               style="max-width:100%; max-height:200px; margin-top:1rem; cursor:pointer;"
               onclick="openImageModal('${obs.imagem}')" />`
        : ''}
      <button onclick="closeModal()">${i18n[currentLang].close}</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Fechar ao clicar fora do conteúdo
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModalById('view-modal');
    }
  });
};

window.openImageModal = function(imgSrc) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <img src="${imgSrc}"
           style="max-width:100%; max-height:80vh; display:block; margin: 0 auto 1rem;" />
      <div style="text-align:center;">
        <button onclick="closeModalById('image-modal')">
          ${i18n[currentLang].close}
        </button>
        <button onclick="closeModalById('image-modal'); closeModalById('view-modal')">
          ${i18n[currentLang].close} tudo
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Fechar ao clicar fora do conteúdo
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModalById('image-modal');
    }
  });
};

window.closeModalById = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
};

window.closeModal = function() {
  document.querySelectorAll('.modal').forEach(m => m.remove());
};

// =========================
// EDITAR OBSERVAÇÃO
// =========================
window.editObservation = function(id) {
  const obs = observacoes.find(o => o.id === id);
  if (!obs) return;
  editId = id;

  // Montar o modal de edição
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
          <input name="local" value="${obs.local || ''}" />
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
          <input type="checkbox" name="favorito" ${obs.favorito ? 'checked' : ''} />
          Favorito
        </label>
        <label>Imagem (opcional):
          <input type="file" name="imagem" accept="image/*" />
        </label>
        <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.5rem;">
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

  // Quando o formulário de edição for enviado...
  const modalForm = modal.querySelector('#modalForm');
  modalForm.addEventListener('submit', async evt => {
    evt.preventDefault();
    const data = new FormData(modalForm);
    const newObs = Object.fromEntries(data.entries());
    newObs.id = id;
    newObs.favorito = !!data.get('favorito');

    const arquivoImagem = data.get('imagem');
    async function salvarEdicao() {
      const orig = observacoes.find(o => o.id === id);
      if (orig?.imagem && !newObs.imagem) {
        newObs.imagem = orig.imagem;
      }
      await saveObservacao(newObs);
      observacoes = await getAllObservacoes();
      renderObservacoes();
      closeModal();
    }

    if (arquivoImagem && arquivoImagem.size > 0) {
      const readerImg = new FileReader();
      readerImg.onload = async () => {
        newObs.imagem = readerImg.result;
        await salvarEdicao();
      };
      readerImg.onerror = async () => {
        alert("Erro ao carregar imagem. A observação será guardada sem imagem nova.");
        await salvarEdicao();
      };
      readerImg.readAsDataURL(arquivoImagem);
    } else {
      await salvarEdicao();
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
// FUNÇÕES AUXILIARES
// =========================
function translateUI() {
  const t = i18n[currentLang];

  // Atualizar placeholder do input de busca
  const searchInputElem = document.getElementById('searchInput');
  if (searchInputElem) searchInputElem.placeholder = t.searchPlaceholder;

  // Atualizar texto dos botões de filtro direto
  const btnTodos = document.querySelector('[data-filter="todos"]');
  if (btnTodos) btnTodos.textContent = t.all;
  const btnRecentes = document.querySelector('[data-filter="recentes"]');
  if (btnRecentes) btnRecentes.textContent = t.recent;
  const btnFavoritos = document.querySelector('[data-filter="favoritos"]');
  if (btnFavoritos) btnFavoritos.textContent = t.favorites;

  // Botão “Filtrar por tipo”
  const filterBtnElem = document.getElementById('filterByType');
  if (filterBtnElem) filterBtnElem.textContent = t.filterType;

  // Botões do formulário modal (reset/save)
  const cancelBtnInside = document.querySelector('button[type="button"]#cancelAdd');
  if (cancelBtnInside) cancelBtnInside.textContent = t.cancel;
  const saveBtnInside = document.querySelector('button[type="submit"]');
  if (saveBtnInside) saveBtnInside.textContent = t.save;

  // Footer – labels
  const redFilterLabel = document.querySelector('footer label:nth-of-type(1)');
  if (redFilterLabel) redFilterLabel.textContent = t.redFilter;
  const intensityLabel = document.querySelector('footer label:nth-of-type(2)');
  if (intensityLabel) intensityLabel.textContent = t.intensity;

  // Traduzir nomes das tabs
  document.querySelectorAll("nav button[data-tab]").forEach(btn => {
    const chave = btn.getAttribute("data-tab");
    if (t[chave]) {
      btn.textContent = t[chave];
    }
  });

  // Traduzir botões "Ver" dentro de cada cartão (re‐renderiza se necessário)
  document.querySelectorAll(".observation-card button.view-btn").forEach(btn => {
    btn.textContent = `🔍 ${t.ver}`;
  });

  // Se estivermos em "Calendário", atualiza o título
  const calendarioVisivel = document.getElementById('tab-calendario')?.classList.contains('active');
  if (calendarioVisivel) {
    const titolo = document.querySelector('#tab-calendario h2');
    if (titolo) titolo.textContent = t.calendarTitle;
    renderCalendario();
  }
}

// =========================
// FILTRO VERMELHO (MODO NOTURNO)
// =========================
const redToggle = document.getElementById('redFilterToggle');
const redSlider = document.getElementById('redFilterIntensity');
const redButton = document.getElementById('toggleRedFilter');

function applyRedFilter(active) {
  if (active) {
    document.body.classList.add('red-filter');
    const intensidade = parseInt(redSlider.value);
    document.body.style.backgroundColor = `rgba(255, 0, 0, ${intensidade / 100})`;
  } else {
    document.body.classList.remove('red-filter');
    document.body.style.backgroundColor = '';
  }
}

if (redButton) {
  redButton.addEventListener('click', () => {
    if (!redToggle) return;
    redToggle.checked = !redToggle.checked;
    applyRedFilter(redToggle.checked);
    updateRedFilterClass();
  });
}
if (redToggle) {
  redToggle.addEventListener('change', () => {
    applyRedFilter(redToggle.checked);
    updateRedFilterClass();
  });
}
if (redSlider) {
  redSlider.addEventListener('input', () => {
    if (redToggle.checked) {
      applyRedFilter(true);
      updateRedFilterClass();
    }
  });
}

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

// =========================
// BACKUP NO LOCALSTORAGE
// =========================
function atualizarBackupJSON() {
  const json = JSON.stringify(observacoes, null, 2);
  localStorage.setItem('backupAstroLog', json);
}

// =========================
// TAB NAVIGATION + INICIALIZAÇÃO GLOBAL
// =========================
document.addEventListener('DOMContentLoaded', async () => {
  // 1) Carregar todas as observações do IndexedDB
  observacoes = await getAllObservacoes();
  renderObservacoes();
  translateUI();
  updateRedFilterClass();

  // 2) LÓGICA DE NAVEGAÇÃO ENTRE TABS
  const navButtons = document.querySelectorAll('nav button[data-tab]');
  const tabSections = document.querySelectorAll('.tab');
  const footerElem = document.querySelector('footer');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const alvo = btn.dataset.tab; // ex.: "recursos", "links", "calendario"...

      // Remover a classe 'active' de todos os botões
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Remover 'active' de todas as seções
      tabSections.forEach(sec => sec.classList.remove('active'));

      // Ativar a seção alvo
      const sectionAlvo = document.getElementById(`tab-${alvo}`);
      if (sectionAlvo) {
        sectionAlvo.classList.add('active');
      }

      // Mostrar footer somente se target for 'configuracoes'
      if (footerElem) {
        footerElem.style.display = (alvo === 'configuracoes') ? 'flex' : 'none';
      }

      // Se for "calendario", renderiza calendário
      if (alvo === 'calendario') {
        renderCalendario();
      }

      // Se for "objectos", re‐renderiza as observações
      if (alvo === 'objetos') {
        renderObservacoes();
      }
    });
  });

  // 3) BOTÕES DE FILTROS RÁPIDOS (todos / recentes / favoritos)
  const filterButtons = document.querySelectorAll('[data-filter]');
  filterButtons.forEach(b => {
    b.addEventListener('click', () => {
      currentFilter = b.dataset.filter;
      filterButtons.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderObservacoes();
    });
  });

  // 4) BOTÃO "Filtrar por tipo" (dropdown custom)
  const filterTypeBtn = document.getElementById('filterByType');
  if (filterTypeBtn) {
    filterTypeBtn.addEventListener('click', async () => {
      if (!observacoes.length) {
        observacoes = await getAllObservacoes();
      }
      if (!observacoes.length) {
        alert("Sem observações para filtrar.");
        return;
      }
      document.querySelectorAll('.dropdown-menu').forEach(m => m.remove());
      const tiposUnicos = [...new Set(observacoes.map(o => o.tipo).filter(Boolean))];
      const menu = document.createElement('div');
      menu.className = 'dropdown-menu';

      tiposUnicos.forEach(tipo => {
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

      // Opção “Todos”
      const allItem = document.createElement('div');
      allItem.textContent = i18n[currentLang].all;
      allItem.addEventListener('click', () => {
        currentFilter = 'todos';
        searchQuery = '';
        renderObservacoes();
        menu.remove();
      });
      menu.appendChild(allItem);

      // Posicionar dropdown abaixo do botão
      const rect = filterTypeBtn.getBoundingClientRect();
      menu.style.position = 'absolute';
      menu.style.top = `${rect.bottom + window.scrollY}px`;
      menu.style.left = `${rect.left + window.scrollX}px`;
      menu.style.zIndex = 1000;
      document.body.appendChild(menu);
    });
  }

  // 5) CAMPO DE PESQUISA
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.toLowerCase();
      renderObservacoes();
    });
  }

  // 6) BOTÃO + PARA ABRIR O MODAL DE “ADICIONAR”
  const addBtn = document.getElementById('addObservationBtn');
  const modal = document.getElementById('addObservationModal');
  const closeModalBtn = document.getElementById('closeAddModal');
  const cancelBtn = document.getElementById('cancelAdd');
  const form = document.getElementById('addObservationForm');
  const successMsg = document.getElementById('addSuccessMsg');

  function openModal() {
    if (modal) {
      // adicionamos a classe .open (código CSS já define .modal.open { display:flex; })
      modal.classList.add('open');
    }
  }
  function closeAddForm() {
    if (form) form.reset();
    if (modal) modal.classList.remove('open');
    if (successMsg) successMsg.style.display = 'none';
  }

  if (addBtn) {
    addBtn.addEventListener('click', openModal);
  }
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeAddForm);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeAddForm);
  }
  if (modal) {
    // fechar se clicar fora do conteúdo
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeAddForm();
      }
    });
  }

  // 7) SUBMISSÃO DO FORMULÁRIO DE ADICIONAR
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const novaObs = Object.fromEntries(formData.entries());
      novaObs.favorito = !!formData.get('favorito');
      novaObs.id = Date.now();

      const arquivo = formData.get('imagem');
      async function salvarObservacaoComImagem() {
        await saveObservacao(novaObs);
        observacoes = await getAllObservacoes();
        renderObservacoes();
        atualizarBackupJSON();
        if (successMsg) successMsg.style.display = 'block';
        setTimeout(closeAddForm, 1500);
      }

      if (arquivo && arquivo.size > 0) {
        const readerImg = new FileReader();
        readerImg.onload = async () => {
          novaObs.imagem = readerImg.result;
          await salvarObservacaoComImagem();
        };
        readerImg.onerror = async () => {
          alert("Erro ao carregar imagem.");
          await salvarObservacaoComImagem();
        };
        readerImg.readAsDataURL(arquivo);
      } else {
        await salvarObservacaoComImagem();
      }
    });
  }

  // 8) BOTÃO DE DOWNLOAD DE BACKUP
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

  // 9) EVENTOS DO CALENDÁRIO (botões prev/next)
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      calendarioMes--;
      if (calendarioMes < 0) {
        calendarioMes = 11;
        calendarioAno--;
      }
      renderCalendario();
    });
  }
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      calendarioMes++;
      if (calendarioMes > 11) {
        calendarioMes = 0;
        calendarioAno++;
      }
      renderCalendario();
    });
  }
}); // fim do DOMContentLoaded

