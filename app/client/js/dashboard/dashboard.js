document.addEventListener("DOMContentLoaded", () => {
  pollFunc(updateData, 10000); // update prosumer data of the dashboard every 10s
});
document.addEventListener("DOMContentLoaded", async () => {
  var ctx = document.getElementById("myChart").getContext("2d");
  var timeFormat = "DD/MM/YYYY";

  const authToken = getCookie("authToken", document.cookie);
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
							currentWindSpeed{
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
  const test = json.data.me.currentWindSpeed[0];

  // Sort by date
  const sorted = json.data.me.currentWindSpeed.sort(
    (e1, e2) => parseInt(e1.dateTime) - parseInt(e2.dateTime)
  );
  const data = sorted.map(windSpeed => ({
    x: moment(parseInt(windSpeed.dateTime)),
    y: windSpeed.value
  }));

  var myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [moment()],
      datasets: [
        {
          label: "Windspeed",
          data,
          fill: false,
          borderColor: "red"
        }
      ]
    },
    options: {
      scales: {
        xAxes: [
          {
            type: "time",
            parser: timeFormat,
            distribution: "linear"
          }
        ]
      }
    }
  });
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
