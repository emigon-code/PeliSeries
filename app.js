// Sustituye esto por tu Token v4 de TMDB
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNTIyNzVlMDVhNTAxMjllZWYwMGRhN2Q5ZmU5NTZlZSIsIm5iZiI6MTc5MzU1NjUzNC4wMDcsInN1YiI6IjZhZTc4MDM2MWMyNDI4MTQ4MmM4ZGM2NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.b2COQUX-mmBdGPcxwCTUN7HI5EN6KNemlZSzbaD5NuI'; 

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
    const resultados = data.results.filter(
      item => item.media_type === 'movie' || item.media_type === 'tv'
    );
    
    console.log("Resultados desde TMDB:", resultados);
    return resultados;
  } catch (error) {
    console.error("Fallo al buscar:", error);
  }
}

// Ejecutamos la prueba nada más cargar la web en Vercel
buscarEnTMDB('Juego de Tronos');
