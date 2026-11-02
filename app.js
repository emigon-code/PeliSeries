// 1. CREDENCIALES
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNTIyNzVlMDVhNTAxMjllZWYwMGRhN2Q5ZmU5NTZlZSIsIm5iZiI6MTc5MzU1NjUzNC4wMDcsInN1YiI6IjZhZTc4MDM2MWMyNDI4MTQ4MmM4ZGM2NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.b2COQUX-mmBdGPcxwCTUN7HI5EN6KNemlZSzbaD5NuI'; 
const SUPABASE_URL = 'https://dqqfoucxbsvfdshruygt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcWZvdWN4YnN2ZmRzaHJ1eWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDgyOTQsImV4cCI6MjEwOTEyNDI5NH0.Z4yVjtuuSrs3Pc5AghHFVeENOvmIeA8k34iWcVQiqIQ';

const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ESTADOS GLOBALES DE LA APP
let pelisYSeries = []; 
let usuarioActual = null;
let miListaTMDBIDs = []; 
let miBibliotecaLocal = []; 
let vistosTemporal = []; 
let totalSerieCapitulosGlobal = 0; 

// Filtros, Ordenación y Diseño
let currentFilterType = 'all';
let currentFilterStatus = 'all';
let currentFilterRating = 0; 
let currentSort = 'rating'; 
let currentSearchSort = 'rating'; 
let currentLayoutMode = 'grid'; 
let currentPosterSize = 'medium'; 

// ESTILOS PREMIUM PARA LOS BOTONES (Gradiente brillante e inactivo translúcido)
const btnPillActive = 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25';
const btnPillInactive = 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-transparent text-gray-400 hover:text-gray-100 hover:bg-white/5';

const searchPillActive = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md transition-all';
const searchPillInactive = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-transparent text-gray-400 hover:bg-white/5 transition-all';

// ELEMENTOS DOM
const authPanel = document.getElementById('authPanel');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const searchSortBar = document.getElementById('searchSortBar');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const emailInput = document.getElementById('emailInput');
const passInput = document.getElementById('passInput');
const loginForm = document.getElementById('loginForm');
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
const detailRating = document.getElementById('detailRating');
const detailSeasons = document.getElementById('detailSeasons');
const detailStatus = document.getElementById('detailStatus');
const detailOverview = document.getElementById('detailOverview');
const detailActions = document.getElementById('detailActions');
const detailRecommendations = document.getElementById('detailRecommendations');
const modalEpisodios = document.getElementById('modalEpisodios');


// --- AUTENTICACIÓN ---
async function iniciarSesion() {
    const email = emailInput.value;
    const password = passInput.value;
    const { data, error } = await clienteSupabase.auth.signInWithPassword({ email, password });
    if (error) { alert("Error al iniciar sesión: " + error.message); } 
    else { usuarioActual = data.session.user; postLoginSetup(); }
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
    authPanel.classList.remove('hidden'); 
    userLogged.classList.add('hidden'); 
    emailInput.value = ''; passInput.value = '';
    btnNavList.click(); 
    resultsGrid.innerHTML = ''; myListGrid.innerHTML = '';
});

loginBtn.addEventListener('click', iniciarSesion);
comprobarSesion();


// --- NAVEGACIÓN ---
btnNavSearch.addEventListener('click', () => {
    viewSearch.classList.remove('hidden'); viewList.classList.add('hidden');
    btnNavSearch.className = 'bg-gray-800/80 px-6 py-2 rounded-full font-bold text-sm text-white transition-all border border-gray-700 shadow';
    btnNavList.className = 'bg-transparent hover:bg-white/5 px-6 py-2 rounded-full font-bold text-sm text-gray-400 transition-all';
    if (pelisYSeries.length > 0) renderResults(pelisYSeries); 
});

btnNavList.addEventListener('click', () => {
    viewSearch.classList.add('hidden'); viewList.classList.remove('hidden');
    btnNavList.className = 'bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2 rounded-full font-bold text-sm text-white transition-all shadow-md shadow-indigo-500/25';
    btnNavSearch.className = 'bg-transparent hover:bg-white/5 px-6 py-2 rounded-full font-bold text-sm text-gray-400 transition-all';
    cargarMiLista();
});


// --- IMPORTACIÓN MASIVA ---
function abrirModalImportacion() {
    if (!usuarioActual) return alert("¡Inicia sesión primero!");
    modalImport.classList.remove('hidden');
    importTextarea.value = '';
    importStatus.classList.add('hidden');
    btnProcesarImport.disabled = false;
    btnProcesarImport.classList.remove('opacity-50');
    btnProcesarImport.onclick = procesarImportacion;
    btnProcesarImport.textContent = "Comenzar Importación";
}

function cerrarModalImportacion() { modalImport.classList.add('hidden'); }

async function procesarImportacion() {
    const lineas = importTextarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lineas.length === 0) return alert("Pega al menos un título.");
    
    btnProcesarImport.disabled = true;
    btnProcesarImport.classList.add('opacity-50');
    importStatus.classList.remove('hidden');
    
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
                    
                    miListaTMDBIDs.push(item.id);
                    encontrados++;
                }
            }
        } catch(e) { console.error(`Error con ${titulo}:`, e); }
        procesados++;
    }
    
    importStatus.textContent = `¡Importación completada! Se añadieron ${encontrados} títulos.`;
    btnProcesarImport.textContent = "Cerrar y ver mi lista";
    btnProcesarImport.disabled = false;
    btnProcesarImport.classList.remove('opacity-50');
    btnProcesarImport.onclick = () => { cerrarModalImportacion(); btnNavList.click(); };
}


// --- BÚSQUEDA TMDB Y ORDENACIÓN ---
async function buscarEnTMDB(query) {
    const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=es-ES&page=1`;
    try {
        const response = await fetch(url, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const data = await response.json();
        return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    } catch (error) { return []; }
}

async function ejecutarBusqueda() {
    const query = searchInput.value.trim();
    if (query.length > 0) {
        resultsGrid.innerHTML = '<p class="text-indigo-400 col-span-full text-center">Buscando...</p>';
        pelisYSeries = await buscarEnTMDB(query); 
        searchSortBar.classList.remove('hidden');
        renderResults(pelisYSeries);
    }
}
searchBtn.addEventListener('click', ejecutarBusqueda);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') ejecutarBusqueda(); });

document.querySelectorAll('.search-sort-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.search-sort-btn').forEach(b => {
            b.className = `search-sort-btn ${searchPillInactive}`;
        });
        e.target.className = `search-sort-btn ${searchPillActive}`;
        currentSearchSort = e.target.getAttribute('data-search-sort');
        renderResults(pelisYSeries);
    });
});

function renderResults(resultados) {
    resultsGrid.innerHTML = '';
    if (resultados.length === 0) return resultsGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center">Sin resultados.</p>';

    const ordenados = [...resultados].sort((a, b) => {
        if (currentSearchSort === 'title') {
            const tA = a.title || a.name || '';
            const tB = b.title || b.name || '';
            return tA.localeCompare(tB);
        } else {
            return (b.vote_average || 0) - (a.vote_average || 0);
        }
    });

    ordenados.forEach(item => {
        const titulo = item.title || item.name;
        const tipo = item.media_type === 'movie' ? 'Película' : 'Serie';
        const imgUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Poster';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

        const yaLaTengo = miListaTMDBIDs.includes(item.id);
        const botonAñadir = yaLaTengo 
            ? `<button disabled class="mt-auto w-full bg-green-950/60 text-green-400 py-2.5 rounded-xl text-xs font-bold border border-green-800/60">✓ En tu lista</button>`
            : `<button class="mt-auto w-full bg-gray-800 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 text-white py-2.5 rounded-xl text-xs font-semibold transition-all shadow border border-gray-700" onclick="event.stopPropagation(); añadirALista(${item.id})">+ Añadir a mi lista</button>`;

        const card = document.createElement('div');
        card.className = 'glass-panel rounded-2xl overflow-hidden shadow-xl hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all cursor-pointer group relative';
        card.onclick = () => abrirModalDetalleDesdeBusqueda(item.id);

        card.innerHTML = `
            <div class="relative aspect-[2/3] overflow-hidden bg-gray-950">
                <img src="${imgUrl}" alt="${titulo}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-yellow-500/20 shadow-md">⭐ ${rating}</span>
            </div>
            <div class="p-4 flex flex-col flex-grow bg-gray-900/60">
                <span class="text-[9px] font-black uppercase tracking-widest text-indigo-400/80 mb-1">${tipo}</span>
                <h3 class="font-bold text-sm leading-snug mb-3 line-clamp-2 group-hover:text-indigo-300 transition-colors">${titulo}</h3>
                ${botonAñadir}
            </div>
        `;
        resultsGrid.appendChild(card);
    });
}


// --- GESTIÓN VISUAL DEL CENTRO DE CONTROL DE MI LISTA ---
function updateBtnClasses(selector, activeValue, dataAttr) {
    const baseClass = selector.replace('.', '');
    document.querySelectorAll(selector).forEach(btn => {
        if(btn.getAttribute(dataAttr) == activeValue) {
            btn.className = `${baseClass} ${btnPillActive}`;
        } else {
            btn.className = `${baseClass} ${btnPillInactive}`;
        }
    });
}

document.querySelectorAll('.filter-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentFilterType = e.target.getAttribute('data-filter-type');
        updateBtnClasses('.filter-type-btn', currentFilterType, 'data-filter-type');
        aplicarFiltrosYDiseño();
    });
});
document.querySelectorAll('.filter-status-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentFilterStatus = e.target.getAttribute('data-filter-status');
        updateBtnClasses('.filter-status-btn', currentFilterStatus, 'data-filter-status');
        aplicarFiltrosYDiseño();
    });
});
document.querySelectorAll('.filter-rating-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentFilterRating = parseFloat(e.target.getAttribute('data-filter-rating'));
        updateBtnClasses('.filter-rating-btn', currentFilterRating, 'data-filter-rating');
        aplicarFiltrosYDiseño();
    });
});
document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentSort = e.target.getAttribute('data-sort');
        updateBtnClasses('.sort-btn', currentSort, 'data-sort');
        aplicarFiltrosYDiseño();
    });
});
document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentPosterSize = e.target.getAttribute('data-size');
        updateBtnClasses('.size-btn', currentPosterSize, 'data-size');
        aplicarFiltrosYDiseño();
    });
});

const btnViewGrid = document.getElementById('btnViewGrid');
const btnViewList = document.getElementById('btnViewList');

btnViewGrid.addEventListener('click', () => {
    currentLayoutMode = 'grid';
    btnViewGrid.className = `layout-btn ${btnPillActive}`;
    btnViewList.className = `layout-btn ${btnPillInactive}`;
    aplicarFiltrosYDiseño();
});
btnViewList.addEventListener('click', () => {
    currentLayoutMode = 'list';
    btnViewList.className = `layout-btn ${btnPillActive}`;
    btnViewGrid.className = `layout-btn ${btnPillInactive}`;
    aplicarFiltrosYDiseño();
});


// --- BASE DE DATOS SUPABASE ---
async function actualizarIdsLocales() {
    const { data } = await clienteSupabase.from('user_tracking').select('items(tmdb_id)').eq('user_id', usuarioActual.id);
    if (data) miListaTMDBIDs = data.map(d => d.items.tmdb_id);
}

async function añadirALista(tmdb_id) {
    if (!usuarioActual) return alert("¡Inicia sesión primero!");
    const item = pelisYSeries.find(i => i.id === tmdb_id);
    const titulo = item.title || item.name;

    await clienteSupabase.from('items').insert({ tmdb_id: item.id, title: titulo, type: item.media_type, poster_path: item.poster_path });
    const { data: dbItem } = await clienteSupabase.from('items').select('id').eq('tmdb_id', item.id).eq('type', item.media_type).single();
    await clienteSupabase.from('user_tracking').insert({ user_id: usuarioActual.id, item_id: dbItem.id, status: 'pendiente' });

    miListaTMDBIDs.push(item.id); 
    renderResults(pelisYSeries);  
}

async function borrarDeMiLista(tracking_id, tmdb_id, titulo) {
    if (confirm(`¿Eliminar "${titulo}" de tu biblioteca personal?`)) {
        await clienteSupabase.from('user_tracking').delete().eq('id', tracking_id);
        miListaTMDBIDs = miListaTMDBIDs.filter(id => id !== tmdb_id);
        cerrarModalDetalle();
        cargarMiLista(); 
    }
}


// --- PESTAÑA MI LISTA CON DETALLES ---
function calcularTotalCapitulosOficiales(seasonsData) {
    if (!seasonsData) return 0;
    return seasonsData.filter(s => s.season_number > 0).reduce((acc, s) => acc + s.episode_count, 0);
}

function recalcularSiguienteCapitulo(registro) {
    if (registro.items.type !== 'tv' || registro.status === 'vista' || !registro.details.seasons_data) {
        registro.details.next_episode = null;
        return;
    }
    const watched = registro.user_episodes || [];
    const validSeasons = registro.details.seasons_data.filter(s => s.season_number > 0).sort((a,b) => a.season_number - b.season_number);
    
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

async function cargarMiLista() {
    if (!usuarioActual) return;
    myListGrid.innerHTML = '<p class="text-indigo-400 col-span-full text-center py-8">Cargando biblioteca personal...</p>';

    const { data, error } = await clienteSupabase.from('user_tracking')
        .select(`id, status, items ( id, tmdb_id, title, type, poster_path ), user_episodes (season_number, episode_number)`)
        .eq('user_id', usuarioActual.id).order('created_at', { ascending: false });

    if (error || data.length === 0) {
        miBibliotecaLocal = [];
        return myListGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center py-8">Aún no has guardado elementos.</p>';
    }

    myListGrid.innerHTML = '<p class="text-indigo-400 col-span-full text-center py-8 animate-pulse">Obteniendo detalles actualizados...</p>';
    
    miBibliotecaLocal = await Promise.all(data.map(async (registro) => {
        const item = registro.items;
        try {
            const endpoint = item.type === 'movie' ? `movie/${item.tmdb_id}` : `tv/${item.tmdb_id}`;
            const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
            const tmdbData = await res.json();
            
            registro.details = {
                rating: tmdbData.vote_average ? tmdbData.vote_average.toFixed(1) : 'N/A',
                overview: tmdbData.overview || 'Sin descripción disponible.',
                seasons_count: tmdbData.number_of_seasons || 0,
                is_ended: tmdbData.status === 'Ended' || tmdbData.status === 'Canceled',
                seasons_data: tmdbData.seasons || []
            };
            
            // CORRECCIÓN SÓLIDA: Si todos los capítulos están marcados, aseguramos que el estado en base de datos sea 'vista'
            if (item.type === 'tv' && registro.status !== 'vista') {
                const totalOficial = calcularTotalCapitulosOficiales(registro.details.seasons_data);
                const vistosCount = (registro.user_episodes || []).length;
                if (vistosCount >= totalOficial && totalOficial > 0) {
                    registro.status = 'vista';
                    await clienteSupabase.from('user_tracking').update({ status: 'vista' }).eq('id', registro.id);
                }
            }

            recalcularSiguienteCapitulo(registro);
            return registro;
        } catch(e) {
            return { ...registro, details: { rating: 'N/A', overview: 'Sin datos.', seasons_count: 0, is_ended: false, next_episode: null } };
        }
    }));

    aplicarFiltrosYDiseño();
}

function aplicarFiltrosYDiseño() {
    let dataFiltrada = miBibliotecaLocal.filter(registro => {
        const matchType = currentFilterType === 'all' || registro.items.type === currentFilterType;
        const matchStatus = currentFilterStatus === 'all' || registro.status === currentFilterStatus;
        
        let matchRating = true;
        if (currentFilterRating === 8) {
            const r = parseFloat(registro.details.rating);
            if (isNaN(r) || r < 8) matchRating = false;
        } else if (currentFilterRating === 6) {
            const r = parseFloat(registro.details.rating);
            if (isNaN(r) || r < 6 || r >= 8) matchRating = false;
        }

        return matchType && matchStatus && matchRating;
    });

    dataFiltrada.sort((a, b) => {
        if (currentSort === 'title') {
            return a.items.title.localeCompare(b.items.title);
        } else {
            const rA = parseFloat(a.details.rating) || 0;
            const rB = parseFloat(b.details.rating) || 0;
            return rB - rA; 
        }
    });

    pintarMiLista(dataFiltrada);
}

function pintarMiLista(dataArray) {
    myListGrid.innerHTML = '';
    
    if (currentLayoutMode === 'list') {
        myListGrid.className = 'flex flex-col gap-3 md:gap-4';
    } else {
        let sizeClass = 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 md:gap-4';
        if (currentPosterSize === 'small') sizeClass = 'grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 gap-2 md:gap-3';
        if (currentPosterSize === 'large') sizeClass = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6';
        myListGrid.className = `grid ${sizeClass}`;
    }

    if (dataArray.length === 0) return myListGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center py-8">No hay resultados que coincidan con los filtros.</p>';

    dataArray.forEach(registro => {
        const item = registro.items; 
        const details = registro.details;
        const imgUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Poster';
        
        let badgeSerie = '';
        let badgeNextEpisode = '';

        if (item.type === 'tv') {
            const estadoTexto = details.is_ended ? '🔴 Fin' : '🟢 Emisión';
            badgeSerie = `<span class="text-[10px] text-gray-400 font-medium block mt-1 tracking-wide">${details.seasons_count} Temp. • ${estadoTexto}</span>`;
            
            if (details.next_episode) {
                badgeNextEpisode = `
                    <div class="mt-1.5">
                        <span class="inline-block text-[9px] sm:text-[10px] font-bold bg-indigo-950/80 text-indigo-300 px-2.5 py-0.5 rounded-lg border border-indigo-700/50 shadow-sm">
                            ▶ Siguiente: ${details.next_episode}
                        </span>
                    </div>
                `;
            }
        }

        const card = document.createElement('div');
        
        if (currentLayoutMode === 'list') {
            let listImgClasses = 'w-20 sm:w-24 h-28 sm:h-36';
            let listTitleClasses = 'text-base sm:text-lg';
            if (currentPosterSize === 'small') {
                listImgClasses = 'w-16 sm:w-20 h-24 sm:h-28';
                listTitleClasses = 'text-sm sm:text-base';
            } else if (currentPosterSize === 'large') {
                listImgClasses = 'w-24 sm:w-32 h-36 sm:h-48';
                listTitleClasses = 'text-lg sm:text-xl';
            }

            card.className = 'glass-panel rounded-2xl overflow-hidden shadow-xl hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-row items-center p-3 md:p-4 gap-4';
            card.onclick = () => abrirModalDetalleDesdeLista(registro.id);
            
            card.innerHTML = `
                <img src="${imgUrl}" alt="${item.title}" class="${listImgClasses} object-cover rounded-xl flex-shrink-0 shadow-md">
                <div class="flex flex-col flex-grow min-w-0">
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-gray-800 text-indigo-300 border border-gray-700">${item.type === 'movie' ? 'Película' : 'Serie'}</span>
                        <span class="text-xs font-bold text-yellow-400">⭐ ${details.rating}</span>
                    </div>
                    <h3 class="font-bold ${listTitleClasses} text-white truncate">${item.title}</h3>
                    ${badgeSerie}
                    ${badgeNextEpisode}
                    <p class="text-xs text-gray-400 mt-2 line-clamp-2 hidden sm:block">${details.overview}</p>
                </div>
                <div class="flex flex-col gap-2 flex-shrink-0 min-w-[130px]" onclick="event.stopPropagation()">
                    <select onchange="cambiarEstado(this, '${registro.id}', ${item.tmdb_id}, '${item.type}', '${item.title.replace(/'/g, "\\'")}')" 
                            class="w-full bg-gray-900/90 text-white text-xs font-semibold rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 border border-gray-700 outline-none hover:bg-gray-800 transition-colors cursor-pointer shadow-inner">
                        <option value="pendiente" ${registro.status === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                        <option value="viendo" ${registro.status === 'viendo' ? 'selected' : ''}>👀 Viendo</option>
                        <option value="vista" ${registro.status === 'vista' ? 'selected' : ''}>✅ Vista</option>
                    </select>
                </div>
            `;
        } else {
            let titleClass = 'text-sm';
            let typeClass = 'text-[9px]';
            if (currentPosterSize === 'small') { titleClass = 'text-xs'; typeClass = 'text-[8px]'; }

            card.className = 'glass-panel rounded-2xl overflow-hidden shadow-xl hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col relative';
            card.onclick = () => abrirModalDetalleDesdeLista(registro.id);
            
            card.innerHTML = `
                <div class="relative aspect-[2/3] overflow-hidden bg-gray-950">
                    <img src="${imgUrl}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <span class="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-yellow-500/20 shadow-md">⭐ ${details.rating}</span>
                </div>
                <div class="p-3.5 flex flex-col flex-grow bg-gray-900/60">
                    <span class="${typeClass} font-black uppercase tracking-widest text-indigo-400/80 mb-1">${item.type === 'movie' ? 'Película' : 'Serie'}</span>
                    <h3 class="font-bold ${titleClass} leading-snug mb-1 line-clamp-2 group-hover:text-indigo-300 transition-colors">${item.title}</h3>
                    ${badgeSerie}
                    ${badgeNextEpisode}
                    <div class="mt-auto pt-4" onclick="event.stopPropagation()">
                        <select onchange="cambiarEstado(this, '${registro.id}', ${item.tmdb_id}, '${item.type}', '${item.title.replace(/'/g, "\\'")}')" 
                                class="w-full bg-gray-900/90 text-white text-xs font-semibold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 border border-gray-700 outline-none hover:bg-gray-800 transition-colors cursor-pointer shadow-inner">
                            <option value="pendiente" ${registro.status === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                            <option value="viendo" ${registro.status === 'viendo' ? 'selected' : ''}>👀 Viendo</option>
                            <option value="vista" ${registro.status === 'vista' ? 'selected' : ''}>✅ Vista</option>
                        </select>
                    </div>
                </div>
            `;
        }
        myListGrid.appendChild(card);
    });
}


// --- MODAL DE DETALLE Y RECOMENDACIONES ---
function cerrarModalDetalle() { modalDetalle.classList.add('hidden'); }

async function abrirModalDetalleDirecto(tmdb_id, tipo) {
    cerrarModalDetalle();
    try {
        const res = await fetch(`https://api.themoviedb.org/3/${tipo}/${tmdb_id}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const item = await res.json();
        item.media_type = tipo; 
        if (!pelisYSeries.find(i => i.id === tmdb_id)) pelisYSeries.push(item);
        abrirModalDetalleDesdeBusqueda(tmdb_id);
    } catch(e) { console.error("Error al cargar recomendación"); }
}

async function cargarRecomendaciones(tmdb_id, tipo) {
    detailRecommendations.innerHTML = '<p class="text-xs text-gray-500">Cargando...</p>';
    try {
        const res = await fetch(`https://api.themoviedb.org/3/${tipo}/${tmdb_id}/recommendations?language=es-ES&page=1`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const data = await res.json();
        if (data.results.length === 0) {
            detailRecommendations.innerHTML = '<p class="text-xs text-gray-500">No hay recomendaciones disponibles.</p>';
            return;
        }
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
    const item = pelisYSeries.find(i => i.id === tmdb_id);
    if (!item) return;

    modalDetalle.classList.remove('hidden');
    detailTitle.textContent = item.title || item.name;
    detailBadgeType.textContent = item.media_type === 'movie' ? 'Película' : 'Serie';
    detailPoster.src = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Poster';
    detailRating.textContent = `⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}`;
    detailOverview.textContent = item.overview || 'Sin descripción disponible en español.';

    detailSeasons.classList.add('hidden');
    detailStatus.classList.add('hidden');

    if (item.media_type === 'tv') {
        try {
            const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
            const data = await res.json();
            detailSeasons.textContent = `${data.number_of_seasons} Temporadas`;
            detailSeasons.classList.remove('hidden');
            detailStatus.textContent = (data.status === 'Ended' || data.status === 'Canceled') ? '🔴 Finalizada' : '🟢 En emisión';
            detailStatus.classList.remove('hidden');
        } catch(e) {}
    }

    const yaLaTengo = miListaTMDBIDs.includes(item.id);
    detailActions.innerHTML = yaLaTengo
        ? `<button disabled class="w-full bg-green-950/60 text-green-400 py-3 rounded-xl text-sm font-bold border border-green-800">✓ Ya está en tu biblioteca</button>`
        : `<button onclick="añadirALista(${item.id}); cerrarModalDetalle();" class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white py-3 rounded-xl text-sm font-bold transition-colors shadow">+ Añadir a mi lista</button>`;

    cargarRecomendaciones(tmdb_id, item.media_type);
}

function abrirModalDetalleDesdeLista(tracking_id) {
    const registro = miBibliotecaLocal.find(r => r.id === tracking_id);
    if (!registro) return;

    const item = registro.items;
    const details = registro.details;

    modalDetalle.classList.remove('hidden');
    detailTitle.textContent = item.title;
    detailBadgeType.textContent = item.type === 'movie' ? 'Película' : 'Serie';
    detailPoster.src = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Poster';
    detailRating.textContent = `⭐ ${details.rating}`;
    detailOverview.textContent = details.overview;

    if (item.type === 'tv') {
        detailSeasons.textContent = `${details.seasons_count} Temporadas`;
        detailSeasons.classList.remove('hidden');
        detailStatus.textContent = details.is_ended ? '🔴 Finalizada' : '🟢 En emisión';
        detailStatus.classList.remove('hidden');
    } else {
        detailSeasons.classList.add('hidden');
        detailStatus.classList.add('hidden');
    }

    const botonCapitulos = item.type === 'tv' 
        ? `<button onclick="cerrarModalDetalle(); abrirModalSeries(${item.tmdb_id}, '${registro.id}', '${item.title.replace(/'/g, "\\'")}')" class="flex-grow bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white py-3 rounded-xl text-sm font-bold transition-colors shadow-lg">📋 Ver Capítulos</button>` 
        : '';

    detailActions.innerHTML = `
        ${botonCapitulos}
        <button onclick="borrarDeMiLista('${registro.id}', ${item.tmdb_id}, '${item.title.replace(/'/g, "\\'")}')" class="bg-red-950/60 hover:bg-red-600 text-red-400 hover:text-white border border-red-800/60 px-5 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
            🗑️ Eliminar
        </button>
    `;

    cargarRecomendaciones(item.tmdb_id, item.type);
}


// --- LÓGICA DE ESTADOS CASCADA ---
async function procesarSerieCompletaBBDD(tracking_id, tmdb_id) {
    try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const serieData = await res.json();
        await clienteSupabase.from('user_episodes').delete().eq('tracking_id', tracking_id);
        const inserts = [];
        serieData.seasons.filter(t => t.season_number > 0).forEach(temp => {
            for(let i = 1; i <= temp.episode_count; i++) inserts.push({ tracking_id, season_number: temp.season_number, episode_number: i });
        });
        for (let i = 0; i < inserts.length; i += 500) {
            await clienteSupabase.from('user_episodes').insert(inserts.slice(i, i + 500));
        }
        return true;
    } catch(e) { return false; }
}

async function cambiarEstado(selectElement, tracking_id, tmdb_id, tipo, titulo) {
    const nuevoEstado = selectElement.value;
    selectElement.disabled = true;

    if (tipo === 'tv') {
        if (nuevoEstado === 'vista') {
            if (confirm(`Al marcar "${titulo}" como Vista, se marcarán automáticamente todos sus capítulos. ¿Deseas continuar?`)) {
                await procesarSerieCompletaBBDD(tracking_id, tmdb_id);
                await cargarMiLista();
                return;
            } else {
                aplicarFiltrosYDiseño();
                return; 
            }
        } else if (nuevoEstado === 'pendiente') {
            if (confirm(`Al marcar "${titulo}" como Pendiente, se borrará todo el progreso de sus capítulos. ¿Deseas continuar?`)) {
                await clienteSupabase.from('user_episodes').delete().eq('tracking_id', tracking_id);
            } else {
                aplicarFiltrosYDiseño();
                return;
            }
        }
    }

    await clienteSupabase.from('user_tracking').update({ status: nuevoEstado }).eq('id', tracking_id);
    const index = miBibliotecaLocal.findIndex(r => r.id === tracking_id);
    if(index > -1) {
        miBibliotecaLocal[index].status = nuevoEstado;
        if (nuevoEstado === 'pendiente') {
            miBibliotecaLocal[index].user_episodes = [];
            recalcularSiguienteCapitulo(miBibliotecaLocal[index]);
        }
    }
    
    selectElement.disabled = false;
    aplicarFiltrosYDiseño();
}


// --- MODAL DE EPISODIOS Y ACORDEONES ---
function cerrarModal() { modalEpisodios.classList.add('hidden'); }

async function abrirModalSeries(tmdb_id, tracking_id, titulo) {
    modalEpisodios.classList.remove('hidden');
    document.getElementById('modalTitle').textContent = titulo;
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = '<p class="text-center text-indigo-400 py-6">Cargando episodios...</p>';

    try {
        const resTMDB = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const serieData = await resTMDB.json();

        totalSerieCapitulosGlobal = 0;
        serieData.seasons.filter(t => t.season_number > 0).forEach(t => totalSerieCapitulosGlobal += t.episode_count);

        const { data: vistosDB } = await clienteSupabase.from('user_episodes').select('season_number, episode_number').eq('tracking_id', tracking_id);
        vistosTemporal = vistosDB || [];

        evaluarBotonSerieCompleta(tracking_id, tmdb_id, titulo);

        modalContent.innerHTML = '';
        serieData.seasons.filter(t => t.season_number > 0).forEach(temp => {
            const vistosDeTemp = vistosTemporal.filter(v => v.season_number === temp.season_number).length;
            const totalDeTemp = temp.episode_count;
            const tempCompleta = vistosDeTemp === totalDeTemp && totalDeTemp > 0;

            let estadoTempHtml = '<span class="season-status-badge text-gray-400 text-[10px] font-normal px-2 bg-gray-800 rounded border border-gray-700 tracking-wider uppercase">⏳ Pendiente</span>';
            if (vistosDeTemp > 0 && vistosDeTemp < totalDeTemp) {
                estadoTempHtml = `<span class="season-status-badge text-yellow-400 text-[10px] font-normal px-2 bg-yellow-900/30 rounded border border-yellow-700/50 tracking-wider uppercase">👀 A medias (${vistosDeTemp}/${totalDeTemp})</span>`;
            } else if (tempCompleta) {
                estadoTempHtml = '<span class="season-status-badge text-green-400 text-[10px] font-normal px-2 bg-green-900/30 rounded border border-green-700/50 tracking-wider uppercase">✅ Vista</span>';
            }

            const btnTempAttr = tempCompleta 
                ? 'disabled class="season-action-btn px-4 py-3 bg-gray-800/50 text-gray-500 opacity-50 cursor-not-allowed font-bold text-[11px] sm:text-xs border-t sm:border-t-0 sm:border-l border-gray-600/60 flex items-center justify-center"' 
                : 'class="season-action-btn px-4 py-3 bg-indigo-900/40 text-indigo-300 hover:bg-indigo-600 hover:text-white font-bold text-[11px] sm:text-xs border-t sm:border-t-0 sm:border-l border-gray-600/60 transition-all flex items-center justify-center"';
            
            const btnTempTexto = tempCompleta ? '✓ Temp. completa' : '✓ Marcar como vista';

            modalContent.innerHTML += `
                <div data-season-div="${temp.season_number}" data-total-caps="${temp.episode_count}" class="mb-3 border border-gray-700/80 rounded-2xl overflow-hidden shadow-sm">
                    <div class="w-full bg-gray-700/70 flex flex-col sm:flex-row justify-between items-stretch">
                        <button onclick="cargarEpisodios(this.parentElement, ${tmdb_id}, ${temp.season_number}, '${tracking_id}')" 
                                class="flex-grow p-4 text-left font-bold text-white hover:bg-gray-600 flex items-center gap-3 transition-colors flex-wrap">
                            Temp. ${temp.season_number} 
                            <span class="text-[10px] font-normal bg-gray-800/80 px-2 py-0.5 rounded text-gray-300 border border-gray-600/50">${temp.episode_count} cap.</span>
                            ${estadoTempHtml}
                        </button>
                        <button onclick="marcarTemporadaCompleta('${tracking_id}', ${temp.season_number}, ${temp.episode_count}, this, ${tmdb_id})" ${btnTempAttr}>
                            ${btnTempTexto}
                        </button>
                    </div>
                    <div class="capitulos-container hidden p-2 bg-gray-900/90 flex flex-col gap-1"></div>
                </div>
            `;
        });
    } catch(e) { modalContent.innerHTML = '<p class="text-red-400 text-center">Error al cargar episodios.</p>'; }
}

function evaluarBotonSerieCompleta(tracking_id, tmdb_id, titulo) {
    const btnMarcarSerie = document.getElementById('btnMarcarSerie');
    const totalVistos = vistosTemporal.length;
    const serieCompleta = totalVistos >= totalSerieCapitulosGlobal && totalSerieCapitulosGlobal > 0;

    if (serieCompleta) {
        btnMarcarSerie.textContent = "✓ Serie completada";
        btnMarcarSerie.disabled = true;
        btnMarcarSerie.className = "bg-green-950/60 text-green-400 opacity-60 cursor-not-allowed text-xs md:text-sm font-bold py-2.5 px-4 rounded-xl shadow border border-green-800/50";
    } else {
        btnMarcarSerie.textContent = "✓ Marcar serie completa";
        btnMarcarSerie.disabled = false;
        btnMarcarSerie.className = "bg-green-700 hover:bg-green-600 text-white text-xs md:text-sm font-bold py-2.5 px-4 rounded-xl shadow transition-colors";
        
        btnMarcarSerie.onclick = async () => {
            btnMarcarSerie.textContent = "⌛ Guardando...";
            btnMarcarSerie.disabled = true;
            await procesarSerieCompletaBBDD(tracking_id, tmdb_id);
            await clienteSupabase.from('user_tracking').update({ status: 'vista' }).eq('id', tracking_id);
            alert(`¡Has marcado toda la serie "${titulo}" como Vista!`);
            cerrarModal();
            cargarMiLista(); 
        };
    }
}

async function cargarEpisodios(cabeceraDiv, tmdb_id, season_number, tracking_id) {
    const contenedor = cabeceraDiv.nextElementSibling; 
    if (contenedor.innerHTML !== '') { contenedor.classList.toggle('hidden'); return; }
    
    contenedor.classList.remove('hidden');
    contenedor.innerHTML = '<p class="text-xs text-gray-400 p-3">Buscando capítulos...</p>';

    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}/season/${season_number}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
    const data = await res.json();
    
    contenedor.innerHTML = '';
    data.episodes.forEach(ep => {
        const estaVisto = vistosTemporal.some(v => v.season_number === season_number && v.episode_number === ep.episode_number);
        contenedor.innerHTML += `
            <div class="flex items-center gap-3 p-2 hover:bg-gray-800/80 rounded-xl transition-colors border-b border-gray-800/60 last:border-0">
                <input type="checkbox" id="ep-${ep.id}" ${estaVisto ? 'checked' : ''} 
                       onchange="marcarCapitulo('${tracking_id}', ${season_number}, ${ep.episode_number}, this.checked, ${tmdb_id})"
                       class="peer w-4 h-4 accent-indigo-500 rounded cursor-pointer flex-shrink-0">
                <label for="ep-${ep.id}" class="cursor-pointer flex items-center gap-2 flex-grow">
                    <span class="text-[11px] font-bold text-gray-500 w-5 flex-shrink-0">${ep.episode_number}.</span>
                    <span class="text-[13px] text-gray-300 line-clamp-1 peer-checked:line-through peer-checked:text-gray-600 transition-all">${ep.name}</span>
                </label>
            </div>
        `;
    });
}

async function marcarCapitulo(tracking_id, season_number, episode_number, isChecked, tmdb_id) {
    if (isChecked) {
        await clienteSupabase.from('user_episodes').insert({ tracking_id, season_number, episode_number });
        if (!vistosTemporal.some(v => v.season_number === season_number && v.episode_number === episode_number)) {
            vistosTemporal.push({ season_number, episode_number });
        }
    } else {
        await clienteSupabase.from('user_episodes').delete().match({ tracking_id, season_number, episode_number });
        vistosTemporal = vistosTemporal.filter(v => !(v.season_number === season_number && v.episode_number === episode_number));
    }
    actualizarHeaderTemporada(season_number);
    await evaluarEstadoSerieDesdeEpisodios(tracking_id, tmdb_id);
}

async function marcarTemporadaCompleta(tracking_id, season_number, totalCapitulos, btnElement, tmdb_id) {
    btnElement.textContent = "⌛...";
    btnElement.disabled = true;
    
    await clienteSupabase.from('user_episodes').delete().match({ tracking_id, season_number });
    const inserts = [];
    for(let i = 1; i <= totalCapitulos; i++) inserts.push({ tracking_id, season_number, episode_number: i });
    await clienteSupabase.from('user_episodes').insert(inserts);

    vistosTemporal = vistosTemporal.filter(v => v.season_number !== season_number);
    for(let i = 1; i <= totalCapitulos; i++) vistosTemporal.push({ season_number, episode_number: i });

    const contenedor = btnElement.parentElement.nextElementSibling;
    contenedor.innerHTML = ''; 
    contenedor.classList.add('hidden');
    
    actualizarHeaderTemporada(season_number);
    await evaluarEstadoSerieDesdeEpisodios(tracking_id, tmdb_id);
}

function actualizarHeaderTemporada(season_number) {
    const tempDiv = document.querySelector(`[data-season-div="${season_number}"]`);
    if (!tempDiv) return;

    const totalCapitulos = parseInt(tempDiv.getAttribute('data-total-caps') || '0');
    const vistosDeTemp = vistosTemporal.filter(v => v.season_number === season_number).length;
    const tempCompleta = vistosDeTemp === totalCapitulos && totalCapitulos > 0;

    const badgeElem = tempDiv.querySelector('.season-status-badge');
    const btnElem = tempDiv.querySelector('.season-action-btn');

    if (badgeElem) {
        if (vistosDeTemp === 0) badgeElem.outerHTML = '<span class="season-status-badge text-gray-400 text-[10px] font-normal px-2 bg-gray-800 rounded border border-gray-700 tracking-wider uppercase">⏳ Pendiente</span>';
        else if (vistosDeTemp < totalCapitulos) badgeElem.outerHTML = `<span class="season-status-badge text-yellow-400 text-[10px] font-normal px-2 bg-yellow-900/30 rounded border border-yellow-700/50 tracking-wider uppercase">👀 A medias (${vistosDeTemp}/${totalCapitulos})</span>`;
        else badgeElem.outerHTML = '<span class="season-status-badge text-green-400 text-[10px] font-normal px-2 bg-green-900/30 rounded border border-green-700/50 tracking-wider uppercase">✅ Vista</span>';
    }

    if (btnElem) {
        if (tempCompleta) {
            btnElem.disabled = true;
            btnElem.textContent = "✓ Temp. completa";
            btnElem.className = "season-action-btn px-4 py-3 bg-gray-800/50 text-gray-500 opacity-50 cursor-not-allowed font-bold text-[11px] sm:text-xs border-t sm:border-t-0 sm:border-l border-gray-600/60 flex items-center justify-center";
        } else {
            btnElem.disabled = false;
            btnElem.textContent = "✓ Marcar como vista";
            btnElem.className = "season-action-btn px-4 py-3 bg-indigo-900/40 text-indigo-300 hover:bg-indigo-600 hover:text-white font-bold text-[11px] sm:text-xs border-t sm:border-t-0 sm:border-l border-gray-600/60 transition-all flex items-center justify-center";
        }
    }
}

async function evaluarEstadoSerieDesdeEpisodios(tracking_id, tmdb_id) {
    const totalVistos = vistosTemporal.length;
    let nuevoEstado = 'pendiente';

    if (totalVistos >= totalSerieCapitulosGlobal && totalSerieCapitulosGlobal > 0) nuevoEstado = 'vista';
    else if (totalVistos > 0) nuevoEstado = 'viendo';

    await clienteSupabase.from('user_tracking').update({ status: nuevoEstado }).eq('id', tracking_id);
    
    const idx = miBibliotecaLocal.findIndex(r => r.id === tracking_id);
    if (idx > -1) {
        miBibliotecaLocal[idx].status = nuevoEstado;
        miBibliotecaLocal[idx].user_episodes = [...vistosTemporal]; 
        recalcularSiguienteCapitulo(miBibliotecaLocal[idx]); 
    }

    const titulo = document.getElementById('modalTitle').textContent;
    evaluarBotonSerieCompleta(tracking_id, tmdb_id, titulo);
    
    aplicarFiltrosYDiseño(); 
}
