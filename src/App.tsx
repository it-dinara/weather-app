import { useEffect, useState } from "react";
import "./App.css";
import { fetchWeatherApi } from "openmeteo";
const params = {
  hourly: "temperature_2m",
  timezone: "Europe/Moscow",
  forecast_days: 1,
};

function App() {
  const [weather, setWeather] = useState<null | number>(null);
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    function success(position: any) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setStatus("");
      setLocation({ latitude, longitude });
      setMapLink({
        link: `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`,
        text: `Latitude: ${latitude} °, Longitude: ${longitude} °`,
      });
    }

    function error() {
      setStatus("Unable to retrieve your location");
    }

    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported by your browser");
    } else {
      setStatus("Locating…");
      navigator.geolocation.getCurrentPosition(success, error);
    }

    const startFetching = async () => {
      if (location.latitude && location.longitude) {
        const url = "https://api.open-meteo.com/v1/forecast";
        const responses = await fetchWeatherApi(url, {
          ...params,
          ...location,
        });
        // Helper function to form time ranges
        const range = (start: number, stop: number, step: number) =>
          Array.from(
            { length: (stop - start) / step },
            (_, i) => start + i * step
          );

        // Process first location. Add a for-loop for multiple locations or weather models
        const response = responses[0];

        // Attributes for timezone and location
        const utcOffsetSeconds = response.utcOffsetSeconds();
        const timezone = response.timezone();
        const timezoneAbbreviation = response.timezoneAbbreviation();
        const latitude = response.latitude();
        const longitude = response.longitude();
        const hourly = response.hourly()!;

        // Note: The order of weather variables in the URL query and the indices below need to match!
        const weatherData = {
          hourly: {
            time: range(
              Number(hourly.time()),
              Number(hourly.timeEnd()),
              hourly.interval()
            ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
            temperature2m: hourly.variables(0)!.valuesArray()!,
          },
        };

        // `weatherData` now contains a simple structure with arrays for datetime and weather data
        for (let i = 0; i < weatherData.hourly.time.length; i++) {
          if (weatherData.hourly.time[i].getHours() === new Date().getHours()) {
            setWeather(weatherData.hourly.temperature2m[i]);
          }
        }
      }
    };
    startFetching();
  }, [location.latitude, location.longitude]);

  const [status, setStatus] = useState("");
  const [mapLink, setMapLink] = useState({ link: "", text: "" });

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <p>weather now is: {Math.round(weather as number)} ° Celsius</p>
        <p>{status}</p>
        <a href={mapLink.link}>Your location: {mapLink.text}</a>
      </div>
    </>
  );
}

export default App;
