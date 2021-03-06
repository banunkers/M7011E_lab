const { pool } = require("../db.js");

const excessRatioQuery = `
SELECT ratio_excess_market FROM prosumers WHERE id = $1
`;

const deficitRatioQuery = `
SELECT ratio_deficit_market FROM prosumers WHERE id = $1
`;

const setDeficitRatioQuery = `
UPDATE prosumers SET ratio_deficit_market = $2 WHERE id = (SELECT id FROM prosumers WHERE account_id = $1)
`;

const setExcessRatioQuery = `
UPDATE prosumers SET ratio_excess_market = $2 WHERE id = (SELECT id FROM prosumers WHERE account_id = $1)
`;

// NOTE: needs changing if more than one power plant
const setPowerPlantProdRatioQuery = `
UPDATE power_plants SET ratio_production_market = $1 WHERE id = 1
`;

const powerPlantProdRatioQuery = `
SELECT ratio_production_market FROM power_plants WHERE id = 1
`;

/**
 * Gets the ratio of the excess power to redirect to the market
 * @param {Number} prosumerId the prosumers id
 * @returns the ratio
 */
async function excessRatio(prosumerId) {
  let ratioExcessMarket = null;
  await pool
    .query(excessRatioQuery, [prosumerId])
    .then(res => (ratioExcessMarket = res.rows[0].ratio_excess_market))
    .catch(err =>
      console.error("Error while querying excess market ratio: ", err)
    );
  return ratioExcessMarket;
}

async function setExcessRatio(accountId, ratio) {
  try {
    await pool.query(setExcessRatioQuery, [accountId, ratio]);
  } catch (err) {
    console.error(err);
  }
  return ratio;
}

/**
 * Gets the ratio of the deficit power to buy from the market
 * @param {Number} prosumerId the prosumers id
 * @returns the ratio
 */
async function deficitRatio(prosumerId) {
  let ratioDeficitMarket = null;
  await pool
    .query(deficitRatioQuery, [prosumerId])
    .then(res => (ratioDeficitMarket = res.rows[0].ratio_deficit_market))
    .catch(err =>
      console.error("Error while querying deficit market ratio: ", err)
    );
  return ratioDeficitMarket;
}

async function setDeficitRatio(accountId, ratio) {
  try {
    await pool.query(setDeficitRatioQuery, [accountId, ratio]);
  } catch (err) {
    console.error(err);
  }
  return ratio;
}

/**
 * Gets the ratio of power plants production which will be sent to the market
 * @returns the ratio
 */
async function powerPlantProdRatio() {
  let ratioProd = null;
  await pool
    .query(powerPlantProdRatioQuery)
    .then(res => (ratioProd = res.rows[0].ratio_production_market))
    .catch(err =>
      console.error("Error while querying manager production ratio: ", err)
    );
  return ratioProd;
}

async function setPowerPlantProdRatio(ratio) {
  try {
    await pool.query(setPowerPlantProdRatioQuery, [ratio]);
  } catch (err) {
    console.error(`Failed while setting manager ratio: ${err}`);
  }
  return ratio;
}

module.exports = {
  excessRatio,
  deficitRatio,
  setDeficitRatio,
  setExcessRatio,
  setPowerPlantProdRatio,
  excessRatioQuery,
  deficitRatioQuery,
  setDeficitRatioQuery,
  setExcessRatioQuery,
  setPowerPlantProdRatioQuery,
  powerPlantProdRatio,
  powerPlantProdRatioQuery
};
