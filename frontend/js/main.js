axios.get("https://pokeapi.co/api/v2/pokemon/pikachu")
  .then(response => console.log(response.data))
  .catch(error => console.error(error));