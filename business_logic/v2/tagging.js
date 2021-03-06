var dbAccess = require('../../persistence/db_access_v2');
var helper = require('./helper');
var parallel = require("async/parallel");


const RAILWAY = {
    id: 1,
    name: "railway",
    description: "Includes OpenStreetMap-Key:railway, Values: rail, light_rail, narrow_gauge, tram and subway."
};

const STREET = {
    id: 2,
    name: "street",
    description: "Includes OpenStreetMap-Key:highway, Values: motorway, motorway_link, trunk, trunk_link, primary, " +
    "primary_link, secondary, secondary_link, tertiary, tertiary_link, residential, road, unclassified, service, " +
    "living_street and track."
};

const BUILDING = {
    id: 3,
    name: "building",
    description: "Includes positions in or on top of a building."
};

const OTHER = {
    id: 100,
    name:"other",
    description: "OSM-tag is defined, but not supported."
};

const UNKNOWN = {
    id: -1,
    name: "unknown",
    description: "No tagging possible."
};




const SWITZERLAND_NEAREST_BUILDING = 'WITH closest_candidates AS (' +
    'SELECT * FROM planet_osm_polygon WHERE building IS NOT NULL ' +
    'ORDER BY way <-> ST_GeomFromText(\'POINT({lon} {lat})\', 4326) ' +
    'ASC LIMIT 10) ' +
    'SELECT osm_id, name, building, ST_Distance(way::geography, ST_GeomFromText(\'POINT({lon} {lat})\', 4326)::geography) ' +
    'FROM closest_candidates ' +
    'LIMIT 1;';


const OSM_NEAREST_OBJECTS_10M = 'WITH closest_candidates AS (SELECT osm_id, name, highway, railway, way FROM planet_osm_line ' +
    'WHERE railway IN (\'rail\', \'light_rail\', \'narrow_gauge\', \'tram\', \'subway\') OR ' +
    'highway IN (\'motorway\', \'motorway_link\', \'trunk\', \'trunk_link\', \'primary\', ' +
    '\'primary_link\', \'secondary\', \'secondary_link\', \'tertiary\', \'tertiary_link\', ' +
    '\'residential\', \'road\', \'unclassified\', \'service\', \'living_street\', \'track\') ' +
    'ORDER BY way <-> ST_GeomFromText(\'POINT({lon} {lat})\', 4326) LIMIT 100) ' +
    'SELECT osm_id, name, highway, railway, ST_Distance(way::geography, ST_GeomFromText(\'POINT({lon} {lat})\', 4326)::geography) FROM closest_candidates ' +
    'WHERE ST_Distance(way::geography, ST_GeomFromText(\'POINT({lon} {lat})\', 4326)::geography) < 10 ORDER BY ST_Distance(way, ST_GeomFromText(\'POINT({lon} {lat})\', 4326)) LIMIT 3;';


const OSM_NEAREST_OBJECTS = 'WITH closest_candidates AS (SELECT osm_id, name, highway, railway, way FROM planet_osm_line ' +
    'WHERE railway IN (\'rail\', \'light_rail\', \'narrow_gauge\', \'tram\', \'subway\') OR ' +
    'highway IN (\'motorway\', \'motorway_link\', \'trunk\', \'trunk_link\', \'primary\', ' +
    '\'primary_link\', \'secondary\', \'secondary_link\', \'tertiary\', \'tertiary_link\', ' +
    '\'residential\', \'road\', \'unclassified\', \'service\', \'living_street\', \'track\') ' +
    'ORDER BY way <-> ST_GeomFromText(\'POINT({lon} {lat})\', 4326) LIMIT 100) ' +
    'SELECT osm_id, name, highway, railway, ST_Distance(way::geography, ST_GeomFromText(\'POINT({lon} {lat})\', 4326)::geography) FROM closest_candidates ' +
    'ORDER BY ST_Distance(way, ST_GeomFromText(\'POINT({lon} {lat})\', 4326)) LIMIT 3;';



function getTag(typeOfMotion, positions, callback) {

    var tag, probability;

    //VEHICULAR or HIGH_SPEED_VEHICULAR
    //Result is CAR or TRAIN
    if(typeOfMotion.id > 2) {

        var nearestObjectsStatements = helper.getDBStatements(OSM_NEAREST_OBJECTS, positions);

        parallel([
                function(callback) {
                    dbAccess.queryMultiple(dbAccess.getDatabase(dbAccess.STREETS_DB), nearestObjectsStatements, function (nearestWayResults) {
                        callback(null, nearestWayResults);
                    });
                }
            ],
            function(err, results) {

                var nearestWays = results[0];

                var amountOfCars = 0;
                var amountOfTrains = 0;

                for (var i = 0; i < nearestWays.length; i++){

                    for (var j = 0; j < nearestWays[i].length; j++){

                        if(nearestWays[i][j].highway) { amountOfCars++; }
                        else { amountOfTrains++; }
                    }
                }

                var bigger = amountOfCars > amountOfTrains ? amountOfCars : amountOfTrains;
                var smaller = amountOfCars < amountOfTrains ? amountOfCars : amountOfTrains;

                tag = amountOfCars > amountOfTrains ? STREET : RAILWAY;
                probability = bigger / (bigger + smaller);
                callback({ tag: tag, probability: probability });

            });
    }

    //STATIONARY or PEDESTRIAN
    //All Results are possible
    else if (typeOfMotion.id !== -1) {

        var nearestBuildingStatements = helper.getDBStatements(SWITZERLAND_NEAREST_BUILDING, positions);
        var nearestWaysStatements = helper.getDBStatements(OSM_NEAREST_OBJECTS_10M, positions);

        //Get the nearest building of each position (3 positions)
        parallel([
                function(callback) {
                    dbAccess.queryMultiple(dbAccess.getDatabase(dbAccess.SWITZERLAND_DB), nearestBuildingStatements, function (result) {
                        callback(null, result);
                    });
                },

                //Get all railways or streets within 10 meters for each of the 3 points
                function(callback) {
                    dbAccess.queryMultiple(dbAccess.getDatabase(dbAccess.STREETS_DB), nearestWaysStatements, function (result) {
                        callback(null, result);
                    });
                }
            ],
            function(err, results) {

                var nearestBuildings = results[0];

                const numberOfBuildings = 3;
                var close_building_count = 0;

                nearestBuildings.forEach(function (building) {
                    //Position within 10 meters to a building
                    if(building[0].st_distance <= 10) {
                        close_building_count++;
                    }
                });

                var probability = close_building_count / numberOfBuildings;

                if(probability >= 2 / 3) {
                    callback({ tag: BUILDING, probability: probability });

                } else
                    {
                        var nearestWays = results[1];

                        var totalAmountOfCars = 0;
                        var totalAmountOfTrains = 0;

                        for (var i = 0; i < nearestWays.length; i++){

                            var amountOfCars = 0;
                            var amountOfTrains = 0;

                            for (var j = 0; j < nearestWays[i].length; j++){

                                if(nearestWays[i][j].highway) {
                                    if(amountOfCars === 0) {
                                        amountOfCars++;
                                    }
                                }
                                else if (nearestWays[i][j].railway) {
                                    if(amountOfTrains === 0) {
                                        amountOfTrains++;
                                    }
                                }
                            }

                            totalAmountOfCars += amountOfCars;
                            totalAmountOfTrains += amountOfTrains;
                        }

                        var bigger = totalAmountOfCars > totalAmountOfTrains ? totalAmountOfCars : totalAmountOfTrains;
                        tag = totalAmountOfCars > totalAmountOfTrains ? STREET : RAILWAY;
                        probability = bigger / 3; //3 points with max. 1 nearest ways

                        if(probability > 0.25) {

                            //Speed < 10 km/h, no building close nearby, close to railway or street
                            callback({ tag: tag, probability: probability });
                        } else {

                            //Speed < 10 km/h, no building close nearby, no railways or streets close nearby
                            callback({ tag: BUILDING, probability: null });
                        }
                }
            });
    }
    else {

        callback({ tag: UNKNOWN, probability: null });
    }
}

module.exports = { "getTag": getTag };