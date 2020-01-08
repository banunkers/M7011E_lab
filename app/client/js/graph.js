function initChart(
  productionCheckboxCallback,
  consumptionCheckboxCallback,
  windspeedCheckboxCallback
) {
  // Make sure all callbacks were passed
  if (
    !productionCheckboxCallback ||
    !consumptionCheckboxCallback ||
    !windspeedCheckboxCallback
  ) {
    return null;
  }

  const timeFormat = "DD/MM/YYYY";
  var ctx = document.getElementById("myChart").getContext("2d");

  // Attach listeners to the checkboxes
  const productionCheckbox = document.getElementById("production-checkbox");
  productionCheckbox.addEventListener("click", productionCheckboxCallback);
  const consumptionCheckbox = document.getElementById("consumption-checkbox");
  consumptionCheckbox.addEventListener("click", consumptionCheckboxCallback);
  const windspeedCheckbox = document.getElementById("windspeed-checkbox");
  windspeedCheckbox.addEventListener("click", windspeedCheckboxCallback);

  return new Chart(ctx, {
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

function replaceChartDataset(chart, label, data, color) {
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

function removeChartDataset(chart, label) {
  if (chart == null) {
    console.trace();
  }
  chart.data.datasets = chart.data.datasets.filter(
    dataset => dataset.label != label
  );
  chart.update();
}

function attachEndDateSelectChangeCallback(callback) {
  document.getElementById("end-date-select").onchange = async function() {
    const startTime = document.getElementById("start-date-select").value;
    const endTime = this.value;

    const consumptionChecked = document.getElementById("consumption-checkbox")
      .checked;
    const productionChecked = document.getElementById("production-checkbox")
      .checked;
    const windspeedChecked = document.getElementById("windspeed-checkbox")
      .checked;

    callback(
      productionChecked,
      consumptionChecked,
      windspeedChecked,
      startTime,
      endTime
    );

    chart.update();
  };
}

function attachStartDateSelectChangeCallback(callback) {
  document.getElementById("start-date-select").onchange = async function() {
    const startTime = this.value;
    const endTime = document.getElementById("end-date-select").value;

    const consumptionChecked = document.getElementById("consumption-checkbox")
      .checked;
    const productionChecked = document.getElementById("production-checkbox")
      .checked;
    const windspeedChecked = document.getElementById("windspeed-checkbox")
      .checked;

    callback(
      productionChecked,
      consumptionChecked,
      windspeedChecked,
      startTime,
      endTime
    );

    chart.update();
  };
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
