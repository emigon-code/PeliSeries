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
