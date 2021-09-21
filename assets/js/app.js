var map;
var firstSymbolId;
var hoveredCtId;
var apiUrl =  'https://texashealthdata.com' //'http://localhost:3306'
var COLORSO = ['#eee','#e0c2a2','#d39c83','#c1766f','#a65461','#813753','#541f3f']
var pColors = [
    // 'red',
    '#ddd',
    '#4fe0a1',
    "#f6e5cf", "#e6b7c4", "#d588b9", "#cc71b4", "#a14e96", "#762a79"
]
var rColors = [
    '#ddd',
    "#f6e5cf",
    "#dd9fbf",
    "#cc71b4",
    "#8c3c88"
]


var pBreaks = [-100,0,10,20,30,40,50]
var percent_legend = [
    {'name': '50% or more above state rate', 'color':pColors[7]},
    {'name': '40%-50% above state rate', 'color':pColors[6]},
    {'name': '30-40% above state rate', 'color':pColors[5]},
    {'name': '20-30% above state rate', 'color':pColors[4]},
    {'name': '10-20% above state rate', 'color':pColors[3]},
    {'name': '0-10% above state rate', 'color':pColors[2]},
    {'name': 'Below state rate', 'color':pColors[1]},
    {'name': 'Unavailable', 'color':pColors[0]},
]
var binning = 'r'
var ctyData;
var KEYS = {
    'acm': {
        // 'breaks':[1.5,720, 842.5, 965, 1087.5, 1210],
        'name': "All Cause Mortality"
        },
    'can': {
        // 'breaks': [1.5,121, 153, 185, 217, 249],
        'name': "Cancer"
        },
    'uni': {
        // 'breaks': [1.5,38, 48, 58, 68, 78],
        'name': "Unintentional injury"
        },
    'clr': {
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
$.get(apiUrl+'/api/netx/all', function(data){
    ctyData = data;
    for(var i=0; i<cause_keys.length; i++){
        var key = cause_keys[i]
        var rawData = []
        var allData = []
        ctyData.filter(function(cty){
            rawData.push(cty[key])
            allData.push({
                county: cty.county,
                rate: parseFloat(cty[key])
            })
        })
        KEYS[cause_keys[i]].data = allData
        var breaks = [
            -100,
            d3.quantile(rawData, 0.25),
            d3.quantile(rawData, 0.5),
            d3.quantile(rawData, 0.75),
        ]
        KEYS[cause_keys[i]].breaks = breaks;
        console.log(KEYS[cause_keys[i]].breaks)
    }
    createColChart('acm')
    if(binning == 'r'){
        create_rLegend()
    }else{
        create_pLegend();
    }
})

function create_pLegend(){
    $('#legend').empty()
    for(var i=0; i<percent_legend.length; i++){
        var leg_name= percent_legend[i].name
        var color= percent_legend[i].color
        var legend_item = $('<div class="legend-item">')
        .append('<div class="leg-color" style="background-color:'+color+'" >')
        .append('<p class="leg-text">'+leg_name+'</p>')
    
        $('#legend').append(legend_item)
    }
}
function create_rLegend(){
    var breaks = KEYS[visible_layer].breaks
    $('#legend').empty()
    $('#legend').append('<div class="legend-item"><div class="leg-color" style="background-color:'+pColors[0]+'" ></div><p class="leg-text">Unavailable</p></div>')
    for(var i=0; i<breaks.length; i++){
        if(i==0){
            var leg_name= 'Below '+breaks[i+1].toFixed(1)
        }else if(i == breaks.length-1){
            var leg_name= 'Above '+breaks[i].toFixed(1)
        }else{
            var leg_name= breaks[i].toFixed(1) + '–' +breaks[i+1].toFixed(1)
        }
        
        var color= rColors[i+1]
        var legend_item = $('<div class="legend-item">')
        .append('<div class="leg-color" style="background-color:'+color+'" >')
        .append('<p class="leg-text">'+leg_name+'</p>')
    
        $('#legend').prepend(legend_item)
    }
    $('#legend').prepend('<p>'+KEYS[visible_layer].name +' rate per 100,000 deaths</p>')
}

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
        minZoom: 5.5,
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
            addLayer(map,cause_keys[i],'p',pBreaks)
            addLayer(map,cause_keys[i],'r',KEYS[cause_keys[i]].breaks)
            console.log (i)
        }
        map.setLayoutProperty(
            'county_fill_'+binning+'_'+cause_keys[0],
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

function addLayer(themap, cause_id, type, breaks){
    var id = 'county_fill_' + type+'_'+ cause_id;
    if(type == 'p'){
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
                    ['get', cause_id+'_diff'],
                    pColors[0],breaks[0],
                    pColors[1],breaks[1], 
                    pColors[2],breaks[2], 
                    pColors[3],breaks[3], 
                    pColors[4],breaks[4],
                    pColors[5], breaks[5],
                    pColors[6], breaks[6],
                    pColors[7]
                ],
                'fill-opacity': 0.9
            }
    
        },firstSymbolId)

    }else{
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
                    rColors[0],breaks[0],
                    rColors[1],breaks[1], 
                    rColors[2],breaks[2], 
                    rColors[3],breaks[3],
                    rColors[4]
                ],
                'fill-opacity': 0.9
            }
    
        },firstSymbolId)
    }
    

    themap.on("mousemove", id, function(e) {
        if(e.features.length >0){
            if(hoveredCtId>=0){
                themap.setFeatureState({source: 'counties', id: hoveredCtId}, { hover: false}); 
            }
            themap.getCanvas().style.cursor = "pointer";
            hoveredCtId = e.features[0].id;
            var county = e.features[0].properties.COUNTY;
            var population = e.features[0].properties.county_pop;
            var percentDiff = e.features[0].properties[cause_id+'_diff'];
            var causeRate = e.features[0].properties[cause_id]
            if(causeRate ==-999){
                causeRate = 'Unavailable'
            }
            var causeName = KEYS[cause_id].name
            var coordinates = [e.lngLat.lng, e.lngLat.lat];
            themap.setFeatureState({source: 'counties', id: hoveredCtId}, { hover: true});
            var popupHTML = '<p class="county-name">'+county+'</p>' + '<p class="population">Population: <span>'+ population + '</span></p>' +'<p class="percent">'+percentDiff+'</p>' + '<p class="rate">'+causeName+' Rate: <span>' + causeRate + ' </span>per 100,000</p>'
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
    if(binning == 'r'){
        create_rLegend()
    }else{
        create_pLegend();
    }
    createColChart(selected_cause)
}


function switchVisibility(a,b){
    map.setLayoutProperty(
        'county_fill_'+binning+'_'+a,
        'visibility',
        'none'
    )
    map.setLayoutProperty(
        'county_fill_'+binning+'_'+b,
        'visibility',
        'visible'
    )
    visible_layer = b;
}

function switchBin(){
    map.setLayoutProperty(
        'county_fill_'+binning+'_'+visible_layer,
        'visibility',
        'none'
    )
    if(binning == 'r'){
        binning = 'p'
    }else{
        binning = 'r'
    }
    map.setLayoutProperty(
        'county_fill_'+binning+'_'+visible_layer,
        'visibility',
        'visible'
    )
    if(binning == 'r'){
        create_rLegend()
    }else{
        create_pLegend();
    }
    
}

if(binning == 'r'){
    create_rLegend()
}else{
    create_pLegend();
}

function createColChart(id){
    
    var data = KEYS[id].data
    var breaks = KEYS[id].breaks
    data.sort((c1,c2) => {
        if(!c1.rate){
            return 1
            
        }else if(!c2.rate){
            return -1
        }else{
            return c1.rate -c2.rate
        }
        
    })
    var margin = {top: 10, right: 30, bottom: 50, left: 30};
    var width = 500;
    var height = 175;

    var min = d3.min(data, function(d){return d.rate})
    var max = d3.max(data, function(d){return d.rate})

    // var domain = [min,max]
    // var bin = d3.bin().thresholds(breaks)
    // var buckets = bin(data,function(d){return d.rate})
    const binColor = d3
        .scaleThreshold()
        .domain(breaks)
        .range(rColors);


    var x = d3.scaleBand()
        .domain(data.map(function(d){return d.county}))
        .range([margin.left,width-margin.right])

    var y = d3.scaleLinear()
        .domain([0,max])
        .range([height-margin.bottom-10, margin.top]);

    var xAxis = d3.axisBottom(x)
    .tickPadding(10)
    .tickSize(0)
    .tickSizeOuter(0)
    
    var yAxis = d3.axisLeft(y)
    .tickPadding(5)
    .tickSize(0)
    .tickSizeOuter(0)

    $("#col-chart-svg-wrap").empty();
    var svg = d3.select("#col-chart-svg-wrap").append("svg")
    .attr('viewBox', [0,0,width,height])
    .attr("preserveAspectRatio", "xMinYMin meet")
    // .append("g")
    // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (height-margin.bottom) + ")")
      .call(xAxis)
      .call(g => g.select(".domain").remove())
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", "-1.2em")
      .attr("transform", "rotate(-90)" )
      .attr("class", (d,i)=> 'bar-label bar-label-cty' )
      .style('font-size','6px')

    svg.append("g")
      .attr("class", "axisline")
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height-margin.bottom)
      .attr('y2', height-margin.bottom)
      .style('stroke', '#000')
      .style('stroke-width', '0.5px')
    // svg.append("g")
    //   .attr("class", "y axis")
    //   .attr("transform", "translate("+margin.left+',' + margin.top + ")")
    //   .call(yAxis)
    // .selectAll("text")
    //   .style("text-anchor", "end")
    //   .attr("dx", "-.8em")
    //   .attr("dy", "-.55em")
    //   .attr("transform", "rotate(-45)" );

    var bar = svg.append('g')
        .attr('id', 'all-bars')
        .selectAll('rect')
        .data(data)
        bar.exit().remove();
        bar.enter().append('rect')
        .merge(bar)
        // .join('rect')
            .style('mix-blend-mode', 'multiply')
            .attr('x', d =>x(d.county))
            .attr('y', d =>{
                if(d.rate){
                 return y(d.rate)+ margin.top
                }else{
                    return margin.top
                }
            })
            .attr('height', d => {
                if(d.rate){
                    return height-margin.bottom-y(d.rate)-margin.top
                   }else{
                    return 0
                }
                
            })
            .attr('id', (d,i)=>'bar'+i)
            .attr('data-target', (d,i)=>i)
            .attr('class', 'col-chart-bar')
            .attr('width', x.bandwidth())
            .attr('fill', d => binColor(d.rate))
            .attr('stroke', '#888')
            .attr('stroke-width', '0.1px')

        svg.select('#all-bars')
            .selectAll('text')
            .data(data)
            .join('text')
            .text(d=> {if(d.rate){return d.rate}})
            .attr('x', (d,i)=> x.bandwidth()*i +margin.right)
            .attr('y', d=>y(d.rate)+5)
            .style('font-size', '8px')
            .attr("class", (d,i)=> 'bar-label bar-label-rate label'+i )



    $('.col-chart-bar').hover(function(){
        var target = '.label' + $(this).data('target')
        console.log(target)
        $(target).css('opacity', '1')
    }, function(){
        var target = '.label' + $(this).data('target')
        $(target).css('opacity', '0')
    })
}

