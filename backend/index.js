require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pokemonRoutes = require('./routes/pokemonRoutes');

// Crea una instancia de la aplicación Express
const app = express();
const PORT = 3000;

// Habilita CORS para permitir peticiones desde el frontend
app.use(cors());

// Permite recibir y procesar datos en formato JSON
app.use(express.json());

// Define las rutas principales para la API de Pokémon
app.use('/api/pokemon', pokemonRoutes);

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});