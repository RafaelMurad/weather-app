const request = require("request");

const url =
  "http://api.weatherstack.com/current?access_key=3acb472106515c1b14faf11f38d2bc90&query=37.8267,-122.4233";

request({ url: url, json: true }, (error, response) => {
  if (error) {
    console.log(error);
    return;
  }

  if (response.body.error) {
    console.log("Unable to find location!");
    return;
  }

  if (response.body && response.body.current) {
    const temperature = response.body.current.temperature;
    const feelslike = response.body.current.feelslike;

    console.log(
      `${response.body.current.weather_descriptions[0]}: it is currently ${temperature} degrees outside, but it feels like ${feelslike}`
    );
    return;
  }
});

// Geocoding API

const geocoding =
  "https://api.mapbox.com/geocoding/v5/mapbox.places/Los%20Angeles.json?access_token=pk.eyJ1IjoicmZsbXVyYWQiLCJhIjoiY2s5YWJ1eTlhMGJnZDNlbnJ4am10ZTIzeCJ9.NNhDMrqRlbbyRz71ITOoeQ&limit=1";

request({ url: geocoding, json: true }, (error, response) => {
  if (error) {
    console.log("Unable to connect to location services");
    return;
  }

  if (response.body.features.length === 0) {
    console.log("Location not found, try another search!");
    return;
  }

  const latitude = response.body.features[0].center[1];
  const longitude = response.body.features[0].center[0];

  console.log(`The latitude/longitude is: ${latitude} , ${longitude}`);
});
