document.addEventListener("DOMContentLoaded", () => {
  pollFunc(updateData, 10000); // update prosumer data of the dashboard every 10s
});
document.addEventListener("DOMContentLoaded", async () => {
  var ctx = document.getElementById("myChart").getContext("2d");
  var timeFormat = "DD/MM/YYYY";

  var myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [
        moment("2006-08-04T00:00:00.000Z"),
        moment("2007-11-09T00:00:00.000Z")
      ],
      datasets: [
        {
          data: [
            { x: moment("2006-08-04T00:00:00.000Z"), y: 177 },
            { x: moment("2006-09-04T00:00:00.000Z"), y: 160 },
            { x: moment("2007-09-04T00:00:00.000Z"), y: 177 }
          ],
          label: "Windspeed",
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
            parser: timeFormat
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
    "windSpeed"
  ).innerHTML = prosumer.currentWindSpeed.toFixed(2);
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
