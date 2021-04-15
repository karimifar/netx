var map;
var firstSymbolId;
var hoveredCtId;
var COLORSO = ['#eee','#e0c2a2','#d39c83','#c1766f','#a65461','#813753','#541f3f']
var COLORS = ['#eee','#eee','#e0c2a2','#c1766f','#a65461','#813753','#541f3f']
var BREAKS = {
    'acm': [1.5,2.5, 720, 842.5, 965, 1087.5, 1210],
    'can': [1.5,2.5, 121, 153, 185, 217, 249],
    'acc': [1.5,2.5, 38, 48, 58, 68, 78],
    'clr': [1.5,2.5, 44, 64, 84, 104, 124],
    'hea': [1.5,2.5, 144, 182, 220, 258, 296],
    'str': [1.5,2.5, 33, 42, 51, 60, 69],
}

var cause_keys = Object.keys(BREAKS);
var visible_layer = cause_keys[0];

mapboxgl.accessToken = "pk.eyJ1Ijoia2FyaW1pZmFyIiwiYSI6ImNqOGtnaWp4OTBjemsyd211ZDV4bThkNmIifQ.Xg-Td2FFJso83Mmmc87NDA";
var mapStyle = "mapbox://styles/karimifar/cknja82y20pq117qxto1psrsz";
var mapStyle2 = "mapbox://styles/karimifar/ck2ey2mad1rtp1cmppck4wq2d";


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

        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: [0, -5],
            className: 'county-pop'
        });

        map.on("mousemove", "county_fill_acm", function(e) {
            if(e.features.length >0){
                if(hoveredCtId>=0){
                    map.setFeatureState({source: 'counties', id: hoveredCtId}, { hover: false}); 
                }
                map.getCanvas().style.cursor = "pointer";
                hoveredCtId = e.features[0].id;
                var county = e.features[0].properties.COUNTY;
                var coordinates = [e.lngLat.lng, e.lngLat.lat];
                console.log(coordinates)
                map.setFeatureState({source: 'counties', id: hoveredCtId}, { hover: true});
                popup.setLngLat(coordinates).setHTML('<h2>'+county+'</h2>').addTo(map);
            }
            
        })

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
    var breaksArr = BREAKS[cause_id];
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