const prosumerFields = `
fragment prosumerFields on prosumer {
	latestProduction{
		value
	},
	latestConsumption{
		value
	},
	latestWindSpeed{
		value
	},
	meanDayWindSpeed,
	ratioExcessMarket,
	ratioDeficitMarket,
	battery {
		power,
		maxCapacity
	}
} 
`;
