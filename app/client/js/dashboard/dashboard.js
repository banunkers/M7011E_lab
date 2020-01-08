let chart = null;

const PRODUCTION_COLOR = "green";
const CONSUMPTION_COLOR = "red";
const WINDSPEED_COLOR = "blue";

// The length (in milliseconds) of the intervals between polling
const POLL_INTERVAL = 4000;

async function handleDateChange(
  productionChecked,
  consumptionChecked,
  windspeedChecked,
  startTime,
  endTime
) {
  const authToken = getCookie("authToken", document.cookie);

  //TODO: These queries should be able to be merged into one using subfields, but
  // for some reason using subfields seems to affect performance heavily.
  if (productionChecked) {
    const response = await fetch(API_ADDRESS, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authToken
      },
      body: JSON.stringify({
        query: createProsumerQuery("production", startTime, endTime)
      })
    });
    const json = await response.json();
    replaceChartDataset(
      chart,
      "Production",
      json.data.me.production,
      PRODUCTION_COLOR
    );
  }

  if (consumptionChecked) {
    const response = await fetch(API_ADDRESS, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authToken
      },
      body: JSON.stringify({
        query: createProsumerQuery("consumption", startTime, endTime)
      })
    });
    const json = await response.json();
    replaceChartDataset(
      chart,
      "Consumption",
      json.data.me.consumption,
      CONSUMPTION_COLOR
    );
  }

  if (windspeedChecked) {
    const response = await fetch(API_ADDRESS, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authToken
      },
      body: JSON.stringify({
        query: createProsumerQuery("windSpeed", startTime, endTime)
      })
    });
    const json = await response.json();
    replaceChartDataset(
      chart,
      "Windspeed",
      json.data.me.windSpeed,
      WINDSPEED_COLOR
    );
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  attachStartDateSelectChangeCallback(handleDateChange);
  attachEndDateSelectChangeCallback(handleDateChange);

  chart = initChart(
    handleProductionCheckbox,
    handleConsumptionCheckbox,
    handleWindspeedCheckbox
  );

  const productionCheckbox = document.getElementById("production-checkbox");
  const consumptionCheckbox = document.getElementById("consumption-checkbox");
  const windspeedCheckbox = document.getElementById("windspeed-checkbox");

  // Initialize the datasets based on the checkboxes
  handleProductionCheckbox.call({
    checked: productionCheckbox.checked
  });
  handleConsumptionCheckbox.call({
    checked: consumptionCheckbox.checked
  });
  handleWindspeedCheckbox.call({
    checked: windspeedCheckbox.checked
  });

  pollFunc(updateData, POLL_INTERVAL); // poll prosumer data on intervals
});

async function updateData() {
  const authToken = getCookie("authToken", document.cookie);
  const data = await getDashboardData();
  const prosumer = data.me;
  const battery = data.me.battery;
  const pricing = data.pricing;

  const batteryPower = battery.power.toFixed(2);
  const batteryMaxCapacity = battery.maxCapacity.toFixed(2);
  document.getElementById(
    "battery"
  ).innerHTML = `${batteryPower}/${batteryMaxCapacity}`;

  document.getElementById("pricing").innerHTML = pricing.toFixed(2);

  const startTime = document.getElementById("start-date-select").value;
  const endTime = document.getElementById("end-date-select").value;

  // If the end date is not set then the user wants the latest data which should be
  // polled on every interval
  if (endTime == "") {
    if (document.getElementById("windspeed-checkbox").checked) {
      const response = await fetch(API_ADDRESS, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authToken
        },
        body: JSON.stringify({
          query: createProsumerQuery("windSpeed", startTime, endTime)
        })
      });
      const json = await response.json();

      replaceChartDataset(
        chart,
        "Windspeed",
        json.data.me.windSpeed,
        WINDSPEED_COLOR
      );
    }
    if (document.getElementById("production-checkbox").checked) {
      const response = await fetch(API_ADDRESS, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authToken
        },
        body: JSON.stringify({
          query: createProsumerQuery("production", startTime, endTime)
        })
      });
      const json = await response.json();

      replaceChartDataset(
        chart,
        "Production",
        json.data.me.production,
        PRODUCTION_COLOR
      );
    }
    if (document.getElementById("consumption-checkbox").checked) {
      const response = await fetch(API_ADDRESS, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authToken
        },
        body: JSON.stringify({
          query: createProsumerQuery("consumption", startTime, endTime)
        })
      });
      const json = await response.json();

      replaceChartDataset(
        chart,
        "Consumption",
        json.data.me.consumption,
        CONSUMPTION_COLOR
      );
    }
  }
}

/**
 * Fetches the prosumer data which will be displayed on the dashboard
 * @returns an object with subfields prosumer and pricing
 */
async function getDashboardData() {
  // Gets all of the prosumer fields aswell as the current electricity pricing
  const QUERY_PROSUMER_DATA = `{
		me {
			... on prosumer {
				... prosumerFields
			}
		}
		pricing
	}
	${prosumerFields}
	`;
  const authToken = getCookie("authToken", document.cookie);
  let prosumerData = null;
  try {
    await fetch(API_ADDRESS, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authToken
      },
      body: JSON.stringify({
        query: QUERY_PROSUMER_DATA
      })
    })
      .then(res => res.json())
      .then(res => (prosumerData = res.data));
  } catch (err) {
    console.error(`Failed to get prosumer data: ${err}`);
  }
  return prosumerData;
}

/*
 * Construct a query for getting prosumer time-based info.
 *
 * Constructs a query in the form
 * {
 *   me{
 *   	... on prosumer{
 *   		<field><startTime/endTime>{
 *				value
 *				dateTime
 *   		}
 *   	}
 *   }
 * }
 * In the case of empty/null start/end times these arguments will not be used in the
 * query.
 *
 * @param {String} field The GraphQL field to query on the prosumer
 * @param {String} startTime The starting time of the query
 * @param {String} endTime The ending time of the query
 *
 * @returns {String} The query string ready for usage.
 */
function createProsumerQuery(field, startTime, endTime) {
  return `
		{
			me{
				... on prosumer{
					${field}${
    (startTime != "" && startTime != null) || (endTime != "" && endTime != null)
      ? `(
						${startTime != "" && startTime != null ? `startTime: "${startTime}"` : ""}
						${endTime != "" && endTime != null ? `endTime: "${endTime}"` : ""}
					)`
      : ""
  }{
						value
						dateTime
					}
				}
			}
		}
	`;
}

async function handleProductionCheckbox() {
  const authToken = getCookie("authToken", document.cookie);
  if (this.checked) {
    const startTime = document.getElementById("start-date-select").value;
    const endTime = document.getElementById("end-date-select").value;
    const response = await fetch(API_ADDRESS, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authToken
      },
      body: JSON.stringify({
        query: `
				{
					me{
						... on prosumer{
							production${
                startTime != "" || endTime != ""
                  ? `(
								${startTime != "" ? `startTime: "${startTime}"` : ""}
								${endTime != "" ? `endTime: "${endTime}"` : ""}
							)`
                  : ""
              }{
								value
								dateTime
							}
						}
					}
				}
				`
      })
    });
    const json = await response.json();

    let data = json.data.me.production;
    // If neither the start nor the end dates are set use the 50 latest samples
    if (startTime == "" && endTime == "") {
      data = data
        .sort((e1, e2) => parseInt(e1.dateTime) - parseInt(e2.dateTime))
        .slice(-50);
    }
    replaceChartDataset(chart, "Production", data, PRODUCTION_COLOR);
  } else {
    removeChartDataset(chart, "Production");
  }
}

async function handleConsumptionCheckbox() {
  const authToken = getCookie("authToken", document.cookie);
  if (this.checked) {
    const startTime = document.getElementById("start-date-select").value;
    const endTime = document.getElementById("end-date-select").value;
    const response = await fetch(API_ADDRESS, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authToken
      },
      body: JSON.stringify({
        query: `
				{
					me{
						... on prosumer{
							consumption${
                startTime != "" || endTime != ""
                  ? `(
								${startTime != "" ? `startTime: "${startTime}"` : ""}
								${endTime != "" ? `endTime: "${endTime}"` : ""}
							)`
                  : ""
              }{
								value
								dateTime
							}
						}
					}
				}
				`
      })
    });
    const json = await response.json();

    let data = json.data.me.consumption;
    // If neither the start nor the end dates are set use the 50 latest samples
    if (startTime == "" && endTime == "") {
      data = data
        .sort((e1, e2) => parseInt(e1.dateTime) - parseInt(e2.dateTime))
        .slice(-50);
    }
    replaceChartDataset(chart, "Consumption", data, CONSUMPTION_COLOR);
  } else {
    removeChartDataset(chart, "Consumption");
  }
}

async function handleWindspeedCheckbox() {
  const authToken = getCookie("authToken", document.cookie);
  if (this.checked) {
    const startTime = document.getElementById("start-date-select").value;
    const endTime = document.getElementById("end-date-select").value;
    const response = await fetch(API_ADDRESS, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authToken
      },
      body: JSON.stringify({
        query: `
				{
					me{
						... on prosumer{
							windSpeed${
                startTime != "" || endTime != ""
                  ? `(
								${startTime != "" ? `startTime: "${startTime}"` : ""}
								${endTime != "" ? `endTime: "${endTime}"` : ""}
							)`
                  : ""
              }{
								value
								dateTime
							}
						}
					}
				}
				`
      })
    });
    const json = await response.json();

    let data = json.data.me.windSpeed;
    // If neither the start nor the end dates are set use the 50 latest samples
    if (startTime == "" && endTime == "") {
      data = data
        .sort((e1, e2) => parseInt(e1.dateTime) - parseInt(e2.dateTime))
        .slice(-50);
    }
    replaceChartDataset(chart, "Windspeed", data, WINDSPEED_COLOR);
  } else {
    removeChartDataset(chart, "Windspeed");
  }
}
