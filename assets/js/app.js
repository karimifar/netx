var map;
var firstSymbolId;
var hoveredCtId;
var selectedCtId;
var selectedCty;
var apiUrl =  'https://texashealthdata.com' //'http://localhost:3306'
var selected = false;
var trendData;
var demoColors = ['green','blue','red']
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
        'name': "All Cause"
        },
    'can': {
        // 'breaks': [1.5,121, 153, 185, 217, 249],
        'name': "Cancer"
        },
    'hea': {
        // 'breaks': [1.5,144, 182, 220, 258, 296],
        'name': "Heart Disease"
        },
    'clr': {
        // 'breaks': [1.5, 44, 64, 84, 104, 124],
        'name': "Respiratory Disease"
        },
    'str': {
        // 'breaks': [1.5,33, 42, 51, 60, 69],
        'name': "Stroke"
        },
    'uni': {
        // 'breaks': [1.5,38, 48, 58, 68, 78],
        'name': "Unintentional Injury"
        },

}


var cause_keys = Object.keys(KEYS);
$.get(apiUrl+'/api/netx/all', function(data){
    ctyData = data;
    for(var i=0; i<cause_keys.length; i++){
        var key = cause_keys[i]
        var percent = cause_keys[i]+'_diff'
        var rawData = []
        var allData = []
        ctyData.filter(function(cty){
            rawData.push(cty[key])
            var rate, percentDiff;
            if(cty[key]){
                rate = (cty[key])
            }else{
                rate = null
            };

            if(cty[percent]){
                percentDiff = parseFloat(cty[percent])
            }else{
                percentDiff = null
            }
            allData.push({
                county: cty.county,
                rate: rate,
                percent: percentDiff
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
        // console.log(KEYS[cause_keys[i]].breaks)
    }
    createMap();

    createColChart('acm')
    if(binning == 'r'){
        create_rLegend()
    }else{
        create_pLegend();
    }
})

$.get(apiUrl+'/api/netx/trend', function(data){
    trendData = data;
    createTrendChart(visible_layer)
})
function createTrendChart(cause){
    $('#trend-chart').empty()
    var usTrend =[]
    var stateTrend =[]
    var netxTrend =[]

    for(var i=0;i<trendData.length;i++){
        var usItem = {year: trendData[i].year, rate:parseFloat(trendData[i][cause+'_us']) }
        var stateItem = {year: trendData[i].year, rate:parseFloat(trendData[i][cause+'_tx'])}
        var netxItem = {year: trendData[i].year, rate:parseFloat(trendData[i][cause+'_netx'])}
        usTrend.push(usItem)
        stateTrend.push(stateItem)
        netxTrend.push(netxItem)
    }
    var causeTrend = [usTrend, stateTrend, netxTrend]
    // console.log(causeTrend)

    var margin = {top: 30, right: 10, bottom: 20, left: 30};
    var width = 500;
    var height= 300;
    var domain =[];
    // var max = 1000;
    var max = d3.max(causeTrend, function(row){
        return d3.max(row,function(column){
            return column.rate
        })
    })
    var min = d3.min(causeTrend, function(row){
        return d3.min(row,function(column){
            return column.rate
        })
    })
    
    console.log(min)
    for(var i =0; i<trendData.length;i++){
        domain.push(trendData[i].year)
    }
    console.log(domain)
    var xScale = d3.scaleBand()
        .domain(domain)
        .range([margin.left,width-margin.right-margin.left])

    var yScale = d3.scaleLinear()
        .domain([min-5,max+5])
        .range([height-margin.bottom, margin.top])

    var demoColor = d3.scaleOrdinal()
        .domain([0,1,2])
        .range(demoColors)

    var ticks = yScale.ticks()
    // ticks = ticks.filter(tick => tick>min-10 && tick<max)
    // ticks.push(min,max)

    var line = d3.line()
        .x(function(d,i){return xScale(d.year)+xScale.bandwidth()/2;})
        .y(function(d){return yScale(d.rate);})
        .curve(d3.curveMonotoneX)

    var svg = d3.select('#trend-chart').append('svg')
    .attr('viewBox', [0,0,width,height])
    .attr("preserveAspectRatio", "xMinYMin meet")
    
    // gridlines in y axis function
    function make_y_gridlines() {		
        return d3.axisLeft(yScale)
            .tickValues(ticks)
    }
    // svg.append("g")			
    //   .attr("class", "grid")
    //   .attr("transform", "translate(0," + height + ")")
    //   .call(make_x_gridlines()
    //       .tickSize(-height)
    //       .tickFormat("")
    //   )
    //   .call(g => g.select(".domain").style('display', 'none'))


  // add the Y gridlines
    svg.append("g")			
        .attr("class", "grid")
        .attr("transform", "translate(30, 0)")
        .call(make_y_gridlines()
            .tickSize((margin.right+margin.left+30)-width)
            .tickFormat("")
        )
        .call(g => g.select(".domain").style('display', 'none'))

        
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, "  + (height-margin.bottom) +")")
        .call(
            d3.axisBottom(xScale)
            .tickPadding(5)
            .tickSize(5)
        );
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" +margin.left+ ',' + " 0)")
        .call(d3.axisLeft(yScale)
        .tickValues(ticks)
        .tickPadding(5)
        .tickSize(0)
    ); 

    for(var i=0; i<causeTrend.length;i++){
        drawLine(causeTrend[i], i)
        annotations(causeTrend[i],i)
    }
    var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("display","none")
            .style("opacity", 0);

    function drawLine(dataset,i){
        svg.append('g')
            .attr('id', '#line-group-'+i)
            .attr('class', 'chart-line-group')
            .append('path')
            .datum(dataset)
            .attr('d',line)
            .attr("class", "chartLine line-"+i)
            .attr('stroke', function() {return demoColor(i)})
  
            // .on("mouseover", function (e,d) {
            //     console.log(d)
            //     tooltip.transition()
            //         .duration(200)
            //         .style("display","block")
            //         .style("opacity", .9);
            //     tooltip.html("<p>"+d.rate + "</p>")
            //         .style("left", e.pageX+5 + "px")
            //         .style("top", e.pageY-20 + "px");
            // })
            // .on("mouseleave", function (d) {
            //     tooltip.transition()
            //         .duration(200)
            //         .style("display","none")
            //         .style("opacity", 0)
            // })
        

    }
    function annotations(dataset,i){
        svg.append('g')
            .attr('id', '#annotations-'+i)
            .selectAll('.circle-g-'+i)
            .data(dataset).enter()
            .append('g')
            .attr('class', 'circle-g circle-g-'+i)
            
        
        svg.selectAll('.circle-g-'+i)
            .data(dataset)
            // console.log(dataset)
            .append('circle')
            .attr('class', i+'-dot chartDot')
            .attr('cx', function(d,n){console.log(dataset);return xScale(d.year)+xScale.bandwidth()/2})
            .attr('cy', function(d){return yScale(d.rate)})
            .attr('r', '4px')
            .style('stroke', 'none')
            .style('fill', function() {return demoColor(i)})

        svg.selectAll('.circle-g-'+i)
            .data(dataset)
            .append('text')
            .attr('x', function(d){return xScale(d.year)+xScale.bandwidth()/2})
            .attr('y', function(d){return yScale(d.rate)-10})
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text(d => d.rate)
    }

}
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
var mapStyle = "mapbox://styles/karimifar/cku4epw321k0w17qy45umxx3v"

var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: [0, -5],
    className: 'county-pop'
});
function createMap(){
    map = new mapboxgl.Map({
        container: 'map',
        zoom: 6.5,
        center: [-95.0, 31.2],
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
        // console.log(firstSymbolId)
        firstSymbolId = 'building-top-line'
        map.addSource("counties", {
            type: "geojson",
            data: "https://texashealthdata.com/netx/map",
            generateId: true,
        })

        
        
        for (var i=0; i<cause_keys.length; i++){
            addLayer(map,cause_keys[i],'p',pBreaks)
            addLayer(map,cause_keys[i],'r',KEYS[cause_keys[i]].breaks)
            // console.log (i)
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
                'text-ignore-placement':true,
                'text-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    6,
                    8,
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
                if(selected){
                    map.setFeatureState({source: 'counties', id: selectedCtId}, { hover: true}); 
                }
            }
            themap.getCanvas().style.cursor = "pointer";
            hoveredCtId = e.features[0].id;
            var county = e.features[0].properties.COUNTY;
            var population = e.features[0].properties.county_pop;
            var percentDiff = e.features[0].properties[cause_id+'_diff'];
            var causeRate = e.features[0].properties[cause_id]
            // if(causeRate ==-999){
            //     causeRate = 'Unavailable'
            // }
            var causeName = KEYS[cause_id].name
            var coordinates = [e.lngLat.lng, e.lngLat.lat];
            themap.setFeatureState({source: 'counties', id: hoveredCtId}, { hover: true});
            // $('#pop-name').text(county)
            // $('#pop-population').html('Population: '+d3.format(',')(population))
            // $('#pop-causeName').html(causeName+':')
            // $('#pop-value').html(function(){
            //     if(causeRate == -999){
            //         return 'Unavailable'
            //     }else{
            //         return causeRate+' per 100,000'
            //     }
                
            // })
            // $('#pop-percent').html(function(){
            //     if (percentDiff>0){
            //         return percentDiff +' percent above state rate'
            //     }else{
            //         return Math.abs(percentDiff) + ' percent below state rate'
            //     }
            // })
            // createRadarchart(county)
            // var popupHTML = '<p class="county-name">'+county+'</p>' + '<p class="population">Population: <span>'+ population + '</span></p>' +'<p class="percent">'+percentDiff+'</p>' + '<p class="rate">'+causeName+' Rate: <span>' + causeRate + ' </span>per 100,000</p>'
            // popup.setLngLat(coordinates).setHTML(popupHTML).addTo(themap);
        }
        
    })
    themap.on("mouseleave", id, function(){
        if(hoveredCtId>=0){
            themap.setFeatureState(
                {source:'counties', id: hoveredCtId},
                {hover: false}
            )
        }
        if(selected){
            themap.setFeatureState(
                {source:'counties', id: selectedCtId},
                {hover: true}
            )
        }

        if(!selected){
            $('.popup').empty();
        }
        // popup.remove();
    })

    themap.on("click", id, function(e) {
        if(e.features.length>0){
            var countyName = e.features[0].properties.COUNTY
            queryCounty(countyName)
        }
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
    createTrendChart(selected_cause)
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

// if(binning == 'r'){
//     create_rLegend()
// }else{
//     create_pLegend();
// }

function createColChart(id){
    
    var data = KEYS[id].data
    var breaks = KEYS[id].breaks
    data.sort((c1,c2) => {
        if(!c1.rate){
            return -1
            
        }else if(!c2.rate){
            return 1
        }else{
            return c1.rate -c2.rate
        }
        
    })
    var margin = {top: 12, right: 10, bottom: 12, left: 10};
    var width = 200;
    var height = 50;

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
        .range([margin.left,width-margin.right-margin.left]);

    var y = d3.scaleLinear()
        .domain([0,max])
        .range([height-margin.bottom, margin.top])
        

    var yAxis = d3.axisBottom(y)
    .tickPadding(10)
    .tickSize(0)
    .tickSizeOuter(0)
    
    var xAxis = d3.axisBottom(x)
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
      .attr("transform", "translate("+ (margin.left) + ","+ (height-margin.bottom)+")")
      .call(xAxis)
      .call(g => g.select(".domain").style('stroke-width', '0.5px'))
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.5em")
      .attr("dy", "-1em")
      .attr("transform", "rotate(-45)" )
      .attr("class", (d,i)=> 'bar-label bar-label-cty' )
      .style('font-size','2.6px')

    // svg.append("g")
    //   .attr("class", "axisline")
    //   .append('line')
    //   .attr('x1', 0)
    //   .attr('x2', width)
    //   .attr('y1', height-margin.bottom)
    //   .attr('y2', height-margin.bottom)
    //   .style('stroke', '#000')
    //   .style('stroke-width', '0.5px')


    var bar = svg.append('g')
        .attr('id', 'all-bars')
        .selectAll('rect')
        .data(data)
        bar.exit().remove();
        bar.enter().append('rect')
        .merge(bar)
        // .join('rect')
            // .style('mix-blend-mode', 'multiply')
            .attr('x', d =>x(d.county)+margin.right)
            .attr('y', d => y(d.rate))
            .attr('height', d => {
                if(d.rate){
                    return y(0)-y(d.rate) 
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
            .attr('x', (d,i)=> x(d.county)+margin.left+2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr('y', d=>y(d.rate)-5)
            .style('font-size', '3px')
            .attr("class", (d,i)=> 'bar-label bar-label-rate label'+i )



    $('.col-chart-bar').hover(function(){
        var target = '.label' + $(this).data('target')
        // console.log(target)
        $(target).css('opacity', '1')
    }, function(){
        var target = '.label' + $(this).data('target')
        $(target).css('opacity', '0')
    })
}

function queryCounty(county){
    selected = true;
    if(selectedCtId){
        map.setFeatureState({source: 'counties', id: selectedCtId}, { hover: false}); 
    }

    createRadarchart(county)
    var countyFeatures = map.querySourceFeatures('counties', {
        layer: 'county_fill_'+binning+'_acm',
        filter: ['==', 'COUNTY', county]
    });
    var countyMap = countyFeatures[0]
    selectedCtId = countyMap.id
    var population = countyMap.properties.county_pop;
    var percentDiff = countyMap.properties[visible_layer+'_diff'];
    var causeRate = countyMap.properties[visible_layer];
    var causeName = KEYS[visible_layer].name
    $('#pop-name').text(county)
    $('#pop-population').html('Population: '+d3.format(',')(population))
    $('#pop-causeName').html(causeName+':')
    $('#pop-value').html(function(){
        if(causeRate == -999){
            return 'Unavailable'
        }else{
            return causeRate+' per 100,000'
        }
        
    })
    
    $('#pop-percent').html(function(){
        if (percentDiff>0){
            return percentDiff +' percent above state rate'
        }else{
            return Math.abs(percentDiff) + ' percent below state rate'
        }
    })

    map.setFeatureState({source: 'counties', id: selectedCtId}, { hover: true}); 


}


var radarState = [
    [
        {axis:'All Cause', value: 0, key:'acm'},
        {axis:'Cancer', value: 0, key:'can'},
        {axis:'Unintentional injury', value: 0, key:'uni'},
        {axis:'Respiratory Disease', value: 0, key:'clr'},
        {axis:'Heart Disease', value: 0, key:'hea'},
        {axis:'Stroke', value: 0, key:'str'},
    ],
    
]
// RadarChart("#radarChart", radarState)
$('#demo-data').on('click', function(){
    $('#demo-data').toggleClass('collapsed')
})





