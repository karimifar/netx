var map;
var firstSymbolId;
var hoveredCtId;
var COLORSO = ['#eee','#e0c2a2','#d39c83','#c1766f','#a65461','#813753','#541f3f']
var COLORS = [
    
    // 'red',
    '#bdadeb',
    '#9c85e0',
    '#7a5cd6',
    '#5933cc',
    '#4729a3',
    '#361f7a',
    '#ddd',
    '#ddd',
    '#dcefeb',
]
var breaksArr = [1.1,2.1,3.1,4.1,5.1,6.1,7.1,8.1,9.1]
var legend = {
    1: {'name': '<10% above state rate', 'color':COLORS[0]},
    2: {'name': '<10-20% above state rate', 'color':COLORS[1]},
    3: {'name': '<20-30% above state rate', 'color':COLORS[2]},
    4: {'name': '<30%-40 above state rate', 'color':COLORS[3]},
    5: {'name': '<40%-50 above state rate', 'color':COLORS[4]},
    6: {'name': '50% or more above state rate', 'color':COLORS[5]},
    7: {'name': 'Suppressed value', 'color':COLORS[6]},
    8: {'name': 'Unreliable value', 'color':COLORS[7]},
    9: {'name': 'Below state rate', 'color':COLORS[8]},

}
var KEYS = {
    'acm': {
        // 'breaks':[1.5,720, 842.5, 965, 1087.5, 1210],
        'name': "All Cause Mortality"
        },
    'can': {
        // 'breaks': [1.5,121, 153, 185, 217, 249],
        'name': "Cancer"
        },
    'acc': {
        // 'breaks': [1.5,38, 48, 58, 68, 78],
        'name': "Accidents"
        },
    'clrd': {
        // 'breaks': [1.5, 44, 64, 84, 104, 124],
        'name': "Respiratory Disease"
        },
    'hea': {
        // 'breaks': [1.5,144, 182, 220, 258, 296],
        'name': "Heart Disease"
        },
    'str': {
        // 'breaks': [1.5,33, 42, 51, 60, 69],
        'name': "Heart Disease"
        },
}

var cause_keys = Object.keys(KEYS);
var legend_keys = Object.keys(legend);

for(var i=0; i<legend_keys.length; i++){
    j = legend_keys[i]
    var leg_name= legend[j].name
    var color= legend[j].color
    console.log('yo')
    var legend_item = $('<div class="legend-item">')
    .append('<div class="leg-color" style="background-color:'+color+'" >')
    .append('<p class="leg-text">'+leg_name+'</p>')

    $('#legend').append(legend_item)
}
console.log(legend_keys)
var visible_layer = cause_keys[0];

mapboxgl.accessToken = "pk.eyJ1Ijoia2FyaW1pZmFyIiwiYSI6ImNqOGtnaWp4OTBjemsyd211ZDV4bThkNmIifQ.Xg-Td2FFJso83Mmmc87NDA";
var mapStyle = "mapbox://styles/karimifar/ckq8gyf5355lv17ns51r44nz8";
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
        console.log(firstSymbolId)
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
                    'Arial Unicode MS Bold'
                ],
                // 'text-size':10,
                'text-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    6,
                    11,
                    10,
                    24
                    // 10,
                    // ['get','font2'],
                    // 12,
                    // ['get','font2'],

                ],
                'text-offset': [0, 0],
                // 'text-anchor': 'center'
                },
            'paint':{
                'text-color': "#ded6f5",
                'text-halo-color': "#111",
                'text-halo-width': 0.6,
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
                ['get', cause_id],
                COLORS[0],breaksArr[0],
                COLORS[1],breaksArr[1], 
                COLORS[2],breaksArr[2], 
                COLORS[3],breaksArr[3], 
                COLORS[4],breaksArr[4],
                COLORS[5], breaksArr[5],
                COLORS[6], breaksArr[6],
                COLORS[7], breaksArr[7],
                COLORS[8]
            ],
            'fill-opacity': 0.9
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
            var causeBin = e.features[0].properties[cause_id];
            var causeRate = legend[causeBin].name
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