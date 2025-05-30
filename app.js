// Idiomas suportados
let observacoes = [];
let currentLang = 'pt';
let currentFilter = 'todos';
let searchQuery = '';
let editId = null;
let calendarioMes = new Date().getMonth();
let calendarioAno = new Date().getFullYear();

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
    ver: "Ver",
  	cielo: "Céu",
    skyTitle: "🔭 Céu Hoje",
    getSkyData: "Obter eventos astronómicos",
    skySummary: "Sugestões do que observar esta noite, previsões para a próxima semana, e fenómenos visíveis.",
	observeHoje: "O que observar hoje?",
    proximaSemana: "O que observar na próxima semana?",
    ceuAnalise: "Análise do céu (deep sky, planetas, cometas)",
    citizenScience: "Ligar ao Citizen Science da Unistellar",
    localizar: "Detetar Localização",
    verObjetos: "Ver Objetos Visíveis",
    semDados: "Não foi possível obter a localização ou dados de céu.",
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
    ver: "View",
 	cielo: "Sky",
  	skyTitle: "🔭 Sky Tonight",
  	getSkyData: "Fetch Astronomical Events",
  	skySummary: "Suggestions for tonight, upcoming week forecasts and visible events.",
    observeHoje: "What to observe tonight?",
    proximaSemana: "What to observe next week?",
    ceuAnalise: "Sky analysis (deep sky, planets, comets)",
    citizenScience: "Link to Unistellar Citizen Science",
    localizar: "Detect Location",
    verObjetos: "Show Visible Objects",
    semDados: "Could not obtain location or sky data.",
  }
};

// === IndexedDB SETUP ===
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

async function loadObservacoes() {
  observacoes = await getAllObservacoes();
  renderObservacoes();
}

// chamada inicial
loadObservacoes();

function translateUI() {
  console.log("Traduzindo UI para:", currentLang);
	
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
  document.querySelector('[data-tab="cielo"]').textContent = t.cielo;
  document.getElementById('skyTitle').textContent = t.skyTitle;
  document.getElementById('skySummary').textContent = t.skySummary;
  document.getElementById('getSkyData').textContent = t.getSkyData;


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
const calendarioVisivel = document.getElementById('tab-calendario').classList.contains('active');
if (calendarioVisivel) {
  document.querySelector('#tab-calendario h2').textContent = i18n[currentLang].calendarTitle;
  renderCalendario(); // força atualização do mês no idioma correto
	}
}

function renderSkyTab() {
  const btn = document.getElementById("getSkyData");
  const output = document.getElementById("skyInfo");
  if (!btn || !output) return;

  btn.addEventListener("click", () => {
    output.innerHTML = `<li>🔄 A obter dados...</li>`;
    fetch("https://astro-colibri.com/api/events")
      .then(res => res.json())
      .then(data => {
        output.innerHTML = "";
        if (!data || data.length === 0) {
          output.innerHTML = `<li>⚠️ Sem eventos disponíveis neste momento.</li>`;
          return;
        }

        data.forEach(event => {
          const li = document.createElement("li");
          li.textContent = `${event.type || 'Evento'} em ${event.time || 'tempo desconhecido'} RA: ${event.ra || '?'} / Dec: ${event.dec || '?'}`;
          output.appendChild(li);
        });
      })
      .catch(err => {
        console.error("Erro ao obter dados do Astro-Colibri", err);
        output.innerHTML = "<li>❌ Erro ao carregar dados.</li>";
      });
  });
}


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

// Quando se clica no botão vermelho da barra superior
redButton.addEventListener('click', () => {
  redToggle.checked = !redToggle.checked;
  applyRedFilter(redToggle.checked);
});

// Quando se muda o toggle ou intensidade nas configurações
redToggle.addEventListener('change', () => {
  applyRedFilter(redToggle.checked);
});

redSlider.addEventListener('input', () => {
  if (redToggle.checked) applyRedFilter(true);
});

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

form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = new FormData(form);
  const obs = Object.fromEntries(data.entries());
  obs.favorito = !!data.get('favorito');
  obs.id = editId || Date.now();

  const file = data.get('imagem');

  const saveObs = async () => {
    await saveObservacao(obs);
    // Corrigido para evitar erro de 'await fora de função async'
  observacoes = await getAllObservacoes();
  renderObservacoes();
	atualizarBackupJSON();
    form.reset();
    editId = null;
  };

function atualizarBackupJSON() {
  const json = JSON.stringify(observacoes, null, 2);
  localStorage.setItem('backupAstroLog', json);
}

document.getElementById('downloadBackup').addEventListener('click', () => {
  const data = localStorage.getItem('backupAstroLog');
  if (!data) {
    alert("Sem backup disponível.");
    return;
  }
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'astro-backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
  
  if (file && file.name && file.size > 0) {
    const reader = new FileReader();
    reader.onload = async () => {
      obs.imagem = reader.result;
      await saveObs();
    };
    reader.onerror = async () => {
      alert("Erro ao carregar imagem. A observação será guardada sem imagem nova.");
      await saveObs();
    };
    reader.readAsDataURL(file);
  } else {
    const original = observacoes.find(o => o.id === editId);
    if (editId && original?.imagem) obs.imagem = original.imagem;
    await saveObs();
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

  if (currentFilter === 'favoritos') {
    list = list.filter(o => o.favorito);
  } else if (currentFilter === 'recentes') {
    list = list.sort((a, b) => new Date(b.data) - new Date(a.data));
  }

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
    const data = new Date(obs.data).toLocaleDateString();

    const imgHTML = obs.imagem
      ? `<img src="${obs.imagem}" style="max-width: 100%; max-height: 100px; cursor: pointer;" onclick="window.open('${obs.imagem}', '_blank')" />`
      : '';

    const viewBtn = `<button class="view-btn" onclick="viewObservation(${obs.id})">🔍 ${i18n[currentLang].ver}</button>`;
    const editBtn = `<button onclick="editObservation(${obs.id})">✏️ ${i18n[currentLang].edit}</button>`;
    const deleteBtn = `<button onclick="deleteObservation(${obs.id})">🗑️ ${i18n[currentLang].delete}</button>`;

    card.innerHTML = `
      <div class="title">${icon} ${obs.nome} ${obs.favorito ? '⭐' : ''}</div>
      <div><small>${obs.tipo}</small></div>
      <div><small>${data} - ${obs.local}</small></div>
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
      <img src="${imgSrc}" style="max-width:100%; max-height:80vh; display:block; margin: 0 auto 1rem;" />
      <div style="text-align:center">
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

window.closeModal = function() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
};

// ... (código anterior mantém-se inalterado)

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

        <select name="tipo" required>
          <option${obs.tipo === 'Estrela' ? ' selected' : ''}>Estrela</option>
          <option${obs.tipo === 'Galáxia' ? ' selected' : ''}>Galáxia</option>
          <option${obs.tipo === 'Aglomerado' ? ' selected' : ''}>Aglomerado</option>
          <option${obs.tipo === 'Nebulosa' ? ' selected' : ''}>Nebulosa</option>
          <option${obs.tipo === 'Sistema Solar' ? ' selected' : ''}>Sistema Solar</option>
          <option${obs.tipo === 'Outro' ? ' selected' : ''}>Outro</option>
        </select>

        <input name="data" type="datetime-local" value="${obs.data}" required />
        <input name="local" value="${obs.local}" required />
        <input name="ra" value="${obs.ra || ''}" placeholder="RA" />
        <input name="dec" value="${obs.dec || ''}" placeholder="DEC" />
        <input name="distancia" value="${obs.distancia || ''}" placeholder="Distância" />
        <input name="magnitude" value="${obs.magnitude || ''}" placeholder="Magnitude" />
        <textarea name="descricao">${obs.descricao || ''}</textarea>
        <label><input type="checkbox" name="favorito" ${obs.favorito ? 'checked' : ''}/> Favorito</label>
        <label>Imagem (opcional)</label>
        <input type="file" name="imagem" accept="image/*" />
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

    const file = data.get('imagem');
    const saveEdit = async () => {
      const original = observacoes.find(o => o.id === id);
      if (original?.imagem && !newObs.imagem) newObs.imagem = original.imagem;
      await saveObservacao(newObs);
      // Corrigido para evitar erro de 'await fora de função async'
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

// ... (resto do código mantém-se)


window.deleteObservation = async function(id) {
  if (confirm('Eliminar esta observação?')) {
    await deleteObservacao(id);
    // Corrigido para evitar erro de 'await fora de função async'
  observacoes = await getAllObservacoes();
  renderObservacoes();
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  observacoes = await getAllObservacoes();
  renderObservacoes();
  translateUI();
  updateRedFilterClass();
  renderSkyTab(); // 👈 ADICIONA ISTO AQUI
});

// Nova função para obter localização e carregar o gráfico
async function carregarGraficoCeuComLocalizacao() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(async position => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Mostrar nome da localização
    const locResp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    const locData = await locResp.json();
    const local = locData.address.city || locData.address.town || locData.address.village || "Localização";
    document.getElementById("skyLocationName").textContent = `📍 ${local}`;

    // Obter dados de qualidade do céu da API Open-Meteo
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 4);
    const dateStr = endDate.toISOString().split("T")[0];

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=cloud_cover,seeing,transparency&timezone=auto&end_date=${dateStr}`;

    const response = await fetch(url);
    const data = await response.json();

    const dias = data.daily.time;
    const seeing = data.daily.seeing;
    const transparency = data.daily.transparency;

    const ctx = document.getElementById("skyChart").getContext("2d");
    if (window.skyChartInstance) window.skyChartInstance.destroy(); // evitar duplicados

    window.skyChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dias,
        datasets: [
          {
            label: 'Seeing',
            data: seeing,
            borderWidth: 2,
          },
          {
            label: 'Transparência',
            data: transparency,
            borderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 5
          }
        }
      }
    });
  });
}

// Chamar quando muda para a tab Céu
document.querySelector('[data-tab="cielo"]').addEventListener("click", () => {
  carregarGraficoCeuComLocalizacao();
});

  // Alternar idioma
  const langBtn = document.getElementById('toggleLanguage');
  langBtn.addEventListener('click', () => {
    currentLang = currentLang === 'pt' ? 'en' : 'pt';
    langBtn.textContent = currentLang === 'pt' ? 'EN' : 'PT';
    translateUI();
    renderObservacoes();
  });

  // Navegação entre tabs
  const tabs = document.querySelectorAll('nav button');
const tabSections = document.querySelectorAll('.tab');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
	  
	   if (target === 'cielo') {
      renderSkyTab(); // <-- importante
    }

    tabSections.forEach(section => section.classList.remove('active'));
	  if (target === 'adicionar') {
  editId = null;
  document.getElementById('observationForm').reset();
} else if (target === 'calendario') {
  renderCalendario();
}
    document.getElementById(`tab-${target}`).classList.add('active');

    document.querySelector('footer').style.display = (target === 'configuracoes') ? 'flex' : 'none';

      // Remover dropdown visível, se existir
      document.querySelectorAll('.dropdown-menu').forEach(m => m.remove());

 if (target === 'adicionar') {
      editId = null;
      document.getElementById('observationForm').reset();
    } else if (target === 'calendario') {
      renderCalendario();
    }
  });
});

  // Filtro por tipo
  const filterBtn = document.getElementById('filterByType');
  filterBtn.addEventListener('click', async () => {
    if (!observacoes || observacoes.length === 0) observacoes = await getAllObservacoes();
    if (!observacoes.length) {
      alert("Sem observações para filtrar.");
      return;
    }

    // Remover menus existentes
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

    const rect = filterBtn.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.style.zIndex = 1000;

    document.body.appendChild(menu);
  });
	
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
        // Corrigido para evitar erro de 'await fora de função async'
  observacoes = await getAllObservacoes();
  renderObservacoes();
        event.target.value = ''; // reset file input
      };
    } catch (err) {
      alert("Erro ao importar ficheiro: " + err.message);
    }
  };
  reader.readAsText(file);
});

function renderCalendario() {
  const container = document.getElementById('calendarContainer');
  const title = document.getElementById('calendarMonthYear');
  container.innerHTML = '';

  const firstDay = new Date(calendarioAno, calendarioMes, 1).getDay();
  const daysInMonth = new Date(calendarioAno, calendarioMes + 1, 0).getDate();

  // Atualizar o título
  const locale = (currentLang === 'pt') ? 'pt-PT' : 'en-US';
	const nomeMes = new Date(calendarioAno, calendarioMes).toLocaleString(locale, { month: 'long' });
	const capitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
	title.textContent = `${capitalizado} ${calendarioAno}`;

  title.textContent = `${capitalize(nomeMes)} ${calendarioAno}`;

  const diasComObservacoes = new Set(
    observacoes.map(o => normalizarDataLocal(o.data))
  );

  for (let i = 0; i < firstDay; i++) {
    container.appendChild(document.createElement('div'));
  }

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

function normalizarDataLocal(data) {
  return new Date(data).toLocaleDateString('sv-SE'); // YYYY-MM-DD
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

async function carregarGraficoCeu() {
  const lat = 38.7169;  // Exemplo: Lisboa
  const lon = -9.1399;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloudcover&timezone=auto`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const horas = data.hourly.time.slice(0, 24).map(t => t.split("T")[1].slice(0, 5)); // só hoje
    const cobertura = data.hourly.cloudcover.slice(0, 24).map(v => 100 - v); // inverter: mais céu limpo = melhor

    const ctx = document.getElementById("skyQualityChart").getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: horas,
        datasets: [{
          label: "Qualidade do Céu (%)",
          data: cobertura,
          borderColor: "aqua",
          backgroundColor: "rgba(0,255,255,0.1)",
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, max: 100 },
          x: { title: { display: true, text: "Hora" } }
        }
      }
    });

  } catch (err) {
    console.error("Erro ao carregar gráfico de céu:", err);
  }
}

document.getElementById("getSkyData").addEventListener("click", () => {
  const skyInfo = document.getElementById("skyInfo");
  skyInfo.innerHTML = "<li>🔄 A carregar dados simulados...</li>";

  // Dados simulados
  setTimeout(() => {
    skyInfo.innerHTML = "";
    const eventos = [
      { tipo: "🌕 Lua Cheia", data: "2025-06-03", descricao: "Boa noite para observar crateras lunares." },
      { tipo: "🔭 Marte em oposição", data: "2025-06-05", descricao: "Marte visível toda a noite, a olho nu." },
      { tipo: "☄️ Cometa 12P/Pons-Brooks", data: "2025-06-08", descricao: "Cometa visível a oeste após o pôr do sol." }
    ];
    eventos.forEach(ev => {
      const li = document.createElement("li");
      li.textContent = `${ev.tipo} — ${ev.data}: ${ev.descricao}`;
      skyInfo.appendChild(li);
    });
  }, 1000);
});


