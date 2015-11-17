//Stores the data retrieved from server
var dataMulti;

var numOfFilesToDownload = 0;
var numOfFilesDownloaded = 0;
var errorHappened = false;

//Variables for maintaining currently selected values on page
var selectedStartDate = null;
var selectedEndDate = null;
var selectedAppMulti = null;
var selectedDependencyMulti = null;
var selectedDataMulti = null;
var selectedTypeMulti = null;
var selectedNameMulti = null;
var selectedSubNameMulti = null;

var currentlyDisplayedIDMulti = null;

var dynamicContentDivIDMulti = '#dynamicContentMulti';
var appDropDownIDMulti = '#appDropDownMulti';
var apiDropDownIDMulti = '#apiDropdownMulti';
var datePickerIDMulti = '#datepickerMulti';

/****************NETWORK CALLS******************/
function loadJSONZippedMulti(){
	errorHappened = false;
	dataMulti = {};
	var dateRange = getDates(selectedStartDate, selectedEndDate);
	
	numOfFilesToDownload = dateRange.length;
	numOfFilesDownloaded = 0;
	
	for(var i = 0; i < dateRange.length; i++){
		var date = $.datepicker.formatDate("yy-mm-dd", dateRange[i]);
		
		JSZipUtils.getBinaryContent('data/' + selectedAppMulti + '/' + selectedAppMulti + "_" + date + '_compressed.js', function(err, zipData, date) {
		    if(err) {
		      errorHappened = true;
		      //dataMulti[date] = null;		     
		    }

		    if(err == null || err == undefined){
			    try {
			    	var result = pako.inflate(zipData);	
			    	var strData = String.fromCharCode.apply(null, new Uint16Array(result));
			    	dataMulti[date] = JSON.parse(strData);
			    } catch(e) {
			    	errorHappened = true;
				    //dataMulti[date] = null;			    
			    }
		    }
		    
		    numOfFilesDownloaded++;
		    
		    if(numOfFilesDownloaded == numOfFilesToDownload){
		    	jsonFilesFinished();
			}
		 }, date);
	}	
};

function jsonFilesFinished(){
	if(errorHappened){
		alert("One or more files were not found for this application.");
	}
	
	var apiDropDown = $('#apiDropdownMulti');
	
	apiDropDown.empty();
	var option = $('<option/>',{
		'text' : "",
		'value' : ""					
	});
	
	apiDropDown.append(option);	
	
	//Append Main App action to dropdown
	option = $('<option/>',{
		'text' : 'Application Hits',
		'value' : 'A|' + selectedAppMulti					
	});
	apiDropDown.append(option);
	
	var allDependencies = {};
	for(var date in dataMulti){
		var dependencies = $.map(dataMulti[date].dependencies, function( value, index ) {
			allDependencies[value.dependencyName] = 0;
		});		
	};
	
	for(var dependency in allDependencies){
		option = $('<option/>',{
			'text' : dependency,
			'value' : 'D|' + dependency					
		});
		apiDropDown.append(option);		
	}
	
	$("#apiDropdownMulti").html($("#apiDropdownMulti option").sort(function (a, b) {
	    return a.text == b.text ? 0 : a.text < b.text ? -1 : 1
	}))
	
	$("#apiDropdownMulti").val(0);
}

function loadAppListJSONMulti(){
	$.ajax({
        url: 'template/apps.js',
        async: false,
        dataType: 'json',
        success: loadAppsMulti,
        error: onJSONNotFound
    });				
}

function onJSONNotFound(jqXHR, textStatus, errorThrown){
	alert("File not found.  " + errorThrown);
};
/****************END NETWORK CALLS******************/

/****************UI HELPERS*************************/
function resetAPIMulti(){
	currentlySelectedAPIMulti = null;
	 $(apiDropDownIDMulti).empty();
};

function emptyDisplayMulti(){
	$(dynamicContentDivIDMulti).empty();
	currentlyDisplayedIDMulti = null;
};

function setSelectedVariablesMulti(){
	selectedAppMulti = $(appDropDownIDMulti).val();	
	
	selectedStartDate = $('#datepickerStart').datepicker('getDate');
	selectedEndDate = $('#datepickerEnd').datepicker('getDate');
	
	selectedDataMulti = $(apiDropDownIDMulti).val();
	if(selectedDataMulti != null){
		var splitData = selectedDataMulti.split("|");
		
		selectedTypeMulti = splitData[0];
		selectedNameMulti = splitData[1];		
	}
	
	selectedSubNameMulti = null;
};

function loadAppsMulti(data){
	var apps = data;
	
	var appDropDownMulti = $('#appDropDownMulti');
	
	var option = $('<option/>',{
		'text' : "",
		'value' : ""					
	});
	
	appDropDownMulti.append(option);
	
	for(var i = 0; i < apps.length; i++){
		var option = $('<option/>',{
			'text' : apps[i],
			'value' : apps[i]					
		});
		
		appDropDownMulti.append(option);
	};
};


/****************END UI HELPERS*************************/

/***********EVENTS*****************/
function dateChangedMulti(){
	resetAPIMulti();
	emptyDisplayMulti();	
	
	$('#appDropDownMulti').val('0');	
	
	setSelectedVariablesMulti();
};

function appChangedMulti(){	
	resetAPIMulti();
	emptyDisplayMulti();
	
	setSelectedVariablesMulti();
	
	loadJSONZippedMulti();	
};

function apiChangedMulti(){	
	setSelectedVariablesMulti();
	
	createContentMulti('table');
};

function tableButtonClickedMulti(type){
	setSelectedVariablesMulti();
	
	createContentMulti('table', type);
};

function graphButtonClickedMulti(type){
	setSelectedVariablesMulti();
	
	createContentMulti('graph', type);
};

function multiModalGraphButtonClicked(type){
	createContentMulti('graph', type, $('#rowMultiModal'));
};

function multiRowClicked(subName){
	selectedSubNameMulti = subName;
	
	createContentMulti('graph', 'dailyCount', $('#rowMultiModal'));
	$('#myMultiModalLabel').text(subName + " Statistics");
	$('#rowMultiModal').modal('show');
};
/***********END EVENTS*****************/

/**************DATA PROCESSING**********/
function createContentMulti(type, subType, div){	
	var contentDiv;
	if(div == null){
		contentDiv = $(dynamicContentDivIDMulti);
		contentDiv.empty();
		
		if(selectedDataMulti == null || selectedDataMulti == ''){
			return;
		}
	}else{
		contentDiv = $('#multiModalDynamicContent');
		contentDiv.empty();
	}
	
	if(type == 'table'){		
		var table = generateTableMulti(subType);
		contentDiv.append(table);
		$(".tablesorter").tablesorter({ sortList: [[0,0]] });
	}else if(type == 'graph'){
		if(subType == 'dailyCount'){
			var svgDiv = createDailyCountGraph(contentDiv);		
		}else if(subType == 'avgByDay'){
			var svgDiv = createAvgByDayGraph(contentDiv);		
		}/*else if(subType == 'countByClient'){
			var svgDiv = createCountByClientGraph(contentDiv);		
		}else if(subType == 'countByServer'){
			var svgDiv = createCountByServerGraph(contentDiv);		
		}else if(subType == 'countByError'){
			var svgDiv = createCountByErrorGraph(contentDiv);		
		}*/
	}	
};

function generateTableMulti(tableType){
	if(tableType == null || tableType == undefined){
		tableType = "APIHits";		
	}
	
	if(tableType == "APIHits"){
		return generateAPIHitsTableMulti();
	}/*else if(tableType == "ClientHits"){
		return generateClientHitsTable();
	}else if(tableType == "ServerHits"){
		return generateServerHitsTable();
	}else if(tableType == "ErrorCounts"){
		return generateErrorCountsTable();
	}else if(tableType == "HourlyHits"){
		return generateHourlyHitsTable();
	}*/
};

function generateAPIHitsTableMulti(){
	var table	 	= $('<table/>', {
			'class' : 'table table-condensed tablesorter table-hover',						
			}),
		tableHead	= $('<thead/>'),
		headerRow 	= $('<tr/>'),
		body		= $('<tbody/>');
				
	table.append(tableHead);
	tableHead.append(headerRow);
	table.append(body);
	
	var headerColumn = $('<th/>', {
        'text': 'API Name'		                
	});
	headerRow.append(headerColumn);
	
	var dateRange = getDates(selectedStartDate, selectedEndDate);
	
	for(var i = 0; i < dateRange.length; i++){
		var date = $.datepicker.formatDate("yy-mm-dd", dateRange[i]);
		var headerColumn = $('<th/>', {
	           'text': date		                
	    });
		headerRow.append(headerColumn);		
	};
	
	var allAPIs = {};
	
	if(selectedTypeMulti == 'A'){		
		for(var i = 0; i < dateRange.length; i++){
			var date = $.datepicker.formatDate("yy-mm-dd", dateRange[i]);
			try{
				$.map(dataMulti[date].actions, function( value, index ) {
					
					if(selectedSubNameMulti == null){
						allAPIs[value.name] = 0;
					}else{
						if(value.name == selectedSubNameMulti){
							allAPIs[value.name] = 0;
						}
					}					
				});		
			}catch(err){
				//Do nothing
			}
		};		
	}else{
		for(var i = 0; i < dateRange.length; i++){
			var date = $.datepicker.formatDate("yy-mm-dd", dateRange[i]);
			try{
				$.map(dataMulti[date].dependencies[selectedNameMulti].dependencyActions, function( value, index ) {
					if(selectedSubNameMulti == null){
						allAPIs[value.name] = 0;
					}else{
						if(value.name == selectedSubNameMulti){
							allAPIs[value.name] = 0;
						}
					}
				});		
			}catch(err){
				//Do nothing
			}
		};
	}
	
	for(var api in allAPIs){
		var bodyRow = $('<tr/>',{
			'onclick' : 'multiRowClicked(\'' + api + '\')'	
		});
		
		body.append(bodyRow);
		var bodyColumn = $('<td/>', {
            'text': api		                
        });
		bodyRow.append(bodyColumn);
		for(var i = 0; i < dateRange.length; i++){
			var date = $.datepicker.formatDate("yy-mm-dd", dateRange[i]);
			var count = 0;
			if(selectedTypeMulti == 'A'){
				try{
					$.map(dataMulti[date].actions, function( value, index ) {
						if(value.name == api){
							count = value.totalRequests;
						}
					});
				}catch(err){
					//Do nothing
				}
			}else{
				try{
					$.map(dataMulti[date].dependencies[selectedNameMulti].dependencyActions, function( value, index ) {
						if(value.name == api){
							count = value.totalRequests;
						}
					});
				}catch(err){
					//Do nothing
				}
			}
			var bodyColumn;
			if(dateRange[i].toDateString().indexOf("Sun") > -1 || dateRange[i].toDateString().indexOf("Sat") > -1){
				bodyColumn = $('<td/>', {
	                'text': count,
	                'class' : 'weekend'
	            });
			}else{
				bodyColumn = $('<td/>', {
	                'text': count	                
	            });
			}
			bodyRow.append(bodyColumn);
		}
	};
	
	return table;
};

function createDailyCountGraph(parentDiv){
	var sizes = new GraphSizes();	
	
	var dateRange = getDates(selectedStartDate, selectedEndDate);
	var days = [], dayCount = [];
	
	for(var i = 0; i < dateRange.length; i++){
		var date = $.datepicker.formatDate("yy-mm-dd", dateRange[i]);
		
		days.push(date);
		
		if(selectedSubNameMulti == null){
			var dayData
			var requestCount = 0;
			
			try{
				if(selectedTypeMulti == 'A'){
					dayData = dataMulti[date].actions;				
				}else{
					dayData = dataMulti[date].dependencies[selectedNameMulti].dependencyActions;
				}
				
				$.map(dayData, function( value, index ) {
					requestCount += value.totalRequests;
				});
			}catch(err){
				//Do nothing
			}
			
			dayCount.push(requestCount);
		}else{
			var requestCount = 0;
			
			if(selectedTypeMulti == 'A'){
				try{
					requestCount = dataMulti[date].actions[selectedSubNameMulti].totalRequests;
				}catch(err){
					requestCount = 0;
				}
			}else{
				try{
					requestCount = dataMulti[date].dependencies[selectedNameMulti].dependencyActions[selectedSubNameMulti].totalRequests;
				}catch(err){
					requestCount = 0;
				}
			}
			
			dayCount.push(requestCount);
		}		
	}
	
	var x = d3.scale.ordinal().rangeRoundBands([0, sizes.width], .45);	
	var y = d3.scale.linear().range([sizes.height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .ticks(15);				
	
	var svgDiv = $("<div/>", {
		'id' : 'generatedGraphMulti'
	});
	
	parentDiv.append(svgDiv);
	
	var svg = d3.select("#generatedGraphMulti").append("svg")
    	.attr("width", sizes.width + sizes.margin.left + sizes.margin.right)
    	.attr("height", sizes.height + sizes.margin.top + sizes.margin.bottom)
      .append("g")
    	.attr("transform", "translate(" + sizes.margin.left + "," + sizes.margin.top + ")");
		
	x.domain(days);
	y.domain([0, d3.max(dayCount, function(d) { return d; })]);
	
	svg.append("g")
      .attr("class", "x axis vertical")
      .attr("transform", "translate(0," + sizes.height + ")")
      .call(xAxis);

	svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
     .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      
    svg.selectAll(".bar")
      .data(dayCount)
     .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, index) { return x(days[index]); })
      .attr("width", x.rangeBand())
      .attr("y", function(d, index) { return y(d); })
      .attr("height", function(d) { return sizes.height - y(d); })
      
    // get the x and y values for least squares
	var xSeries = d3.range(1, days.length + 1);
	var ySeries = dayCount;
      
    var leastSquaresCoeff = leastSquares(xSeries, ySeries);
		
	// apply the reults of the least squares regression
	var x1 = days[0];
	var y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
	var x2 = days[days.length - 1];
	var y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
	var trendData = [[x1,y1,x2,y2]];
	
	var trendline = svg.selectAll(".trendline")
		.data(trendData);
		
	trendline.enter()
		.append("line")
		.attr("class", "trendline")
		.attr("x1", function(d) { return x(d[0]) + (x.rangeBand()/2); })
		.attr("y1", function(d) { return y(d[1]); })
		.attr("x2", function(d) { return x(d[2]) + (x.rangeBand()/2); })
		.attr("y2", function(d) { return y(d[3]); })
		.attr("stroke", "black")
		.attr("stroke-width", 1)
		.attr("stroke-dasharray","5,5");
      
    $(".vertical").find("g").find("text").attr("class","vertical-text-45").attr("transform","translate(0,20)").attr("style", "text-anchor: none");
      
    return svgDiv;
};

function createAvgByDayGraph(parentDiv){
	var sizes = new GraphSizes();	
	
	var dateRange = getDates(selectedStartDate, selectedEndDate);
	var days = [], dayCount = [];
	
	for(var i = 0; i < dateRange.length; i++){
		var date = $.datepicker.formatDate("yy-mm-dd", dateRange[i]);
		
		days.push(date);
		
		if(selectedSubNameMulti == null){
			var dayData
			var requestCount = 0;
			
			try{
				if(selectedTypeMulti == 'A'){
					dayData = dataMulti[date].actions;				
				}else{
					dayData = dataMulti[date].dependencies[selectedNameMulti].dependencyActions;
				}
				
				$.map(dayData, function( value, index ) {
					requestCount += value.totalRequests;
				});
			}catch(err){
				//do nothing
			}
			
			dayCount.push(requestCount);
		}else{			
			if(selectedTypeMulti == 'A'){
				try{
					requestCount = dataMulti[date].actions[selectedSubNameMulti].avgTime;
				}catch(err){
					requestCount = 0;
				}
			}else{
				try{
					requestCount = dataMulti[date].dependencies[selectedNameMulti].dependencyActions[selectedSubNameMulti].avgTime;
				}catch(err){
					requestCount = 0;
				}
			}
			
			dayCount.push(requestCount);
		}		
	}
	
	var x = d3.scale.ordinal().rangeRoundBands([0, sizes.width], .45);	
	var y = d3.scale.linear().range([sizes.height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .ticks(15);				
	
	var svgDiv = $("<div/>", {
		'id' : 'generatedGraphMulti'
	});
	
	parentDiv.append(svgDiv);
	
	var svg = d3.select("#generatedGraphMulti").append("svg")
    	.attr("width", sizes.width + sizes.margin.left + sizes.margin.right)
    	.attr("height", sizes.height + sizes.margin.top + sizes.margin.bottom)
      .append("g")
    	.attr("transform", "translate(" + sizes.margin.left + "," + sizes.margin.top + ")");
		
	x.domain(days);
	y.domain([0, d3.max(dayCount, function(d) { return d; })]);
	
	svg.append("g")
      .attr("class", "x axis vertical")
      .attr("transform", "translate(0," + sizes.height + ")")
      .call(xAxis);

	svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
     .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      
    svg.selectAll(".bar")
      .data(dayCount)
     .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, index) { return x(days[index]); })
      .attr("width", x.rangeBand())
      .attr("y", function(d, index) { return y(d); })
      .attr("height", function(d) { return sizes.height - y(d); })
      
    // get the x and y values for least squares
	var xSeries = d3.range(1, days.length + 1);
	var ySeries = dayCount;
      
    var leastSquaresCoeff = leastSquares(xSeries, ySeries);
		
	// apply the reults of the least squares regression
	var x1 = days[0];
	var y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
	var x2 = days[days.length - 1];
	var y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
	var trendData = [[x1,y1,x2,y2]];
	
	var trendline = svg.selectAll(".trendline")
		.data(trendData);
		
	trendline.enter()
		.append("line")
		.attr("class", "trendline")
		.attr("x1", function(d) { return x(d[0]) + (x.rangeBand()/2); })
		.attr("y1", function(d) { return y(d[1]); })
		.attr("x2", function(d) { return x(d[2]) + (x.rangeBand()/2); })
		.attr("y2", function(d) { return y(d[3]); })
		.attr("stroke", "black")
		.attr("stroke-width", 1)
		.attr("stroke-dasharray","5,5");
      
    $(".vertical").find("g").find("text").attr("class","vertical-text-45").attr("transform","translate(0,20)").attr("style", "text-anchor: none");
      
    return svgDiv;
};

//returns slope, intercept and r-square of the line
function leastSquares(xSeries, ySeries) {
	var reduceSumFunc = function(prev, cur) { return prev + cur; };
	
	var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
	var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

	var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
		.reduce(reduceSumFunc);
	
	var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
		.reduce(reduceSumFunc);
		
	var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
		.reduce(reduceSumFunc);
		
	var slope = ssXY / ssXX;
	var intercept = yBar - (xBar * slope);
	var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);
	
	return [slope, intercept, rSquare];
}

/************END DATA PROCESSING********/

/****************UTILITIES************************/
Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
}

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push( new Date (currentDate) )
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

function alertSelectedMulti(){
	alert("selectedAppMulti: " + selectedAppMulti + "\r\n" +
			"selectedDependencyMulti: " + selectedDependencyMulti + "\r\n" + 
			"selectedDataMulti: " + selectedDataMulti + "\r\n" + 
			"selectedTypeMulti: " + selectedTypeMulti + "\r\n" + 
			"selectedNameMulti: " + selectedNameMulti + "\r\n" + 
			"selectedSubNameMulti: " + selectedSubNameMulti
    )
}
/*************END UTILITIES***********************/

