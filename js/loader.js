var apiData; //holds processed data, organized on api
var clientsData; //holds processed data, organized on clients

var data; //used to store loaded JSON data
var selectDropDownID = '#selectDropdown';
var apiHeader = '#apiHeader';
var content = "#dynamicContent";
var urlPre = 'data/';

//pre-formed pretty hour strings
var hourString = ['12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM', '06:00 AM',
			'07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', 
			'02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', 
			'09:00 PM', '10:00 PM', '11:00 PM'];

function loadJSONZipped(sYear, selectedApp){
	var bool = false;
	JSZipUtils.getBinaryContent(urlPre + selectedApp + '/' + selectedApp + "_" + sYear + '_compressed.js', function(err, zipData) {
	    if(err) {
	      return bool;
	    }

	    try {
	    	var result = pako.inflate(zipData);	
	    	var strData = String.fromCharCode.apply(null, new Uint16Array(result));
	        data = JSON.parse(strData);
			bool = true;
	        processJSON(data);
	    } catch(e) {
	      //alert(e);
	    }
	 });
	 return bool;
};

function loadJSON(sYear, selectedApp){
	var url = 'jsonSummaries/' + selectedApp + '.js';		
	var j = $.getJSON(url, function(jData){
		//set App name to the element ::TODO
		apiData = jData.apis;	
		populateDropDown();
	});
};

function populateDropDown(){
	var selectDropDown = $('#selectDropdown');		
	var option = $('<option/>',{
		'text' : "",
		'value' : ""					
	});
	
	apiDropDown.empty();
	//apiDropDown.append(option);
	for(var i=0; i<apiData.length; i++){
		var n = apiData[i].name;		
		option = $('<option/>',{
					'text' : n,
					'value' : i					
				});
		selectDropDown.append(option);
	}
		
	$("#selectDropdown").html($("#selectDropdown option").sort(function (a, b) {
		return a.text == b.text ? 0 : a.text < b.text ? -1 : 1
	}))
	
	$("#selectDropdown").val(0);
	selectChanged();
}

function selectChanged(){
	var refAPI = $(selectDropDownID).val();
	var selectName = "";
	if(refAPI >= 0)
		selectName = apiData[refAPI].name;
	else
		refAPI = 0;
	
	$(apiHeader).empty();
	$(apiHeader).append(selectName);
	
	loadContent(refAPI);
}
function loadContent(index){
	$(content).empty();
	var name, date, count, hour, aHour, min=0, max=0, temp 
		chartData = [];
	var clients = apiData[index].clients;
	
	//setup content holders then populate with data
	//make sure to call the visual content creator first
	createVisualContentHolder();
	createSeperator();
	createTableContentHolders();	
	
	for(var i=0; i<clients.length; i++){
		//add client data one by one
		name = clients[i].name;
		date = clients[i].max.date;
		count = clients[i].max.count;
		hour = clients[i].max.occuredHour;
		aHour = clients[i].max.hourlyCount;
		
		insertIntoContent(name, date, count, hour, aHour);
		//insertIntoVisual(name, count, aHour, getNextColor);
		
		//set the min, max vars
		//temp = Math.max.apply(Math, aHour);
		//if(temp > max)
		//	max = temp;
		
		//temp = Math.min.apply(Math, aHour);
		//if(temp < min && temp >= 0)
		//	min = temp;
		chartData[i] = {
				"name":name,
				"values":[]
			};
		for(var j=0; j<aHour.length; j++){
			chartData[i].values[j] = {
				"name":name,
				"label":hourString[j],
				"value":aHour[j]
			};
		}
	}
	insertIntoVisualContent(chartData); //plot the data
	$(".tablesorter").tablesorter({ sortList: [[0,0]] });
};
function createVisualContentHolder(){
	var visualDiv = $('<div/>', {
		'id':'visual-content',
		'align':'left'
	});
	//add the visualDiv to the dynamicContent
	$(content).append(visualDiv);
}
function insertIntoVisualContent(chartData){
	var frameWidth = 900;//$(window).width()*.75;
	var frameHeight = 500;
	
	//frameWidth = (frameWidth < 800) ? 800 : frameWidth;
	
	var colors = ["#1f77b4","#aec7e8","#ff7f0e","#ffbb78","#2ca02c","#98df8a","#d62728",
			"#ff9896","#9467bd","#c5b0d5","#8c564b","#c49c94","#e377c2","#f7b6d2",
			"#7f7f7f","#c7c7c7","#bcbd22","#dbdb8d","#17becf","#9edae5"];
			
	var colorScheme = [];
	var temp = chartData[0].values.map(function(d){ return d.label;});
	var tickLabels = [];
	for(var i=0; i<temp.length; i++){
		if(i%3 === 0)
			tickLabels.push(temp[i]);
		else
			tickLabels.push(" ");
	}
	for(var i=0; i<chartData.length; i++){
		colorScheme.push(colors[i%colors.length]);
	}
	
	//margin variables, and size variables
	var m = {top: 20, right: 55, bottom: 30, left: 40},
		width = frameWidth - m.left - m.right,
		height = frameHeight - m.top - m.bottom;
	
	
		//d3.keys(chartData).filter(function (key){ return k.name});
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
	var svg = d3.select("#visual-content").append("svg")
			.attr("width", width+m.top+m.right)
			.attr("height", height+m.top+m.bottom)
		.append("g")
			.attr("transform", "translate(" + m.left + "," + m.top + ")");
	
	
	var varNames = chartData.map(function(d){return d.name});
	color.domain(varNames);
	
	
	var temp = chartData[0].values.map(function(d){ return d.label;});
	x.domain(temp);
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


function insertIntoContent(n, d, c, h, aH){
	var test = $('#table-data');
	var body = $('#table-data > tbody');
	
	var row = $('<tr/>');
	body.append(row);
	
	//name, date-time, count columns
	var col = $('<td/>', {'text':n});
	row.append(col);
	
	var t = d.substring(4,6) + "-" + d.substring(6,8) + "-" + d.substring(0,4);
	t += ' ' + hourString[h];
	col = $('<td/>', {'text':t});
	row.append(col);
	
	col = $('<td/>', {'text':c});
	row.append(col);
	
	for(var i=0; i<aH.length; i++){
		col = $('<td/>', {'text':aH[i]});
		row.append(col);
	}
	
}
function createSeperator(){
	var sep = $('<div/>', {
		'style':'background-color:lightBlue',
		'width':'1400px'
	});
	sep.append(document.createElement("hr"));
	sep.append(document.createElement("hr"));
	$(content).append(sep);
}

function createTableContentHolders(){	
	var	tableDiv = $('<div/>', {'id':'table-content'});
	
	var table = $('<table/>', {'class':'table table-condensed tablesorter',
								'id':'table-data'}),
		tHead = $('<thead/>'),
		hRow = $('<tr/>'),
		tBody = $('<tbody/>');
	
	tHead.append(hRow);
	
	//table constructor	
	table.append(tHead);	
	table.append(tBody);
	
	//client name col
	var col = $('<th/>', {'text':'Client Name'});
	hRow.append(col);
	
	//date and time col
	col = $('<th/>', {'text':'Date'});
	hRow.append(col);
	
	//count col
	col = $('<th/>', {'text':'Count'});
	hRow.append(col);
	
	//hours cols
	for(var i=0; i<hourString.length; i++){
		col = $('<th/>', {'text':hourString[i]});
		hRow.append(col);
	}
	
	tableDiv.append(table);  //add the table to the table div
	
	//finally add tableDiv to the content holder div
	$(content).append(tableDiv);
	
}

function loadData(year){
	var selectedApp = 'RMS';
	var sDate = new Date("January 1, " + year);
	var formatDate;
	var str = "";
	var month;
	var day;
	
	if(year < 2014)
		return;
	
	for(i=0; i<365;i++){
		month = sDate.getMonth() + 1;
		day = sDate.getDate();
		if(month < 10)
			month = '0' + month;
		
		if(day < 10)
			day = '0' + day;
		
		formatDate = sDate.getFullYear() + "-" + month + "-" + day;
		if(loadJSONZipped(formatDate, selectedApp))
			str += formatDate + ":true<br>";
		else
			str += formatDate + ":false<br>";
		
		sDate.setDate(sDate.getDate()+1);
	}
	$('div.container').append(str);
};
function processJSON(data){
	//add the data into constructs
	if(data.actions != null)
		alert("Worked!");
};

/*********trash******
function insertIntoVisual(n, c, aH, color){
	var index = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
	var MAX_WIDTH = 1400, MAX_HEIGHT = 600;
	var margin = {top:30, right:20, bottom:30, left:50},
		width = MAX_WIDTH - margin.left - margin.right,
		height = MAX_HEIGHT - margin.top - margin.bottom;
		
	var y = d3.scale.linear().range([margin.bottom,height]).domain([0, c+200]);
	var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);
	
	var svg = d3.select("#visual-content");
	
	svg.selectAll("g.y.axis").call(yAxis);
	
	var line = d3.svg.line()
		.x(function(d){return d})
		.y(function(d){return aH[d]})
		.interpolate("basis");
		
	svg.append('svg:path')
		.attr('d', line(index))
		.attr('stroke', color)
		.attr('stroke-width', 2)
		.attr('fill', 'none');
		
	
}
function createContentHolder(c, n, d, c, h, aH){
	
	var temp, p, t;
	var outer = document.createElement("div");
	var table = document.createElement("table");
	table.style.width = "1400px";
	
	var tbody = document.createElement("tbody");
	var headRow = document.createElement("tr");
	var secondRow = document.createElement("tr");
	var plotRow = document.createElement("tr");
	
	
	
	//table setup add all hold rows
	tbody.appendChild(headRow);
	tbody.appendChild(secondRow);
	tbody.appendChild(plotRow);
	
	//setup head row with title
	headRow.style.color = "#333";
	headRow.style.fontWeight = "bold";
	//headRow.style.fontSize = "18px";
	
	//setup second row
	secondRow.style.fontSize = "14px";
	
	
	//add the heading element content
	temp = document.createElement("td");
	p = document.createElement("p");
	t = document.createTextNode(n);
	p.appendChild(t);
	temp.appendChild(p);
	headRow.appendChild(temp);
	
	//add second content elements
	temp = document.createElement("td");
	temp.style.width = "300px";
	
	p = document.createElement("ul");
	p.setAttribute("display", "inline");
	temp.appendChild(p);
	temp = p;
	
	p = document.createElement("li");
	p.style.fontWeight = "bold";
	t = document.createTextNode("Date: ");
	p.appendChild(t);
	temp.appendChild(p);
	p = document.createElement("li");
	p.style.fontSize = "18px";
	p.style.color = "#433";
	
	t = d.substring(4,6) + "-" + d.substring(6,8) + "-" + d.substring(0,4);
	t = document.createTextNode(t);
	p.appendChild(t);
	temp.appendChild(p);
	
	secondRow.appendChild(temp);
	
	//second cell
	temp = document.createElement("td");
	temp.style.width = "300px";
	
	p = document.createElement("ul");
	p.setAttribute("display", "inline");
	temp.appendChild(p);
	temp = p;
	
	p = document.createElement("li");
	p.style.fontWeight = "bold";
	t = document.createTextNode("Count: ");
	p.appendChild(t);
	temp.appendChild(p);
	p = document.createElement("li");
	p.style.fontSize = "18px";
	p.style.color = "#433";
	t = document.createTextNode(c);
	p.appendChild(t);
	temp.appendChild(p);
	
	secondRow.appendChild(temp);
	
	//third cell
	temp = document.createElement("td");
	temp.style.width = "300px";
	
	p = document.createElement("ul");
	p.setAttribute("display", "inline");
	temp.appendChild(p);
	temp = p;
	
	p = document.createElement("li");
	p.style.fontWeight = "bold";
	t = document.createTextNode("Hour: ");
	p.appendChild(t);
	temp.appendChild(p);
	p = document.createElement("li");
	p.style.fontSize = "18px";
	p.style.color = "#433";
	t = document.createTextNode(h);
	p.appendChild(t);
	temp.appendChild(p);
	
	secondRow.appendChild(temp);
	
	//plot row setup
	temp = document.createElement("td");
	temp.style.width = "830px";
	temp.style.height = "430px"
	temp.setAttribute("align", "center");
	
	p = document.createElement("div");
	p.setAttribute("id", n+"-chart");
	
	temp.appendChild(p);
	
	plotRow.appendChild(temp);
	
	//set the hour data format for dygraph
	var data = [];
	for(var i =0; i<aH.length; i++){
		data.push([i, aH[i]]);
	}
	
	
		
	table.appendChild(tbody);
	outer.appendChild(table);
	//$(c).append(outer);
	var con = document.getElementById("dynamicContent");
	con.appendChild(outer);
	temp = document.getElementById(n+"-chart");
	temp = new Dygraph(p, data,
			{
				title: n + ' Max Hour Day Breakdown',
				labels: ['Hour', 'Count'],
				drawPoints: true
			});
			
	
}

*/