// 1. CREDENCIALES
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNTIyNzVlMDVhNTAxMjllZWYwMGRhN2Q5ZmU5NTZlZSIsIm5iZiI6MTc5MzU1NjUzNC4wMDcsInN1YiI6IjZhZTc4MDM2MWMyNDI4MTQ4MmM4ZGM2NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.b2COQUX-mmBdGPcxwCTUN7HI5EN6KNemlZSzbaD5NuI'; 
const SUPABASE_URL = 'https://dqqfoucxbsvfdshruygt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcWZvdWN4YnN2ZmRzaHJ1eWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDgyOTQsImV4cCI6MjEwOTEyNDI5NH0.Z4yVjtuuSrs3Pc5AghHFVeENOvmIeA8k34iWcVQiqIQ';
const OMDB_TOKEN = '23569907';

const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ESTADOS GLOBALES DE LA APP
let pelisYSeries = []; 
let usuarioActual = null;
let miListaTMDBIDs = []; 
let miBibliotecaLocal = []; 
let vistosTemporal = []; 
let totalSerieCapitulosGlobal = 0; 
let currentDetailTrackingId = null; 

// Filtros y Ordenación
let filterTypes = ['movie', 'tv']; 
let currentFilterStatus = 'all';
let filterRating8Plus = false; 
let filterImdbRating8Plus = false; 
let filterMyRating8Plus = false; 
let filterNovedades = false; 
let currentGenreFilter = 'all'; 
let currentSagaFilter = 'all'; 
let currentSort = 'recent'; 
let currentSearchSort = 'rating'; 
let localSearchQuery = ''; 

// ESTILOS DE BOTONES ADAPTATIVOS
const btnPillActive = 'px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md flex items-center gap-1';
const btnPillInactive = 'px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all bg-transparent text-gray-400 hover:bg-white/5 flex items-center gap-1';
const searchPillActive = 'px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md transition-all';
const searchPillInactive = 'px-4 py-2 rounded-xl text-sm font-bold bg-transparent text-gray-400 hover:text-white transition-all';

// ELEMENTOS DOM
const authPanel = document.getElementById('authPanel');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const searchSortBar = document.getElementById('searchSortBar');
const localSearchInput = document.getElementById('localSearchInput'); 
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn'); 
const logoutBtn = document.getElementById('logoutBtn');
const emailInput = document.getElementById('emailInput');
const passInput = document.getElementById('passInput');
const userLogged = document.getElementById('userLogged');
const viewSearch = document.getElementById('viewSearch');
const viewList = document.getElementById('viewList');
const btnNavSearch = document.getElementById('btnNavSearch');
const btnNavList = document.getElementById('btnNavList');
const myListGrid = document.getElementById('myListGrid');

const modalImport = document.getElementById('modalImport');
const importTextarea = document.getElementById('importTextarea');
const importStatus = document.getElementById('importStatus');
const btnProcesarImport = document.getElementById('btnProcesarImport');

const modalDetalle = document.getElementById('modalDetalle');
const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailBadgeType = document.getElementById('detailBadgeType');
const detailYear = document.getElementById('detailYear');
const detailCountry = document.getElementById('detailCountry'); 
const detailRating = document.getElementById('detailRating');
const detailImdbRating = document.getElementById('detailImdbRating'); 
const detailRuntime = document.getElementById('detailRuntime'); 
const detailGenres = document.getElementById('detailGenres'); 
const detailSaga = document.getElementById('detailSaga'); 
const detailExtraInfo = document.getElementById('detailExtraInfo'); 
const detailPersonalRating = document.getElementById('detailPersonalRating');
const miValoracionContenedor = document.getElementById('miValoracionContenedor');
const detailSeasons = document.getElementById('detailSeasons');
const detailStatus = document.getElementById('detailStatus');
const detailNextEpisode = document.getElementById('detailNextEpisode');
const detailOverview = document.getElementById('detailOverview');
const detailActions = document.getElementById('detailActions');
const detailRecommendations = document.getElementById('detailRecommendations');
const detailCredits = document.getElementById('detailCredits');

const detailSeasonsWrapper = document.getElementById('detailSeasonsWrapper');
const detailSeasonsContent = document.getElementById('detailSeasonsContent');
const btnMarcarSerieDetalle = document.getElementById('btnMarcarSerieDetalle');

const modalPersona = document.getElementById('modalPersona');
const btnFilterNovedades = document.getElementById('btnFilterNovedades');
const btnFilterImdbRating = document.getElementById('btnFilterImdbRating');
const genreFilterSelect = document.getElementById('genreFilterSelect');
const sagaFilterSelect = document.getElementById('sagaFilterSelect');

// --- AUTENTICACIÓN ---
async function iniciarSesion() {
    const email = emailInput.value;
    const password = passInput.value;
    const { data, error } = await clienteSupabase.auth.signInWithPassword({ email, password });
    if (error) { alert("Error al iniciar sesión: " + error.message); } 
    else { usuarioActual = data.session.user; postLoginSetup(); }
}

async function crearCuenta() {
    const email = emailInput.value;
    const password = passInput.value;
    if (!email || password.length < 6) return alert('Introduce un correo válido y una contraseña de al menos 6 caracteres.');
    registerBtn.textContent = "Creando cuenta...";
    const { data, error } = await clienteSupabase.auth.signUp({ email, password });
    registerBtn.textContent = "Crear Nueva Cuenta";
    if (error) { alert("Error al registrar: " + error.message); } 
    else { alert("¡Cuenta creada! Iniciando sesión..."); if (data.session) { usuarioActual = data.session.user; postLoginSetup(); } }
}

async function comprobarSesion() {
    const { data: { session } } = await clienteSupabase.auth.getSession();
    if (session) { usuarioActual = session.user; postLoginSetup(); }
}

async function postLoginSetup() {
    authPanel.classList.add('hidden'); 
    userLogged.classList.remove('hidden');
    await actualizarIdsLocales(); 
    btnNavList.click(); 
}

logoutBtn.addEventListener('click', async () => {
    await clienteSupabase.auth.signOut();
    usuarioActual = null; miListaTMDBIDs = []; miBibliotecaLocal = [];
    authPanel.classList.remove('hidden'); userLogged.classList.add('hidden'); 
    emailInput.value = ''; passInput.value = '';
    btnNavList.click(); resultsGrid.innerHTML = ''; myListGrid.innerHTML = '';
});

loginBtn.addEventListener('click', iniciarSesion);
registerBtn.addEventListener('click', crearCuenta);
comprobarSesion();

// --- TECLA ESC ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { cerrarModalDetalle(); cerrarModalImportacion(); cerrarModalPersona(); }
});

// --- NAVEGACIÓN ---
btnNavSearch.addEventListener('click', () => {
    viewSearch.classList.remove('hidden'); viewList.classList.add('hidden');
    btnNavSearch.className = 'bg-gray-800/80 px-6 py-2 rounded-full font-bold text-sm text-white transition-all border border-gray-700 shadow';
    btnNavList.className = 'bg-transparent hover:bg-white/5 px-6 py-2 rounded-full font-bold text-sm text-gray-400 transition-all';
    searchInput.value = ''; resultsGrid.innerHTML = ''; pelisYSeries = []; searchSortBar.classList.add('hidden');
    setTimeout(() => { searchInput.focus(); }, 50);
});

btnNavList.addEventListener('click', () => {
    viewSearch.classList.add('hidden'); viewList.classList.remove('hidden');
    btnNavList.className = 'bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2 rounded-full font-bold text-sm text-white transition-all shadow-md shadow-indigo-500/25';
    btnNavSearch.className = 'bg-transparent hover:bg-white/5 px-6 py-2 rounded-full font-bold text-sm text-gray-400 transition-all';
    cargarMiLista();
});

// --- IMPORTACIÓN EN BLOQUE ---
function abrirModalImportacion() {
    if (!usuarioActual) return alert("¡Inicia sesión primero!");
    modalImport.classList.remove('hidden'); importTextarea.value = ''; importStatus.classList.add('hidden');
    btnProcesarImport.disabled = false; btnProcesarImport.classList.remove('opacity-50');
    btnProcesarImport.onclick = procesarImportacion; btnProcesarImport.textContent = "Comenzar Búsqueda";
    setTimeout(() => { importTextarea.focus(); }, 50);
}
function cerrarModalImportacion() { modalImport.classList.add('hidden'); }

async function procesarImportacion() {
    const lineas = importTextarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lineas.length === 0) return alert("Pega al menos un título.");
    btnProcesarImport.disabled = true; btnProcesarImport.classList.add('opacity-50'); importStatus.classList.remove('hidden');
    let procesados = 0, encontrados = 0;

    for (const titulo of lineas) {
        importStatus.textContent = `Buscando "${titulo}" (${procesados + 1}/${lineas.length})...`;
        try {
            const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(titulo)}&language=es-ES&page=1`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
            const data = await res.json();
            const resultadosValidos = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
            if (resultadosValidos.length > 0) {
                const item = resultadosValidos[0]; 
                if (!miListaTMDBIDs.includes(item.id)) {
                    await clienteSupabase.from('items').insert({ tmdb_id: item.id, title: item.title || item.name, type: item.media_type, poster_path: item.poster_path });
                    const { data: dbItem } = await clienteSupabase.from('items').select('id').eq('tmdb_id', item.id).eq('type', item.media_type).single();
                    await clienteSupabase.from('user_tracking').insert({ user_id: usuarioActual.id, item_id: dbItem.id, status: 'pendiente' });
                    miListaTMDBIDs.push(item.id); encontrados++;
                }
            }
        } catch(e) {}
        procesados++;
    }
    importStatus.textContent = `¡Búsqueda en bloque completada! Se añadieron ${encontrados} títulos a tu lista.`;
    btnProcesarImport.textContent = "Cerrar y ver mi lista"; btnProcesarImport.disabled = false; btnProcesarImport.classList.remove('opacity-50');
    btnProcesarImport.onclick = () => { cerrarModalImportacion(); btnNavList.click(); };
}

// --- EXCEL ---
function exportarAExcel() {
    if (!miBibliotecaLocal || miBibliotecaLocal.length === 0) return alert("No hay ningún elemento en tu lista para exportar.");
    const datosFormateados = miBibliotecaLocal.map(registro => {
        const item = registro.items; const details = registro.details || {};
        let progresoCapitulos = 'N/A';
        if (item.type === 'tv') {
            const totalOficial = calcularTotalCapitulosOficiales(details.seasons_data);
            const vistosCount = (registro.user_episodes || []).length;
            progresoCapitulos = `${vistosCount}/${totalOficial}`;
        }
        let estadoFormateado = 'Pendiente';
        if (registro.status === 'viendo') estadoFormateado = 'Viendo';
        if (registro.status === 'vista') estadoFormateado = 'Vista';

        return {
            'Título': item.title, 'Tipo': item.type === 'movie' ? 'Película' : 'Serie', 'Estado': estadoFormateado,
            'Mi Nota': (registro.personal_rating && registro.personal_rating > 0) ? registro.personal_rating : 'Sin nota',
            'Nota TMDB': details.rating || 'N/A', 'Nota IMDb': details.rating_imdb || 'N/A', 'Año': details.year || 'N/A', 'Saga / Colección': details.saga || 'N/A', 'Géneros': details.genres || 'N/A', 'Capítulos Vistos': progresoCapitulos,
            'Siguiente Episodio': details.next_episode || 'N/A', 'Temporadas': item.type === 'tv' ? (details.seasons_count || 0) : 'N/A',
            'Estado Emisión': item.type === 'tv' ? (details.is_ended ? 'Finalizada' : 'En emisión') : 'N/A',
            'Sinopsis': details.overview || '', 'TMDB ID': item.tmdb_id
        };
    });
    const hoja = XLSX.utils.json_to_sheet(datosFormateados);
    hoja['!cols'] = [ {wch: 32}, {wch: 10}, {wch: 12}, {wch: 10}, {wch: 12}, {wch: 12}, {wch: 8}, {wch: 22}, {wch: 22}, {wch: 18}, {wch: 12}, {wch: 15}, {wch: 55}, {wch: 10} ];
    const libro = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(libro, hoja, "Mi Lista");
    XLSX.writeFile(libro, `PeliSeries_MiLista_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// --- UTILIDADES ---
function formatearFecha(fechaStr) {
    if (!fechaStr) return ''; const partes = fechaStr.split('-'); if (partes.length !== 3) return fechaStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
function obtenerBandera(codigos) {
    if (!codigos || codigos.length === 0 || !codigos[0]) return '';
    let code = typeof codigos === 'string' ? codigos.split(',')[0] : codigos[0];
    if (typeof code === 'object' && code.iso_3166_1) code = code.iso_3166_1;
    if (typeof code !== 'string') return '';
    const flag = code.trim().toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
    return `${flag} ${code.trim()}`;
}

// --- DETECTOR INTELIGENTE DE SAGAS Y FRANQUICIAS ---
function determinarSaga(tmdbData) {
    let sagaStr = '';
    if (tmdbData.belongs_to_collection && tmdbData.belongs_to_collection.name) {
        sagaStr = tmdbData.belongs_to_collection.name.replace(/^Colección\s+/i, '');
    }

    const tituloLower = (tmdbData.title || tmdbData.name || '').toLowerCase();
    const productoras = (tmdbData.production_companies || []).map(c => (c.name || '').toLowerCase()).join(' ');

    if (productoras.includes('marvel') || tituloLower.includes('marvel') || tituloLower.includes('avengers') || tituloLower.includes('vengadores') || tituloLower.includes('spider-man') || tituloLower.includes('spiderman') || tituloLower.includes('thor') || tituloLower.includes('iron man') || tituloLower.includes('captain america') || tituloLower.includes('capitán américa') || tituloLower.includes('loki') || tituloLower.includes('wandavision') || tituloLower.includes('agatha') || tituloLower.includes('visionquest') || tituloLower.includes('vision quest') || tituloLower.includes('echo') || tituloLower.includes('daredevil') || tituloLower.includes('hawkeye') || tituloLower.includes('she-hulk') || tituloLower.includes('moon knight') || tituloLower.includes('secret invasion') || tituloLower.includes('guardians of the galaxy') || tituloLower.includes('guardianes de la galaxia') || tituloLower.includes('black panther') || tituloLower.includes('doctor strange') || tituloLower.includes('ant-man') || tituloLower.includes('deadpool') || tituloLower.includes('x-men')) {
        return 'Marvel';
    } 
    if (productoras.includes('lucasfilm') || tituloLower.includes('star wars') || tituloLower.includes('mandalorian') || tituloLower.includes('andor') || tituloLower.includes('boba fett') || tituloLower.includes('obi-wan') || tituloLower.includes('ahsoka') || tituloLower.includes('acolyte')) {
        return 'Star Wars';
    } 
    if (tituloLower.includes('anillos') || tituloLower.includes('hobbit') || tituloLower.includes('tierra media') || tituloLower.includes('lord of the rings') || tituloLower.includes('rings of power')) {
        return 'Tolkien / ESDLA';
    } 
    if (productoras.includes('dc entertainment') || productoras.includes('dc films') || productoras.includes('dc studios') || tituloLower.includes('batman') || tituloLower.includes('superman') || tituloLower.includes('dc ') || tituloLower.includes('justice league') || tituloLower.includes('joker') || tituloLower.includes('aquaman') || tituloLower.includes('wonder woman') || tituloLower.includes('peacemaker') || tituloLower.includes('penguin') || tituloLower.includes('pingüino')) {
        return 'DC Universe';
    } 
    if (tituloLower.includes('harry potter') || tituloLower.includes('animales fantásticos') || tituloLower.includes('fantastic beasts')) {
        return 'Harry Potter';
    }

    return sagaStr;
}

// --- ACCIONES DIRECTAS DE NAVEGACIÓN DESDE EL MODAL DETALLE ---
function filtrarPorGeneroDirecto(genero) {
    cerrarModalDetalle();
    if (viewList.classList.contains('hidden')) btnNavList.click();
    currentGenreFilter = genero;
    if (genreFilterSelect) genreFilterSelect.value = genero;
    aplicarFiltrosYDiseño();
}

function filtrarPorSagaDirecta(saga) {
    cerrarModalDetalle();
    if (viewList.classList.contains('hidden')) btnNavList.click();
    currentSagaFilter = saga;
    if (sagaFilterSelect) sagaFilterSelect.value = saga;
    aplicarFiltrosYDiseño();
}

// --- BUSCADOR ---
async function buscarEnTMDB(query) {
    const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=es-ES&page=1`;
    try {
        const response = await fetch(url, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const data = await response.json(); return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    } catch (error) { return []; }
}
async function ejecutarBusqueda() {
    const query = searchInput.value.trim();
    if (query.length > 0) {
        resultsGrid.innerHTML = '<p class="text-indigo-400 col-span-full text-center">Buscando...</p>';
        pelisYSeries = await buscarEnTMDB(query); searchSortBar.classList.remove('hidden'); renderResults(pelisYSeries);
    }
}
searchBtn.addEventListener('click', ejecutarBusqueda);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') ejecutarBusqueda(); });

document.querySelectorAll('.search-sort-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.search-sort-btn').forEach(b => { b.className = `search-sort-btn ${searchPillInactive}`; });
        e.target.className = `search-sort-btn ${searchPillActive}`; currentSearchSort = e.target.getAttribute('data-search-sort');
        renderResults(pelisYSeries);
    });
});

function renderResults(resultados) {
    resultsGrid.innerHTML = '';
    if (resultados.length === 0) return resultsGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center">Sin resultados.</p>';

    const ordenados = [...resultados].sort((a, b) => {
        if (currentSearchSort === 'title') { return (a.title || a.name || '').localeCompare(b.title || b.name || ''); } 
        else { return (b.vote_average || 0) - (a.vote_average || 0); }
    });

    ordenados.forEach(item => {
        const titulo = item.title || item.name;
        const isMovie = item.media_type === 'movie';
        
        const badgeTipo = isMovie 
            ? `<span class="bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">🍿 Película</span>`
            : `<span class="bg-amber-950/90 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">📺 Serie</span>`;

        const imgUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Poster';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
        const rawYear = (item.release_date || item.first_air_date || '').substring(0, 4);
        const yearBadge = rawYear ? `<span class="ml-1 text-gray-400 text-xs font-normal">(${rawYear})</span>` : '';

        const yaLaTengo = miListaTMDBIDs.includes(item.id);
        const botonAñadir = yaLaTengo 
            ? `<button disabled class="mt-auto w-full bg-green-950/60 text-green-400 py-2.5 rounded-xl text-xs font-bold border border-green-800/60">✓ En tu lista</button>`
            : `<button class="mt-auto w-full bg-gray-800 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 text-white py-2.5 rounded-xl text-xs font-semibold transition-all shadow border border-gray-700" onclick="event.stopPropagation(); añadirALista(${item.id})">+ Añadir a mi lista</button>`;

        const card = document.createElement('div');
        card.className = 'glass-panel rounded-2xl overflow-hidden shadow-xl hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all cursor-pointer group relative flex flex-col';
        card.onclick = () => abrirModalDetalleDesdeBusqueda(item.id);

        card.innerHTML = `
            <div class="relative aspect-[2/3] overflow-hidden bg-gray-950">
                <img src="${imgUrl}" alt="${titulo}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-yellow-500/20 shadow-md">⭐ ${rating}</span>
            </div>
            <div class="p-3.5 flex flex-col flex-grow bg-gray-900/60">
                <div class="mb-1.5">${badgeTipo}</div>
                <h3 class="font-bold text-sm leading-snug mb-3 line-clamp-2 group-hover:text-indigo-300 transition-colors">${titulo} ${yearBadge}</h3>
                ${botonAñadir}
            </div>
        `;
        resultsGrid.appendChild(card);
    });
}

// --- FILTROS DE LISTA ---
function updateBtnClassesSingle(selector, activeValue, dataAttr) {
    const baseClass = selector.replace('.', '');
    document.querySelectorAll(selector).forEach(btn => { btn.className = btn.getAttribute(dataAttr) === activeValue ? `${baseClass} ${btnPillActive}` : `${baseClass} ${btnPillInactive}`; });
}
function updateBtnClassesMulti(selector, activeArray, dataAttr) {
    const baseClass = selector.replace('.', '');
    document.querySelectorAll(selector).forEach(btn => { btn.className = activeArray.includes(btn.getAttribute(dataAttr)) ? `${baseClass} ${btnPillActive}` : `${baseClass} ${btnPillInactive}`; });
}

localSearchInput.addEventListener('input', (e) => { localSearchQuery = e.target.value.toLowerCase().trim(); aplicarFiltrosYDiseño(); });

if (genreFilterSelect) {
    genreFilterSelect.addEventListener('change', (e) => { 
        currentGenreFilter = e.target.value; 
        aplicarFiltrosYDiseño(); 
        e.target.blur(); 
    });
}

if (sagaFilterSelect) {
    sagaFilterSelect.addEventListener('change', (e) => { 
        currentSagaFilter = e.target.value; 
        aplicarFiltrosYDiseño(); 
        e.target.blur(); 
    });
}

document.querySelectorAll('.filter-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const sel = e.currentTarget.getAttribute('data-filter-type');
        if (filterTypes.includes(sel)) { if (filterTypes.length > 1) filterTypes = filterTypes.filter(t => t !== sel); } else { filterTypes.push(sel); }
        updateBtnClassesMulti('.filter-type-btn', filterTypes, 'data-filter-type'); aplicarFiltrosYDiseño();
    });
});
document.querySelectorAll('.filter-status-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentFilterStatus = e.currentTarget.getAttribute('data-filter-status');
        updateBtnClassesSingle('.filter-status-btn', currentFilterStatus, 'data-filter-status'); aplicarFiltrosYDiseño();
    });
});

document.getElementById('btnFilterRating').addEventListener('click', (e) => {
    filterRating8Plus = !filterRating8Plus; e.currentTarget.className = filterRating8Plus ? btnPillActive : btnPillInactive; aplicarFiltrosYDiseño();
});

btnFilterImdbRating.addEventListener('click', (e) => {
    filterImdbRating8Plus = !filterImdbRating8Plus; e.currentTarget.className = filterImdbRating8Plus ? btnPillActive : btnPillInactive; aplicarFiltrosYDiseño();
});

document.getElementById('btnFilterMyRating').addEventListener('click', (e) => {
    filterMyRating8Plus = !filterMyRating8Plus; e.currentTarget.className = filterMyRating8Plus ? btnPillActive : btnPillInactive; aplicarFiltrosYDiseño();
});

btnFilterNovedades.addEventListener('click', () => { filterNovedades = !filterNovedades; aplicarFiltrosYDiseño(); });
document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentSort = e.currentTarget.getAttribute('data-sort');
        updateBtnClassesSingle('.sort-btn', currentSort, 'data-sort'); aplicarFiltrosYDiseño();
    });
});

// --- GESTIÓN SUPABASE ---
async function actualizarIdsLocales() {
    const { data } = await clienteSupabase.from('user_tracking').select('items(tmdb_id)').eq('user_id', usuarioActual.id);
    if (data) miListaTMDBIDs = data.map(d => d.items.tmdb_id);
}
async function añadirALista(tmdb_id) {
    if (!usuarioActual) return alert("¡Inicia sesión primero!");
    const item = pelisYSeries.find(i => i.id === tmdb_id);
    await clienteSupabase.from('items').insert({ tmdb_id: item.id, title: item.title || item.name, type: item.media_type, poster_path: item.poster_path });
    const { data: dbItem } = await clienteSupabase.from('items').select('id').eq('tmdb_id', item.id).eq('type', item.media_type).single();
    await clienteSupabase.from('user_tracking').insert({ user_id: usuarioActual.id, item_id: dbItem.id, status: 'pendiente' });
    miListaTMDBIDs.push(item.id); renderResults(pelisYSeries);  
}
async function borrarDeMiLista(tracking_id, tmdb_id, titulo) {
    if (confirm(`¿Eliminar "${titulo}" de tu lista?`)) {
        await clienteSupabase.from('user_tracking').delete().eq('id', tracking_id);
        miListaTMDBIDs = miListaTMDBIDs.filter(id => id !== tmdb_id);
        cerrarModalDetalle(); cargarMiLista(); 
    }
}

// --- MI LISTA CON CACHÉ Y SINCRONIZACIÓN EN PARALELO ---
function calcularTotalCapitulosOficiales(seasonsData) {
    if (!seasonsData) return 0;
    let seasons = seasonsData;
    if (typeof seasons === 'string') { try { seasons = JSON.parse(seasons); } catch(e) { seasons = []; } }
    if (!Array.isArray(seasons)) return 0;
    return seasons.filter(s => s && s.season_number > 0).reduce((acc, s) => acc + (s.episode_count || 0), 0);
}

function recalcularSiguienteCapitulo(registro) {
    const estaViendo = registro.status === 'viendo';
    const tieneNovedades = registro.status === 'vista' && registro.has_new_episodes;

    if (registro.items.type !== 'tv' || (!estaViendo && !tieneNovedades)) {
        registro.details.next_episode = null;
        return;
    }

    let seasons = registro.details.seasons_data;
    if (typeof seasons === 'string') {
        try { seasons = JSON.parse(seasons); } catch(e) { seasons = []; }
    }

    if (!Array.isArray(seasons) || seasons.length === 0) {
        registro.details.next_episode = null;
        return;
    }

    const watched = registro.user_episodes || [];
    const validSeasons = seasons.filter(s => s && s.season_number > 0).sort((a,b) => a.season_number - b.season_number);
    
    for (const s of validSeasons) {
        let missingEp = 0;
        for (let e = 1; e <= s.episode_count; e++) {
            if (!watched.some(w => w.season_number === s.season_number && w.episode_number === e)) { 
                missingEp = e; 
                break; 
            }
        }
        if (missingEp > 0) { 
            registro.details.next_episode = `T${s.season_number}x${missingEp.toString().padStart(2, '0')}`; 
            return; 
        }
    }
    registro.details.next_episode = null;
}

function actualizarOpcionesSelectorGeneros() {
    if (!genreFilterSelect) return;
    const generosUnicos = new Set();
    miBibliotecaLocal.forEach(r => {
        if (r.details && r.details.genres) {
            r.details.genres.split(',').forEach(g => generosUnicos.add(g.trim()));
        }
    });

    const listaOrdenada = Array.from(generosUnicos).sort();
    const claveGeneros = listaOrdenada.join('|');
    
    if (genreFilterSelect.dataset.lastGenres === claveGeneros) {
        genreFilterSelect.value = generosUnicos.has(currentGenreFilter) ? currentGenreFilter : 'all';
        return;
    }
    genreFilterSelect.dataset.lastGenres = claveGeneros;

    genreFilterSelect.innerHTML = '<option value="all" class="bg-gray-900 text-gray-300">🎭 Todos los géneros</option>';
    listaOrdenada.forEach(g => {
        if (g) genreFilterSelect.innerHTML += `<option value="${g}" class="bg-gray-900 text-gray-300">${g}</option>`;
    });

    genreFilterSelect.value = generosUnicos.has(currentGenreFilter) ? currentGenreFilter : 'all';
    if (!generosUnicos.has(currentGenreFilter)) currentGenreFilter = 'all';
}

function actualizarOpcionesSelectorSagas() {
    if (!sagaFilterSelect) return;
    const sagasUnicas = new Set();
    miBibliotecaLocal.forEach(r => {
        if (r.details && r.details.saga) {
            sagasUnicas.add(r.details.saga.trim());
        }
    });

    const listaOrdenada = Array.from(sagasUnicas).sort();
    const claveSagas = listaOrdenada.join('|');

    if (sagaFilterSelect.dataset.lastSagas === claveSagas) {
        sagaFilterSelect.value = sagasUnicas.has(currentSagaFilter) ? currentSagaFilter : 'all';
        return;
    }
    sagaFilterSelect.dataset.lastSagas = claveSagas;

    sagaFilterSelect.innerHTML = '<option value="all" class="bg-gray-900 text-gray-300">🪐 Todas las sagas</option>';
    listaOrdenada.forEach(s => {
        if (s) sagaFilterSelect.innerHTML += `<option value="${s}" class="bg-gray-900 text-gray-300">${s}</option>`;
    });

    sagaFilterSelect.value = sagasUnicas.has(currentSagaFilter) ? currentSagaFilter : 'all';
    if (!sagasUnicas.has(currentSagaFilter)) currentSagaFilter = 'all';
}

async function cargarMiLista() {
    if (!usuarioActual) return;
    myListGrid.innerHTML = '<p class="text-indigo-400 col-span-full text-center py-8">Cargando biblioteca personal...</p>';

    const { data, error } = await clienteSupabase.from('user_tracking')
        .select(`*, items ( id, tmdb_id, title, type, poster_path, rating_tmdb, rating_imdb, runtime, country, genres, year, saga, seasons_data, api_updated_at ), user_episodes (season_number, episode_number)`)
        .eq('user_id', usuarioActual.id);

    if (error || !data || data.length === 0) { 
        miBibliotecaLocal = []; 
        return myListGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center py-8">Aún no has guardado elementos.</p>'; 
    }

    const itemsParaSincronizar = [];

    miBibliotecaLocal = data.map(registro => {
        const item = registro.items;
        
        let ratingTmdbStr = (item.rating_tmdb !== null && item.rating_tmdb !== undefined) 
            ? Number(item.rating_tmdb).toFixed(1) 
            : 'N/A';

        let rawSeasons = item.seasons_data || [];
        if (typeof rawSeasons === 'string') {
            try { rawSeasons = JSON.parse(rawSeasons); } catch(e) { rawSeasons = []; }
        }

        registro.details = {
            rating: ratingTmdbStr,
            rating_imdb: (item.rating_imdb !== null && item.rating_imdb !== undefined) ? Number(item.rating_imdb).toFixed(1) : null,
            runtime: item.runtime || null,
            country: item.country || '',
            genres: item.genres || '',
            year: item.year || '',
            saga: item.saga || '',
            overview: 'Haz clic para ver detalles.',
            seasons_count: Array.isArray(rawSeasons) ? rawSeasons.filter(s => s && s.season_number > 0).length : 0,
            is_ended: false,
            seasons_data: rawSeasons,
            next_episode: null
        };

        if (item.type === 'tv') {
            const totalCapitulosTMDB = calcularTotalCapitulosOficiales(rawSeasons);
            const totalVistosUsuario = (registro.user_episodes || []).length;
            if (totalCapitulosTMDB > totalVistosUsuario && registro.status === 'vista') {
                registro.has_new_episodes = true;
            } else {
                registro.has_new_episodes = false;
            }
            recalcularSiguienteCapitulo(registro);
        }

        const haceSieteDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const estaCaducado = !item.api_updated_at || new Date(item.api_updated_at) < haceSieteDias;
        if (estaCaducado || item.rating_imdb === null || item.rating_imdb === undefined || item.rating_tmdb === null || !item.genres || !item.year || item.saga === undefined || (item.type === 'tv' && (!rawSeasons || rawSeasons.length === 0))) {
            itemsParaSincronizar.push(registro);
        }

        return registro;
    });

    actualizarOpcionesSelectorGeneros();
    actualizarOpcionesSelectorSagas();
    aplicarFiltrosYDiseño();

    if (itemsParaSincronizar.length > 0) {
        const loteSesion = itemsParaSincronizar.slice(0, 20);
        sincronizarEnSegundoPlano(loteSesion);
    }
}

// Sincronización acelerada en lotes de 4
async function sincronizarEnSegundoPlano(registros) {
    const TAMANO_LOTE = 4;
    for (let i = 0; i < registros.length; i += TAMANO_LOTE) {
        const lote = registros.slice(i, i + TAMANO_LOTE);
        
        await Promise.all(lote.map(async (reg) => {
            const item = reg.items;
            try {
                const endpoint = item.type === 'movie' ? `movie/${item.tmdb_id}` : `tv/${item.tmdb_id}`;
                const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?language=es-ES&append_to_response=external_ids`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
                if (!res.ok) return;
                const tmdbData = await res.json();

                let ratingTmdb = tmdbData.vote_average ? parseFloat(tmdbData.vote_average.toFixed(1)) : null;
                let duracion = tmdbData.runtime || (tmdbData.episode_run_time && tmdbData.episode_run_time[0]) || null;
                const codigosPais = tmdbData.origin_country || (tmdbData.production_countries ? tmdbData.production_countries.map(c=>c.iso_3166_1) : []);
                let paisStr = Array.isArray(codigosPais) ? codigosPais.join(',') : (codigosPais || '');
                let generosStr = tmdbData.genres ? tmdbData.genres.map(g => g.name).join(', ') : '';
                let rawYear = (tmdbData.release_date || tmdbData.first_air_date || '').substring(0, 4);

                let sagaStr = determinarSaga(tmdbData);
                let seasonsData = item.type === 'tv' ? (tmdbData.seasons || []) : null;

                let ratingImdb = null;
                let imdbId = tmdbData.imdb_id || (tmdbData.external_ids && tmdbData.external_ids.imdb_id);

                if (imdbId && OMDB_TOKEN && OMDB_TOKEN.trim() !== '') {
                    try {
                        const omdbRes = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_TOKEN.trim()}`);
                        const omdbData = await omdbRes.json();
                        if (omdbData.Response === "True" && omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
                            ratingImdb = parseFloat(omdbData.imdbRating);
                        }
                    } catch(e) {}
                }

                const { error: errUp } = await clienteSupabase.from('items').update({
                    rating_tmdb: ratingTmdb,
                    rating_imdb: ratingImdb,
                    runtime: duracion,
                    country: paisStr,
                    genres: generosStr,
                    year: rawYear,
                    saga: sagaStr,
                    seasons_data: seasonsData,
                    api_updated_at: new Date().toISOString()
                }).eq('id', item.id);

                if (errUp) console.error("Error al guardar en Supabase para item ID:", item.id, errUp);

                const idx = miBibliotecaLocal.findIndex(r => r.id === reg.id);
                if (idx > -1) {
                    if (ratingTmdb) miBibliotecaLocal[idx].details.rating = ratingTmdb.toFixed(1);
                    if (ratingImdb) miBibliotecaLocal[idx].details.rating_imdb = ratingImdb.toFixed(1);
                    miBibliotecaLocal[idx].details.country = paisStr;
                    miBibliotecaLocal[idx].details.runtime = duracion;
                    miBibliotecaLocal[idx].details.genres = generosStr;
                    miBibliotecaLocal[idx].details.year = rawYear;
                    miBibliotecaLocal[idx].details.saga = sagaStr;

                    if (item.type === 'tv') {
                        miBibliotecaLocal[idx].details.seasons_data = seasonsData || [];
                        miBibliotecaLocal[idx].details.seasons_count = tmdbData.number_of_seasons || 0;
                        miBibliotecaLocal[idx].details.is_ended = (tmdbData.status === 'Ended' || tmdbData.status === 'Canceled');
                        
                        const totalCapitulosTMDB = calcularTotalCapitulosOficiales(seasonsData);
                        const totalVistosUsuario = (miBibliotecaLocal[idx].user_episodes || []).length;
                        
                        if (totalCapitulosTMDB > totalVistosUsuario && miBibliotecaLocal[idx].status === 'vista') {
                            miBibliotecaLocal[idx].has_new_episodes = true;
                        } else {
                            miBibliotecaLocal[idx].has_new_episodes = false;
                        }

                        recalcularSiguienteCapitulo(miBibliotecaLocal[idx]);
                    }
                }
            } catch(e) { console.error("Error en petición TMDB:", e); }
        }));

        actualizarOpcionesSelectorGeneros();
        actualizarOpcionesSelectorSagas();
        aplicarFiltrosYDiseño();
        await new Promise(r => setTimeout(r, 200));
    }
}

function aplicarFiltrosYDiseño() {
    const hayNovedades = miBibliotecaLocal.some(r => r.has_new_episodes);
    if (hayNovedades) {
        btnFilterNovedades.classList.remove('hidden');
        btnFilterNovedades.className = filterNovedades 
            ? 'px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all bg-gradient-to-r from-pink-600 to-red-500 text-white shadow-[0_0_15px_rgba(219,39,119,0.6)] flex items-center gap-1'
            : 'px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all bg-pink-950/40 text-pink-400 border border-pink-800/50 hover:bg-pink-900/60 flex items-center gap-1 animate-pulse';
    } else {
        btnFilterNovedades.classList.add('hidden'); filterNovedades = false; 
    }

    let dataFiltrada = miBibliotecaLocal.filter(registro => {
        const matchType = filterTypes.includes(registro.items.type);
        const matchStatus = currentFilterStatus === 'all' || registro.status === currentFilterStatus;
        let matchRating = !filterRating8Plus || (parseFloat(registro.details.rating) >= 8);
        
        let matchImdbRating = true;
        if (filterImdbRating8Plus) {
            const rImdb = parseFloat(registro.details.rating_imdb);
            if (isNaN(rImdb) || rImdb < 8) matchImdbRating = false;
        }

        let matchGenre = true;
        if (currentGenreFilter !== 'all') {
            const generosItem = (registro.details.genres || '').split(',').map(g => g.trim());
            matchGenre = generosItem.includes(currentGenreFilter);
        }

        let matchSaga = true;
        if (currentSagaFilter !== 'all') {
            matchSaga = (registro.details.saga || '').trim() === currentSagaFilter.trim();
        }

        let matchMyRating = !filterMyRating8Plus || ((registro.personal_rating || 0) >= 8);
        let matchSearch = localSearchQuery === '' || registro.items.title.toLowerCase().includes(localSearchQuery);
        let matchNovedades = !filterNovedades || registro.has_new_episodes;
        
        return matchType && matchStatus && matchRating && matchImdbRating && matchGenre && matchSaga && matchMyRating && matchSearch && matchNovedades;
    });

    dataFiltrada.sort((a, b) => {
        if (currentSort === 'recent') {
            if (a.has_new_episodes && !b.has_new_episodes) return -1;
            if (!a.has_new_episodes && b.has_new_episodes) return 1;
            return new Date(b.updated_at || b.created_at || b.updated_local || 0).getTime() - new Date(a.updated_at || a.created_at || a.updated_local || 0).getTime();
        } else if (currentSort === 'title') { return a.items.title.localeCompare(b.items.title);
        } else { return (parseFloat(b.details.rating) || 0) - (parseFloat(a.details.rating) || 0); }
    });
    pintarMiLista(dataFiltrada);
}

function pintarMiLista(dataArray) {
    myListGrid.innerHTML = '';
    if (dataArray.length === 0) return myListGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center py-8">No hay resultados.</p>';

    dataArray.forEach(registro => {
        const item = registro.items; const details = registro.details;
        const imgUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Poster';
        
        const isMovie = item.type === 'movie';
        
        const badgeTipo = isMovie 
            ? `<span class="bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">🍿 Película</span>`
            : `<span class="bg-amber-950/90 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">📺 Serie</span>`;

        const yearBadge = details.year ? `<span class="ml-1 text-gray-400 text-xs font-normal">(${details.year})</span>` : '';
        const sagaBadge = details.saga ? `<span class="text-[10px] text-amber-300 font-bold block truncate mt-0.5">🪐 ${details.saga}</span>` : '';
        const genresBadge = details.genres ? `<span class="text-[10px] text-purple-300/80 font-medium block truncate mt-0.5">🎭 ${details.genres}</span>` : '';
        const runtimeBadge = (isMovie && details.runtime) ? `<span class="text-[10px] text-gray-400 font-medium block">⏳ ${details.runtime} min</span>` : '';

        let badgeSerie = ''; let badgeNextEpisode = '';
        const miNotaBadge = (registro.personal_rating > 0) 
            ? `<span class="absolute top-2 left-2 bg-blue-900/90 backdrop-blur-md text-blue-300 text-[11px] font-black px-2 py-1 rounded-lg border border-blue-500/50 shadow-md shadow-blue-900/50">★ ${registro.personal_rating}</span>` : '';

        const imdbBadge = details.rating_imdb 
            ? `<span class="bg-black/80 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-500/30 shadow-md">🎬 ${details.rating_imdb}</span>`
            : `<span class="bg-black/60 backdrop-blur-md text-gray-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-700/50 shadow-md">🎬 --</span>`;

        if (!isMovie) {
            const estadoTexto = details.is_ended ? '🔴 Fin' : '🟢 Emisión';
            badgeSerie = `<span class="text-[10px] text-gray-400 font-medium block mt-1 tracking-wide">${details.seasons_count > 0 ? details.seasons_count + ' Temp. • ' : ''}${estadoTexto}</span>`;
            if (details.next_episode) badgeNextEpisode = `<div class="mt-1.5"><span class="inline-block text-[9px] sm:text-[10px] font-bold bg-indigo-950/80 text-indigo-300 px-2.5 py-0.5 rounded-lg border border-indigo-700/50 shadow-sm">▶ Siguiente: ${details.next_episode}</span></div>`;
        }

        let selectClass = "w-full text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 border outline-none transition-colors cursor-pointer shadow-inner ";
        let ringClass = ""; let badgeNewSeason = "";

        if (registro.has_new_episodes) {
            ringClass = "ring-2 ring-pink-500 shadow-[0_0_15px_rgba(219,39,119,0.3)]";
            badgeNewSeason = `<span class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg z-10 animate-pulse whitespace-nowrap">🔥 NUEVOS CAPÍTULOS</span>`;
            selectClass += "bg-green-950/50 text-green-400 border-green-800/60 opacity-80";
        } else if (registro.status === 'vista') { selectClass += "bg-green-950/50 hover:bg-green-900/60 text-green-400 border-green-800/60";
        } else if (registro.status === 'viendo') { selectClass += "bg-yellow-950/50 hover:bg-yellow-900/60 text-yellow-400 border-yellow-800/60";
        } else { selectClass += "bg-gray-900/90 hover:bg-gray-800 text-gray-300 border-gray-700"; }

        const card = document.createElement('div');
        card.className = `glass-panel rounded-2xl overflow-hidden shadow-xl hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col relative ${ringClass}`;
        card.onclick = () => abrirModalDetalleDesdeLista(registro.id);
        
        card.innerHTML = `
            <div class="relative aspect-[2/3] overflow-hidden bg-gray-950">
                <img src="${imgUrl}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                ${miNotaBadge}
                <div class="absolute top-2 right-2 flex flex-col items-end gap-1">
                    <span class="bg-black/80 backdrop-blur-md text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-yellow-500/20 shadow-md">⭐ ${details.rating}</span>
                    ${imdbBadge}
                </div>
                ${badgeNewSeason}
            </div>
            <div class="p-3.5 flex flex-col flex-grow bg-gray-900/60">
                <div class="flex items-center justify-between mb-1">
                    ${badgeTipo}
                    ${runtimeBadge}
                </div>
                <h3 class="font-bold text-sm leading-snug mb-0.5 line-clamp-2 group-hover:text-indigo-300 transition-colors">${item.title} ${yearBadge}</h3>
                ${sagaBadge}
                ${genresBadge}
                ${badgeSerie}
                ${badgeNextEpisode}
                <div class="mt-auto pt-4" onclick="event.stopPropagation()">
                    <select onchange="cambiarEstado(this, '${registro.id}', ${item.tmdb_id}, '${item.type}', '${item.title.replace(/'/g, "\\'")}')" class="${selectClass}">
                        <option value="pendiente" ${registro.status === 'pendiente' ? 'selected' : ''} class="bg-gray-900 text-gray-300">⏳ Pendiente</option>
                        <option value="viendo" ${registro.status === 'viendo' ? 'selected' : ''} class="bg-gray-900 text-gray-300">👀 Viendo</option>
                        <option value="vista" ${registro.status === 'vista' ? 'selected' : ''} class="bg-gray-900 text-gray-300">✅ Vista</option>
                    </select>
                </div>
            </div>
        `;
        myListGrid.appendChild(card);
    });
}

// --- DETALLES Y EXTRACCIÓN AVANZADA (OMDb + TMDB) ---
function cerrarModalDetalle() { 
    modalDetalle.classList.add('hidden'); currentDetailTrackingId = null; 
    detailSeasonsWrapper.classList.add('hidden'); detailSeasonsContent.innerHTML = '';
    detailNextEpisode.classList.add('hidden');
}

async function cargarDatosAvanzados(tmdb_id, tipo) {
    detailCountry.textContent = ''; 
    detailRuntime.classList.add('hidden'); 
    detailGenres.classList.add('hidden');
    detailSaga.classList.add('hidden');
    detailNextEpisode.classList.add('hidden');
    detailExtraInfo.classList.add('hidden'); 
    detailExtraInfo.innerHTML = '';

    try {
        const endpoint = tipo === 'movie' ? `movie/${tmdb_id}` : `tv/${tmdb_id}`;
        const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?language=es-ES&append_to_response=external_ids`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const dataFull = await res.json();

        if (dataFull.overview) detailOverview.textContent = dataFull.overview;
        const yearStr = (dataFull.release_date || dataFull.first_air_date || '').substring(0, 4);
        if (yearStr) detailYear.textContent = `(${yearStr})`;

        // Hipervínculos interactivos para Géneros
        if (dataFull.genres && dataFull.genres.length > 0) {
            detailGenres.innerHTML = dataFull.genres.map(g => `
                <button onclick="filtrarPorGeneroDirecto('${g.name.replace(/'/g, "\\'")}')" class="bg-purple-950/80 hover:bg-purple-800 text-purple-200 border border-purple-700/60 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 hover:scale-105 cursor-pointer">
                    🎭 ${g.name}
                </button>
            `).join('');
            detailGenres.classList.remove('hidden');
        }

        // Detección de Saga
        let sagaStr = determinarSaga(dataFull);
        if (sagaStr) {
            detailSaga.innerHTML = `
                <button onclick="filtrarPorSagaDirecta('${sagaStr.replace(/'/g, "\\'")}')" class="bg-amber-950/90 hover:bg-amber-800 text-amber-200 border border-amber-700/70 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 hover:scale-105 cursor-pointer">
                    🪐 Saga: ${sagaStr}
                </button>
            `;
            detailSaga.classList.remove('hidden');
        }

        let duracion = dataFull.runtime || (dataFull.episode_run_time && dataFull.episode_run_time[0]);
        const codigosPais = dataFull.origin_country || (dataFull.production_countries ? dataFull.production_countries.map(c=>c.iso_3166_1) : []);
        detailCountry.textContent = obtenerBandera(codigosPais);

        let imdbId = dataFull.imdb_id || (dataFull.external_ids && dataFull.external_ids.imdb_id);
        
        if (imdbId && OMDB_TOKEN && OMDB_TOKEN.trim() !== '') {
            try {
                const omdbRes = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_TOKEN.trim()}&lang=es`);
                const omdbData = await omdbRes.json();

                if (omdbData.Response === "True") {
                    if (omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
                        detailImdbRating.innerHTML = `🎬 IMDb: <span class="text-white">${omdbData.imdbRating}</span>`;
                        detailImdbRating.classList.remove('hidden');

                        const ratingNum = parseFloat(omdbData.imdbRating);
                        const idx = miBibliotecaLocal.findIndex(r => r.items.tmdb_id === tmdb_id);
                        if (idx > -1) {
                            miBibliotecaLocal[idx].details.rating_imdb = ratingNum.toFixed(1);
                            await clienteSupabase.from('items').update({ rating_imdb: ratingNum }).eq('id', miBibliotecaLocal[idx].items.id);
                            aplicarFiltrosYDiseño();
                        }
                    }
                    if (!duracion && omdbData.Runtime && omdbData.Runtime !== 'N/A') duracion = parseInt(omdbData.Runtime);
                    
                    let htmlExtra = '';
                    if (omdbData.Awards && omdbData.Awards !== 'N/A') htmlExtra += `<p class="mb-1.5"><span class="font-bold text-gray-400 uppercase tracking-wide">🏆 Premios:</span> <span class="text-gray-200 ml-1">${omdbData.Awards}</span></p>`;
                    if (omdbData.BoxOffice && omdbData.BoxOffice !== 'N/A') htmlExtra += `<p class="mb-1.5"><span class="font-bold text-gray-400 uppercase tracking-wide">💰 Recaudación:</span> <span class="text-gray-200 ml-1">${omdbData.BoxOffice}</span></p>`;
                    if (omdbData.Writer && omdbData.Writer !== 'N/A') htmlExtra += `<p class="mb-1.5"><span class="font-bold text-gray-400 uppercase tracking-wide">✍️ Guion:</span> <span class="text-gray-200 ml-1">${omdbData.Writer}</span></p>`;
                    
                    if (htmlExtra !== '') { detailExtraInfo.innerHTML = htmlExtra; detailExtraInfo.classList.remove('hidden'); }
                }
            } catch(e) {}
        }

        if (duracion && duracion > 0) {
            detailRuntime.textContent = `⏳ ${duracion} min`;
            detailRuntime.classList.remove('hidden');
        }

        if (tipo === 'tv') {
            const totalTemp = dataFull.number_of_seasons || 0;
            const isEnded = (dataFull.status === 'Ended' || dataFull.status === 'Canceled');
            const seasonsData = dataFull.seasons || [];
            
            detailSeasons.textContent = `${totalTemp} Temporada${totalTemp !== 1 ? 's' : ''}`;
            detailSeasons.classList.remove('hidden');
            detailStatus.textContent = isEnded ? '🔴 Finalizada' : '🟢 En emisión';
            detailStatus.classList.remove('hidden');

            const idx = miBibliotecaLocal.findIndex(r => r.items.tmdb_id === tmdb_id);
            if (idx > -1) {
                miBibliotecaLocal[idx].details.seasons_data = seasonsData;
                miBibliotecaLocal[idx].details.seasons_count = totalTemp;
                miBibliotecaLocal[idx].details.is_ended = isEnded;
                miBibliotecaLocal[idx].details.saga = sagaStr;

                const totalCapitulosTMDB = calcularTotalCapitulosOficiales(seasonsData);
                const totalVistosUsuario = (miBibliotecaLocal[idx].user_episodes || []).length;
                if (totalCapitulosTMDB > totalVistosUsuario && miBibliotecaLocal[idx].status === 'vista') {
                    miBibliotecaLocal[idx].has_new_episodes = true;
                } else {
                    miBibliotecaLocal[idx].has_new_episodes = false;
                }

                recalcularSiguienteCapitulo(miBibliotecaLocal[idx]);

                const { error: errModal } = await clienteSupabase.from('items').update({
                    seasons_data: seasonsData,
                    saga: sagaStr
                }).eq('id', miBibliotecaLocal[idx].items.id);

                if (errModal) console.error("Error al guardar temporadas en Supabase desde el modal:", errModal);

                if (miBibliotecaLocal[idx].details.next_episode) {
                    detailNextEpisode.textContent = `▶ Siguiente: ${miBibliotecaLocal[idx].details.next_episode}`;
                    detailNextEpisode.classList.remove('hidden');
                } else {
                    detailNextEpisode.classList.add('hidden');
                }
                aplicarFiltrosYDiseño();
            }
        } else {
            detailSeasons.classList.add('hidden');
            detailStatus.classList.add('hidden');
            detailNextEpisode.classList.add('hidden');
        }
    } catch(e) {}
}

async function cargarCreditos(tmdb_id, tipo) {
    detailCredits.innerHTML = '<span class="text-xs text-gray-500">Cargando ficha técnica...</span>';
    try {
        const res = await fetch(`https://api.themoviedb.org/3/${tipo}/${tmdb_id}/credits?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const data = await res.json();
        const director = data.crew.find(c => c.job === 'Director') || data.crew.find(c => c.department === 'Directing');
        const musico = data.crew.find(c => c.job === 'Original Music Composer' || c.job === 'Music');
        const reparto = data.cast.slice(0, 6);

        let html = '';
        if (director) html += crearPillPersona('🎬 Dirección', director);
        if (musico) html += crearPillPersona('🎵 Música', musico);
        if (reparto.length > 0) {
            html += `<div class="flex flex-wrap items-center gap-2 mt-1"><span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">🎭 Reparto:</span>`;
            reparto.forEach(actor => { html += generarBotonPersona(actor); }); html += `</div>`;
        }
        if (html === '') html = '<span class="text-xs text-gray-500">Sin datos.</span>';
        detailCredits.innerHTML = html;
    } catch(e) { detailCredits.innerHTML = ''; }
}

function crearPillPersona(rol, persona) { return `<div class="flex items-center gap-2 mb-1"><span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${rol}:</span>${generarBotonPersona(persona)}</div>`; }
function generarBotonPersona(persona) { return `<button onclick="abrirModalPersona(${persona.id}, '${persona.name.replace(/'/g, "\\'")}')" class="bg-gray-800/80 hover:bg-indigo-600 text-gray-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-600/50 transition-colors shadow-sm flex items-center gap-1.5"><span class="text-indigo-400">👤</span> ${persona.name}</button>`; }

async function abrirModalDetalleDirecto(tmdb_id, tipo) {
    cerrarModalDetalle();
    try {
        const res = await fetch(`https://api.themoviedb.org/3/${tipo}/${tmdb_id}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const item = await res.json(); item.media_type = tipo; 
        if (!pelisYSeries.find(i => i.id === tmdb_id)) pelisYSeries.push(item);
        abrirModalDetalleDesdeBusqueda(tmdb_id);
    } catch(e) { }
}

async function cargarRecomendaciones(tmdb_id, tipo) {
    detailRecommendations.innerHTML = '<p class="text-xs text-gray-500">Cargando...</p>';
    try {
        const res = await fetch(`https://api.themoviedb.org/3/${tipo}/${tmdb_id}/recommendations?language=es-ES&page=1`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const data = await res.json();
        if (data.results.length === 0) { detailRecommendations.innerHTML = '<p class="text-xs text-gray-500">No hay recomendaciones.</p>'; return; }
        detailRecommendations.innerHTML = '';
        data.results.slice(0, 10).forEach(rec => {
            const img = rec.poster_path ? `https://image.tmdb.org/t/p/w200${rec.poster_path}` : 'https://via.placeholder.com/200x300/1f2937/ffffff?text=X';
            const recTipo = rec.media_type || tipo;
            const rating = rec.vote_average ? rec.vote_average.toFixed(1) : '-';
            detailRecommendations.innerHTML += `
                <div class="flex-shrink-0 w-24 cursor-pointer group" onclick="abrirModalDetalleDirecto(${rec.id}, '${recTipo}')">
                    <div class="relative">
                        <img src="${img}" class="w-full h-36 object-cover rounded-xl shadow-md border border-transparent group-hover:border-indigo-500 transition-all">
                        <span class="absolute top-1 right-1 bg-black/80 backdrop-blur-md text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md border border-yellow-500/20">⭐ ${rating}</span>
                    </div>
                    <p class="text-[10px] font-semibold text-gray-400 mt-2 truncate group-hover:text-indigo-400">${rec.title || rec.name}</p>
                </div>
            `;
        });
    } catch(e) { detailRecommendations.innerHTML = '<p class="text-xs text-red-500">Error al cargar.</p>'; }
}

async function abrirModalDetalleDesdeBusqueda(tmdb_id) {
    const item = pelisYSeries.find(i => i.id === tmdb_id); if (!item) return;
    modalDetalle.classList.remove('hidden'); miValoracionContenedor.classList.add('hidden'); detailNextEpisode.classList.add('hidden');
    
    detailTitle.textContent = item.title || item.name;
    
    const isMovie = item.media_type === 'movie';
    detailBadgeType.textContent = isMovie ? 'Película' : 'Serie';
    detailBadgeType.className = isMovie 
        ? 'text-xs font-bold uppercase px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700'
        : 'text-xs font-bold uppercase px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700';

    const yearStr = (item.release_date || item.first_air_date || '').substring(0, 4);
    detailYear.textContent = yearStr ? `(${yearStr})` : '';
    
    detailPoster.src = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Poster';
    detailRating.textContent = `⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}`;
    detailImdbRating.classList.add('hidden');
    detailOverview.textContent = item.overview || 'Sin descripción disponible en español.';
    detailSeasons.classList.add('hidden'); detailStatus.classList.add('hidden');

    cargarDatosAvanzados(tmdb_id, item.media_type);

    const yaLaTengo = miListaTMDBIDs.includes(item.id);
    detailActions.innerHTML = yaLaTengo
        ? `<button disabled class="w-full bg-green-950/60 text-green-400 py-3 rounded-xl text-sm font-bold border border-green-800">✓ Ya está en tu biblioteca</button>`
        : `<button onclick="añadirALista(${item.id}); cerrarModalDetalle();" class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white py-3 rounded-xl text-sm font-bold transition-colors shadow">+ Añadir a mi lista</button>`;

    cargarCreditos(tmdb_id, item.media_type); cargarRecomendaciones(tmdb_id, item.media_type);
    if (item.media_type === 'tv') renderizarTemporadas(tmdb_id, null, item.title || item.name);
    else detailSeasonsWrapper.classList.add('hidden');
}

function abrirModalDetalleDesdeLista(tracking_id) {
    const registro = miBibliotecaLocal.find(r => r.id === tracking_id); if (!registro) return;
    currentDetailTrackingId = tracking_id; const item = registro.items; const details = registro.details;

    modalDetalle.classList.remove('hidden'); miValoracionContenedor.classList.remove('hidden'); miValoracionContenedor.classList.add('flex');
    detailPersonalRating.value = registro.personal_rating || '0';
    detailTitle.textContent = item.title;
    
    const isMovie = item.type === 'movie';
    detailBadgeType.textContent = isMovie ? 'Película' : 'Serie';
    detailBadgeType.className = isMovie 
        ? 'text-xs font-bold uppercase px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700'
        : 'text-xs font-bold uppercase px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700';

    detailSeasons.classList.add('hidden');
    detailStatus.classList.add('hidden');
    detailNextEpisode.classList.add('hidden');
    
    detailYear.textContent = details.year ? `(${details.year})` : '';
    detailPoster.src = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Poster';
    detailRating.textContent = `⭐ ${details.rating}`;

    if (details.next_episode) {
        detailNextEpisode.textContent = `▶ Siguiente: ${details.next_episode}`;
        detailNextEpisode.classList.remove('hidden');
    }

    // Géneros interactivos desde datos locales
    if (details.genres) {
        detailGenres.innerHTML = details.genres.split(',').map(g => `
            <button onclick="filtrarPorGeneroDirecto('${g.trim().replace(/'/g, "\\'")}')" class="bg-purple-950/80 hover:bg-purple-800 text-purple-200 border border-purple-700/60 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 hover:scale-105 cursor-pointer">
                🎭 ${g.trim()}
            </button>
        `).join('');
        detailGenres.classList.remove('hidden');
    } else {
        detailGenres.classList.add('hidden');
    }

    // Saga interactiva desde datos locales
    if (details.saga) {
        detailSaga.innerHTML = `
            <button onclick="filtrarPorSagaDirecta('${details.saga.replace(/'/g, "\\'")}')" class="bg-amber-950/90 hover:bg-amber-800 text-amber-200 border border-amber-700/70 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 hover:scale-105 cursor-pointer">
                🪐 Saga: ${details.saga}
            </button>
        `;
        detailSaga.classList.remove('hidden');
    } else {
        detailSaga.classList.add('hidden');
    }
    
    if (details.rating_imdb && details.rating_imdb !== 'N/A') {
        detailImdbRating.innerHTML = `🎬 IMDb: <span class="text-white">${details.rating_imdb}</span>`;
        detailImdbRating.classList.remove('hidden');
    } else {
        detailImdbRating.classList.add('hidden');
    }

    detailOverview.textContent = 'Cargando descripción...';

    cargarDatosAvanzados(item.tmdb_id, item.type);

    detailActions.innerHTML = `<button onclick="borrarDeMiLista('${registro.id}', ${item.tmdb_id}, '${item.title.replace(/'/g, "\\'")}')" class="w-full bg-red-950/60 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/60 px-5 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">🗑️ Eliminar de mi lista</button>`;

    cargarCreditos(item.tmdb_id, item.type); cargarRecomendaciones(item.tmdb_id, item.type);
    if (item.type === 'tv') renderizarTemporadas(item.tmdb_id, registro.id, item.title);
    else detailSeasonsWrapper.classList.add('hidden');
}

async function cambiarNotaPersonal(valor) {
    if (!currentDetailTrackingId) return;
    const nuevaNota = parseInt(valor) || 0;
    await clienteSupabase.from('user_tracking').update({ personal_rating: nuevaNota }).eq('id', currentDetailTrackingId);
    const index = miBibliotecaLocal.findIndex(r => r.id === currentDetailTrackingId);
    if(index > -1) miBibliotecaLocal[index].personal_rating = nuevaNota;
    aplicarFiltrosYDiseño(); 
}

// --- PERSONAS ---
const cerrarModalPersona = () => { modalPersona.classList.add('hidden'); }
async function abrirModalPersona(personId, personName) {
    modalPersona.classList.remove('hidden'); document.getElementById('personaName').innerHTML = `<span class="text-indigo-400 text-2xl">👤</span> ${personName}`;
    const grid = document.getElementById('personaWorks'); grid.innerHTML = '<p class="text-indigo-400 text-sm p-4">Cargando filmografía destacada...</p>';
    try {
        const res = await fetch(`https://api.themoviedb.org/3/person/${personId}/combined_credits?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const data = await res.json(); const trabajos = data.cast.sort((a,b) => b.popularity - a.popularity).slice(0, 15);
        if(trabajos.length === 0) { grid.innerHTML = '<p class="text-gray-500 text-sm p-4">No hay trabajos registrados.</p>'; return; }
        grid.innerHTML = '';
        trabajos.forEach(w => {
            const img = w.poster_path ? `https://image.tmdb.org/t/p/w200${w.poster_path}` : 'https://via.placeholder.com/200x300/1f2937/ffffff?text=X';
            grid.innerHTML += `
                <div class="flex-shrink-0 w-28 cursor-pointer group" onclick="cerrarModalPersona(); abrirModalDetalleDirecto(${w.id}, '${w.media_type}')">
                    <div class="relative">
                        <img src="${img}" class="w-full h-40 object-cover rounded-xl shadow-md border border-transparent group-hover:border-indigo-500 transition-all">
                        <span class="absolute top-1 right-1 bg-black/80 backdrop-blur-md text-gray-300 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md border border-gray-600/50">${w.media_type === 'movie' ? '🍿' : '📺'}</span>
                    </div>
                    <p class="text-xs font-semibold text-gray-300 mt-2 line-clamp-2 group-hover:text-indigo-400 leading-tight">${w.title || w.name}</p>
                </div>
            `;
        });
    } catch(e) { grid.innerHTML = '<p class="text-red-400 p-4">Error al cargar trabajos.</p>'; }
}

// --- ESTADOS Y TEMPORADAS ---
async function actualizarEstadoSeguro(tracking_id, nuevoEstado) {
    const payload = { status: nuevoEstado, updated_at: new Date().toISOString() };
    const { error } = await clienteSupabase.from('user_tracking').update(payload).eq('id', tracking_id);
    if (error && error.code === 'PGRST204') await clienteSupabase.from('user_tracking').update({ status: nuevoEstado }).eq('id', tracking_id);
}

async function procesarSerieCompletaBBDD(tracking_id, tmdb_id) {
    try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const serieData = await res.json();
        await clienteSupabase.from('user_episodes').delete().eq('tracking_id', tracking_id);
        const inserts = [];
        serieData.seasons.filter(t => t.season_number > 0).forEach(temp => {
            for(let i = 1; i <= temp.episode_count; i++) inserts.push({ tracking_id, season_number: temp.season_number, episode_number: i });
        });
        for (let i = 0; i < inserts.length; i += 500) await clienteSupabase.from('user_episodes').insert(inserts.slice(i, i + 500));
        return true;
    } catch(e) { return false; }
}

async function cambiarEstado(selectElement, tracking_id, tmdb_id, tipo, titulo) {
    const nuevoEstado = selectElement.value; selectElement.disabled = true;
    if (tipo === 'tv') {
        if (nuevoEstado === 'vista') { await procesarSerieCompletaBBDD(tracking_id, tmdb_id); await cargarMiLista(); return; } 
        else if (nuevoEstado === 'pendiente') { await clienteSupabase.from('user_episodes').delete().eq('tracking_id', tracking_id); }
    }
    await actualizarEstadoSeguro(tracking_id, nuevoEstado);
    const index = miBibliotecaLocal.findIndex(r => r.id === tracking_id);
    if(index > -1) {
        miBibliotecaLocal[index].status = nuevoEstado; miBibliotecaLocal[index].updated_local = new Date().toISOString(); 
        miBibliotecaLocal[index].has_new_episodes = false; 
        if (nuevoEstado === 'pendiente') { miBibliotecaLocal[index].user_episodes = []; recalcularSiguienteCapitulo(miBibliotecaLocal[index]); }
    }
    selectElement.disabled = false; aplicarFiltrosYDiseño();
}

async function renderizarTemporadas(tmdb_id, tracking_id, titulo) {
    detailSeasonsWrapper.classList.remove('hidden'); detailSeasonsContent.innerHTML = '<p class="text-indigo-400 text-xs py-4 text-center">Cargando episodios...</p>';
    try {
        const resTMDB = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const serieData = await resTMDB.json();
        totalSerieCapitulosGlobal = 0; serieData.seasons.filter(t => t.season_number > 0).forEach(t => totalSerieCapitulosGlobal += t.episode_count);

        if (tracking_id) {
            const { data: vistosDB } = await clienteSupabase.from('user_episodes').select('season_number, episode_number').eq('tracking_id', tracking_id);
            vistosTemporal = vistosDB || []; btnMarcarSerieDetalle.classList.remove('hidden'); evaluarBotonSerieCompleta(tracking_id, tmdb_id, titulo);
        } else { vistosTemporal = []; btnMarcarSerieDetalle.classList.add('hidden'); }

        detailSeasonsContent.innerHTML = '';
        serieData.seasons.filter(t => t.season_number > 0).forEach(temp => {
            const yearTemp = temp.air_date ? temp.air_date.substring(0, 4) : '';
            const yearBadge = yearTemp ? `<span class="text-[10px] text-gray-500 font-normal">(${yearTemp})</span>` : '';
            let estadoTempHtml = ''; let btnTempHtml = '';

            if (tracking_id) {
                const vistosDeTemp = vistosTemporal.filter(v => v.season_number === temp.season_number).length;
                const totalDeTemp = temp.episode_count; const tempCompleta = vistosDeTemp === totalDeTemp && totalDeTemp > 0;
                if (vistosDeTemp === 0) estadoTempHtml = '<span class="season-status-badge text-gray-400 text-[10px] font-normal px-2 bg-gray-800 rounded border border-gray-700 tracking-wider uppercase ml-auto">⏳ Ptes</span>';
                else if (vistosDeTemp < totalDeTemp) estadoTempHtml = `<span class="season-status-badge text-yellow-400 text-[10px] font-normal px-2 bg-yellow-900/30 rounded border border-yellow-700/50 tracking-wider uppercase ml-auto">👀 (${vistosDeTemp}/${totalDeTemp})</span>`;
                else estadoTempHtml = '<span class="season-status-badge text-green-400 text-[10px] font-normal px-2 bg-green-900/30 rounded border border-green-700/50 tracking-wider uppercase ml-auto">✅ Vista</span>';

                const btnTempAttr = tempCompleta 
                    ? 'disabled class="season-action-btn px-4 py-3 bg-gray-800/50 text-gray-500 opacity-50 cursor-not-allowed font-bold text-[11px] sm:text-xs border-t sm:border-t-0 sm:border-l border-gray-600/60 flex items-center justify-center"' 
                    : 'class="season-action-btn px-4 py-3 bg-indigo-900/40 text-indigo-300 hover:bg-indigo-600 hover:text-white font-bold text-[11px] sm:text-xs border-t sm:border-t-0 sm:border-l border-gray-600/60 transition-all flex items-center justify-center"';
                btnTempHtml = `<button onclick="marcarTemporadaCompleta('${tracking_id}', ${temp.season_number}, ${temp.episode_count}, this, ${tmdb_id})" ${btnTempAttr}>${tempCompleta ? '✓ Temp' : '✓ Marcar'}</button>`;
            }

            detailSeasonsContent.innerHTML += `
                <div data-season-div="${temp.season_number}" data-total-caps="${temp.episode_count}" class="mb-3 border border-gray-700/80 rounded-2xl overflow-hidden shadow-sm">
                    <div class="w-full bg-gray-700/70 flex flex-col sm:flex-row justify-between items-stretch">
                        <button onclick="cargarEpisodios(this.parentElement, ${tmdb_id}, ${temp.season_number}, ${tracking_id ? `'${tracking_id}'` : 'null'})" 
                                class="flex-grow p-3.5 text-left font-bold text-white hover:bg-gray-600 flex items-center gap-2 transition-colors flex-wrap">
                            Temp. ${temp.season_number} ${yearBadge}
                            <span class="text-[10px] font-normal bg-gray-800/80 px-2 py-0.5 rounded text-gray-300 border border-gray-600/50">${temp.episode_count} cap.</span>
                            ${estadoTempHtml}
                        </button>
                        ${btnTempHtml}
                    </div>
                    <div class="capitulos-container hidden p-2 bg-gray-900/90 flex flex-col gap-1"></div>
                </div>
            `;
        });
    } catch(e) { detailSeasonsContent.innerHTML = '<p class="text-red-400 text-center text-xs">Error al cargar episodios.</p>'; }
}

function evaluarBotonSerieCompleta(tracking_id, tmdb_id, titulo) {
    if (!btnMarcarSerieDetalle) return;
    const totalVistos = vistosTemporal.length;
    const serieCompleta = totalVistos >= totalSerieCapitulosGlobal && totalSerieCapitulosGlobal > 0;
    if (serieCompleta) {
        btnMarcarSerieDetalle.textContent = "✓ Serie completada"; btnMarcarSerieDetalle.disabled = true;
        btnMarcarSerieDetalle.className = "hidden md:block bg-green-950/60 text-green-400 opacity-60 cursor-not-allowed text-xs font-bold py-1.5 px-3 rounded-lg shadow border border-green-800/50";
    } else {
        btnMarcarSerieDetalle.textContent = "✓ Marcar serie completa"; btnMarcarSerieDetalle.disabled = false;
        btnMarcarSerieDetalle.className = "bg-green-700 hover:bg-green-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow transition-colors";
        btnMarcarSerieDetalle.onclick = async () => {
            btnMarcarSerieDetalle.textContent = "⌛ Guardando..."; btnMarcarSerieDetalle.disabled = true;
            await procesarSerieCompletaBBDD(tracking_id, tmdb_id); await actualizarEstadoSeguro(tracking_id, 'vista');
            renderizarTemporadas(tmdb_id, tracking_id, titulo); cargarMiLista(); 
        };
    }
}

async function cargarEpisodios(cabeceraDiv, tmdb_id, season_number, tracking_id) {
    const contenedor = cabeceraDiv.nextElementSibling; 
    if (contenedor.innerHTML !== '') { contenedor.classList.toggle('hidden'); return; }
    contenedor.classList.remove('hidden'); contenedor.innerHTML = '<p class="text-xs text-gray-400 p-3">Buscando capítulos...</p>';
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}/season/${season_number}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
    const data = await res.json();
    contenedor.innerHTML = '';
    data.episodes.forEach(ep => {
        const estaVisto = tracking_id ? vistosTemporal.some(v => v.season_number === season_number && v.episode_number === ep.episode_number) : false;
        const fechaHtml = ep.air_date ? `<span class="text-[10px] text-gray-500 font-normal ml-auto whitespace-nowrap hidden sm:block">${formatearFecha(ep.air_date)}</span>` : '';
        const duracionHtml = ep.runtime ? `<span class="text-[10px] text-gray-400 bg-gray-800/80 px-1.5 py-0.5 rounded border border-gray-700/50 shadow-sm ml-2 whitespace-nowrap">⏳ ${ep.runtime}m</span>` : '';
        const controlHtml = tracking_id 
            ? `<input type="checkbox" id="ep-${ep.id}" ${estaVisto ? 'checked' : ''} onchange="marcarCapitulo('${tracking_id}', ${season_number}, ${ep.episode_number}, this.checked, ${tmdb_id})" class="peer w-4 h-4 accent-indigo-500 rounded cursor-pointer flex-shrink-0">`
            : `<span class="w-4 h-4 flex-shrink-0 text-gray-600 text-[10px] flex items-center justify-center">▶</span>`;
        contenedor.innerHTML += `
            <div class="flex items-center gap-3 p-2 hover:bg-gray-800/80 rounded-xl transition-colors border-b border-gray-800/60 last:border-0">
                ${controlHtml}
                <label for="ep-${ep.id}" class="${tracking_id ? 'cursor-pointer' : ''} flex items-center gap-2 flex-grow">
                    <span class="text-[11px] font-bold text-gray-500 w-5 flex-shrink-0">${ep.episode_number}.</span>
                    <span class="text-[13px] text-gray-300 line-clamp-1 ${tracking_id ? 'peer-checked:line-through peer-checked:text-gray-600' : ''} transition-all">${ep.name}</span>
                    ${duracionHtml} ${fechaHtml}
                </label>
            </div>
        `;
    });
}

async function marcarCapitulo(tracking_id, season_number, episode_number, isChecked, tmdb_id) {
    if (isChecked) {
        await clienteSupabase.from('user_episodes').insert({ tracking_id, season_number, episode_number });
        if (!vistosTemporal.some(v => v.season_number === season_number && v.episode_number === episode_number)) vistosTemporal.push({ season_number, episode_number });
    } else {
        await clienteSupabase.from('user_episodes').delete().match({ tracking_id, season_number, episode_number });
        vistosTemporal = vistosTemporal.filter(v => !(v.season_number === season_number && v.episode_number === episode_number));
    }
    actualizarHeaderTemporada(season_number); await evaluarEstadoSerieDesdeEpisodios(tracking_id, tmdb_id);
}

async function marcarTemporadaCompleta(tracking_id, season_number, totalCapitulos, btnElement, tmdb_id) {
    btnElement.textContent = "⌛..."; btnElement.disabled = true;
    await clienteSupabase.from('user_episodes').delete().match({ tracking_id, season_number });
    const inserts = []; for(let i = 1; i <= totalCapitulos; i++) inserts.push({ tracking_id, season_number, episode_number: i });
    await clienteSupabase.from('user_episodes').insert(inserts);
    vistosTemporal = vistosTemporal.filter(v => v.season_number !== season_number);
    for(let i = 1; i <= totalCapitulos; i++) vistosTemporal.push({ season_number, episode_number: i });
    const contenedor = btnElement.parentElement.nextElementSibling; contenedor.innerHTML = ''; contenedor.classList.add('hidden');
    actualizarHeaderTemporada(season_number); await evaluarEstadoSerieDesdeEpisodios(tracking_id, tmdb_id);
}

function actualizarHeaderTemporada(season_number) {
    const tempDiv = document.querySelector(`[data-season-div="${season_number}"]`); if (!tempDiv) return;
    const totalCapitulos = parseInt(tempDiv.getAttribute('data-total-caps') || '0');
    const vistosDeTemp = vistosTemporal.filter(v => v.season_number === season_number).length;
    const tempCompleta = vistosDeTemp === totalCapitulos && totalCapitulos > 0;
    const badgeElem = tempDiv.querySelector('.season-status-badge'); const btnElem = tempDiv.querySelector('.season-action-btn');

    if (badgeElem) {
        if (vistosDeTemp === 0) badgeElem.outerHTML = '<span class="season-status-badge text-gray-400 text-[10px] font-normal px-2 bg-gray-800 rounded border border-gray-700 tracking-wider uppercase ml-auto">⏳ Ptes</span>';
        else if (vistosDeTemp < totalCapitulos) badgeElem.outerHTML = `<span class="season-status-badge text-yellow-400 text-[10px] font-normal px-2 bg-yellow-900/30 rounded border border-yellow-700/50 tracking-wider uppercase ml-auto">👀 (${vistosDeTemp}/${totalCapitulos})</span>`;
        else badgeElem.outerHTML = '<span class="season-status-badge text-green-400 text-[10px] font-normal px-2 bg-green-900/30 rounded border border-green-700/50 tracking-wider uppercase ml-auto">✅ Vista</span>';
    }
    if (btnElem) {
        if (tempCompleta) {
            btnElem.disabled = true; btnElem.textContent = "✓ Temp";
            btnElem.className = "season-action-btn px-4 py-3 bg-gray-800/50 text-gray-500 opacity-50 cursor-not-allowed font-bold text-[11px] sm:text-xs border-t sm:border-t-0 sm:border-l border-gray-600/60 flex items-center justify-center";
        } else {
            btnElem.disabled = false; btnElem.textContent = "✓ Marcar";
            btnElem.className = "season-action-btn px-4 py-3 bg-indigo-900/40 text-indigo-300 hover:bg-indigo-600 hover:text-white font-bold text-[11px] sm:text-xs border-t sm:border-t-0 sm:border-l border-gray-600/60 transition-all flex items-center justify-center";
        }
    }
}

async function evaluarEstadoSerieDesdeEpisodios(tracking_id, tmdb_id) {
    const totalVistos = vistosTemporal.length; let nuevoEstado = 'pendiente';
    const idx = miBibliotecaLocal.findIndex(r => r.id === tracking_id);

    if (totalVistos >= totalSerieCapitulosGlobal && totalSerieCapitulosGlobal > 0) {
        nuevoEstado = 'vista';
        if (idx > -1) miBibliotecaLocal[idx].has_new_episodes = false;
    } else if (totalVistos > 0) {
        nuevoEstado = 'viendo';
    }

    await actualizarEstadoSeguro(tracking_id, nuevoEstado);
    if (idx > -1) {
        miBibliotecaLocal[idx].status = nuevoEstado; miBibliotecaLocal[idx].updated_local = new Date().toISOString();
        miBibliotecaLocal[idx].user_episodes = [...vistosTemporal]; recalcularSiguienteCapitulo(miBibliotecaLocal[idx]); 
        
        if (miBibliotecaLocal[idx].details.next_episode) {
            detailNextEpisode.textContent = `▶ Siguiente: ${miBibliotecaLocal[idx].details.next_episode}`;
            detailNextEpisode.classList.remove('hidden');
        } else {
            detailNextEpisode.classList.add('hidden');
        }
    }
    const titulo = document.getElementById('detailTitle').textContent;
    evaluarBotonSerieCompleta(tracking_id, tmdb_id, titulo); aplicarFiltrosYDiseño(); 
}
