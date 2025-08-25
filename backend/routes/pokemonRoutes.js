const express = require('express');
const enrutador = express.Router();
const { obtenerPokemon, obtenerPokemonesPorTipo, buscarPokemonesPorNombre  } = require('../controllers/pokemonController');

// Ruta para buscar pokémones por nombre (coincidencias)
enrutador.get('/buscar/:texto', buscarPokemonesPorNombre);

// Ruta para obtener todos los pokémones de un tipo específico
enrutador.get('/tipo/:tipo', obtenerPokemonesPorTipo);

// Ruta para obtener la información de un pokémon por su nombre o id
enrutador.get('/:nombre', obtenerPokemon);

module.exports = enrutador;