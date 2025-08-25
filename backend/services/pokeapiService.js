const axios = require('axios');
const urlBasePokeapi = process.env.POKEAPI_URL;

// Función para obtener datos de un Pokémon desde la PokéAPI
async function obtenerPokemon(parametro, esUrl = false) {
  const url = esUrl ? parametro : `${urlBasePokeapi}/pokemon/${parametro}`;
  const respuesta = await axios.get(url);
  return respuesta.data;
}

module.exports = { obtenerPokemon };