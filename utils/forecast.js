const request = require("request");

const forecast = (latitude, longitude, callback) => {
  const url =
    "http://api.weatherstack.com/current?access_key=3acb472106515c1b14faf11f38d2bc90&query=" +
    latitude +
    "," +
    longitude +
    "&units=m";

  request({ url, json: true }, (error, { body }) => {
    if (error) {
      callback("Unable to connect to location services", undefined);
      return;
    }

    if (body.error) {
      callback("Unable to find location, try another search!", undefined);
      return;
    }

    callback(
      undefined,
      `${body.current.weather_descriptions[0]}: it is currently ${body.current.temperature} degrees outside, but it feels like ${body.current.feelslike}`
    );
  });
};

module.exports = forecast;
