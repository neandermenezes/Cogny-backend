const { POPULATION_API_HOST } = require('./config');
const axios = require('axios');

// const api = axios.create({
//     baseUrl: POPULATION_API_HOST,
// })

axios.get('https://datausa.io/api/data?drilldowns=Nation&measures=Population')
    .then((response) => console.log(response.data.data))

