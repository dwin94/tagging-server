var router = require('express').Router();
var validate = require('express-jsonschema').validate;
var tagging_v4 = require('../../business_logic/v4/tagging_communication');
var velocity_v4 = require('../../business_logic/v4/velocity_communication');
var surroundings_v4 = require('../../business_logic/v4/surroundings_communication');
var jsonSchema = require('../jsonSchemas');


//Tagging:
router.get('/tag', function (req, res) {
    res.render('taggingIndex', { title: 'Tagging-Server', version: '4.0' });
});

// This route validates req.body against the taggingSchema
router.post('/tag', validate({body: jsonSchema.TAGGING_SCHEMA_V4}), function (req, res) {
    // At this point req.body has been validated
    tagging_v4.getTagsJSON(req, res);
});


//FindSurroundings:
router.get('/findSurroundings', function (req, res) {
    res.render('surroundingsIndex', { title: 'Umgebungsabfrage', version: '4.0' });
});

// This route validates req.body against the taggingSchema
router.post('/findSurroundings', validate({body: jsonSchema.SURROUNDINGS_SCHEMA}), function (req, res) {
    // At this point req.body has been validated
    surroundings_v4.getSurroundingsJSON(req, res);
});


//SpeedCalculation:
router.get('/calculateSpeed', function (req, res) {
    res.render('speedIndex', { title: 'Geschwindigkeitsberechnung', version: '4.0' });
});

router.post('/calculateSpeed', validate({body: jsonSchema.VELOCITY_SCHEMA}), function (req, res) {
    velocity_v4.getSpeedCalculationJSON(req, res);
});



module.exports = router;