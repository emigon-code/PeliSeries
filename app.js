// 1. TUS CREDENCIALES (¡Rellena esto antes de hacer commit!)
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNTIyNzVlMDVhNTAxMjllZWYwMGRhN2Q5ZmU5NTZlZSIsIm5iZiI6MTc5MzU1NjUzNC4wMDcsInN1YiI6IjZhZTc4MDM2MWMyNDI4MTQ4MmM4ZGM2NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.b2COQUX-mmBdGPcxwCTUN7HI5EN6KNemlZSzbaD5NuI'; 
const SUPABASE_URL = 'https://dqqfoucxbsvfdshruygt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcWZvdWN4YnN2ZmRzaHJ1eWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDgyOTQsImV4cCI6MjEwOTEyNDI5NH0.Z4yVjtuuSrs3Pc5AghHFVeENOvmIeA8k34iWcVQiqIQ';

const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// VARIABLES GLOBALES Y DOM
let pelisYSeries = []; 
let usuarioActual = null;
let miListaTMDBIDs = []; 
let vistosTemporal = []; 
let miBibliotecaLocal = []; // Almacena toda la lista para poder filtrarla sin recargar

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
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
const modalEpisodios = document.getElementById('modalEpisodios');

// Elementos de Filtro
const filterType = document.getElementById('filterType');
const filterStatus = document.getElementById('filterStatus');

filterType.addEventListener('change', aplicarFiltros);
filterStatus.addEventListener('change', aplicarFiltros);

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
    loginForm.classList.add('hidden');
    userLogged.classList.remove('hidden');
    await actualizarIdsLocales(); 
}

logoutBtn.addEventListener('click', async () => {
    await clienteSupabase.auth.signOut();
    usuarioActual = null; miListaTMDBIDs = []; miBibliotecaLocal = [];
    userLogged.classList.add('hidden'); loginForm.classList.remove('hidden');
    emailInput.value = ''; passInput.value = '';
    btnNavSearch.click(); 
    resultsGrid.innerHTML = ''; myListGrid.innerHTML = '';
});

loginBtn.addEventListener('click', iniciarSesion);
comprobarSesion();


// --- NAVEGACIÓN ---
btnNavSearch.addEventListener('click', () => {
    viewSearch.classList.remove('hidden'); viewList.classList.add('hidden');
    btnNavSearch.classList.replace('bg-gray-700', 'bg-indigo-600');
    btnNavList.classList.replace('bg-indigo-600', 'bg-gray-700');
    if (pelisYSeries.length > 0) renderResults(pelisYSeries); 
});

btnNavList.addEventListener('click', () => {
    viewSearch.classList.add('hidden'); viewList.classList.remove('hidden');
    btnNavList.classList.replace('bg-gray-700', 'bg-indigo-600');
    btnNavSearch.classList.replace('bg-indigo-600', 'bg-gray-700');
    cargarMiLista();
});


// --- BUSCADOR ---
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
        renderResults(pelisYSeries);
    }
}
searchBtn.addEventListener('click', ejecutarBusqueda);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') ejecutarBusqueda(); });

function renderResults(resultados) {
    resultsGrid.innerHTML = '';
    if (resultados.length === 0) return resultsGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center">Sin resultados.</p>';

    resultados.forEach(item => {
        const titulo = item.title || item.name;
        const tipo = item.media_type === 'movie' ? 'Película' : 'Serie';
        const imgUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=X';
        
        const yaLaTengo = miListaTMDBIDs.includes(item.id);
        const botonAñadir = yaLaTengo 
            ? `<button disabled class="mt-auto w-full bg-green-900/50 text-green-400 py-2 rounded text-sm font-bold cursor-not-allowed border border-green-800">✓ En tu lista</button>`
            : `<button class="mt-auto w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm font-semibold transition-colors shadow" onclick="añadirALista(${item.id})">+ Añadir a mi lista</button>`;

        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-xl overflow-hidden shadow flex flex-col';
        card.innerHTML = `
            <img src="${imgUrl}" alt="${titulo}" class="w-full h-auto object-cover aspect-[2/3]">
            <div class="p-4 flex flex-col flex-grow">
                <span class="text-xs font-bold uppercase text-gray-400">${tipo}</span>
                <h3 class="font-bold text-lg leading-tight mt-1 mb-4 line-clamp-2">${titulo}</h3>
                ${botonAñadir}
            </div>
        `;
        resultsGrid.appendChild(card);
    });
}


// --- SUPABASE BÁSICOS ---
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
    const { error } = await clienteSupabase.from('user_tracking').insert({ user_id: usuarioActual.id, item_id: dbItem.id, status: 'pendiente' });

    if (!error) {
        miListaTMDBIDs.push(item.id); 
        renderResults(pelisYSeries);  
    }
}

async function borrarDeMiLista(tracking_id, tmdb_id, titulo) {
    if (confirm(`¿Eliminar "${titulo}" de tu biblioteca?`)) {
        await clienteSupabase.from('user_tracking').delete().eq('id', tracking_id);
        miListaTMDBIDs = miListaTMDBIDs.filter(id => id !== tmdb_id);
        cargarMiLista(); 
    }
}


// --- PESTAÑA MI LISTA (CON FILTROS AUTOMÁTICOS) ---
async function cargarMiLista() {
    if (!usuarioActual) return;
    myListGrid.innerHTML = '<p class="text-indigo-400 col-span-full text-center">Cargando biblioteca...</p>';

    const { data, error } = await clienteSupabase.from('user_tracking')
        .select(`id, status, items ( id, tmdb_id, title, type, poster_path )`)
        .eq('user_id', usuarioActual.id).order('created_at', { ascending: false });

    if (error || data.length === 0) {
        miBibliotecaLocal = [];
        return myListGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center">Aún no has guardado nada.</p>';
    }

    miBibliotecaLocal = data; // Guardamos en local para los filtros
    aplicarFiltros();
}

function aplicarFiltros() {
    const typeValue = filterType.value;
    const statusValue = filterStatus.value;

    const dataFiltrada = miBibliotecaLocal.filter(registro => {
        const matchType = typeValue === 'all' || registro.items.type === typeValue;
        const matchStatus = statusValue === 'all' || registro.status === statusValue;
        return matchType && matchStatus;
    });

    pintarMiLista(dataFiltrada);
}

function pintarMiLista(dataArray) {
    myListGrid.innerHTML = '';
    if (dataArray.length === 0) return myListGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center">No hay resultados para este filtro.</p>';

    dataArray.forEach(registro => {
        const item = registro.items; 
        const imgUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=X';
        const tituloSeguro = item.title.replace(/'/g, "\\'");

        const botonCapitulos = item.type === 'tv' 
            ? `<button onclick="abrirModalSeries(${item.tmdb_id}, '${registro.id}', '${tituloSeguro}')" 
                       class="mt-2 w-full bg-indigo-900 hover:bg-indigo-700 text-indigo-100 py-2 rounded text-sm font-semibold transition-colors">
                 📋 Ver Capítulos
               </button>` : '';

        const card = document.createElement('div');
        card.className = 'relative bg-gray-800 rounded-xl overflow-hidden shadow border border-gray-700 flex flex-col';
        card.innerHTML = `
            <button onclick="borrarDeMiLista('${registro.id}', ${item.tmdb_id}, '${tituloSeguro}')" 
                    class="absolute top-2 right-2 bg-red-600/90 hover:bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-lg z-10" title="Eliminar">
                &times;
            </button>
            <img src="${imgUrl}" alt="${item.title}" class="w-full h-auto object-cover aspect-[2/3]">
            <div class="p-4 flex flex-col flex-grow">
                <span class="text-xs font-bold uppercase text-gray-400">${item.type === 'movie' ? 'Película' : 'Serie'}</span>
                <h3 class="font-bold text-lg leading-tight mt-1 mb-3 line-clamp-2">${item.title}</h3>
                <div class="mt-auto">
                    <!-- Pasamos el Select completo (this) para poder deshabilitarlo mientras guarda -->
                    <select onchange="cambiarEstado(this, '${registro.id}', ${item.tmdb_id}, '${item.type}', '${tituloSeguro}')" 
                            class="w-full mt-1 mb-2 bg-gray-700 text-white text-sm rounded p-2 focus:ring-indigo-500 border-none outline-none cursor-pointer">
                        <option value="pendiente" ${registro.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="viendo" ${registro.status === 'viendo' ? 'selected' : ''}>Viendo</option>
                        <option value="vista" ${registro.status === 'vista' ? 'selected' : ''}>Vista</option>
                    </select>
                    ${botonCapitulos}
                </div>
            </div>
        `;
        myListGrid.appendChild(card);
    });
}


// --- LÓGICA CORE: MARCAR SERIE COMPLETA Y ESTADOS ---
async function procesarSerieCompletaBBDD(tracking_id, tmdb_id) {
    try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const serieData = await res.json();

        // Borramos primero todo rastro antiguo para evitar duplicados
        await clienteSupabase.from('user_episodes').delete().eq('tracking_id', tracking_id);
        
        const inserts = [];
        serieData.seasons.filter(t => t.season_number > 0).forEach(temp => {
            for(let i = 1; i <= temp.episode_count; i++) inserts.push({ tracking_id, season_number: temp.season_number, episode_number: i });
        });
        
        // Insertamos en bloques de 500 para evitar que Supabase bloquee la petición en series súper largas (ej. One Piece)
        for (let i = 0; i < inserts.length; i += 500) {
            await clienteSupabase.from('user_episodes').insert(inserts.slice(i, i + 500));
        }
        return true;
    } catch(e) { console.error("Fallo BBDD serie:", e); return false; }
}

async function cambiarEstado(selectElement, tracking_id, tmdb_id, tipo, titulo) {
    const nuevoEstado = selectElement.value;
    selectElement.disabled = true; // Bloqueamos el select mientras piensa

    // MAGIA NUEVA: Si marcas una serie como Vista desde la tarjeta principal
    if (nuevoEstado === 'vista' && tipo === 'tv') {
        if (confirm(`Al marcar la serie "${titulo}" como Vista, se marcarán automáticamente todos sus capítulos. ¿Deseas continuar?`)) {
            await procesarSerieCompletaBBDD(tracking_id, tmdb_id);
        } else {
            cargarMiLista(); // Si el usuario cancela, recargamos para devolver el select a su estado original
            return; 
        }
    }

    await clienteSupabase.from('user_tracking').update({ status: nuevoEstado }).eq('id', tracking_id);
    
    // Actualizar la variable local para que los filtros funcionen sin recargar la BBDD
    const index = miBibliotecaLocal.findIndex(r => r.id === tracking_id);
    if(index > -1) miBibliotecaLocal[index].status = nuevoEstado;
    
    selectElement.disabled = false;
    aplicarFiltros(); // Refresca visualmente la lista (por si estás filtrando por pendientes y acabas de ponerla a vista)
}


// --- MODAL DE ACORDEONES ---
function cerrarModal() { modalEpisodios.classList.add('hidden'); }

async function abrirModalSeries(tmdb_id, tracking_id, titulo) {
    modalEpisodios.classList.remove('hidden');
    document.getElementById('modalTitle').textContent = titulo;
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = '<p class="text-center text-indigo-400">Cargando...</p>';

    // Botón Global de la cabecera
    const btnMarcarSerie = document.getElementById('btnMarcarSerie');
    btnMarcarSerie.textContent = "✓ Marcar serie completa";
    btnMarcarSerie.disabled = false;
    btnMarcarSerie.onclick = async () => {
        btnMarcarSerie.textContent = "⌛ Guardando capítulos...";
        btnMarcarSerie.disabled = true;
        await procesarSerieCompletaBBDD(tracking_id, tmdb_id);
        await clienteSupabase.from('user_tracking').update({ status: 'vista' }).eq('id', tracking_id);
        alert(`¡Has marcado toda la serie "${titulo}" como Vista!`);
        cerrarModal();
        cargarMiLista(); 
    };

    try {
        const resTMDB = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
        const serieData = await resTMDB.json();

        const { data: vistosDB } = await clienteSupabase.from('user_episodes').select('season_number, episode_number').eq('tracking_id', tracking_id);
        vistosTemporal = vistosDB || [];

        modalContent.innerHTML = '';
        serieData.seasons.filter(t => t.season_number > 0).forEach(temp => {
            modalContent.innerHTML += `
                <div class="mb-3 border border-gray-700 rounded overflow-hidden shadow-sm">
                    <div class="w-full bg-gray-700 flex flex-wrap sm:flex-nowrap justify-between items-stretch">
                        
                        <button onclick="cargarEpisodios(this.parentElement, ${tmdb_id}, ${temp.season_number}, '${tracking_id}')" 
                                class="flex-grow p-4 text-left font-bold text-white hover:bg-gray-600 flex items-center gap-3 transition-colors">
                            Temp. ${temp.season_number} 
                            <span class="text-xs font-normal bg-gray-800 px-2 py-1 rounded text-gray-300">${temp.episode_count} cap.</span>
                        </button>
                        
                        <!-- BOTÓN MARCAR TEMPORADA (Rediseñado para ser muy visible) -->
                        <button onclick="marcarTemporadaCompleta('${tracking_id}', ${temp.season_number}, ${temp.episode_count}, this)" 
                                class="px-6 py-3 bg-green-900/40 text-green-400 hover:bg-green-600 hover:text-white font-bold text-sm border-l border-gray-600 transition-all flex items-center justify-center">
                            ✓ Temporada Vista
                        </button>

                    </div>
                    <div class="capitulos-container hidden p-2 bg-gray-900 flex flex-col gap-1"></div>
                </div>
            `;
        });
    } catch(e) { modalContent.innerHTML = '<p class="text-red-400 text-center">Error al cargar.</p>'; }
}

async function cargarEpisodios(cabeceraDiv, tmdb_id, season_number, tracking_id) {
    const contenedor = cabeceraDiv.nextElementSibling; 
    if (contenedor.innerHTML !== '') { contenedor.classList.toggle('hidden'); return; }
    
    contenedor.classList.remove('hidden');
    contenedor.innerHTML = '<p class="text-sm text-gray-400 p-2">Buscando capítulos...</p>';

    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}/season/${season_number}?language=es-ES`, { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } });
    const data = await res.json();
    
    contenedor.innerHTML = '';
    data.episodes.forEach(ep => {
        const estaVisto = vistosTemporal.some(v => v.season_number === season_number && v.episode_number === ep.episode_number);
        
        contenedor.innerHTML += `
            <div class="flex items-center gap-3 p-3 hover:bg-gray-800 rounded transition-colors border-b border-gray-800 last:border-0">
                <input type="checkbox" id="ep-${ep.id}" ${estaVisto ? 'checked' : ''} 
                       onchange="marcarCapitulo('${tracking_id}', ${season_number}, ${ep.episode_number}, this.checked)"
                       class="peer w-5 h-5 accent-indigo-500 rounded cursor-pointer flex-shrink-0">
                <label for="ep-${ep.id}" class="cursor-pointer flex items-center gap-2 flex-grow">
                    <span class="text-sm font-semibold text-gray-500 w-6 flex-shrink-0">${ep.episode_number}.</span>
                    <span class="text-sm text-gray-200 line-clamp-1 peer-checked:line-through peer-checked:text-gray-600 transition-all">${ep.name}</span>
                </label>
            </div>
        `;
    });
}

async function marcarCapitulo(tracking_id, season_number, episode_number, isChecked) {
    if (isChecked) await clienteSupabase.from('user_episodes').insert({ tracking_id, season_number, episode_number });
    else await clienteSupabase.from('user_episodes').delete().match({ tracking_id, season_number, episode_number });
}

async function marcarTemporadaCompleta(tracking_id, season_number, totalCapitulos, btnElement) {
    btnElement.textContent = "⌛...";
    btnElement.disabled = true;
    
    await clienteSupabase.from('user_episodes').delete().match({ tracking_id, season_number });
    
    const inserts = [];
    for(let i = 1; i <= totalCapitulos; i++) inserts.push({ tracking_id, season_number, episode_number: i });
    await clienteSupabase.from('user_episodes').insert(inserts);

    const contenedor = btnElement.parentElement.nextElementSibling;
    contenedor.innerHTML = ''; 
    contenedor.classList.add('hidden');
    
    btnElement.textContent = "✓ Vista";
    btnElement.classList.replace('text-green-400', 'text-white');
    btnElement.classList.replace('bg-green-900/40', 'bg-green-600');
    
    setTimeout(() => { 
        btnElement.textContent = "✓ Temporada Vista"; 
        btnElement.disabled = false;
        btnElement.classList.replace('text-white', 'text-green-400');
        btnElement.classList.replace('bg-green-600', 'bg-green-900/40');
    }, 2000);
}
