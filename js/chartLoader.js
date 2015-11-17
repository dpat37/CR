function multiLineChart(contentString, chartData, tickDisplayVarient){	
	//margin variables, and size variables
	var frameWidth = 900,
		frameHeight = 500;
	
	var m = {top: 20, right: 55, bottom: 30, left: 40},
		width = frameWidth - m.left - m.right,
		height = frameHeight - m.top - m.bottom;
		
	
	//colors and scheme for each line setup
	var colors = ["#1f77b4","#aec7e8","#ff7f0e","#ffbb78","#2ca02c","#98df8a","#d62728",
			"#ff9896","#9467bd","#c5b0d5","#8c564b","#c49c94","#e377c2","#f7b6d2",
			"#7f7f7f","#c7c7c7","#bcbd22","#dbdb8d","#17becf","#9edae5"];
	var colorScheme = [];	
	for(var i=0; i<chartData.length; i++)
		colorScheme.push(colors[i%colors.length]);
	
	//label setup including tick labeling
	var labels = chartData[0].values.map(function(d){return d.label;});
	var tickLabels = [];
	if(tickDisplayVarient >= labels.length || tickDisplayVarient <= 0)
		tickDisplayVarient = labels.length-1;
	for(var i=0; i<labels.length; i++){
		if(i%tickDisplayVarient)
			tickLabels.push(labels[i]);
		else
			tickLabels.push(" ");
	}
	
	//x and y scale variables
	var x = d3.scale.ordinal()
			.rangeRoundBands([0, width], .1);
	
	var y = d3.scale.linear()
			.rangeRound([height, 0]);
			
	//x and y axis setup
	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.tickValues(tickLabels);
		
	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
	
	//axis line	
	var line = d3.svg.line()
		.interpolate("cardinal")
		.x(function(d){return x(d.label) + x.rangeBand()/2;})
		.y(function(d){return y(d.value);});
	
	//coloring scheme to be used for different series
	var color = d3.scale.ordinal()
        .range(colorScheme);
	
	//svg element construct
	var svg = d3.select(contentString).append("svg")
			.attr("width", width+m.top+m.right)
			.attr("height", height+m.top+m.bottom)
		.append("g")
			.attr("transform", "translate(" + m.left + "," + m.top + ")");
	
	
	var varNames = chartData.map(function(d){return d.name});
	color.domain(varNames);
	
	x.domain(labels);
	y.domain([
		d3.min(chartData, function(c){
			return d3.min(c.values, function(d){return d.value;});
		}),
		d3.max(chartData, function(c){
			return d3.max(c.values, function(d){return d.value;});
		})
	]);
	
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
	
	svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Count");
		
	var series = svg.selectAll(".series")
			.data(chartData)
		.enter().append("g")
			.attr("class", "series");
			
	series.append("path")
		.attr("class", "line")
		.attr("d", function(d){ return line(d.values);})
		.style("stroke", function (d) { return color(d.name); })
		.style("stroke-width", "4px")
		.style("fill", "none")
	
	series.selectAll(".point")
		.data(function(d){return d.values;})
		.enter().append("circle")
			.attr("class", "point")
			.attr("cx", function(d){return x(d.label) + x.rangeBand()/2;})
			.attr("cy", function(d){return y(d.value);})
			.attr("r", "3px")
			.style("fill", function(d){return color(d.name);})
			.style("stroke", "grey")
			.style("stroke-width", "3px")
			.on("mouseover", function(d){ showPopover.call(this, d); })
			.on("mouseout", function(d){removePopovers(); });
			
	var legend = svg.selectAll(".legend")
			.data(varNames.slice().reverse())
		.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i){ return "translate(20," + i*20 +")"});
			
	legend.append("rect")
		.attr("x", width - 10)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", color)
        .style("stroke", "grey");

        legend.append("text")
            .attr("x", width - 12)
            .attr("y", 6)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function (d) { return d; });
	
	
	function removePopovers () {
		$('.popover').each(function() {
			$(this).remove();
        }); 
    }

    function showPopover (d) {
          $(this).popover({
            title: d.name,
            placement: 'auto top',
            container: 'body',
            trigger: 'manual',
            html : true,
            content: function() { 
              return "Time: " + d.label + 
                     "<br/>Count: " + d3.format(",")(d.value ? d.value: d.y1 - d.y0); }
          });
          $(this).popover('show')
        }		
	
}