// 1. TUS CREDENCIALES (¡Rellena esto!)
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNTIyNzVlMDVhNTAxMjllZWYwMGRhN2Q5ZmU5NTZlZSIsIm5iZiI6MTc5MzU1NjUzNC4wMDcsInN1YiI6IjZhZTc4MDM2MWMyNDI4MTQ4MmM4ZGM2NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.b2COQUX-mmBdGPcxwCTUN7HI5EN6KNemlZSzbaD5NuI'; 
const SUPABASE_URL = 'https://dqqfoucxbsvfdshruygt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcWZvdWN4YnN2ZmRzaHJ1eWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDgyOTQsImV4cCI6MjEwOTEyNDI5NH0.Z4yVjtuuSrs3Pc5AghHFVeENOvmIeA8k34iWcVQiqIQ';

// 2. INICIALIZAR SUPABASE (Cambiamos el nombre para evitar el error)
const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. VARIABLES GLOBALES Y DOM
let pelisYSeries = []; 
let usuarioActual = null;

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const loginBtn = document.getElementById('loginBtn');
const emailInput = document.getElementById('emailInput');
const passInput = document.getElementById('passInput');
const loginForm = document.getElementById('loginForm');
const userLogged = document.getElementById('userLogged');

// --- SISTEMA DE AUTENTICACIÓN ---
async function iniciarSesion() {
    const email = emailInput.value;
    const password = passInput.value;
    
    // Usamos clienteSupabase en lugar de supabase
    const { data, error } = await clienteSupabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert("Error al iniciar sesión: " + error.message);
    } else {
        usuarioActual = data.session.user;
        loginForm.classList.add('hidden');
        userLogged.classList.remove('hidden');
    }
}

async function comprobarSesion() {
    const { data: { session } } = await clienteSupabase.auth.getSession();
    if (session) {
        usuarioActual = session.user;
        loginForm.classList.add('hidden');
        userLogged.classList.remove('hidden');
    }
}
loginBtn.addEventListener('click', iniciarSesion);
comprobarSesion(); 


// --- LÓGICA DE BÚSQUEDA TMDB ---
async function buscarEnTMDB(query) {
    const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=es-ES&page=1`;
    const options = {
        method: 'GET',
        headers: { accept: 'application/json', Authorization: `Bearer ${TMDB_TOKEN}` }
    };
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    } catch (error) {
        console.error("Fallo al buscar:", error);
        return [];
    }
}

function renderResults(resultados) {
    resultsGrid.innerHTML = '';
    if (resultados.length === 0) {
        resultsGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center">No se encontraron resultados.</p>';
        return;
    }

    resultados.forEach(item => {
        const titulo = item.title || item.name;
        const tipo = item.media_type === 'movie' ? 'Película' : 'Serie';
        const colorTipo = item.media_type === 'movie' ? 'text-blue-400' : 'text-green-400';
        const imgUrl = item.poster_path 
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
            : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Póster';

        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-xl overflow-hidden shadow hover:ring-2 hover:ring-indigo-500 transition-all flex flex-col';
        card.innerHTML = `
            <img src="${imgUrl}" alt="${titulo}" class="w-full h-auto object-cover aspect-[2/3]">
            <div class="p-4 flex flex-col flex-grow">
                <span class="text-xs font-bold uppercase tracking-wider ${colorTipo}">${tipo}</span>
                <h3 class="font-bold text-lg leading-tight mt-1 mb-4 line-clamp-2">${titulo}</h3>
                <button class="mt-auto w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm font-semibold transition-colors"
                        onclick="añadirALista(${item.id})">
                    + Añadir a mi lista
                </button>
            </div>
        `;
        resultsGrid.appendChild(card);
    });
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


// --- GUARDAR EN SUPABASE ---
async function añadirALista(tmdb_id) {
    if (!usuarioActual) {
        alert("¡Inicia sesión primero para poder guardar!");
        return;
    }

    const item = pelisYSeries.find(i => i.id === tmdb_id);
    const titulo = item.title || item.name;
    const tipo = item.media_type;

    // 1. Guardar en el catálogo general
    await clienteSupabase.from('items').insert({
        tmdb_id: item.id,
        title: titulo,
        type: tipo,
        poster_path: item.poster_path
    });

    // 2. Obtener el UUID interno
    const { data: dbItem, error: errorSelect } = await clienteSupabase
        .from('items')
        .select('id')
        .eq('tmdb_id', item.id)
        .eq('type', tipo)
        .single();

    if (errorSelect || !dbItem) {
        alert("Hubo un error al leer la base de datos.");
        return;
    }

    // 3. Vincularlo a tu usuario
    const { error: errorInsert } = await clienteSupabase.from('user_tracking').insert({
        user_id: usuarioActual.id,
        item_id: dbItem.id,
        status: 'pendiente'
    });

    if (errorInsert) {
        if (errorInsert.code === '23505') { 
            alert("¡Ya tienes esto en tu lista!");
        } else {
            alert("Error al añadir a tu lista.");
            console.error(errorInsert);
        }
    } else {
        alert(`✅ "${titulo}" guardada como Pendiente`);
    }
}
// --- NUEVAS VARIABLES DEL DOM ---
const viewSearch = document.getElementById('viewSearch');
const viewList = document.getElementById('viewList');
const btnNavSearch = document.getElementById('btnNavSearch');
const btnNavList = document.getElementById('btnNavList');
const myListGrid = document.getElementById('myListGrid');

// --- LÓGICA DE NAVEGACIÓN ---
btnNavSearch.addEventListener('click', () => {
    viewSearch.classList.remove('hidden');
    viewList.classList.add('hidden');
    btnNavSearch.classList.replace('bg-gray-700', 'bg-indigo-600');
    btnNavList.classList.replace('bg-indigo-600', 'bg-gray-700');
});

btnNavList.addEventListener('click', () => {
    viewSearch.classList.add('hidden');
    viewList.classList.remove('hidden');
    btnNavList.classList.replace('bg-gray-700', 'bg-indigo-600');
    btnNavSearch.classList.replace('bg-indigo-600', 'bg-gray-700');
    cargarMiLista(); // Cargamos la base de datos al entrar en la pestaña
});

// --- CARGAR Y PINTAR MI LISTA ---
async function cargarMiLista() {
    if (!usuarioActual) return;
    
    myListGrid.innerHTML = '<p class="text-indigo-400 col-span-full text-center">Cargando tu biblioteca...</p>';

    // La magia relacional de Supabase: Trae el tracking y la información del item unido
    const { data, error } = await clienteSupabase
        .from('user_tracking')
        .select(`
            id,
            status,
            items ( id, title, type, poster_path )
        `)
        .eq('user_id', usuarioActual.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        myListGrid.innerHTML = '<p class="text-red-400 col-span-full text-center">Error al cargar la lista.</p>';
        return;
    }

    pintarMiLista(data);
}

function pintarMiLista(registros) {
    myListGrid.innerHTML = '';
    if (registros.length === 0) {
        myListGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center">Aún no has guardado nada.</p>';
        return;
    }

    registros.forEach(registro => {
        const item = registro.items; 
        const imgUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Póster';
        const tipo = item.type === 'movie' ? 'Película' : 'Serie';
        const colorTipo = item.type === 'movie' ? 'text-blue-400' : 'text-green-400';

        // NUEVO: Creamos el botón solo si el tipo es 'tv' (Serie)
        // Usamos replace para evitar que títulos con apóstrofes rompan el HTML
        const botonCapitulos = item.type === 'tv' 
            ? `<button onclick="abrirModalSeries(${item.tmdb_id}, '${registro.id}', '${item.title.replace(/'/g, "\\'")}')" 
                       class="mt-2 w-full bg-indigo-900 hover:bg-indigo-700 text-indigo-100 py-2 rounded text-sm font-semibold transition-colors">
                 📋 Ver Capítulos
               </button>` 
            : '';

        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-xl overflow-hidden shadow border border-gray-700 flex flex-col';
        card.innerHTML = `
            <img src="${imgUrl}" alt="${item.title}" class="w-full h-auto object-cover aspect-[2/3]">
            <div class="p-4 flex flex-col flex-grow">
                <span class="text-xs font-bold uppercase tracking-wider ${colorTipo}">${tipo}</span>
                <h3 class="font-bold text-lg leading-tight mt-1 mb-3 line-clamp-2">${item.title}</h3>
                
                <div class="mt-auto">
                    <label class="text-xs text-gray-400 uppercase font-bold">Estado:</label>
                    <select onchange="cambiarEstado('${registro.id}', this.value)" 
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

// --- CAMBIAR EL ESTADO ---
async function cambiarEstado(tracking_id, nuevoEstado) {
    const { error } = await clienteSupabase
        .from('user_tracking')
        .update({ status: nuevoEstado })
        .eq('id', tracking_id);

    if (error) {
        alert("Error al actualizar el estado");
        console.error(error);
    } else {
        console.log(`Estado actualizado a ${nuevoEstado}`);
    }
}
// --- LÓGICA DE LAS SERIES (MODAL, TMDB Y SUPABASE) ---

let vistosTemporal = []; // Guardará en memoria los capítulos ya vistos para no consultar a la BD constantemente

function cerrarModal() {
    document.getElementById('modalEpisodios').classList.add('hidden');
}

async function abrirModalSeries(tmdb_id, tracking_id, titulo) {
    const modalEpisodios = document.getElementById('modalEpisodios');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    modalEpisodios.classList.remove('hidden');
    modalTitle.textContent = titulo;
    modalContent.innerHTML = '<p class="text-center text-indigo-400">Cargando datos de la serie...</p>';

    try {
        // 1. Pedir a TMDB las temporadas que tiene esta serie
        const resTMDB = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}?language=es-ES`, {
            headers: { Authorization: `Bearer ${TMDB_TOKEN}` }
        });
        const serieData = await resTMDB.json();

        // 2. Pedir a Supabase TODOS los capítulos que ya has visto de esta serie
        const { data: vistosDB } = await clienteSupabase
            .from('user_episodes')
            .select('season_number, episode_number')
            .eq('tracking_id', tracking_id);
        
        vistosTemporal = vistosDB || [];

        // 3. Pintar los "botones acordeón" de las temporadas
        modalContent.innerHTML = '';
        
        // Filtramos t.season_number > 0 para quitar los extras/especiales
        serieData.seasons.filter(t => t.season_number > 0).forEach(temp => {
            modalContent.innerHTML += `
                <div class="mb-3 border border-gray-700 rounded overflow-hidden shadow-sm">
                    <button onclick="cargarEpisodios(this, ${tmdb_id}, ${temp.season_number}, '${tracking_id}')" 
                            class="w-full bg-gray-700 hover:bg-gray-600 p-4 text-left font-bold flex justify-between items-center transition-colors">
                        <span class="text-white">Temporada ${temp.season_number}</span>
                        <span class="text-xs font-normal bg-gray-800 px-2 py-1 rounded text-gray-300">${temp.episode_count} cap.</span>
                    </button>
                    <!-- Div oculto donde se cargarán los capítulos al hacer clic -->
                    <div class="capitulos-container hidden p-2 bg-gray-900 grid gap-1"></div>
                </div>
            `;
        });
    } catch(error) {
        console.error(error);
        modalContent.innerHTML = '<p class="text-red-400 text-center">Error de conexión al cargar las temporadas.</p>';
    }
}

async function cargarEpisodios(botonAcordeon, tmdb_id, season_number, tracking_id) {
    const contenedor = botonAcordeon.nextElementSibling; 
    
    // Efecto Acordeón: Si ya tiene contenido, solo lo ocultamos/mostramos sin gastar llamadas a la API
    if (contenedor.innerHTML !== '') {
        contenedor.classList.toggle('hidden');
        return;
    }
    
    contenedor.classList.remove('hidden');
    contenedor.innerHTML = '<p class="text-sm text-gray-400 p-2">Buscando capítulos...</p>';

    // Pedimos los nombres de los capítulos de esta temporada a TMDB
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}/season/${season_number}?language=es-ES`, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` }
    });
    const data = await res.json();
    
    contenedor.innerHTML = '';
    data.episodes.forEach(ep => {
        // Comprobamos si las variables coinciden con lo que trajimos de Supabase antes
        const estaVisto = vistosTemporal.some(v => v.season_number === season_number && v.episode_number === ep.episode_number);
        
        contenedor.innerHTML += `
            <label class="flex items-center gap-3 p-3 hover:bg-gray-800 rounded transition-colors cursor-pointer border-b border-gray-800 last:border-0">
                <input type="checkbox" ${estaVisto ? 'checked' : ''} 
                       onchange="marcarCapitulo('${tracking_id}', ${season_number}, ${ep.episode_number}, this.checked)"
                       class="w-5 h-5 accent-indigo-500 rounded cursor-pointer flex-shrink-0">
                <span class="text-sm font-semibold text-gray-500 w-6 flex-shrink-0">${ep.episode_number}.</span>
                <span class="text-sm text-gray-200 line-clamp-1">${ep.name}</span>
            </label>
        `;
    });
}

async function marcarCapitulo(tracking_id, season_number, episode_number, isChecked) {
    // En base al checkbox, insertamos la fila en Supabase o la borramos
    if (isChecked) {
        await clienteSupabase.from('user_episodes').insert({
            tracking_id, season_number, episode_number
        });
        console.log(`Capítulo ${episode_number} insertado en BBDD.`);
    } else {
        await clienteSupabase.from('user_episodes')
            .delete()
            .match({ tracking_id, season_number, episode_number });
        console.log(`Capítulo ${episode_number} borrado de BBDD.`);
    }
}
