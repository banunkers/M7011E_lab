let chart = null;

const PRODUCTION_COLOR = "green";
const CONSUMPTION_COLOR = "red";
const WINDSPEED_COLOR = "blue";

document.addEventListener("DOMContentLoaded", () => {
  pollFunc(updateData, 10000); // update prosumer data of the dashboard every 10s
});
document.addEventListener("DOMContentLoaded", async () => {
  const authToken = getCookie("authToken", document.cookie);

  attachStartDateSelectChangeListeners();
  attachEndDateSelectChangeListeners();

  const productionCheckbox = document.getElementById("production-checkbox");
  productionCheckbox.addEventListener("click", handleProductionCheckbox);
  const consumptionCheckbox = document.getElementById("consumption-checkbox");
  consumptionCheckbox.addEventListener("click", handleConsumptionCheckbox);
  const windspeedCheckbox = document.getElementById("windspeed-checkbox");
  windspeedCheckbox.addEventListener("click", handleWindspeedCheckbox);
  initChart();

  handleProductionCheckbox.call({
    checked: productionCheckbox.checked
  });
  handleConsumptionCheckbox.call({
    checked: consumptionCheckbox.checked
  });
  handleWindspeedCheckbox.call({
    checked: windspeedCheckbox.checked
  });
});

async function updateData() {
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

async function initChart() {
  const authToken = getCookie("authToken", document.cookie);
  const timeFormat = "DD/MM/YYYY";

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
							currentWindSpeed${
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

  let data = json.data.me.currentWindSpeed;
  // If neither the start nor the end dates are set use the 50 latest samples
  if (startTime == "" && endTime == "") {
    data = data
      .sort((e1, e2) => parseInt(e1.dateTime) - parseInt(e2.dateTime))
      .slice(-50);
  }

  var ctx = document.getElementById("myChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: []
    },
    options: {
      resposive: true,
      scales: {
        xAxes: [
          {
            type: "time",
            parser: timeFormat
          }
        ]
      }
    }
  });
}

function attachStartDateSelectChangeListeners() {
  const authToken = getCookie("authToken", document.cookie);

  document.getElementById("start-date-select").onchange = async function() {
    const endTime = document.getElementById("end-date-select").value;

    const consumptionChecked = document.getElementById("consumption-checkbox")
      .checked;
    const productionChecked = document.getElementById("production-checkbox")
      .checked;
    const windspeedChecked = document.getElementById("windspeed-checkbox")
      .checked;

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
          query: createProsumerQuery("currentProduction", this.value, endTime)
        })
      });
      const json = await response.json();
      replaceChartDataset(
        "Production",
        json.data.me.currentProduction,
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
          query: createProsumerQuery("currentConsumption", this.value, endTime)
        })
      });
      const json = await response.json();
      replaceChartDataset(
        "Consumption",
        json.data.me.currentConsumption,
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
          query: createProsumerQuery("currentWindSpeed", this.value, endTime)
        })
      });
      const json = await response.json();
      replaceChartDataset(
        "Windspeed",
        json.data.me.currentWindSpeed,
        WINDSPEED_COLOR
      );
    }

    chart.update();
  };
}

function attachEndDateSelectChangeListeners() {
  const authToken = getCookie("authToken", document.cookie);

  document.getElementById("end-date-select").onchange = async function() {
    const startTime = document.getElementById("start-date-select").value;

    const consumptionChecked = document.getElementById("consumption-checkbox")
      .checked;
    const productionChecked = document.getElementById("production-checkbox")
      .checked;
    const windspeedChecked = document.getElementById("windspeed-checkbox")
      .checked;

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
          query: createProsumerQuery("currentProduction", startTime, this.value)
        })
      });
      const json = await response.json();
      replaceChartDataset(
        "Production",
        json.data.me.currentProduction,
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
          query: createProsumerQuery(
            "currentConsumption",
            startTime,
            this.value
          )
        })
      });
      const json = await response.json();
      replaceChartDataset(
        "Consumption",
        json.data.me.currentConsumption,
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
          query: createProsumerQuery("currentWindSpeed", startTime, this.value)
        })
      });
      const json = await response.json();
      replaceChartDataset(
        "Windspeed",
        json.data.me.currentWindSpeed,
        WINDSPEED_COLOR
      );
    }

    chart.update();
  };
}

function createProsumerQuery(field, startTime, endTime) {
  return `
		{
			me{
				... on prosumer{
					${field}(
						${startTime != "" && startTime != null ? `startTime: "${startTime}"` : ""}
						${endTime != "" && endTime != null ? `endTime: "${endTime}"` : ""}
					){
						value
						dateTime
					}
				}
			}
		}
	`;
}

function replaceChartDataset(label, data, color) {
  let found = false;
  chart.data.datasets.forEach(ds => {
    if (ds.label === label) {
      found = true;
      ds.borderColor = color;
      ds.data = prepareChartData(data);
    }
  });
  if (!found) {
    chart.data.datasets.push({
      label,
      data: prepareChartData(data),
      fill: false,
      borderColor: color,
      lineTension: 0.1
    });
  }
  chart.update();
}

function removeChartDataset(label) {
  chart.data.datasets = chart.data.datasets.filter(
    dataset => dataset.label != label
  );
  chart.update();
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
							currentProduction${
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

    let data = json.data.me.currentProduction;
    // If neither the start nor the end dates are set use the 50 latest samples
    if (startTime == "" && endTime == "") {
      data = data
        .sort((e1, e2) => parseInt(e1.dateTime) - parseInt(e2.dateTime))
        .slice(-50);
    }
    replaceChartDataset("Production", data, PRODUCTION_COLOR);
  } else {
    removeChartDataset("Production");
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
							currentConsumption${
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

    let data = json.data.me.currentConsumption;
    // If neither the start nor the end dates are set use the 50 latest samples
    if (startTime == "" && endTime == "") {
      data = data
        .sort((e1, e2) => parseInt(e1.dateTime) - parseInt(e2.dateTime))
        .slice(-50);
    }
    replaceChartDataset("Consumption", data, CONSUMPTION_COLOR);
  } else {
    removeChartDataset("Consumption");
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
							currentWindSpeed${
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

    let data = json.data.me.currentWindSpeed;
    // If neither the start nor the end dates are set use the 50 latest samples
    if (startTime == "" && endTime == "") {
      data = data
        .sort((e1, e2) => parseInt(e1.dateTime) - parseInt(e2.dateTime))
        .slice(-50);
    }
    replaceChartDataset("Windspeed", data, WINDSPEED_COLOR);
  } else {
    removeChartDataset("Windspeed");
  }
}

/*
 * Prepares data for being displayed in the chart.
 *
 * Sorts the input array's objects by their dateTime member, and then maps it to objects
 * with a member x containing the date as a moment, and member y containing the value.
 *
 * @param data The input array consisting of object with members dateTime and value.
 *
 * @return An array ready for being displayed in a chart.
 */
function prepareChartData(data) {
  // Sort by date
  const sorted = data.sort(
    (e1, e2) => parseInt(e1.dateTime) - parseInt(e2.dateTime)
  );

  return sorted.map(e => ({
    x: moment(parseInt(e.dateTime)),
    y: e.value
  }));
}
