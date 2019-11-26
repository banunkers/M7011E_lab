\c gle

-- Creates 10 batteries with varying max capacities
INSERT INTO batteries (max_capacity) VALUES
	(50),
	(75),	
	(100),	
	(65),	
	(55),	
	(50),	
	(75),	
	(125),	
	(65),	
	(55);

INSERT INTO prosumers (mean_day_wind_speed, battery_id) VALUES
	(15, 1),
	(10, 2),
	(5, 3),
	(2, 4),
	(0, 5),
	(7, 6),
	(8, 7),
	(4, 8),
	(6, 9),
	(12, 10);

WITH power_plant_bat AS (
	INSERT INTO batteries (max_capacity, power) VALUES(5000, 0) RETURNING id
)
INSERT INTO power_plants (current_production, battery_id, status) VALUES(0, (SELECT id FROM power_plant_bat), 'stopped');
