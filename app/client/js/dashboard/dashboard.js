let chart = null;

document.addEventListener("DOMContentLoaded", () => {
  pollFunc(updateData, 10000); // update prosumer data of the dashboard every 10s
});
document.addEventListener("DOMContentLoaded", async () => {
  const authToken = getCookie("authToken", document.cookie);

  attachDateSelectChangeListeners();
  initChart();
});

async function updateData() {
  const data = await getDashboardData();
  const prosumer = data.me;
  const battery = data.me.battery;
  const pricing = data.pricing;

  document.getElementById(
    "production"
  ).innerHTML = prosumer.currentProduction.toFixed(2);
  document.getElementById(
    "consumption"
  ).innerHTML = prosumer.currentConsumption.toFixed(2);

  const netProd = prosumer.currentProduction - prosumer.currentConsumption;
  document.getElementById("netProduction").innerHTML = netProd.toFixed(2);

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
  var timeFormat = "DD/MM/YYYY";

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
  updateChartDatasets(data);
}

function attachDateSelectChangeListeners() {
  const authToken = getCookie("authToken", document.cookie);

  document.getElementById("start-date-select").onchange = async function() {
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
							currentWindSpeed(
								startTime: "${this.value}"
								${endTime != "" ? `endTime: "${endTime}"` : ""}
							){
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

    updateChartDatasets(json.data.me.currentWindSpeed);
  };

  document.getElementById("end-date-select").onchange = async function() {
    const startTime = document.getElementById("start-date-select").value;
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
							currentWindSpeed(
								${startTime != "" ? `startTime: "${startTime}"` : ""}
								endTime: "${this.value}"
							){
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

    updateChartDatasets(json.data.me.currentWindSpeed);
  };
}

function updateChartDatasets(data) {
  chart.data.datasets = [
    {
      label: "Windspeed",
      data: prepareChartData(data),
      fill: false,
      borderColor: "red",
      lineTension: 0.1
    }
  ];
  chart.update();
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
