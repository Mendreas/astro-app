// Idiomas suportados
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
    close: "Fechar"
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
    close: "Close"
  }
};

let currentLang = 'pt';
let currentFilter = 'todos';
let searchQuery = '';
let editId = null;

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
}

const langBtn = document.getElementById('toggleLanguage');
langBtn.addEventListener('click', () => {
  currentLang = currentLang === 'pt' ? 'en' : 'pt';
  langBtn.textContent = currentLang === 'pt' ? 'EN' : 'PT';
  translateUI();
  renderObservacoes();
});

const tabs = document.querySelectorAll('nav button');
const tabSections = document.querySelectorAll('.tab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabSections.forEach(section => section.classList.remove('active'));
    document.getElementById(`tab-${target}`).classList.add('active');
    document.querySelector('footer').style.display = (target === 'configuracoes') ? 'flex' : 'none';
    if (target === 'adicionar') {
      editId = null;
      document.getElementById('observationForm').reset();
    }
  });
});

const redToggle = document.getElementById('redFilterToggle');
const redSlider = document.getElementById('redFilterIntensity');

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

redToggle.addEventListener('change', updateRedFilterClass);
redSlider.addEventListener('input', updateRedFilterClass);

const form = document.getElementById('observationForm');
const obsList = document.getElementById('observationsList');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('[data-filter]');

let observacoes = JSON.parse(localStorage.getItem('observacoes')) || [];

form.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(form);
  const obs = Object.fromEntries(data.entries());
  obs.favorito = !!data.get('favorito');

  const file = data.get('imagem');
  const saveObs = () => {
    if (editId) {
      observacoes = observacoes.map(o => o.id === editId ? { ...obs, id: editId } : o);
      editId = null;
    } else {
      obs.id = Date.now();
      observacoes.push(obs);
    }
    localStorage.setItem('observacoes', JSON.stringify(observacoes));
    renderObservacoes();
    form.reset();
  };

  if (file && file.name && file.size > 0) {
    const reader = new FileReader();
    reader.onload = () => {
      obs.imagem = reader.result;
      saveObs();
    };
    reader.onerror = () => {
      alert("Erro ao carregar imagem. A observação será guardada sem imagem.");
      saveObs();
    };
    reader.readAsDataURL(file);
  } else {
    const original = observacoes.find(o => o.id === editId);
    if (editId && original?.imagem) obs.imagem = original.imagem;
    saveObs();
  }
});

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.toLowerCase();
  renderObservacoes();
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderObservacoes();
  });
});

function renderObservacoes() {
  obsList.innerHTML = '';
  let list = observacoes;

  if (currentFilter === 'favoritos') list = list.filter(o => o.favorito);
  else if (currentFilter === 'recentes') list = list.sort((a, b) => new Date(b.data) - new Date(a.data));

  if (searchQuery) {
    list = list.filter(o =>
      o.nome.toLowerCase().includes(searchQuery) ||
      o.tipo.toLowerCase().includes(searchQuery) ||
      o.local.toLowerCase().includes(searchQuery)
    );
  }

  list.forEach(obs => {
    const card = document.createElement('div');
    card.className = 'observation-card';
    const icon = getIcon(obs.tipo);
    card.innerHTML = `
      <div class="title">${icon} ${obs.nome} ${obs.favorito ? '⭐' : ''}</div>
      <div><small>${obs.tipo}</small></div>
      <div><small>${new Date(obs.data).toLocaleDateString()} - ${obs.local}</small></div>
      ${obs.imagem ? `<img src="${obs.imagem}" style="max-width: 100%; max-height: 100px; cursor: pointer;" onclick="window.open('${obs.imagem}', '_blank')" />` : ''}
      <div style="margin-top: 0.5rem">
        <button onclick="viewObservation(${obs.id})">🔍 Ver</button>
        <button onclick="editObservation(${obs.id})">✏️ ${i18n[currentLang].edit}</button>
        <button onclick="deleteObservation(${obs.id})">🗑️ ${i18n[currentLang].delete}</button>
      </div>
    `;
    obsList.appendChild(card);
  });
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

window.viewObservation = function(id) {
  const obs = observacoes.find(o => o.id === id);
  if (!obs) return;
  const modal = document.createElement('div');
  modal.className = 'modal';
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
      <p><strong>Elongação:</strong> ${obs.elongacao || ''}</p>
      <p><strong>Descrição:</strong> ${obs.descricao || ''}</p>
      ${obs.imagem ? `<img src="${obs.imagem}" style="max-width:100%; max-height:200px; margin-top:1rem;" />` : ''}
      <button onclick="closeModal()">${i18n[currentLang].close}</button>
    </div>
  `;
  document.body.appendChild(modal);
};

window.closeModal = function() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
};

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
        <input name="nome" value="${obs.nome}" required />
        <input name="tipo" value="${obs.tipo}" required />
        <input name="data" value="${obs.data}" required />
        <input name="local" value="${obs.local}" required />
        <textarea name="descricao">${obs.descricao || ''}</textarea>
        <label><input type="checkbox" name="favorito" ${obs.favorito ? 'checked' : ''}/> Favorito</label>
        <button type="submit">${i18n[currentLang].save}</button>
        <button type="button" onclick="closeModal()">${i18n[currentLang].cancel}</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  const modalForm = modal.querySelector('form');
  modalForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(modalForm);
    const newObs = Object.fromEntries(data.entries());
    newObs.id = id;
    newObs.favorito = !!data.get('favorito');
    const original = observacoes.find(o => o.id === id);
    if (original.imagem) newObs.imagem = original.imagem;
    observacoes = observacoes.map(o => o.id === id ? newObs : o);
    localStorage.setItem('observacoes', JSON.stringify(observacoes));
    renderObservacoes();
    closeModal();
  });
};

window.deleteObservation = function(id) {
  if (confirm('Eliminar esta observação?')) {
    observacoes = observacoes.filter(o => o.id !== id);
    localStorage.setItem('observacoes', JSON.stringify(observacoes));
    renderObservacoes();
  }
};

renderObservacoes();
translateUI();
updateRedFilterClass();
