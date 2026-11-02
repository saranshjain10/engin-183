// Fetches this week's prices from the EIA API and writes them to prices.json,
// which browser.html reads so visitors don't need an API key.
// Usage: EIA_API_KEY=your_key node fetch-prices.js
const fs = require("fs");
const path = require("path");
const { fetchPrices } = require("./server");

if (!process.env.EIA_API_KEY) {
  console.error("EIA_API_KEY environment variable is not set.");
  process.exit(1);
}

fetchPrices()
  .then((data) => {
    const out = path.join(__dirname, "prices.json");
    fs.writeFileSync(out, JSON.stringify({ ...data, fetchedAt: new Date().toISOString() }, null, 2) + "\n");
    console.log(`Wrote ${out}: week of ${data.week}, U.S. $${data.usAverage}, California $${data.california}`);
  })
  .catch((err) => {
    console.error(`Could not fetch prices: ${err.message}`);
    process.exit(1);
  });
