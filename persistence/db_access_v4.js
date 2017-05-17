var pg = require('pg');
var options = require('../config/configReader');
var parallel = require("async/parallel");


var config = {
    user: options.config.database_user,
    database: options.config.database_streets,
    password: options.config.database_password,
    host: options.config.database_host,
    port: options.config.database_port,
    max: options.config.max_database_connections,
    idleTimeoutMillis: options.config.database_idleTimeoutMillis
};

const STREETS_DB = 'streets';
const SWITZERLAND_DB = 'switzerland';

var osmdb_pool, switzerland_osm_pool;

function getDatabase(dbName) {

    switch(dbName) {
        case STREETS_DB:
            if(osmdb_pool) {
                return osmdb_pool;
            }

            osmdb_pool = new pg.Pool(config);
            return osmdb_pool;

        case SWITZERLAND_DB:
            if(switzerland_osm_pool) {
                return switzerland_osm_pool;
            }

            //copy config
            var newConfig = JSON.parse(JSON.stringify(config));
            newConfig.database = options.config.database_switzerland;
            switzerland_osm_pool = new pg.Pool(newConfig);
            return switzerland_osm_pool;
    }
}


/**
 * @param database
 * @param statement
 * @param positions: Use formatPositions to fit the required form
 * @param callback
 */
function queryMultipleParameterized(database, statement, positions, callback) {

    var dbRequests = [];

    for(var i = 0; i < positions.length; i++) {

        dbRequests[i] = (function (i) {
            return function(callback) {
                
                database.query(statement, [positions[i]], function (err, result) {
                    if (err) {
                        return console.error('error happened during query', err)
                    }
                    callback(null, result.rows);
                });
            };
        })(i);
    }

    parallel(dbRequests,
        function(err, results) {
            callback(results)
        });
}


function singleQueryParameterized(database, statement, positions, callback) {

    database.query(statement, positions, function (err, result) {
        if (err) {
            return console.error('error happened during query', err)
        }

        callback(result.rows);
    });
}



module.exports = {
    "getDatabase": getDatabase,
    "SWITZERLAND_DB": SWITZERLAND_DB,
    "STREETS_DB": STREETS_DB,
    "singleQueryParameterized": singleQueryParameterized,
     "queryMultipleParameterized": queryMultipleParameterized
};