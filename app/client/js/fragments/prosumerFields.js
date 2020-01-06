const prosumerFields = `
fragment prosumerFields on prosumer {
	meanDayWindSpeed,
	ratioExcessMarket,
	ratioDeficitMarket,
	battery {
		power,
		maxCapacity
	}
} 
`;
