const request = require('request')

const url = 'http://api.weatherstack.com/current?access_key=84da104444694bbe3d2aef402537c5b4&query=37.8267,-122.4233'

request({url: url}, (error, response) => {
    const data = JSON.parse(response.body)
    console.log(data.current)
})