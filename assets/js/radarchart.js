function createRadarchart(county){
    var data=[
        // [
        //     {axis:'All Cause', value: 0, key:'acm'},
        //     {axis:'Cancer', value: 0, key:'can'},
        //     {axis:'Unintentional injury', value: 0, key:'uni'},
        //     {axis:'Respiratory Disease', value: 0, key:'clr'},
        //     {axis:'Heart Disease', value: 0, key:'hea'},
        //     {axis:'Stroke', value: 0, key:'str'},
        // ],
    ]
    var radarData=[]
    for(var i=0; i<cause_keys.length;i++){
        var cause = cause_keys[i]
        var axis = KEYS[cause].name
        var causeData = KEYS[cause].data
        // console.log(axis)
        var ctyData = causeData.filter(data => data.county.toLowerCase() ==county.toLowerCase())[0]
        // console.log(causeData,ctyData)

        var radarItem = {axis: axis, value: ctyData.percent, key:cause, rate:ctyData.rate}
        radarData.push(radarItem)
    }
    data.push(radarData)
    var margin = {top: 100, right: 100, bottom: 100, left: 100},    
    width = 600,
    height= 600;

    var radarChartOptions = {
        // w: width,
        // h: height,
        // margin: margin,
        // maxValue: 140,
        // levels: 1,
        // roundStrokes: true,
        county: county
        // color: color
    };

    RadarChart("#radarChart", data, radarChartOptions);
}



function RadarChart(id, data, options) {
    var cfg = {
        w: 600,				//Width of the circle
        h: 600,				//Height of the circle
        margin: {top: 100, right: 100, bottom: 100, left: 100}, //The margins of the SVG
        levels: 1,				//How many levels or inner circles should there be drawn
        maxValue: 140, 			//What is the value that the biggest circle will represent
        labelFactor: 1.15, 	//How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 100, 		//The number of pixels after which a label needs to be given a new line
        opacityArea: 0.55, 	//The opacity of the area of the blob
        dotRadius: 5, 			//The size of the colored circles of each blog
        opacityCircles: 0.7, 	//The opacity of the circles of each blob
        strokeWidth: 2, 		//The width of the stroke around each blob
        roundStrokes: true,	//If true the area and stroke will follow a round path (cardinal-closed)
        county: '',
    };
    var colorFunction =  d3.scaleThreshold().range(rColors).domain(KEYS.acm.breaks)	//Color function
    var color = colorFunction(parseFloat(data[0][0].rate))
    console.log(data[0][0].rate)
    //rewrite cfg object if options are passed
    if('undefined' !== typeof options){
        for(var i in options){
          if('undefined' !== typeof options[i]){ cfg[i] = options[i]; }
        }
    }

    var color = "#66175e"

    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
	var maxValue = Math.max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));

    var allAxis = (data[0].map(function(i, j){return i.axis})),	//Names of each axis
        total = allAxis.length,					//The number of different axes
        radius = Math.min(cfg.w/2, cfg.h/2), 	//Radius of the outermost circle
        Format = d3.format('.1f'),			 	//Percentage formatting
        angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"
    
        //Scale for the radius
    var rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([-100, maxValue]);

    
    //Remove whatever chart with the same id/class was present before
	d3.select(id).select("svg").remove();
    $(id).empty();

    	//Initiate the radar chart SVG
	var svg = d3.select(id).append("svg")
    .attr('viewBox', [0,0,cfg.w + cfg.margin.left + cfg.margin.right,cfg.h + cfg.margin.top + cfg.margin.bottom])
    .attr("preserveAspectRatio", "xMinYMin meet")
    // .attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
    // .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
    .attr("class", "radar"+id);

    //Append a g element		
	var g = svg.append("g")
    .attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");

    //Wrapper for the grid & axes
	var axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
	axisGrid.selectAll(".levels")
        .data(d3.range(1,(cfg.levels+1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", function(d, i){return radius/cfg.levels*d;})
        .style("fill", "#fff")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", cfg.opacityCircles)
        // .style("filter" , "url(#glow)");

    //Text indicating at what % each level is
	// axisGrid.selectAll(".axisLabel")
    //     .data(d3.range(1,(cfg.levels+1)).reverse())
    //     .enter().append("text")
    //     .attr("class", "axisLabel")
    //     .attr("x", 4)
    //     .attr("y", function(d){return -d*radius/cfg.levels;})
    //     .attr("dy", "0.4em")
    //     .style("font-size", "10px")
    //     .attr("fill", "#737373")
    //     .text(function(d,i) { return Format(maxValue * d/cfg.levels)+'%'; });

    // Draw the axes
    //Create the straight lines radiating outward from the center
	var axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");
    //Append the lines
    axis.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", function(d, i){ return rScale(maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
		.attr("y2", function(d, i){ return rScale(maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); })
		.attr("class", "line")
		.style("stroke", "#ddd")
		.style("stroke-width", "2px");

    //Append the labels at each axis
	axis.append("text")
        .attr("class", "legend")
        .style("font-size", "20px")
        .attr("text-anchor", function(d, i){
            if(i==0 || i==3){
                return 'middle'
            }else if(i>3){
                return 'end'
            }else{
                return 'start'
            }
        })
        .attr("dy", function(d, i){
            if(i==0){
                return '0.2em'
            }else if(i==3 || i==2){
                return '-1em'
            }else{
                return '0'
            }
        })
        .attr("x", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("y", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
        .text(function(d){return d})
        .call(wrap, cfg.wrapWidth);

    var stateBlob = d3.lineRadial()
        .curve(d3.curveLinearClosed)
        .radius(function(){return rScale(0)})
        .angle(function(d,i) {	return i*angleSlice; });

        
    g.selectAll('g.zeroBlob')
        .data(data).enter()
        .append('g')
        .attr("class", "zeroBlob") 
        .append("path")

        .attr("d", function(d,i){console.log(stateBlob(d));return stateBlob(d)})
        .style("fill", function(d,i) { return '#bbb'; })
        .style("fill-opacity", cfg.opacityArea)
        .style("mix-blend-mode", 'multiply')



    // Draw the radar chart blobs
    //The radial line function
	var radarLine = d3.lineRadial()
    .curve(d3.curveLinearClosed)
        .radius(function(d) { return rScale(d.value); })
        .angle(function(d,i) {	return i*angleSlice; });


    //Create a wrapper for the blobs	
	var blobWrapper = g.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");

    //Append the backgrounds	
	blobWrapper
        .append("path")
        .attr("class", "radarArea")
        .attr("d", function(d,i) { return radarLine(d); })
        .style("fill", function(d,i) { return color; })
        .style("fill-opacity", cfg.opacityArea)
        .style("mix-blend-mode", 'hard-light')

    blobWrapper
    .on('mouseover', function (){
        //Dim all blobs
        // console.log(d3.select(this))
        d3.selectAll(".radarArea")
            .transition().duration(200)
            .style("fill-opacity", 0.1); 
        //Bring back the hovered over blob
        d3.select(this).select('.radarArea')
            .transition().duration(200)
            .style("fill-opacity", 0.7);	
    })
    .on('mouseout', function(){
        //Bring back all blobs
        d3.selectAll(".radarArea")
            .transition().duration(200)
            .style("fill-opacity", cfg.opacityArea);
    });
    
    //Create the outlines	
	blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", function(d,i) { return radarLine(d); })
        .style("stroke-width", cfg.strokeWidth + "px")
        .style("stroke", function(d,i) { return color; })
        .style("fill", "none")
        // .style("filter" , "url(#glow)");

    //Append the circles
	blobWrapper.selectAll(".radarCircle")
        .data(function(d,i) {return d; })
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", function(d,i){ if(d.value){return cfg.dotRadius}})
        .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
        .style("fill", function(d,i,j) { return color; })
        .style("fill-opacity", 0.8);

    // blobWrapper.selectAll(".radarCircle")
    //     .data(data)
    //     .style("fill", function(d,i) { console.log(i); return cfg.color(i); })

    // Append invisible circles for tooltip
    //Wrapper for the invisible circles on top
	var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");

    //Append a set of invisible circles on top for the mouseover pop-up
	blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(function(d,i) { return d; })
        .enter().append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", cfg.dotRadius*1.5)
        .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(d,i) {
            newX =  parseFloat(d3.select(this).attr('cx')) - 10;
            newY =  parseFloat(d3.select(this).attr('cy')) - 10;
                    
            tooltip
                .attr('x', newX)
                .attr('y', newY)
                .text(function(){
                    if(i.value>0){
                        return Format(Math.abs(i.value))+'% above state rate'
                    }else{
                        return Format(Math.abs(i.value))+'% below state rate'
                    }
                })
                .attr('text-anchor','middle')
                .transition().duration(200)
                .style('opacity', 1)
                .style('font-size','18px')
        })
        .on("mouseout", function(){
            tooltip.transition().duration(200)
                .style("opacity", 0);
        });

    //Set up the small tooltip for when you hover over a circle
	var tooltip = g.append("text")
        .attr("class", "tooltip")
        .style("opacity", 0);

	/////////////////// Helper Function /////////////////////
	//Taken from http://bl.ocks.org/mbostock/7555321
	//Wraps SVG text	
	function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.4, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
              
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
          }
        });
    }//wrap	

    var radarLegend = $('<div id="radarLegend">')
    var state = $('<div class="radar-legend-item state-leg">')
        state.append('<div class="radar-leg-color state-color">')
        state.append('<span>State Average</span>')
    var countyLeg = $('<div class="radar-legend-item cty-leg">')
        countyLeg.append('<div class="radar-leg-color cty-color" style="background:#BC42AB;">')
        countyLeg.append('<span>'+cfg.county+' County</span>')

    radarLegend.append(state)
    radarLegend.append(countyLeg)
    $(id).append(radarLegend)

}//RadarChart