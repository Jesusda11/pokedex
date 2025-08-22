console.log('Hola mudo');

import axios from 'axios';

console.log("hi");


axios.get('https://pokeapi.co/api/v2/pokemon/1')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });