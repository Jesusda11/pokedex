const axios = require('axios');
const { obtenerPokemon } = require('../services/pokeapiService');

const urlBasePokeapi = process.env.POKEAPI_URL;

// Diccionario de tipos en español
const tiposES = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  grass: "Planta",
  electric: "Eléctrico",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dark: "Siniestro",
  dragon: "Dragón",
  steel: "Acero",
  fairy: "Hada"
};

// Diccionario de estadísticas en español
const estadisticasES = {
  hp: "Vida",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Especial",
  "special-defense": "Def. Especial",
  speed: "Velocidad"
};

// Controlador para obtener un Pokémon por nombre o id
async function obtenerPokemonControlador(req, res) {
  try {
    const nombre = req.params.nombre;
    const pokemon = await obtenerPokemon(nombre);

    // Filtrar y transformar datos
    const datos = {
      nombre: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
      id: pokemon.id,
      tipos: pokemon.types.map(t => tiposES[t.type.name] || t.type.name),
      imagenes: {
        female: pokemon.sprites.front_female,
        default: pokemon.sprites.front_default,
        shiny: pokemon.sprites.front_shiny
      },
      estadisticas: pokemon.stats.map(estadistica => ({
        nombre: estadisticasES[estadistica.stat.name] || estadistica.stat.name,
        valor: estadistica.base_stat
      })),
      movimientos: await Promise.all(
        pokemon.moves.slice(0, 4).map(async movimientoObj => {
          const movimiento = await obtenerPokemon(movimientoObj.move.url, true);
          return {
            nombre: movimiento.name,
            tipo: tiposES[movimiento.type.name] || movimiento.type.name,
            potencia: movimiento.power || "—",
            precision: movimiento.accuracy ? `${movimiento.accuracy}%` : "—"
          };
        })
      )
    };

    res.json(datos);
    
  } catch (error) {
    res.status(404).json({ error: 'Pokémon no encontrado' });
  }
}

// Controlador para obtener pokémones por tipo
async function obtenerPokemonesPorTipo(req, res) {
  try {
    const tipo = req.params.tipo.toLowerCase();
    const respuesta = await axios.get(`${urlBasePokeapi}/type/${tipo}`);
    // Filtrar solo pokémones con id entre 1 y 1025
    const pokemones = respuesta.data.pokemon
      .map(p => ({
        nombre: p.pokemon.name,
        url: p.pokemon.url
      }))
      .filter(poke => {
        const coincidencia = poke.url.match(/\/pokemon\/(\d+)\//);
        if (!coincidencia) return false;
        const id = parseInt(coincidencia[1]);
        return id >= 1 && id <= 1025;
      });
    res.json(pokemones);
  } catch (error) {
    res.status(404).json({ error: 'Tipo no encontrado' });
  }
}

async function buscarPokemonesPorNombre(req, res) {
  try {
    const texto = req.params.texto.toLowerCase();

    // Obtiene la lista de todos los pokémon
    const respuesta = await axios.get(`${urlBasePokeapi}/pokemon?limit=2000`);

    // Filtra los que incluyan el texto y cuyo id esté entre 1 y 1025
    const coincidencias = respuesta.data.results.filter(poke => {
      if (!poke.name.includes(texto)) return false;
      const match = poke.url.match(/\/pokemon\/(\d+)\//);
      if (!match) return false;
      const id = parseInt(match[1]);
      return id >= 1 && id <= 1025;
    });

    // Obtener hasta 10 coincidencias con nombre + imagen pequeña (default)
    const resultados = await Promise.all(
      coincidencias.slice(0, 10).map(async poke => {
        const datos = await obtenerPokemon(poke.name);
        return {
          nombre: datos.name.charAt(0).toUpperCase() + datos.name.slice(1),
          imagen: datos.sprites.front_default 
        };
      })
    );

    res.json(resultados);
  } catch (error) {
    res.status(404).json({ error: 'No se encontraron coincidencias' });
  }
}

module.exports = { obtenerPokemon: obtenerPokemonControlador, obtenerPokemonesPorTipo, buscarPokemonesPorNombre };
