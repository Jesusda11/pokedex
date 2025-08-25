const VALOR_MAX_ESTADISTICA = 255;


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
    imgEl.alt = poke.nombre;
    containerImagenesPokemon.appendChild(imgEl);
  });
}

function renderizarTipos(poke) {
  containerTiposPokemon.innerHTML = '';
  (poke.types).forEach(t => {
    console.log(t, "-> ", mapearTextoATipoApi(t));
    
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
    const poke = await obtenerPokemon(nombreOrId);
    renderCartaPokemon(poke);
    renderizarImagenes(poke);
    renderizarTipos(poke);
    renderizarEstadisticas(poke);
    renderizarMovimientos(poke);
    btnAnterior.disabled = poke.id === 1; //si esta en el primer pokemon no puede haber mas atras
    btnSiguiente.disabled = false;
  } catch (err) {
    alert(err.message || 'Error obteniendo Pokémon');
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

function iniciar() {
  inicializarListeners();
  mostrarPokemon('snorlax'); // pokemon por defectoar
}
iniciar();
