const request = require("request");

const url =
  "http://api.weatherstack.com/current?access_key=3acb472106515c1b14faf11f38d2bc90&query=37.8267,-122.4233";

request({ url: url, json: true }, (error, response) => {
  if (error) {
    console.log(error);
    return;
  }

  if (response.body && response.body.current) {
    const temperature = response.body.current.temperature;
    const feelslike = response.body.current.feelslike;

    console.log(
      `${response.body.current.weather_descriptions[0]}: it is currently ${temperature} degrees outside, but it feels like ${feelslike}`
    );
  } else {
    console.log(`No data found on URL: ${url}`);
  }
});
