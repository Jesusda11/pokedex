// Selectores DOM
const inputBuscador = document.querySelector('.search-box input');
const btnBuscar = document.querySelector('.search-btn');
const btnAleatorio = document.querySelector('.random-btn');
const containerFiltros = document.querySelector('.filters');
const containerPokemon = document.querySelector('.pokemon-card .pokemon-header h2');
const etiquetaIdPokemon = document.querySelector('.pokemon-card .pokemon-header .pokemon-id');
const containerImagenesPokemon = document.querySelector('.pokemon-card .pokemon-img');
const containerTiposPokemon = document.querySelector('.pokemon-card .pokemon-type');
const containerEstadisticas = document.querySelector('.pokemon-info .stats');
const listaMovimientos = document.querySelector('.pokemon-info .moves ul');
const btnAnterior = document.querySelector('.navigation .prev');
const btnSiguiente = document.querySelector('.navigation .next');

let idPokemonActual = null;

function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

async function obtenerPokemon(nombreOrId) {
  try {
    nombreOrId = String(nombreOrId || '').trim();
    const nombreLimpio = nombreOrId.toLowerCase();
    const respuesta = await axios.get(`${POKEAPI_URL}/${nombreLimpio}`);
    const d = respuesta.data; 
    //devuelve el formato organizado para manejar sus atributos facilmente
    return {
      nombre: d.nombre,
      id: d.id,
      types: d.tipos,
      sprites: {
        front_default: d.imagenes?.default ?? null,
        front_shiny: d.imagenes?.shiny ?? null,
        front_female: d.imagenes?.female ?? null
      },
      stats: (d.estadisticas || []).map(s => ({ stat: { nombre: s.nombre }, valor: s.valor })),
      moves: (d.movimientos || []).map(m => ({ move: { nombre: m.nombre}}))
    };
  } catch (err) {
    throw new Error('Pokémon no encontrado');
  }
}

function renderCartaPokemon(poke) {
  containerPokemon.textContent = capitalizar(poke.nombre);
  etiquetaIdPokemon.textContent = `#${poke.id}`;
  idPokemonActual = poke.id;
}

function renderizarImagenes(poke) {
  containerImagenesPokemon.innerHTML = '';
  const sprites = poke.sprites || {};
  const urls = [];
  if (sprites.front_female) urls.push(sprites.front_female);
  if (sprites.front_default) urls.push(sprites.front_default);
  if (sprites.front_shiny) urls.push(sprites.front_shiny);

  urls.slice(0, 3).forEach(u => {
    const imgEl = document.createElement('img');
    imgEl.src = u;  
    imgEl.title = poke.nombre
    if(u.includes('shiny')){
      imgEl.title = poke.nombre + " shiny";
    }else if(u.includes('female')) {
      imgEl.title = poke.nombre + " female";
    }
  
    // Creamos un contenedor para el tooltip
  const wrapper = document.createElement('div');
  wrapper.className = 'tooltip-container';

  // Creamos el tooltip
  const tooltip = document.createElement('span');
  tooltip.className = 'tooltip-text';
  tooltip.textContent = imgEl.title;

  // Insertamos imagen y tooltip dentro del contenedor
  wrapper.appendChild(imgEl);
  wrapper.appendChild(tooltip);

  containerImagenesPokemon.appendChild(wrapper);
  });
}

function renderizarTipos(poke) {
  containerTiposPokemon.innerHTML = '';
  (poke.types).forEach(t => {
    const span = document.createElement('span');
    span.className = `type ${mapearTextoATipoApi(t.toLowerCase())}`;
    span.textContent = capitalizar(t);
    span.dataset.type = t;
    containerTiposPokemon.appendChild(span);
  });
}

function renderizarEstadisticas(poke) {
  const listaStats = poke.stats;
  const elementosStat = document.querySelectorAll('.stat .bar div');
   const etiquetaelementosStat = document.querySelectorAll('.labelStat');
  for (let i = 0; i < listaStats.length; i++) {
    elementosStat[i].style.width = listaStats[i].valor + "%";
    etiquetaelementosStat[i].textContent = listaStats[i].valor;
  }
}

function renderizarMovimientos(poke) {
  listaMovimientos.innerHTML = '';
  const movimientosAMostrar = (poke.moves || []).slice(0, 6);
  if (movimientosAMostrar.length === 0) {
    listaMovimientos.innerHTML = '<li>No hay movimientos</li>';
    return;
  }
  movimientosAMostrar.forEach(m => {
    const d = m.details || {};
    const nombre = d.nombre || m.move.nombre || 'Movimiento';
    const potencia = (d.potencia ?? '—');
    const precision = (d.precision ?? '—');
    const tipo = d.tipo ? capitalizar(d.tipo) : '???';
    const li = document.createElement('li');
    li.innerHTML = `<strong>${capitalizar(nombre)}</strong><br/><small>Tipo: ${tipo} | Potencia: ${potencia} | Precisión: ${precision}</small>`;
    listaMovimientos.appendChild(li);
  });
}

async function mostrarPokemon(nombreOrId) {
  try {
    mostrarLoader(); // 👉 mostramos a Ditto antes de pedir datos
    
    const poke = await obtenerPokemon(nombreOrId);
    renderCartaPokemon(poke);
    renderizarImagenes(poke);
    renderizarTipos(poke);
    renderizarEstadisticas(poke);
    renderizarMovimientos(poke);
    btnAnterior.disabled = poke.id === 1; 
    btnSiguiente.disabled = false;
  } catch (err) {
    alert(err.message || 'Error obteniendo Pokémon');
  } finally {
    ocultarLoader(); // 👉 ocultamos a Ditto cuando ya se renderizó
  }
}


async function manejadorBusqueda() {
  const busqueda = inputBuscador.value.trim();
  if(!isNaN(busqueda) && busqueda > 1025) {
    return alert('Pokemon inexistente fuera de rango')
  }
  if (!busqueda) return alert('Escribe el nombre o id del Pokémon');
  await mostrarPokemon(busqueda);
}

async function manejadorAleatorio() {
  //genera un id aleatorio de los 1024
  try {
    let numerorandom = Math.floor(Math.random() * 1024) + 1;
    const res = await axios.get(`${POKEAPI_URL}/` + numerorandom);
    const p = res.data;
    await mostrarPokemon(p.id);
  } catch (e) { 
    await mostrarPokemon(1); //por defecto muestra al primero
  }

}

async function manejadorAnterior() {
  await mostrarPokemon(idPokemonActual - 1);
}
async function manejadorSiguiente() {
  if(idPokemonActual >= 1025){
    idPokemonActual = 0;
  }
  await mostrarPokemon(idPokemonActual + 1);
}

// Filtros por tipo
async function manejadorFiltroTipo(tipo) {
  if (!tipo) return;
  try {
    const res = await axios.get(`${POKEAPI_URL}/tipo/${tipo}`);
    const datos = res.data;
    const elegido = datos[Math.floor(Math.random() * datos.length)];
    const nombreOId = elegido.nombre ?? elegido.nombre ?? null;
    await mostrarPokemon(nombreOId);
  } catch (err) {
    alert('Error cargando pokémones del tipo: ' + (err.message ));
  }
}

// Mapear texto del botón a tipo de la API (puedes mantenerlo)
function mapearTextoATipoApi(texto) {
  const mapa = {
  "acero":     "steel",
  "agua":      "water",
  "bicho":     "bug",
  "dragón":    "dragon",
  "eléctrico": "electric",
  "fantasma":  "ghost",
  "fuego":     "fire",
  "hada":      "fairy",
  "hielo":     "ice",
  "lucha":     "fighting",
  "normal":    "normal",
  "planta":    "grass",
  "psíquico":  "psychic",
  "roca":      "rock",
  "siniestro": "dark",
  "tierra":    "ground",
  "veneno":    "poison",
  "volador":   "flying"
};

  return mapa[texto];
}

// ---- enlazando los eventos con las funciones
function inicializarListeners() {
  btnBuscar.addEventListener('click', manejadorBusqueda);
  inputBuscador.addEventListener('keydown', (e) => { if (e.key === 'Enter') manejadorBusqueda(); });
  btnAleatorio.addEventListener('click', manejadorAleatorio);
  btnAnterior.addEventListener('click', manejadorAnterior);
  btnSiguiente.addEventListener('click', manejadorSiguiente);

  containerFiltros.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const texto = btn.textContent.trim().toLowerCase();
  
    const tipoApi = mapearTextoATipoApi(texto);
    manejadorFiltroTipo(tipoApi);
  });
}

const listaAutocomplete = document.createElement('div');
listaAutocomplete.className = 'autocomplete-list None';
document.querySelector('.search-box').appendChild(listaAutocomplete);
listaAutocomplete.style.display = 'none';

// Escucha cuando el usuario escribe
inputBuscador.addEventListener('input', async () => {
  const texto = inputBuscador.value.trim().toLowerCase();

  if (texto.length < 1) {
    listaAutocomplete.style.display = 'none';
    return;
  }

  try {
    // Llamada a el backend de node
    const res = await axios.get(`${POKEAPI_URL}/buscar/${texto}`);
    const sugerencias = res.data;

    // Renderizar resultados
    listaAutocomplete.innerHTML = '';
    sugerencias.forEach(poke => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `
        <img src="${poke.imagen}" alt="${poke.nombre}">
        <span>${poke.nombre}</span>
      `;

      item.addEventListener('click', () => {
        inputBuscador.value = poke.nombre;
        listaAutocomplete.style.display = 'none';
        mostrarPokemon(poke.nombre.toLowerCase());
      });

      listaAutocomplete.appendChild(item);
    });

    listaAutocomplete.style.display = 'block';
  } catch (err) {
    console.error('Error buscando pokémon:', err);
    listaAutocomplete.style.display = 'none';
  }
});

//esconder la lista si se enfoca en otro elemento
document.addEventListener('click', (e) => {
  if (!document.querySelector('.search-box').contains(e.target)) {
    listaAutocomplete.style.display = 'none';
  }
});

const loader = document.getElementById('loader');

function mostrarLoader() {
  loader.classList.remove('hidden');
}

function ocultarLoader() {
  loader.classList.add('hidden');
}



function iniciar() {
  inicializarListeners();
  mostrarPokemon('pikachu'); // pokemon por defectoar
}
iniciar();
