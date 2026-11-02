# Gas price map

A single-page app that shows this week's regular gasoline price from the U.S. Energy Information Administration (EIA) on a Leaflet map with OpenStreetMap tiles. It has a pin for each of the 10 cities EIA publishes weekly prices for: San Francisco, Los Angeles, Seattle, Denver, Houston, Chicago, Cleveland, Miami, New York City and Boston. Pins are red when a city's price is above the U.S. average and green when it is below. The headline says how much more per gallon California pays than the U.S. average.

## Run it

You need Node 18 or later. There are no dependencies to install. Get a free API key at https://www.eia.gov/opendata/register.php.

```bash
EIA_API_KEY=your_key node server.js
```

Then open http://localhost:3000. Set `PORT` to use a different port.

## How it works

- `server.js` serves the page and the `/api/prices` endpoint. It makes one request to EIA API v2 (`/v2/petroleum/pri/gnd/data`) for 12 weekly series: the U.S. average, California and the 10 cities. The key stays on the server and is never sent to the browser. Responses are cached for one hour.
- "This week" is the latest week EIA has published a U.S. average for. Every pin and the headline use that same week. A city with no price for that week shows a gray "n/a" pin.
- The California figure is EIA's statewide California average, not the average of San Francisco and Los Angeles.
- `public/index.html` loads Leaflet 1.9.4 from unpkg (with integrity hashes) and draws the pins, popups, legend and headline.
