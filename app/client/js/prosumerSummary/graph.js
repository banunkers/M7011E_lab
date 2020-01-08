let chart = null;

const PRODUCTION_COLOR = "green";
const CONSUMPTION_COLOR = "red";
const WINDSPEED_COLOR = "blue";

const POLL_INTERVAL = 4000;

const PROSUMER_ID = document.currentScript.getAttribute("prosumerId");

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

  // Initialize the datasets
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
        query: createProsumerQuery(
          "production",
          PROSUMER_ID,
          startTime,
          endTime
        )
      })
    });
    const json = await response.json();
    console.log(json);
    replaceChartDataset(
      chart,
      "Production",
      json.data.prosumer.production,
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
          "consumption",
          PROSUMER_ID,
          startTime,
          endTime
        )
      })
    });
    const json = await response.json();
    replaceChartDataset(
      chart,
      "Consumption",
      json.data.prosumer.consumption,
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
        query: createProsumerQuery("windSpeed", PROSUMER_ID, startTime, endTime)
      })
    });
    const json = await response.json();
    replaceChartDataset(
      chart,
      "Windspeed",
      json.data.prosumer.windSpeed,
      WINDSPEED_COLOR
    );
  }
}

function createProsumerQuery(field, prosumerId, startTime, endTime) {
  return `
		{
			prosumer(id:${prosumerId}){
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
					prosumer(id:${PROSUMER_ID}){
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
				`
      })
    });
    const json = await response.json();

    let data = json.data.prosumer.production;
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
					prosumer(id:${PROSUMER_ID}){
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
				`
      })
    });
    const json = await response.json();

    let data = json.data.prosumer.consumption;
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
					prosumer(id:${PROSUMER_ID}){
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
				`
      })
    });
    const json = await response.json();

    let data = json.data.prosumer.windSpeed;
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
