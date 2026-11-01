// ¡Acuérdate de pegar aquí tu token de TMDB!
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNTIyNzVlMDVhNTAxMjllZWYwMGRhN2Q5ZmU5NTZlZSIsIm5iZiI6MTc5MzU1NjUzNC4wMDcsInN1YiI6IjZhZTc4MDM2MWMyNDI4MTQ4MmM4ZGM2NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.b2COQUX-mmBdGPcxwCTUN7HI5EN6KNemlZSzbaD5NuI'; 

// Referencias al HTML
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');

// Función 1: Buscar en la API
async function buscarEnTMDB(query) {
    const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=es-ES&page=1`;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_TOKEN}`
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        // Filtramos para quitar actores, solo queremos pelis y series
        return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    } catch (error) {
        console.error("Fallo al buscar:", error);
        return [];
    }
}

// Función 2: Pintar los resultados en pantalla
function renderResults(resultados) {
    resultsGrid.innerHTML = ''; // Limpiamos resultados anteriores

    if (resultados.length === 0) {
        resultsGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center text-xl">No se encontraron resultados.</p>';
        return;
    }

    resultados.forEach(item => {
        // TMDB usa 'title' para pelis y 'name' para series
        const titulo = item.title || item.name;
        const tipo = item.media_type === 'movie' ? 'Película' : 'Serie';
        const colorTipo = item.media_type === 'movie' ? 'text-blue-400' : 'text-green-400';
        
        // Si no tiene imagen, ponemos un gris de relleno
        const imgUrl = item.poster_path 
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
            : 'https://via.placeholder.com/500x750/1f2937/ffffff?text=Sin+Póster';

        // Construimos la tarjeta HTML para cada resultado
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:ring-2 hover:ring-indigo-500 transition-all flex flex-col';
        
        card.innerHTML = `
            <img src="${imgUrl}" alt="${titulo}" class="w-full h-auto object-cover aspect-[2/3]">
            <div class="p-4 flex flex-col flex-grow">
                <span class="text-xs font-bold uppercase tracking-wider ${colorTipo}">${tipo}</span>
                <h3 class="font-bold text-lg leading-tight mt-1 mb-4 line-clamp-2">${titulo}</h3>
                
                <button class="mt-auto w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors shadow"
                        onclick="añadirALista(${item.id})">
                    + Añadir a mi lista
                </button>
            </div>
        `;
        resultsGrid.appendChild(card);
    });
}

// Función que se ejecutará al pulsar el botón de buscar
async function ejecutarBusqueda() {
    const query = searchInput.value.trim();
    if (query.length > 0) {
        resultsGrid.innerHTML = '<p class="text-indigo-400 col-span-full text-center text-xl animate-pulse">Buscando en la base de datos...</p>';
        const resultados = await buscarEnTMDB(query);
        renderResults(resultados);
    }
}

// Eventos: Al hacer clic en el botón o pulsar Enter
searchBtn.addEventListener('click', ejecutarBusqueda);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') ejecutarBusqueda();
});

// Función vacía temporalmente para el botón "Añadir a mi lista"
function añadirALista(id) {
    console.log("Hiciste clic para añadir el ID de TMDB:", id);
    alert("En el siguiente paso conectaremos esto con Supabase para el ID: " + id);
}
