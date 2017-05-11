
function renderTagJson(taggingRes, typeOfMotion, speedResult, geographicalSurroundingsResult, geoAdminResults) {

    var jsonSurrounding = renderSurroundingsJson(geographicalSurroundingsResult, geoAdminResults);

    return {
        title: "Calculated Tagging",
        location: {
            id: taggingRes.tag.id,
            name: taggingRes.tag.name,
            description: taggingRes.tag.description,
            probability: taggingRes.probability,
            allProbabilities: taggingRes.allProbabilities
        },
        type_of_motion: {
            id: typeOfMotion.id,
            name: typeOfMotion.name,
            description: typeOfMotion.description,
            probability: null
        },
        velocity: {
            distance_m: speedResult.distance,
            time_s: speedResult.time_s,
            velocity_ms: speedResult.velocity_ms,
            velocity_kmh: speedResult.velocity_kmh,
            probability: speedResult.probability
        },
        surroundings: jsonSurrounding.surroundings
    }
}



function renderSurroundingsJson(geographicalSurroundingsResult, geoAdminResults) {

    return {
        title: "Calculated Surroundings",
        surroundings: {
            download: {
                population_density: {
                    number: geoAdminResults.download.pop.number,
                    description: geoAdminResults.download.pop.description,
                    probability: null
                },
                community_type: {
                    id: geoAdminResults.download.type.tag.id,
                    type: geoAdminResults.download.type.tag.name,
                    community_id: geoAdminResults.download.type.res.comId,
                    community_name: geoAdminResults.download.type.res.comName,
                    canton_id: geoAdminResults.download.type.res.canId,
                    canton_name: geoAdminResults.download.type.res.canName,
                    description: geoAdminResults.download.type.tag.description,
                    probability: null
                },
                geographical_surroundings: {
                    osm_key: geographicalSurroundingsResult.download.osm_key,
                    osm_value: geographicalSurroundingsResult.download.osm_value,
                    description: geographicalSurroundingsResult.download.description,
                    probability: null
                }
            },
            upload: {
                population_density: {
                    number: geoAdminResults.upload.pop.number,
                    description: geoAdminResults.upload.pop.description,
                    probability: null
                },
                community_type: {
                    id: geoAdminResults.upload.type.tag.id,
                    type: geoAdminResults.upload.type.tag.name,
                    community_id: geoAdminResults.upload.type.res.comId,
                    community_name: geoAdminResults.upload.type.res.comName,
                    canton_id: geoAdminResults.upload.type.res.canId,
                    canton_name: geoAdminResults.upload.type.res.canName,
                    description: geoAdminResults.upload.type.tag.description,
                    probability: null
                },
                geographical_surroundings: {
                    osm_key: geographicalSurroundingsResult.upload.osm_key,
                    osm_value: geographicalSurroundingsResult.upload.osm_value,
                    description: geographicalSurroundingsResult.upload.description,
                    probability: null
                }
            }
        }
    }
}



module.exports = {
    "renderSurroundingsJson": renderSurroundingsJson,
    "renderTagJson": renderTagJson
};