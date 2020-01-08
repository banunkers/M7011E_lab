const { pool } = require("./db.js");
const { turbineOutput } = require("./windturbine");

// Price in SEK
const START_PRICE = 0.5;
const PRICE_COEFFICIENT = 0.05;

const PROSUMERS_QUERY = `
	SELECT 
		ratio_excess_market, 
		ratio_deficit_market,
		latest_consumption,
		latest_windspeed
	FROM prosumers
	INNER JOIN
	(
		SELECT
			DISTINCT ON(prosumer_id)
			prosumer_id,
			value as latest_consumption,
			date_time
		FROM consumption_values
		ORDER BY prosumer_id, date_time DESC
	) consumption_values
	ON prosumers.id=consumption_values.prosumer_id
	INNER JOIN
	(
		SELECT
			DISTINCT ON(prosumer_id)
			prosumer_id,
			value as latest_windspeed,
			date_time
		FROM windspeed_values
		ORDER BY prosumer_id, date_time DESC
	) windspeed_values
	ON prosumers.id=windspeed_values.prosumer_id
	`;

async function getPricing() {
  const prosumersRes = await pool.query(PROSUMERS_QUERY);
  let demandSum = 0;
  prosumersRes.rows.forEach(prosumer => {
    const production = turbineOutput(prosumer.latest_windspeed);
    const diff = prosumer.latest_consumption - production;
    demandSum +=
      diff *
      (diff > 0 ? prosumer.ratio_deficit_market : prosumer.ratio_excess_market);
  });
  const pricing = START_PRICE + demandSum * PRICE_COEFFICIENT;
  return pricing < START_PRICE ? START_PRICE : pricing;
}

module.exports = {
  getPricing,
  START_PRICE,
  PRICE_COEFFICIENT,
  PROSUMERS_QUERY
};
