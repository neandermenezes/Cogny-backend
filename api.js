const axios = require('axios');

async function getUsaData() {
    const { data } = await axios.get('https://datausa.io/api/data?drilldowns=Nation&measures=Population')

    return data.data
}

async function calculateUsaPopulation(yearsToFetch, data) {
    const filteredData = data.filter((record) => yearsToFetch.includes(record.Year))

    return filteredData.reduce((acc, curr) => acc + curr.Population, 0)
}

module.exports = {
    getUsaData,
    calculateUsaPopulation
}