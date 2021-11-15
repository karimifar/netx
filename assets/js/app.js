var map;
var firstSymbolId;
var hoveredCtId;
var selectedCtId;
var selectedCty;
var apiUrl =  'https://texashealthdata.com' //'http://localhost:3306'
var selected = false;
var trendData;
var demoData
var demoColors = ["#ecb29e","#9b3557", "#420239"]
var regions = [{region:'us', name:'US'}, {region:'tx', name:'Texas'}, {region:'netx', name:'Northeast Texas'}]
var rColors = ['#ddd',"#98d1d1", "#54bebe", "#df979e", "#c80064"]
var input = document.getElementById("main-input");

// var binning = 'r'
var ctyData;
var allCounties = []
var KEYS = {
    'acm': {
        'name': "All Cause"
        },
    'can': {
        'name': "Cancer"
        },
    'hea': {
        'name': "Heart Disease"
        },
    'clr': {
        'name': "Respiratory Disease"
        },
    'str': {
        'name': "Stroke"
        },
    'uni': {
        'name': "Unintentional Injury"
        },

}
var cause_keys = Object.keys(KEYS);
var visible_layer = cause_keys[0];


//get all county data and store in ctyData & KEYS variables
$.get(apiUrl+'/api/netx/all', function(data){
    ctyData = data;
    allCounties = ctyData.map(data => data.county.toLowerCase())
    autocomplete(input, allCounties);
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
    }

    createMap();
    createColChart('acm')
    createLegend()
})

//Get trend data and create the chart.
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

    var margin = {top: 20, right: 10, bottom: 20, left: 30};
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
    
    for(var i =0; i<trendData.length;i++){
        domain.push(trendData[i].year)
    }
    var xScale = d3.scaleBand()
        .domain(domain)
        .range([margin.left,width-margin.right])

    var yScale = d3.scaleLinear()
        .domain([min-5,max+5])
        .range([height-margin.bottom, margin.top])

    var demoColor = d3.scaleOrdinal()
        .domain([0,1,2])
        .range(demoColors)

    var ticks = yScale.ticks()


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
  // add the Y gridlines
    svg.append("g")			
        .attr("class", "grid")
        .attr("transform", "translate(30, 0)")
        .call(make_y_gridlines()
            .tickSize((margin.right+30)-width)
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

    function drawLine(dataset,i){
        svg.append('g')
            .attr('id', '#line-group-'+i)
            .attr('class', 'chart-line-group')
            .append('path')
            .datum(dataset)
            .attr('d',line)
            .attr("class", "chartLine line-"+i)
            .attr('stroke', function() {return demoColor(i)})
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
            .attr('cx', function(d,n){return xScale(d.year)+xScale.bandwidth()/2})
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

//Get demographic data and draw gender and race bar charts
$.get(apiUrl+'/api/netx/demo', function(data){
    demoData = data;
    createGenderChart('acm')
    createRaceChart('acm')
})

function createGenderChart(cause){
    $('#gender-chart').empty()
    var rawData = demoData.filter(data => data.cause == cause)[0]
    var data =[]
    for(var i=0; i<regions.length; i++){
        var region = regions[i].region;
        var name = regions[i].name;
        var dataObj = {region: region, name:name, gender:[parseFloat(rawData[region+'_f']), parseFloat(rawData[region+'_m'])]}
        data.push(dataObj)
    }
    var margin = {top: 20, right: 10, bottom: 30, left: 30};
    var width = 500;
    var height= 300;
    var innerW = width-margin.left-margin.right;
    var barW = 24;
    var gap = 120;
    var padding = (innerW - 6*barW-gap)/2
    // console.log(padding,innerW)
    var max = d3.max(data, function(row){
        return d3.max(row.gender)
    })
    console.log(data)
    var yScale = d3.scaleLinear()
        .domain([0,max+5])
        .range([height-margin.bottom, margin.top])
    
    var demoColor = d3.scaleOrdinal()
        .domain(['us','tx','netx'])
        .range(demoColors)

    var svg = d3.select('#gender-chart').append('svg')
        .attr('viewBox', [0,0,width,height])
        .attr("preserveAspectRatio", "xMinYMin meet")

    

    for(var i =0; i<data.length; i++){
        drawBars(data[i],i)
    }
    svg.append("g")
        .attr("class", "x axis")
        // .attr("transform", "translate(0, "  + (height-margin.bottom) +")")
        .append('line')
        .attr('x1',margin.left)
        .attr('x2',width - margin.right)
        .attr('y1',yScale(0))
        .attr('y2',yScale(0))
        .style("stroke", "black")
    svg.select('g.x')
        .append('text')
        .attr('x', margin.left+padding+1.5*barW)
        .attr('y', height-margin.bottom+18)
        .text('Female')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
    svg.select('g.x')
        .append('text')
        .attr('x', width - margin.right-padding-1.5*barW)
        .attr('y', height-margin.bottom+18)
        .text('Male')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" +margin.left+ ',' + " 0)")
        .call(d3.axisLeft(yScale)
        // .tickValues(ticks)
        .tickPadding(5)
        .tickSize(0)
    ); 
    function drawBars(data,i){
        var region= data.region;
        svg.append('g')
            .attr('class', 'bar-g-'+region)
            .selectAll()
            .data(data.gender).enter()
            .append('g')
            .attr('class', 'bar-g bar-region-'+region)
            .append('rect')
            .attr('class','bar-'+region)
            .attr('x',function(d,j){return margin.left+(i*barW)+ padding + j*(gap+3*barW)})
            .attr('y',function(d,j){return yScale(d)})
            .attr('width',barW)
            .attr('height',function(d){return yScale(0)-yScale(d)})
            .style('fill', demoColor(data.name))

            svg.selectAll('.bar-region-'+region)
            .data(data.gender)
            .append('text')
            .text(function(d){return d})
            .attr('x', function(d,j){return margin.left+(i*barW)+ padding + j*(gap+3*barW) +barW/2})
            .attr('y', function(d,j){return yScale(d)-3})
            .style('font-family', 'acumin-pro-extra-condensed, sans-serif')
            .style('font-weight', '300')
            // .attr("transform", "rotate(-90)" )
            .style("text-anchor", "middle")
            // .attr("transform-origin", function(d,j){ return margin.left+(i*barW)+ padding + j*(gap+3*barW)+'px '+yScale(d)+'px'} )
            // .attr("dx", "1.4em")
            // .attr("dy", "1em")
    }

}

function createRaceChart(cause){
    $('#race-chart').empty()
    var rawData = demoData.filter(data => data.cause == cause)[0]
    var data =[]
    for(var i=0; i<regions.length; i++){
        var region = regions[i].region;
        var name = regions[i].name;
        var dataObj = {region: region, name:name, race:[parseFloat(rawData[region+'_w']), parseFloat(rawData[region+'_b']),parseFloat(rawData[region+'_h'])]}
        data.push(dataObj)
    }

    var margin = {top: 20, right: 10, bottom: 30, left: 30};
    var width = 500;
    var height= 300;
    var innerW = width-margin.left-margin.right;
    var barW = 24;
    var gap = 60;
    var padding = (innerW - 9*barW-2*gap)/2
    // console.log(padding,innerW)
    var max = d3.max(data, function(row){
        return d3.max(row.race)
    })

    var yScale = d3.scaleLinear()
        .domain([0,max+5])
        .range([height-margin.bottom, margin.top])
    
    var demoColor = d3.scaleOrdinal()
        .domain(['us','tx','netx'])
        .range(demoColors)

    var svg = d3.select('#race-chart').append('svg')
        .attr('viewBox', [0,0,width,height])
        .attr("preserveAspectRatio", "xMinYMin meet")

    for(var i =0; i<data.length; i++){
        drawBars(data[i],i)
    }

    svg.append("g")
        .attr("class", "x axis")
        // .attr("transform", "translate(0, "  + (height-margin.bottom) +")")
        .append('line')
        .attr('x1',margin.left)
        .attr('x2',width - margin.right)
        .attr('y1',yScale(0))
        .attr('y2',yScale(0))
        .style("stroke", "black")
    svg.select('g.x')
        .append('text')
        .attr('x', margin.left+padding+1.5*barW)
        .attr('y', height-margin.bottom+18)
        .text('Non-Hispanic White')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
    svg.select('g.x')
        .append('text')
        .attr('x', margin.left+padding+4.5*barW+gap)
        .attr('y', height-margin.bottom+18)
        .text('Non-Hispanic Black')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
    svg.select('g.x')
        .append('text')
        .attr('x', margin.left+padding+7.5*barW+ 2*gap)
        .attr('y', height-margin.bottom+18)
        .text('Hispanic')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" +margin.left+ ',' + " 0)")
        .call(d3.axisLeft(yScale)
        // .tickValues(ticks)
        .tickPadding(5)
        .tickSize(0)
    ); 
    function drawBars(data,i){
        var region= data.region;
        svg.append('g')
            .attr('class', 'bar-g-'+region)
            .selectAll()
            .data(data.race).enter()
            .append('g')
            .attr('class', 'bar-g bar-region-'+region)
            .append('rect')
            .attr('class','bar-'+region)
            .attr('x',function(d,j){return margin.left+(i*barW)+ padding + j*(gap+3*barW)})
            .attr('y',function(d,j){return yScale(d)})
            .attr('width',barW)
            .attr('height',function(d){return yScale(0)-yScale(d)})
            .style('fill', demoColor(data.name))

            svg.selectAll('.bar-region-'+region)
            .data(data.race)
            .append('text')
            .text(function(d){return d})
            .attr('x', function(d,j){return margin.left+(i*barW)+ padding + j*(gap+3*barW) +barW/2})
            .attr('y', function(d,j){return yScale(d)-3})
            .style('font-family', 'acumin-pro-extra-condensed, sans-serif')
            .style('font-weight', '300')
            // .attr("transform", "rotate(-90)" )
            .style("text-anchor", "middle")
    }

    

}

function createLegend(){
    var breaks = KEYS[visible_layer].breaks
    $('#legend').empty()
    $('#legend').append('<div class="legend-item"><p class="leg-text">Unavailable</p><div class="leg-color" style="background-color:'+rColors[0]+'" ></div></div>')
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
        .append('<p class="leg-text">'+leg_name+'</p>')
        .append('<div class="leg-color" style="background-color:'+color+'" >')
        
    
        $('#legend').prepend(legend_item)
    }
    $('#legend').prepend('<p>'+KEYS[visible_layer].name +' rate per 100,000 deaths</p>')
}


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
        // var layers = map.getStyle().layers;
        // for (var i = 0; i < layers.length; i++) {
        //     if (layers[i].type === 'symbol') {
        //         firstSymbolId = layers[i].id;
        //         break;
        //     }
        // }
        // console.log(firstSymbolId)
        firstSymbolId = 'building-top-line'
        map.addSource("counties", {
            type: "geojson",
            data: "https://texashealthdata.com/netx/map",
            generateId: true,
        })

        
        
        for (var i=0; i<cause_keys.length; i++){
            // addLayer(map,cause_keys[i],'p',pBreaks)
            addLayer(map,cause_keys[i], KEYS[cause_keys[i]].breaks)
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


    })
}







function addLayer(themap, cause_id, breaks){
    var id = 'county_fill_'+ cause_id;
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
    createLegend()
    createColChart(selected_cause)
    createTrendChart(selected_cause)
    createGenderChart(selected_cause)
    createRaceChart(selected_cause)
    if(selected){
        queryCounty(selectedCty)
    }
    $('.cause-name').text(KEYS[selected_cause].name)
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
            .attr('fill', d => {
                if(d.rate){
                    return binColor(d.rate)
                   }else{
                    return '#ddd'
                }
            })
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
            .attr('y', d=> {if(d.rate){return y(d.rate)-5}})
            .style('font-size', '3px')
            .attr("class", (d,i)=> 'bar-label bar-label-rate label'+i )


    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate("+ (margin.left) + ","+ (height-margin.bottom)+")")
      .call(xAxis)
      .call(g => g.select(".domain").style('stroke-width', '0.25px'))
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.5em")
      .attr("dy", "-1em")
      .attr("transform", "rotate(-45)" )
      .attr("class", (d,i)=> 'bar-label bar-label-cty' )
      .style('font-size','2.6px')

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
    if(allCounties.indexOf(county.toLowerCase())>=0){

        selected = true;
        selectedCty = toTitleCase(county);
        $('#fg-right-col').addClass('selected')
        
        if(selectedCtId || selectedCtId == 0){
            map.setFeatureState({source: 'counties', id: selectedCtId}, { hover: false}); 
        }

        createRadarchart(county)
        var countyFeatures = map.querySourceFeatures('counties', {
            layer: 'county_fill_acm',
            filter: ['==', 'COUNTY', toTitleCase(county)]
        });
        var countyMap = countyFeatures[0]
        selectedCtId = countyMap.id
        var population = countyMap.properties.county_pop;
        var percentDiff = countyMap.properties[visible_layer+'_diff'];
        var causeRate = countyMap.properties[visible_layer];
        var causeName = KEYS[visible_layer].name
        $('#pop-name').text(selectedCty + ' County')
        $('#pop-population').html('Population: <span>'+d3.format(',')(population)+'</span>')
        $('#pop-causeName').html(causeName+' mortality rate:')
        $('#pop-value').html(function(){
            if(causeRate == -999){
                return 'Unavailable'
            }else{
                return '<span>'+causeRate+'</span> per 100,000'
            }
            
        })
        
        $('#pop-percent').html(function(){
            if (percentDiff>0){
                return '<span>'+ percentDiff +'% above</span> state rate'
            }else{
                return Math.abs(percentDiff) + '% below</span> state rate'
            }
        })

        map.setFeatureState({source: 'counties', id: selectedCtId}, { hover: true}); 
    }else{
        alert('Data not available')
    }

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
$('#demo-data-handle').on('click', function(){
    $('#demo-data').toggleClass('collapsed')
})


$('.modal-toggle').on('click', function(){
    $('#intro').toggleClass('closed')
})


var viewed = sessionStorage.getItem('viewed');
if(!viewed){
    $('#intro').toggleClass('closed')
    sessionStorage.setItem('viewed', true);
}

$('#deselect').on('click',function(){
    selected=false;
    selectedCty = '';
    map.setFeatureState({source: 'counties', id: selectedCtId}, { hover: false}); 
    $('#fg-right-col').removeClass('selected')
})

$('#submit').on('click', function(e){
    e.preventDefault();
    var county = $('#main-input').val().toLowerCase();
    queryCounty(county)
    
})



//HELPER FUNCTIONS
function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
}

$('#leg-us .leg-color').css('background', demoColors[0])
$('#leg-tx .leg-color').css('background', demoColors[1])
$('#leg-netx .leg-color').css('background', demoColors[2])