// ======================================================
// AstroLog - app.js (versão completa, revisada e sem duplicações)
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
    faseLua: "Fase da Lua",
    mapaCeu: "Mapa do céu",
	inicio: "Início",
    home: "Início",
    hoje: "Hoje",
    data: "Data",
    localizacao: "Localização",
    editarData: "Editar Data",
    editarLocal: "Alterar localização",
    usarGeo: "Obter localização atual",
	alterarLocal: "Alterar",
    pesquisarLocal: "Pesquisar localidade...",
    previsao: "Previsão do tempo",
    eventos: "Eventos astronómicos",
    objetos: "Objetos visíveis",
	nuvens: "Nuvens",
    bortle: "Índice Bortle",
    latitude: "Latitude",
    longitude: "Longitude",
    buscarTempo: "A obter previsão...",
    semEventos: "Nenhum evento encontrado.",
    semObjetos: "Nenhum objeto visível encontrado.",
	erroGeo: "Não foi possível obter a localização.",
    selecionar: "Selecionar",
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
    addObsTitle: "Adicionar Observação",
    nomeObj: "Nome do objeto",
    tipo: "Tipo",
    dataObs: "Data da observação",
    localizacao: "Localização",
    ra: "RA",
    dec: "DEC",
    magnitude: "Magnitude",
    distancia: "Distância",
    unidadeDist: "Unidade",
    descricao: "Descrição",
    favorito: "Favorito",
    imagem: "Imagem",
    saveSuccess: "✔️ Observação adicionada com sucesso",
    monthNames: [
      "Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ],
    tipos: {
      "Estrela": "Estrela",
      "Galáxia": "Galáxia",
      "Aglomerado": "Aglomerado",
      "Nebulosa": "Nebulosa",
      "Sistema Solar": "Sistema Solar",
      "Outro": "Outro"
    }
  }, // <--- VÍRGULA ENTRE OS OBJETOS!
  en: {
    faseLua: "Moon Phase",
    mapaCeu: "Sky Map",
	inicio: "Home",
    home: "Home",
    hoje: "Today",
    data: "Date",
    localizacao: "Location",
	alterarLocal: "Change",
    pesquisarLocal: "Search location...",
    editarData: "Edit Date",
    editarLocal: "Change location",
    usarGeo: "Use current location",
    previsao: "Weather forecast",
    eventos: "Astronomical events",
    objetos: "Visible objects",
	nuvens: "Clouds",
    bortle: "Bortle Index",
    latitude: "Latitude",
    longitude: "Longitude",
    buscarTempo: "Getting forecast...",
    semEventos: "No events found.",
    semObjetos: "No visible objects found.",
	erroGeo: "Could not get location.",
    selecionar: "Select",
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
    addObsTitle: "Add Observation",
    nomeObj: "Object Name",
    tipo: "Type",
    dataObs: "Observation Date",
    localizacao: "Location",
    ra: "RA",
    dec: "DEC",
    magnitude: "Magnitude",
    distancia: "Distance",
    unidadeDist: "Unit",
    descricao: "Description",
    favorito: "Favorite",
    imagem: "Image",
    saveSuccess: "✔️ Observation successfully added",
    monthNames: [
      "January","February","March","April","May","June","July","August","September","October","November","December"
    ],
    tipos: {
      "Estrela": "Star",
      "Galáxia": "Galaxy",
      "Aglomerado": "Cluster",
      "Nebulosa": "Nebula",
      "Sistema Solar": "Solar System",
      "Outro": "Other"
    }
  }
}; // <--- FECHA O OBJETO PRINCIPAL

// =========================
// INDEXEDDB
// =========================
const DB_NAME = 'AstroLogDB';
const DB_VERSION = 1;
const STORE_NAME = 'observacoes';

// Chaves da API Astronomy
const applicationId = '6108e60e-8f00-4765-af3f-05deda74df85';
const applicationSecret = 'd8aa2fcb08d16a43b7aef292f6e4d5a1e5fb25001224b166102c12910101251eb954e305b1680dab5581feb38e02dcc131f3dadcb6035081a2145d428c9be759cafda9e6e2d12d69238ecf9e5372a3b2c9fa4c220f71347f4fe52915787bb66e9dc03c0b80ee95d985c2b0a27f15d3ce';

// Codificando a string de autenticação
const authString = btoa(`${applicationId}:${applicationSecret}`);

// Função para fazer as requisições à AstronomyAPI
async function astronomyApi(endpoint, body) {
  const response = await fetch(`https://api.astronomyapi.com/api/v2/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Erro ao obter dados: ${response.statusText}`);
  }

  return response.json();
}

// Exemplo de como chamar a função astronomyApi para posições do Sol e da Lua
async function getSunAndMoonPositions() {
  const observer = {
    latitude: 40.7128, // Latitude de Nova Iorque
    longitude: -74.0060, // Longitude de Nova Iorque
    date: new Date().toISOString().slice(0, 10), // Data atual
  };

  try {
    const data = await astronomyApi('bodies/positions', {
      bodies: ['sun', 'moon'],
      observer,
      view: 'horizontal',
    });

    console.log(data); // Dados da API (posições do Sol e da Lua)
  } catch (error) {
    console.error('Erro ao obter dados da AstronomyAPI:', error);
  }
}

// Chamada para obter a posição do Sol e da Lua
getSunAndMoonPositions();


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

// Apenas para apagar do IndexedDB (não mexe no DOM)
async function deleteObservacaoFromDB(id) {
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
// EVENTOS DE INTERFACE (fora do DOMContentLoaded)
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
	  item.textContent = i18n[currentLang].tipos[tipo] || tipo;
	  item.addEventListener('click', () => {
	    currentFilter = 'tipo';
	    searchQuery = tipo.toLowerCase();
	    renderObservacoes();
	    menu.remove();
	  });
	  menu.appendChild(item);
	});

    // Adiciona opção "Todos"
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
// INÍCIO: Estado e Funções
// =========================
let inicioData = new Date();
let inicioCoords = null; // { lat, lon }
let inicioLocManual = "";

// ============ Função para obter localização via browser ===========
function pedirGeolocalizacao(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        callback({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      err => {
        alert("Não foi possível obter localização automática.");
        callback(null);
      }
    );
  } else {
    alert("Geolocalização não suportada.");
    callback(null);
  }
}

// ======== Estado Global ========
let localState = {
  coords: null,
  city: null,
  country: null
};
let autocompleteResults = [];
// ========== Inicialização ==========
async function atualizarTabInicio() {
  const t = i18n[currentLang];
  const sec = document.getElementById('inicio-astroapi');
  const dadosDiv = document.getElementById('astroapi-dados');
  const skyDiv = document.getElementById('astroapi-skymap');

  if (!localState.coords) {
    dadosDiv.innerHTML = `<span>${t.erroGeo}</span>`;
    skyDiv.innerHTML = '';
    return;
  }
  dadosDiv.innerHTML = t.buscarTempo;

  try {
    const observer = {
      latitude: localState.coords.lat,
      longitude: localState.coords.lon,
      date: inicioData.toISOString().slice(0, 10)
    };

    // 1. Fase da Lua
    const moonPhaseData = await astronomyApi('bodies/phase', { format: 'json', observer });
    const fase = moonPhaseData.data.phase.name;
    const iluminacao = moonPhaseData.data.phase.illumination * 100;

    // 2. Posições Sol/Lua
    const posData = await astronomyApi('bodies/positions', {
      bodies: ['sun', 'moon'],
      observer,
      view: 'horizontal'
    });
    const sol = posData.data.table.rows.find(r => r.entry.name.toLowerCase() === 'sun');
    const lua = posData.data.table.rows.find(r => r.entry.name.toLowerCase() === 'moon');

    // 3. Gerar HTML
    dadosDiv.innerHTML = `
      <div>🌙 <b>${t.faseLua || 'Fase da Lua'}:</b> ${fase} (${iluminacao.toFixed(1)}%)</div>
      <div>☀️ <b>Sol:</b> Az ${sol.cells[0].position.azimuth.degrees.toFixed(1)}°, Alt ${sol.cells[0].position.altitude.degrees.toFixed(1)}°</div>
      <div>🌙 <b>Lua:</b> Az ${lua.cells[0].position.azimuth.degrees.toFixed(1)}°, Alt ${lua.cells[0].position.altitude.degrees.toFixed(1)}°</div>
    `;

    // 4. (Opcional) Sky Chart
    skyDiv.innerHTML = t.buscarTempo + " (sky chart)...";
    const skyRes = await astronomyApi('studio/star-chart', {
      observer,
      style: 'inverted',
      view: { type: 'area', parameters: { position: { equatorial: { rightAscension: 10, declination: 10 } }, zoom: 2 } }
    });
    if (skyRes.data && skyRes.data.imageUrl) {
      skyDiv.innerHTML = `<img src="${skyRes.data.imageUrl}" alt="Sky chart" style="max-width:100%; border-radius:10px; box-shadow:0 2px 8px #000;">`;
    } else {
      skyDiv.innerHTML = t.erroGeo;
    }
  } catch (err) {
    dadosDiv.innerHTML = '<span style="color:#f55">Erro a obter dados astronómicos.</span>';
    skyDiv.innerHTML = '';
  }

  // Data
  const now = new Date();
  document.getElementById('inicio-date').textContent = now.toLocaleDateString(currentLang, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Localização
  if (!localState.coords) {
    await obterLocalizacao();
  } else {
    atualizarLocalLabel();
  }

  // Previsão do tempo
  if (localState.coords) {
    await mostrarPrevisaoTempo(localState.coords);
  } else {
    document.getElementById('inicio-previsao').innerHTML = `<span>${t.erroGeo}</span>`;
  }

  // Eventos astronómicos
  mostrarEventosAstronomicos();

  // Objetos visíveis
  mostrarObjetosVisiveis();
} // <-- Agora fecha aqui, só no fim de tudo!


// ========== Localização Automática e Manual ==========
async function obterLocalizacao() {
  const t = i18n[currentLang];
  // Tenta geolocalização do browser
  return new Promise(resolve => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async pos => {
        localState.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        await reverseGeocode(localState.coords.lat, localState.coords.lon);
        atualizarLocalLabel();
        resolve();
      }, () => {
        document.getElementById('inicio-localidade').textContent = t.erroGeo;
        resolve();
      });
    } else {
      document.getElementById('inicio-localidade').textContent = t.erroGeo;
      resolve();
    }
  });
}

// Inverte coordenadas para cidade/país (usando Nominatim)
async function reverseGeocode(lat, lon) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    const data = await r.json();
    localState.city = data.address.city || data.address.town || data.address.village || data.address.hamlet || "";
    localState.country = data.address.country || "";
  } catch {
    localState.city = "";
    localState.country = "";
  }
}

// Mostra a label da localização
function atualizarLocalLabel() {
  const t = i18n[currentLang];
  const span = document.getElementById('inicio-localidade');
  let texto = localState.city ? `${localState.city}, ${localState.country}` : `${t.erroGeo}`;
  span.textContent = texto;
  document.getElementById('btn-alterar-local').textContent = t.alterarLocal;
}

// ========== Autocomplete de Localização (Nominatim) ==========
document.getElementById('btn-alterar-local').onclick = () => {
  const t = i18n[currentLang];
  document.getElementById('local-autocomplete-wrapper').style.display = 'block';
  document.getElementById('local-autocomplete').placeholder = t.pesquisarLocal;
  document.getElementById('local-autocomplete').value = "";
  document.getElementById('autocomplete-results').innerHTML = "";
  document.getElementById('local-autocomplete').focus();
};

document.getElementById('local-autocomplete').oninput = async (e) => {
  const query = e.target.value;
  const t = i18n[currentLang];
  if (query.length < 3) {
    document.getElementById('autocomplete-results').innerHTML = "";
    return;
  }
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`);
  autocompleteResults = await r.json();
  const resultsDiv = document.getElementById('autocomplete-results');
  resultsDiv.innerHTML = "";
  if (!autocompleteResults.length) {
    resultsDiv.innerHTML = `<div>${t.erroGeo}</div>`;
    return;
  }
  autocompleteResults.forEach((item, idx) => {
    const loc =
      (item.address.city || item.address.town || item.address.village || item.address.hamlet || item.display_name);
    const ctry = item.address.country || "";
    const el = document.createElement('div');
    el.textContent = `${loc}, ${ctry}`;
    el.onclick = () => {
      localState.coords = { lat: +item.lat, lon: +item.lon };
      localState.city = loc;
      localState.country = ctry;
      atualizarLocalLabel();
      document.getElementById('local-autocomplete-wrapper').style.display = 'none';
      atualizarTabInicio();
    };
    resultsDiv.appendChild(el);
  });
};

// Fecha o autocomplete ao clicar fora
document.addEventListener('click', function (e) {
  const wrapper = document.getElementById('local-autocomplete-wrapper');
  if (!wrapper.contains(e.target) && e.target.id !== 'btn-alterar-local') {
    wrapper.style.display = 'none';
  }
});

// ========== Previsão do tempo (Open-Meteo) ==========
async function mostrarPrevisaoTempo(coords) {
  const t = i18n[currentLang];
  let html = `<h3>${t.previsao}</h3>`;
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=cloudcover&timezone=auto`);
    const data = await res.json();
    // Calcula nuvens médias do pôr ao nascer do sol
    const agora = new Date();
    const horas = agora.getHours();
    // Só um exemplo simples: média entre 21h e 6h
    let nuvensNoite = [];
    data.hourly.time.forEach((h, idx) => {
      const dt = new Date(h);
      if (dt.getHours() >= 21 || dt.getHours() <= 6) nuvensNoite.push(data.hourly.cloudcover[idx]);
    });
    const mediaNuvens = nuvensNoite.length ? (nuvensNoite.reduce((a, b) => a + b, 0) / nuvensNoite.length) : 0;
    // Bortle fake (só para layout)
    const bortle = mediaNuvens < 30 ? "3" : mediaNuvens < 60 ? "5" : "7";
    html += `<div>${t.nuvens}: ${mediaNuvens.toFixed(0)}%</div>`;
    html += `<div>${t.bortle}: ${bortle}</div>`;
  } catch {
    html += `<div>${t.erroGeo}</div>`;
  }
  document.getElementById('inicio-previsao').innerHTML = html;
}

// ========== Eventos Astronómicos ==========
function mostrarEventosAstronomicos() {
  const t = i18n[currentLang];
  document.getElementById('inicio-eventos-title').textContent = t.eventos;
  const lista = document.getElementById('eventos-list');
  // Dummy - podes trocar por API real no futuro
  lista.innerHTML = `
    <li>🌠 <b>Chuva de meteoros Perseidas</b>: 23:00-03:00</li>
    <li>🌑 <b>Lua Nova</b>: 01:34</li>
  `;
}

// ========== Objetos Visíveis ==========
function mostrarObjetosVisiveis() {
  const t = i18n[currentLang];
  document.getElementById('inicio-objetos-title').textContent = t.objetos;
  const lista = document.getElementById('objetos-list');
  // Dummy - troca por API real/filtros depois
  lista.innerHTML = `
    <li>🪐 <b>Saturno</b> (19:00-02:30)</li>
    <li>🌕 <b>Lua</b> (20:00-04:30)</li>
    <li>✨ <b>M31</b> Andrómeda (00:00-06:00)</li>
  `;
}

// ========== Integração com mudança de língua ==========
function traduzirTabInicio() {
  // Chama isto depois de mudar currentLang!
  atualizarTabInicio();
  document.getElementById('btn-alterar-local').textContent = i18n[currentLang].alterarLocal;
  document.getElementById('local-autocomplete').placeholder = i18n[currentLang].pesquisarLocal;
  document.getElementById('inicio-eventos-title').textContent = i18n[currentLang].eventos;
  document.getElementById('inicio-objetos-title').textContent = i18n[currentLang].objetos;
}

// Chama atualizarTabInicio() ao abrir a tab, e também após mudar de língua!




// =========================
// EVENTOS E INICIALIZAÇÃO (DOMContentLoaded)
// =========================
document.addEventListener('DOMContentLoaded', async () => {
  observacoes = await getAllObservacoes();
  renderObservacoes();
  translateUI();
  updateRedFilterClass();

	  // Data: editar
  document.getElementById("inicio-edit-date").onclick = () => {
    document.getElementById("inicio-date-input").style.display = "inline";
    document.getElementById("inicio-date-input").value = inicioData.toISOString().slice(0, 10);
    document.getElementById("inicio-date").style.display = "none";
  };
  document.getElementById("inicio-date-input").onchange = (e) => {
    inicioData = new Date(e.target.value);
    document.getElementById("inicio-date-input").style.display = "none";
    document.getElementById("inicio-date").style.display = "inline";
    atualizarTabInicio();
  };
});

// ============ Inicializar tab Início por defeito ===========
document.addEventListener("DOMContentLoaded", () => {
  // Marcar tab “Início” como ativa por defeito
  document.querySelectorAll("nav button[data-tab]").forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-tab") === "inicio") btn.classList.add("active");
  });
  document.querySelectorAll(".tab").forEach(sec => sec.classList.remove("active"));
  document.getElementById("tab-inicio").classList.add("active");

  // Pedir localização ao carregar
  pedirGeolocalizacao(coords => {
    if (coords) {
      inicioCoords = coords;
    }
    atualizarTabInicio();
  });
});

  // ======== MODAL DE ADICIONAR OBSERVAÇÃO ========
  const addBtn = document.getElementById('addObservationBtn');
  const modal = document.getElementById('addObservationModal');
  const closeModalBtn = document.getElementById('closeAddModal');
  const cancelBtn = document.getElementById('cancelAdd');
  const form = document.getElementById('addObservationForm');
  const successMsg = document.getElementById('addSuccessMsg');

  // Usa a função GLOBAL closeAddForm para fechar (definida lá em baixo)
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeAddForm);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeAddForm);
  }

  // Abre o modal ao clicar no botão “＋”
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (modal) modal.style.display = 'flex';
    });
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

    // Cria o objeto com os nomes/IDs corretos
    const obs = {
      id: Date.now(),
      nome: formData.get('nome'),
      tipo: formData.get('tipo'),
      data: formData.get('data'),
      local: formData.get('local'),
      ra: formData.get('ra'),
      dec: formData.get('dec'),
      magnitude: formData.get('magnitude'),
      distancia: formData.get('distancia'),
      unidadeDistancia: formData.get('unidadeDistancia'),
      descricao: formData.get('descricao'),
      favorito: !!formData.get('favorito')
      // imagem: será tratada abaixo
    };

    const file = formData.get('imagem');
    const saveObs = async () => {
      await saveObservacao(obs);
      observacoes = await getAllObservacoes();
      renderObservacoes();
      atualizarBackupJSON();
      if (successMsg) {
        successMsg.style.display = 'block';
        successMsg.textContent = "✔️ Observação adicionada com sucesso";
      }
      // Fecha o modal imediatamente após mostrar a mensagem de sucesso
      closeAddForm();
    };

    if (file && file.size > 0) {
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

  // ======== Botão de download de backup ========
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

// ========== NAVEGAÇÃO ENTRE TABS ==========
const navButtons = document.querySelectorAll('nav button[data-tab]');
const tabSections = document.querySelectorAll('.tab');

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const alvo = btn.dataset.tab;

    // Ativa o botão selecionado e desativa os outros
    navButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Mostra apenas a seção correta
    tabSections.forEach(sec => sec.classList.remove('active'));
    const sectionAlvo = document.getElementById(`tab-${alvo}`);
    if (sectionAlvo) {
      sectionAlvo.classList.add('active');
    }

    if (alvo === 'inicio') atualizarTabInicio();

    // Exibe o footer somente em “Configurações”
    const footer = document.querySelector('footer');
    if (footer) {
      footer.style.display = (alvo === 'configuracoes') ? 'flex' : 'none';
    }

    // Se a aba for “Calendário”, renderiza o calendário
    if (alvo === 'calendario') {
      renderCalendario();
    }
  });
});

  // ======== Setas do Calendário (agora funcionam) ========
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
		
// =========================
// FUNÇÃO PARA FECHAR O MODAL (ADICIONAR OBSERVAÇÃO) – VERSÃO GLOBAL
// =========================
function closeAddForm() {
  const form = document.getElementById('addObservationForm');
  const modal = document.getElementById('addObservationModal');
  const successMsg = document.getElementById('addSuccessMsg');
  if (form) form.reset();
  if (modal) modal.style.display = 'none';
  if (successMsg) successMsg.style.display = 'none';
}


// =========================
// ATUALIZAR BACKUP NO localStorage (com try…catch)
// =========================
function atualizarBackupJSON() {
  const json = JSON.stringify(observacoes, null, 2);
  try {
    localStorage.setItem('backupAstroLog', json);
  } catch (err) {
    console.warn("Não foi possível gravar o backup em localStorage (quota exceeded).");
    // opcional: eliminar o backup anterior para liberar espaço
    // localStorage.removeItem('backupAstroLog');
  }
}

// =========================
// FUNÇÃO DE TRADUÇÃO DE UI
// =========================
function translateUI() {
  const t = i18n[currentLang];

	document.getElementById('inicio-astroapi-title').textContent = i18n[currentLang].mapaCeu;
	
  // Header + filtros rápidos
  document.getElementById('searchInput').placeholder = t.searchPlaceholder;
  document.querySelector('[data-filter="todos"]').textContent = t.all;
  document.querySelector('[data-filter="recentes"]').textContent = t.recent;
  document.querySelector('[data-filter="favoritos"]').textContent = t.favorites;
  document.getElementById('filterByType').textContent = t.filterType;
  document.getElementById('toggleLanguage').textContent = currentLang === 'pt' ? 'EN' : 'PT';

  // Modal Adicionar Observação
  document.getElementById('addObsTitle').textContent = t.addObsTitle;
  document.getElementById('labelNomeObj').textContent = t.nomeObj;
  document.getElementById('labelTipo').textContent = t.tipo;
  document.getElementById('labelData').textContent = t.dataObs;
  document.getElementById('labelLocalizacao').textContent = t.localizacao;
  document.getElementById('labelRA').textContent = t.ra;
  document.getElementById('labelDEC').textContent = t.dec;
  document.getElementById('labelMagnitude').textContent = t.magnitude;
  document.getElementById('labelDistancia').textContent = t.distancia;
  document.getElementById('labelDescricao').textContent = t.descricao;
  document.getElementById('labelFavorito').lastChild.textContent = " " + t.favorito;
  document.getElementById('labelImagem').textContent = t.imagem;
  document.getElementById('btnSave').textContent = t.save;
  document.getElementById('btnCancel').textContent = t.cancel;
  document.getElementById('addSuccessMsg').textContent = t.saveSuccess;

  // Opções do select Tipo no modal (sempre na ordem do array!)
  const tipoSelect = document.getElementById('inputTipo');
  if (tipoSelect) {
    Array.from(tipoSelect.options).forEach((opt, i) => {
      const val = opt.value;
      opt.textContent = t.tipos[val] || val;
    });
  }
  // Unidade de distância no formulário
  const unidade = document.getElementById('inputUnidadeDistancia');
  if (unidade) {
    unidade.options[0].text = "ly";
    unidade.options[1].text = "AU";
  }

  // Tradução dos botões das tabs
  document.querySelectorAll("nav button[data-tab]").forEach(btn => {
    const key = btn.getAttribute("data-tab");
    if (t[key]) btn.textContent = t[key];
  });

  // Traduzir secção configurações
  if (document.getElementById('tab-configuracoes')) {
    document.querySelector('#tab-configuracoes p').textContent =
      currentLang === 'pt'
        ? "Ajustes e configurações da aplicação."
        : "Application settings and adjustments.";
    document.getElementById('exportJson').textContent = "📤 " + (currentLang === 'pt' ? "Exportar Observações" : "Export Observations");
    // Label do input
    const importLabel = document.querySelector('label.import-label');
    if (importLabel) importLabel.childNodes[1].textContent = currentLang === 'pt' ? " Importar Observações" : " Import Observations";
    document.getElementById('downloadBackup').textContent = currentLang === 'pt' ? "💾 Descarregar Backup" : "💾 Download Backup";
  }

  // Footer
  document.querySelector('footer label:first-child').textContent = t.redFilter;
  document.querySelector('footer label:last-of-type').textContent = t.intensity;

  // Botões das observações
  document.querySelectorAll(".observation-card button.view-btn").forEach(btn => btn.textContent = `🔍 ${t.ver}`);
  document.querySelectorAll(".observation-card button.edit-btn").forEach(btn => btn.textContent = `✏️ ${t.edit}`);
  document.querySelectorAll(".observation-card button.delete-btn").forEach(btn => btn.textContent = `🗑️ ${t.delete}`);

  // Atualiza o título do calendário e os meses
  const title = document.getElementById('calendarMonthYear');
  const span = document.getElementById('calendarMonthYearDisplay');
  if (title && span) {
    const nomeMes = t.monthNames[calendarioMes];
    const textoMesAno = `${capitalize(nomeMes)} ${calendarioAno}`;
    title.textContent = textoMesAno;
    span.textContent = textoMesAno;
  }
  // Se o calendário está ativo, força rerender
  if (document.getElementById('tab-calendario')?.classList.contains('active')) {
    renderCalendario();
  }

  // Corrige tipos traduzidos do dropdown de filtro por tipo, se estiver aberto
document.querySelectorAll('.dropdown-menu > div').forEach((item, i) => {
  // "Todos" está sempre no fim
  if (item.textContent.trim() === i18n.pt.all || item.textContent.trim() === i18n.en.all) {
    item.textContent = t.all;
  } else if (i < Object.keys(i18n.pt.tipos).length) {
    // outros tipos
    const tipoKey = item.textContent.trim();
    // tenta traduzir pelo valor reverso
    item.textContent = t.tipos[tipoKey] || tipoKey;
  }
}); // <-- fecha o forEach corretamente

	// Chama fora do ciclo, só uma vez se quiseres atualizar a tab Inicio
	atualizarTabInicio();
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
    if (val > 80)       document.body.classList.add('intensity-100');
    else if (val > 60)  document.body.classList.add('intensity-80');
    else if (val > 40)  document.body.classList.add('intensity-60');
    else if (val > 20)  document.body.classList.add('intensity-40');
    else                document.body.classList.add('intensity-20');
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
  const title       = document.getElementById('calendarMonthYear');
  const displaySpan = document.getElementById('calendarMonthYearDisplay');
  const container   = document.getElementById('calendarContainer');
  const results     = document.getElementById('calendarResults');
  if (!title || !container || !results) return;

  container.innerHTML = '';
  results.innerHTML   = '';

  // Calcula o primeiro dia e quantos dias tem o mês
  const firstDay    = new Date(calendarioAno, calendarioMes, 1).getDay();
  const daysInMonth = new Date(calendarioAno, calendarioMes + 1, 0).getDate();

  // Atualiza o título principal <h2>
	const nomeMes = i18n[currentLang].monthNames[calendarioMes];
	const textoMesAno = `${capitalize(nomeMes)} ${calendarioAno}`;
	title.textContent = textoMesAno;
	if (displaySpan) displaySpan.textContent = textoMesAno;

  // Se quiser mostrar também dentro do header (entre as setas):
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
    const date    = new Date(calendarioAno, calendarioMes, d);
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
  const lista     = observacoes.filter(o => o.data.startsWith(dataISO));
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

  // 1) FILTROS “FAVORITOS” / “RECENTES”
  if (currentFilter === 'favoritos') {
    list = list.filter(o => o.favorito);
  } else if (currentFilter === 'recentes') {
    list = list.sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  // 2) PESQUISA TEXTUAL (por nome, tipo ou local)
  if (searchQuery) {
    list = list.filter(o =>
      o.nome.toLowerCase().includes(searchQuery) ||
      o.tipo.toLowerCase().includes(searchQuery) ||
      (o.local || '').toLowerCase().includes(searchQuery)
    );
  }

  // 3) PARA CADA OBSERVAÇÃO, CRIAR O CARTÃO (DIV) VIA DOM API
  list.forEach(obs => {
    // Container principal do cartão
    const card = document.createElement('div');
    card.className = 'observation-card';

    // --- TÍTULO (ícone + nome + ⭐ se for favorito) ---
    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = `${getIcon(obs.tipo)} ${obs.nome} ${obs.favorito ? '⭐' : ''}`;
    card.appendChild(titleDiv);

	// --- TIPO (pequeno) ---
	const tipoSmall = document.createElement('div');
	const tipoTraduzido = i18n[currentLang].tipos[obs.tipo] || obs.tipo;
	tipoSmall.innerHTML = `<small>${tipoTraduzido}</small>`;
	card.appendChild(tipoSmall);


    // --- DATA + LOCAL (pequeno) ---
    const dateLocal = document.createElement('div');
    const dataFormatada = new Date(obs.data).toLocaleDateString();
    dateLocal.innerHTML = `<small>${dataFormatada} – ${obs.local || ''}</small>`;
    card.appendChild(dateLocal);

    // --- MINIATURA DA IMAGEM (se existir) ---
    if (obs.imagem) {
      const img = document.createElement('img');
      img.src = obs.imagem; // obs.imagem deve ser data URL ou URL válido
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100px';
      img.style.cursor = 'pointer';
      // Ao clicar na miniatura, abre nova aba com a imagem completa
      img.addEventListener('click', () => {
        window.open(obs.imagem, '_blank');
      });
      card.appendChild(img);
    }

    // --- DIV DE BOTÕES (“Ver”, “Editar”, “Eliminar”) ---
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.marginTop = '0.5rem';

    // Botão “Ver”
    const viewBtn = document.createElement('button');
    viewBtn.className = 'view-btn';
    viewBtn.textContent = `🔍 ${i18n[currentLang].ver}`;
    viewBtn.addEventListener('click', () => {
      viewObservation(obs.id);
    });
    buttonsDiv.appendChild(viewBtn);

    // Botão “Editar”
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = `✏️ ${i18n[currentLang].edit}`;
    editBtn.addEventListener('click', () => {
      editObservation(obs.id);
    });
    buttonsDiv.appendChild(editBtn);

    // Botão “Eliminar”
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = `🗑️ ${i18n[currentLang].delete}`;
    deleteBtn.addEventListener('click', () => {
      deleteObservacaoHandler(obs.id);
    });
    buttonsDiv.appendChild(deleteBtn);

    card.appendChild(buttonsDiv);

    // Acrescenta o cartão completo ao contêiner
    obsList.appendChild(card);
  });
}


// =========================
// VISUALIZAR OBSERVAÇÃO (modal)
// =========================
// Função para visualizar a observação em um modal
window.viewObservation = function(id) {
  window.closeModal(); // fecha qualquer modal aberto
  console.log("viewObservation chamada com id:", id);

  // MODAL DE TESTE — para depuração
  const modalTeste = document.createElement('div');
  modalTeste.className = 'modal';
  modalTeste.id = 'modal-teste';
  modalTeste.innerHTML = `
    <div class="modal-content">
      <h3>MODAL DE TESTE</h3>
      <p>Se vês isto, modais estão a ser criados corretamente!</p>
      <button onclick="closeModalById('modal-teste')">Fechar Modal de Teste</button>
    </div>
  `;
  document.body.appendChild(modalTeste);
  modalTeste.addEventListener('click', e => {
    if (e.target === modalTeste) closeModalById('modal-teste');
  });

  // MODAL REAL (o teu original)
  const obs = observacoes.find(o => o.id === id);
  if (!obs) return;

  const modal = document.createElement('div');
  modal.className = 'modal open';
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
      ${obs.imagem ? `
        <img src="${obs.imagem}" 
             style="max-width:100%; max-height:200px; margin-top:1rem; cursor:pointer" 
             onclick="window.open('${obs.imagem}', '_blank')" />
      ` : ''}
      <button onclick="closeModalById('view-modal')">Fechar</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModalById('view-modal');
  });
};


// Função para editar a observação
window.editObservation = function(id) {
	window.closeModal();
	  console.log("editObservation chamada com id:", id);
  const obs = observacoes.find(o => o.id === id);
  if (!obs) return;

  const modal = document.createElement('div');
  modal.className = 'modal open';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Editar Observação</h3>
      <form id="modalForm">
        <label>Nome:
          <input name="nome" value="${obs.nome}" required />
        </label>
        <label>Tipo:
			<select name="tipo" required>
			  <option ${obs.tipo === 'Estrela' ? 'selected' : ''}>Estrela</option>
			  <option ${obs.tipo === 'Galáxia' ? 'selected' : ''}>Galáxia</option>
			  <option ${obs.tipo === 'Aglomerado' ? 'selected' : ''}>Aglomerado</option>
			  <option ${obs.tipo === 'Nebulosa' ? 'selected' : ''}>Nebulosa</option>
			  <option ${obs.tipo === 'Sistema Solar' ? 'selected' : ''}>Sistema Solar</option>
			  <option ${obs.tipo === 'Outro' ? 'selected' : ''}>Outro</option>
			</select>
        </label>
        <label>Data:
          <input name="data" type="date" value="${obs.data.slice(0, 10)}" required />
        </label>
        <label>Local:
          <input name="local" value="${obs.local || ''}" required />
        </label>
        <label>RA:
          <input name="ra" value="${obs.ra || ''}" />
        </label>
        <label>DEC:
          <input name="dec" value="${obs.dec || ''}" />
        </label>
        <label>Distância:
          <input name="distancia" value="${obs.distancia || ''}" />
          <select name="unidadeDistancia">
            <option ${obs.unidadeDistancia === 'ly' ? 'selected' : ''}>ly</option>
            <option ${obs.unidadeDistancia === 'AU' ? 'selected' : ''}>AU</option>
          </select>
        </label>
        <label>Magnitude:
          <input name="magnitude" type="number" value="${obs.magnitude || ''}" />
        </label>
        <label>Descrição:
          <textarea name="descricao">${obs.descricao || ''}</textarea>
        </label>
        <label><input type="checkbox" name="favorito" ${obs.favorito ? 'checked' : ''}/> Favorito</label>
        <label>Imagem (opcional):
          <input type="file" name="imagem" accept="image/*" />
        </label>
        <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.5rem;">
          <button type="submit">Salvar</button>
          <button type="button" onclick="closeModal()">Cancelar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModal();
    }
  });

  const modalForm = modal.querySelector('#modalForm');
  modalForm.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(modalForm);
    const updatedObs = Object.fromEntries(data.entries());
    updatedObs.id = id;

    const file = data.get('imagem');
    const saveEdit = async () => {
      const original = observacoes.find(o => o.id === id);
      if (original?.imagem && !updatedObs.imagem) {
        updatedObs.imagem = original.imagem;
      }
      await saveObservacao(updatedObs);
      observacoes = await getAllObservacoes();
      renderObservacoes();
      closeModal();
    };

    if (file && file.size > 0) {
      const reader = new FileReader();
      reader.onload = async () => {
        updatedObs.imagem = reader.result;
        await saveEdit();
      };
      reader.onerror = async () => {
        alert("Erro ao carregar imagem.");
        await saveEdit();
      };
      reader.readAsDataURL(file);
    } else {
      await saveEdit();
    }
  });
};



// =========================
// EXCLUIR OBSERVAÇÃO (handler)
// =========================
window.deleteObservacaoHandler = async function(id) {
  if (confirm('Eliminar esta observação?')) {
    await deleteObservacaoFromDB(id);
    observacoes = await getAllObservacoes();
    renderObservacoes();
  }
};

// =========================
// VISUALIZAR IMAGEM EM MODAL (caso ainda uses essa função em alguma parte)
// =========================
window.openImageModal = function(imgSrc) {
  const modal = document.createElement('div');
  modal.className = 'modal open';
  modal.id = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <img src="${imgSrc}" 
           style="max-width:100%; max-height:80vh; display:block; margin: 0 auto 1rem;" />
      <div style="text-align:center">
        <button onclick="closeModalById('image-modal')">${i18n[currentLang].close}</button>
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
// FECHAR TODOS OS MODAIS
// =========================
window.closeModal = function() {
  document.querySelectorAll('.modal').forEach(m => m.remove());
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
