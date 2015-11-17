function createVisualContentHolderSub(){
	var MAX_WIDTH = 1400, MAX_HEIGHT = 600;
	var margin = {top:30, right:20, bottom:30, left:50},
		width = MAX_WIDTH - margin.left - margin.right,
		height = MAX_HEIGHT - margin.top - margin.bottom;
		
	//setup plot chart
	var svg = d3.select("#visual-content")
		.attr("class", "chart")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom);

	//initialize axis
	var y = d3.scale.linear().domain([0, 1000]).range([0,height]).nice(),
		x = d3.scale.linear().domain([0, 23]).range([width,0]),
		yAxis = d3.svg.axis().scale(y).orient("left"),
		xAxis = d3.svg.axis().scale(x).orient("bottom");
		
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
		
	svg.append("text")
		.attr("transform", "translate(" + (width/2) + " ," + (height+margin.bottom) + ")")
		.style("text-anchor", "middle")
		.text("Hour");
		
	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);
		
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 0 - margin.left)
		.attr("x", 0-(height/2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Count");
	
	svg.append("text")
		.attr("transform", "translate(" + (width/2) + " ,0)")
		.style("text-anchor", "middle")
		.style("font-size", "20px")
		.style("fill", "darkOrange")
		.text("Combined Hourly Chart");
}
function createVisualContentHolderSecond(){
	var WIDTH = 1000, HEIGHT = 500;
	var visualDiv = $('<div/>', {'id':'visual-content'}).width(1400).height(600);
	//add the visualDiv to the dynamicContent
	$(content).append(visualDiv);
	
	
	var svg = d3.select('#visual-content'),
		MARGINS = { top: 20, right: 20, bottom: 20, left: 50},
		xScale = d3.scale.linear().range([MARGINS.left, WIDTH-MARGINS.right]).domain([0, 23]),
		yScale = d3.scale.linear().range([HEIGHT-MARGINS.top, MARGINS.bottom]).domain([10,1000]),
		xAxis = d3.svg.axis().scale(xScale),
		yAxis = d3.svg.axis().scale(yScale).orient("left");
	
	svg.append("svg")
		.attr("class", "visual-content-svg")
		.attr("width", WIDTH + MARGINS.left + MARGINS.right)
		.attr("height", HEIGHT + MARGINS.top + MARGINS.bottom);
	svg = d3.select('svg#visual-content-svg');
	//svg.append("svg")
	//	.attr("width", WIDTH + MARGINS.left + MARGINS.right)
	//	.attr("height", HEIGHT + MARGINS.top + MARGINS.bottom)
	//.append("g")
	//	.attr("transform", "translate(" + MARGINS.left + "," + MARGINS.top + ")");
	
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + (HEIGHT-MARGINS.bottom) + ")")
		.call(xAxis);
			
	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + MARGINS.left + ",0)")
		.call(yAxis);
		
	svg.append("text")
		.attr("transform", "translate(" + (WIDTH/2) + " ," + (HEIGHT+MARGINS.bottom) + ")")
		.style("text-anchor", "middle")
		.text("Hour");
			
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 0-MARGINS.left)
		.attr("x", 0-(HEIGHT/2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Count");
	
	svg.append("text")
		.attr("transform", "translate(" + (WIDTH/2) + " ,0)")
		.style("text-anchor", "middle")
		.style("font-size", "20px")
		.style("fill", "CornflowerBlue")
		.text("Combined Hourly Chart");
}
function createVisualContentHolderWorking(){
	var visualDiv = $('<div/>', {'id':'visual-content'});
	//add the visualDiv to the dynamicContent
	$(content).append(visualDiv);
	
	
	var MAX_WIDTH = 1400, MAX_HEIGHT = 600;
	var margin = {top:30, right:20, bottom:30, left:50},
		width = MAX_WIDTH - margin.left - margin.right,
		height = MAX_HEIGHT - margin.top - margin.bottom;
	
	var x = d3.scale.linear().range([0, width]).domain([0,23]);
	var y = d3.scale.linear().range([0, height]).domain([0,1000]);
	
	var xAxis = d3.svg.axis().scale(x)
			.orient("bottom").ticks(24);
	var yAxis = d3.svg.axis().scale(y)
				.orient("left").ticks(5);
				
	var svg = d3.select("#visual-content")
		.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
		
	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);
	
	svg.append("text")
		.attr("transform", "translate(" + (width/2) + " ," + (height+margin.bottom) + ")")
		.style("text-anchor", "middle")
		.text("Hour");
		
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 0 - margin.left)
		.attr("x", 0-(height/2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Count");
	
	svg.append("text")
		.attr("transform", "translate(" + (width/2) + " ,0)")
		.style("text-anchor", "middle")
		.style("font-size", "20px")
		.style("fill", "darkOrange")
		.text("Combined Hourly Chart");
	
}