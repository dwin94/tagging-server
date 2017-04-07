var express = require('express');
var router = express.Router();
var converter = require('../helpers/converter');

var pg = require('pg');
var options = require('../helpers/options');
var connectionString = options.storageConfig.connectionString;


const OsmQuery = 'WITH closest_candidates AS (SELECT id, osm_id, osm_name, clazz, geom_way FROM switzerland ' +
    'ORDER BY geom_way <-> ST_GeomFromText(\'POINT({lon} {lat})\', 4326) LIMIT 100) ' +
    'SELECT id, osm_id, osm_name, clazz, ST_Distance(geom_way::geography, ST_GeomFromText(\'POINT({lon} {lat})\', 4326)::geography) FROM closest_candidates ' +
    'ORDER BY ST_Distance(geom_way, ST_GeomFromText(\'POINT({lon} {lat})\', 4326)) LIMIT 3;';

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Tagging-Prototype 1.0' });
});

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};

router.get('/getNearest', function (req, res) {

    /*
    var lon = req.query.longitude ? req.query.longitude : '8.79712';
    var lat = req.query.latitude ? req.query.latitude : '47.21114';
    */

    var latitude1 = req.query.latitude1;
    var latitude2 = req.query.latitude2;
    var latitude3 = req.query.latitude3;

    var longitude1 = req.query.longitude1;
    var longitude2 = req.query.longitude2;
    var longitude3 = req.query.longitude3;

    pg.connect(connectionString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err)
        }
        done();

        var statement1 = OsmQuery.replaceAll("{lon}", longitude1).replaceAll("{lat}", latitude1);
        var statement2 = OsmQuery.replaceAll("{lon}", longitude2).replaceAll("{lat}", latitude2);
        var statement3 = OsmQuery.replaceAll("{lon}", longitude3).replaceAll("{lat}", latitude3);

        client.query(statement1, function (err, result1) {
            if (err) {
                return console.error('error happened during query', err)
            }

            client.query(statement2, function (err, result2) {

                if (err) {
                    return console.error('error happened during query', err)
                }

                client.query(statement3, function (err, result3) {
                    done();

                    if (err) {
                        return console.error('error happened during query', err)
                    }

                    var results = [result1.rows, result2.rows, result3.rows];
                    var tag = converter.tag(results);

                    res.render('nearestView', {
                        title: "Nearest Ways:",
                        results: results,
                        tag: tag.tagName,
                        probability: tag.probability
                    });
                });
            });
        });
    })

});

module.exports = router;
