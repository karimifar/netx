var map;
var firstSymbolId;
var hoveredCtId;
var COLORSO = ['#eee','#e0c2a2','#d39c83','#c1766f','#a65461','#813753','#541f3f']
var COLORS = ['#eee','#eee','#e0c2a2','#c1766f','#a65461','#813753','#541f3f']
var KEYS = {
    'acm': {'breaks':[1.5,720, 842.5, 965, 1087.5, 1210],
            'name': "All Cause Mortality"
            },
    'can': {'breaks': [1.5,121, 153, 185, 217, 249],
            'name': "Cancer"
            },
    'acc': {'breaks': [1.5,38, 48, 58, 68, 78],
            'name': "Accidents"
            },
    'clr': {'breaks': [1.5, 44, 64, 84, 104, 124],
            'name': "Respiratory Disease"
            },
    'hea': {'breaks': [1.5,144, 182, 220, 258, 296],
            'name': "Heart Disease"
            },
    'str': {'breaks': [1.5,33, 42, 51, 60, 69],
            'name': "Heart Disease"
            },
}

var cause_keys = Object.keys(KEYS);
var visible_layer = cause_keys[0];

mapboxgl.accessToken = "pk.eyJ1Ijoia2FyaW1pZmFyIiwiYSI6ImNqOGtnaWp4OTBjemsyd211ZDV4bThkNmIifQ.Xg-Td2FFJso83Mmmc87NDA";
var mapStyle = "mapbox://styles/karimifar/cknja82y20pq117qxto1psrsz";
var mapStyle2 = "mapbox://styles/karimifar/ck2ey2mad1rtp1cmppck4wq2d";

var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: [0, -5],
    className: 'county-pop'
});
function createMap(){
    map = new mapboxgl.Map({
        container: 'map',
        zoom: 6.7,
        center: [-95.1156622, 32.0289487],
        maxZoom: 10,
        minZoom: 1,
        style: mapStyle
    })
    

    map.on('load', function () {
        var layers = map.getStyle().layers;
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol') {
                firstSymbolId = layers[i].id;
                break;
            }
        }

        map.addSource("counties", {
            type: "geojson",
            data: "https://texashealthdata.com/netx/map",
            generateId: true,
        })

        
        
        for (var i=0; i<cause_keys.length; i++){
            addLayer(map,cause_keys[i])
            console.log (i)
        }
        map.setLayoutProperty(
            'county_fill_'+cause_keys[0],
            'visibility',
            'visible'
        )

        map.addLayer({
            'id': 'counties-text',
            'type': 'symbol',
            'source':'counties',
            'layout': {
                'text-field': ['get', 'COUNTY'],
                'text-font': [
                    'Halyard Text Book',
                    'Arial Unicode MS Bold'
                ],
                'text-size':10,
                'text-offset': [0, 0],
                // 'text-anchor': 'center'
                },
            'paint':{
                'text-color': "#222",
                // 'text-halo-color': "#fff",
                // 'text-halo-width': 0.1,
            }
        });
        
        map.addLayer({
            'id': 'counties_outline',
            'type': 'line',
            'source':'counties',
            'paint':{
                "line-color": ["case",
                    ["boolean", ["feature-state", "hover"], false],
                    "#111",
                    "#999"
                ],
                "line-width": ["case",
                    ["boolean", ["feature-state", "hover"], false],
                    1.5,
                    0.1
                ],
            }
        }, firstSymbolId);

        

        

        // map.on("mouseenter", "county_fill_acm", function(e) {
        //     var feature = e.features[0];
        //     var coordinates = feature.geometry.coordinates.slice();
        //     console.log(feature)
        //     popup.setLngLat(coordinates).addTo(map);
        // });
    })
}






createMap();

function addLayer(themap, cause_id){
    var cause_var = 'county_' + cause_id;
    var breaksArr = KEYS[cause_id].breaks;
    var id = 'county_fill_' + cause_id;
    themap.addLayer({
        'id':id,
        'type': 'fill',
        'source': 'counties',
        'layout': {
            'visibility':'none'
        },
        'paint':{
            'fill-color':[
                'step',
                ['get', cause_var],
                COLORS[0],breaksArr[0],
                COLORS[1],breaksArr[1], 
                COLORS[2],breaksArr[2], 
                COLORS[3],breaksArr[3], 
                COLORS[4],breaksArr[4],
                COLORS[5], breaksArr[5],
                COLORS[6],
            ]
        }

    },firstSymbolId)

    themap.on("mousemove", id, function(e) {
        if(e.features.length >0){
            if(hoveredCtId>=0){
                themap.setFeatureState({source: 'counties', id: hoveredCtId}, { hover: false}); 
            }
            themap.getCanvas().style.cursor = "pointer";
            hoveredCtId = e.features[0].id;
            var county = e.features[0].properties.COUNTY;
            var population = e.features[0].properties.county_pop;
            var causeRate = e.features[0].properties[cause_var];
            if(causeRate == 1){
                causeRate = 'Suppressed'
            }
            if(causeRate == 2){
                causeRate = "Unreliable"
            }
            var causeName = KEYS[cause_id].name;
            var coordinates = [e.lngLat.lng, e.lngLat.lat];
            console.log(coordinates)
            themap.setFeatureState({source: 'counties', id: hoveredCtId}, { hover: true});
            var popupHTML = '<p class="county-name">'+county+'</p>' + '<p class="population">Population: <span>'+ population + '</span></p>' + '<p class="rate">'+causeName+' Rate: <span>' + causeRate + '</span></p>'
            popup.setLngLat(coordinates).setHTML(popupHTML).addTo(themap);
        }
        
    })
    themap.on("mouseleave", id, function(){
        if(hoveredCtId>=0){
            themap.setFeatureState(
                {source:'counties', id: hoveredCtId},
                {hover: false}
            )
        }
        popup.remove();
    })


}

function switchCause(){
    var selected_cause = $('#cause').val()
    switchVisibility (visible_layer, selected_cause)
}


function switchVisibility(a,b){
    map.setLayoutProperty(
        'county_fill_'+a,
        'visibility',
        'none'
    )
    map.setLayoutProperty(
        'county_fill_'+b,
        'visibility',
        'visible'
    )
    visible_layer = b;
}