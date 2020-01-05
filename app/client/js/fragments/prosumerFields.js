const prosumerFields = `
fragment prosumerFields on prosumer {
	meanDayWindSpeed,
	currentProduction,
	currentConsumption,
	ratioExcessMarket,
	ratioDeficitMarket,
	battery {
		power,
		maxCapacity
	}
} 
`;
