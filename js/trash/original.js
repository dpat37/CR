<script src="//cdnjs.cloudflare.com/ajax/libs/dygraph/1.1.1/dygraph-combined.js"></script>

//Stores the data retrieved from server
var data;

//Variables for maintaining currently selected values on page
var selectedDate = null;
var selectedApp = null;
var selectedDependency = null;
var selectedData = null;
var selectedType = null;
var selectedName = null;
var selectedSubName = null;

var currentlyDisplayedID = null;

var dynamicContentDivID = '#dynamicContent';
var appDropDownID = '#appDropDown';
var apiDropDownID = '#apiDropdown';
var datePickerID = '#datepicker';

/****************NETWORK CALLS******************/
function loadJSON(){
	if(selectedApp != ""){
		$.ajax({
            url: 'data/' + selectedApp + '/' + selectedApp + "_" + selectedDate + '.js.gz',
            async: false,
            dataType: 'json',
            success: processJSON,
            error: onJSONNotFound
        });
	}
}

function loadJSONZipped(){
	JSZipUtils.getBinaryContent('data/' + selectedApp + '/' + selectedApp + "_" + selectedDate + '_compressed.js', function(err, zipData) {
	    if(err) {
	      alert(err);
	      return;
	    }

	    try {
	    	var result = pako.inflate(zipData);	
	    	var strData     = String.fromCharCode.apply(null, new Uint16Array(result));
	        data = JSON.parse(strData);
	        processJSON(data);
	    } catch(e) {
	      alert(e);
	    }
	 });
};

function loadAppListJSON(){
	$.ajax({
        url: 'template/apps.js',
        async: false,
        dataType: 'json',
        success: loadApps,
        error: onJSONNotFound
    });				
}

function onJSONNotFound(jqXHR, textStatus, errorThrown){
	alert("File not found.  " + errorThrown);
};
/****************END NETWORK CALLS******************/


/****************UI HELPERS*************************/
function resetAPI(){
	currentlySelectedAPI = null;
	 $(apiDropDownID).empty();
};

function emptyDisplay(){
	$(dynamicContentDivID).empty();
	currentlyDisplayedID = null;
};

function setSelectedVariables(){
	selectedApp = $(appDropDownID).val();
	selectedDate =  $(datePickerID).val();
	selectedData = $(apiDropDownID).val();
	
	if(selectedData != null){
		var splitData = selectedData.split("|");
		
		selectedType = splitData[0];
		selectedName = splitData[1];		
	}
	
	selectedSubName = null;
};

function loadApps(data){
	var apps = data;
	
	var appDropDown = $('#appDropDown');
	
	var option = $('<option/>',{
		'text' : "",
		'value' : ""					
	});
	
	appDropDown.append(option);
	
	for(var i = 0; i < apps.length; i++){
		var option = $('<option/>',{
			'text' : apps[i],
			'value' : apps[i]					
		});
		
		appDropDown.append(option);
	};
};
/****************END UI HELPERS*************************/


/***********EVENTS*****************/
function dateChanged(){
	resetAPI();
	emptyDisplay();	
	
	$('#appDropDown').val('0');	
	
	setSelectedVariables();
};

function appChanged(){	
	resetAPI();
	emptyDisplay();	
	
	setSelectedVariables();
	
	loadJSONZipped();	
};

function apiChanged(){	
	setSelectedVariables();
	
	createContent('table');
};

function tableButtonClicked(type){
	setSelectedVariables();
	
	createContent('table', type);
};

function graphButtonClicked(type){
	setSelectedVariables();
	
	createContent('graph', type);
};

function rowClicked(subName){
	selectedSubName = subName;
	
	createContent('table', null, $('#rowModal'));
	$('#myModalLabel').text(subName + " Statistics");
	$('#rowModal').modal('show');
};

function modalGraphButtonClicked(type){
	createContent('graph', type, $('#rowModal'));
};

function modalTableButtonClicked(type){
	createContent('table', type, $('#rowModal'));
};
/**********END EVENTS**************/

/**********DATA PROCESSING*********/
function processJSON(newData){
	var apiDropDown = $('#apiDropdown');
	
	apiDropDown.empty();
	var option = $('<option/>',{
		'text' : "",
		'value' : ""					
	});
	
	apiDropDown.append(option);	
	
	//Append Main App action to dropdown
	option = $('<option/>',{
		'text' : 'Application Hits',
		'value' : 'A|' + selectedApp					
	});
	apiDropDown.append(option);
	
	//Append all dependencies
	var dependencies = $.map(data.dependencies, function( value, index ) {
		return value;
	});	
	for(var i = 0; i < dependencies.length; i++){
		option = $('<option/>',{
			'text' : dependencies[i].dependencyName,
			'value' : 'D|' + dependencies[i].dependencyName					
		});
		apiDropDown.append(option);		
	}
	
	$("#apiDropdown").html($("#apiDropdown option").sort(function (a, b) {
	    return a.text == b.text ? 0 : a.text < b.text ? -1 : 1
	}))
	
	$("#apiDropdown").val(0);
};

function createContent(type, subType, div){
	var contentDiv;
	if(div == null){
		contentDiv = $(dynamicContentDivID);
		contentDiv.empty();
		
		if(selectedData == null || selectedData == ''){
			return;
		}
	}else{
		contentDiv = $('#modalDynamicContent');
		contentDiv.empty();
	}
	
	if(type == 'table'){
		var table = generateTable(subType);
		contentDiv.append(table);
		$(".tablesorter").tablesorter({ sortList: [[0,0]] });
	}else if(type == 'graph'){
		if(subType == 'avgByHour'){
			var svgDiv = createGraph('avgByHour', contentDiv);		
		}else if(subType == 'countByHour'){
			var svgDiv = createGraph('countByHour', contentDiv);		
		}else if(subType == 'countByClient'){
			var svgDiv = createCountByClientGraph(contentDiv);		
		}else if(subType == 'countByServer'){
			var svgDiv = createCountByServerGraph(contentDiv);		
		}else if(subType == 'countByError'){
			var svgDiv = createCountByErrorGraph(contentDiv);		
		}
	}	
};

function generateTable(tableType){
	if(tableType == null || tableType == undefined){
		tableType = "APIHits";		
	}
	
	if(tableType == "APIHits"){
		return generateAPIHitsTable();
	}else if(tableType == "ClientHits"){
		return generateClientHitsTable();
	}else if(tableType == "ServerHits"){
		return generateServerHitsTable();
	}else if(tableType == "ErrorCounts"){
		return generateErrorCountsTable();
	}else if(tableType == "HourlyHits"){
		return generateHourlyHitsTable();
	}
};

function generateAPIHitsTable(){
	var tableTemplate = null;
	if(selectedType == 'A'){
		tableTemplate = tableTemplates["APIHits"];
	}else{
		tableTemplate = tableTemplates["DependencyHits"];
	}
	
	var table	 	= $('<table/>', {
			'class' : 'table table-condensed tablesorter table-hover',						
			}),
		tableHead	= $('<thead/>'),
		headerRow 	= $('<tr/>'),
		body		= $('<tbody/>');
				
	table.append(tableHead);
	tableHead.append(headerRow);
	table.append(body);
	
	var headers = tableTemplate["headers"];
	for(var i = 0; i < headers.length; i++){
		var headerColumn = $('<th/>', {
            'text': headers[i]		                
        });
		headerRow.append(headerColumn);
	}
	
	var dataArray = null;
	if(selectedType == 'A'){
		dataArray = $.map(data.actions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}else{
		dataArray = $.map(data.dependencies[selectedName].dependencyActions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}
	
	var totalCount = 0;
	for(var j = 0; j < dataArray.length; j++){
		var dataRow = dataArray[j];
		totalCount += dataRow["totalRequests"];
	}
	
	var dataColumns = tableTemplate["data"];				
	for(var j = 0; j < dataArray.length; j++){
		var dataRow = dataArray[j];
		var bodyRow = $('<tr/>', {
			'onclick' : 'rowClicked(\'' + dataRow.name + '\')'			
		});
		body.append(bodyRow);		
		for(var i = 0; i < dataColumns.length; i++){
			var bodyColumn = $('<td/>', {
                'text': dataRow[dataColumns[i]]		                
            });
			bodyRow.append(bodyColumn);			
		}
		
		var bodyColumn = $('<td/>', {
            'text': (dataRow["successCount"]/dataRow["totalRequests"] * 100.0).toFixed(2)     
        });
		bodyRow.append(bodyColumn);
		
		bodyColumn = $('<td/>', {
            'text': (dataRow["errorCount"]/dataRow["totalRequests"] * 100.0).toFixed(2)        
        });
		bodyRow.append(bodyColumn);
		
		bodyColumn = $('<td/>', {
            'text': (dataRow["totalRequests"]/totalCount * 100.0).toFixed(2)      
        });
		bodyRow.append(bodyColumn);
	}	
	
	return table;
};

function generateClientHitsTable(){
	var table	 	= $('<table/>', {
		'class' : 'table table-condensed tablesorter',						
		}),
	tableHead	= $('<thead/>'),
	headerRow 	= $('<tr/>'),
	body		= $('<tbody/>');
			
	table.append(tableHead);
	tableHead.append(headerRow);
	table.append(body);
	
	var dataArray = null;
	if(selectedType == 'A'){
		dataArray = $.map(data.actions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}else{
		dataArray = $.map(data.dependencies[selectedName].dependencyActions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}
	
	var listOfAllClients = {};
	for(var i = 0; i < dataArray.length; i++){
		var apiData = dataArray[i];
		for (var client in apiData.clientRequestCount){
			listOfAllClients[client] = 0;
		}		
	};
	
	var headerColumn = $('<th/>', {
        'text': 'API Name'		                
    });
	headerRow.append(headerColumn);
	
	for (var client in listOfAllClients){
		var headerColumn = $('<th/>', {
	        'text': client		                
	    });
		headerRow.append(headerColumn);
	}	
	
	for(var j = 0; j < dataArray.length; j++){
		var dataRow = dataArray[j];
		var bodyRow = $('<tr/>', {
			'onclick' : 'rowClicked(\'' + dataRow.name + '\')'
		});
		body.append(bodyRow);	
		var bodyColumn = $('<td/>', {
            'text': dataRow.name		                
        });
		bodyRow.append(bodyColumn);
		for(var client in listOfAllClients){
			var count = dataRow.clientRequestCount[client];
			if(count == null || count == undefined){
				count = 0;
			}
			var bodyColumn = $('<td/>', {
	            'text': count	                
	        });
			bodyRow.append(bodyColumn);
		}
	}
	
	return table;
};

function generateServerHitsTable(){
	var table	 	= $('<table/>', {
		'class' : 'table table-condensed tablesorter',						
		}),
	tableHead	= $('<thead/>'),
	headerRow 	= $('<tr/>'),
	body		= $('<tbody/>');
			
	table.append(tableHead);
	tableHead.append(headerRow);
	table.append(body);
	
	var dataArray = null;
	if(selectedType == 'A'){
		dataArray = $.map(data.actions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}else{
		dataArray = $.map(data.dependencies[selectedName].dependencyActions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}
	
	var listOfAllServers = {};
	for(var i = 0; i < dataArray.length; i++){
		var apiData = dataArray[i];
		for (var server in apiData.serverRequestCount){
			listOfAllServers[server] = 0;
		}		
	};
	
	var headerColumn = $('<th/>', {
        'text': 'API Name'		                
    });
	headerRow.append(headerColumn);
	
	for (var server in listOfAllServers){
		var headerColumn = $('<th/>', {
	        'text': server		                
	    });
		headerRow.append(headerColumn);
	}	
	
	for(var j = 0; j < dataArray.length; j++){
		var dataRow = dataArray[j];
		var bodyRow = $('<tr/>', {
			'onclick' : 'rowClicked(\'' + dataRow.name + '\')'
		});
		body.append(bodyRow);	
		var bodyColumn = $('<td/>', {
            'text': dataRow.name		                
        });
		bodyRow.append(bodyColumn);
		for(var server in listOfAllServers){
			var count = dataRow.serverRequestCount[server];
			if(count == null || count == undefined){
				count = 0;
			}
			var bodyColumn = $('<td/>', {
	            'text': count	                
	        });
			bodyRow.append(bodyColumn);
		}
	}
	
	return table;
};

function generateErrorCountsTable(){
	var table	 	= $('<table/>', {
		'class' : 'table table-condensed tablesorter',						
		}),
	tableHead	= $('<thead/>'),
	headerRow 	= $('<tr/>'),
	body		= $('<tbody/>');
			
	table.append(tableHead);
	tableHead.append(headerRow);
	table.append(body);
	
	var dataArray = null;
	if(selectedType == 'A'){
		dataArray = $.map(data.actions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}else{
		dataArray = $.map(data.dependencies[selectedName].dependencyActions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}
	
	var listOfAllErrors = {};
	for(var i = 0; i < dataArray.length; i++){
		var apiData = dataArray[i];
		for (var error in apiData.errorCountMap){
			listOfAllErrors[error] = 0;
		}		
	};
	
	var headerColumn = $('<th/>', {
        'text': 'API Name'		                
    });
	headerRow.append(headerColumn);
	
	for (var error in listOfAllErrors){
		var headerColumn = $('<th/>', {
	        'text': error		                
	    });
		headerRow.append(headerColumn);
	}	
	
	for(var j = 0; j < dataArray.length; j++){
		var dataRow = dataArray[j];
		var bodyRow = $('<tr/>', {
			'onclick' : 'rowClicked(\'' + dataRow.name + '\')'
		});
		body.append(bodyRow);	
		var bodyColumn = $('<td/>', {
            'text': dataRow.name		                
        });
		bodyRow.append(bodyColumn);
		for(var error in listOfAllErrors){
			var count = dataRow.errorCountMap[error];
			if(count == null || count == undefined){
				count = 0;
			}
			var bodyColumn = $('<td/>', {
	            'text': count	                
	        });
			bodyRow.append(bodyColumn);
		}
	}
	
	return table;
};

function generateHourlyHitsTable(){
	var table	 	= $('<table/>', {
		'class' : 'table table-condensed tablesorter',						
		}),
	tableHead	= $('<thead/>'),
	headerRow 	= $('<tr/>'),
	body		= $('<tbody/>');
			
	table.append(tableHead);
	tableHead.append(headerRow);
	table.append(body);
	
	var dataArray = null;
	if(selectedType == 'A'){
		dataArray = $.map(data.actions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}else{
		dataArray = $.map(data.dependencies[selectedName].dependencyActions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}
	
	var hoursList = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	
	var headerColumn = $('<th/>', {
        'text': 'API Name'		                
    });
	headerRow.append(headerColumn);
	
	for (var hour in hoursList){
		var headerColumn = $('<th/>', {
	        'text': hour + ':00'		                
	    });
		headerRow.append(headerColumn);
	}	
	
	for(var j = 0; j < dataArray.length; j++){
		var dataRow = dataArray[j];
		var bodyRow = $('<tr/>', {
			'onclick' : 'rowClicked(\'' + dataRow.name + '\')'
		});
		body.append(bodyRow);	
		var bodyColumn = $('<td/>', {
            'text': dataRow.name		                
        });
		bodyRow.append(bodyColumn);
		for(var hour in hoursList){
			var count = dataRow.countByHour[hour];
			if(count == null || count == undefined){
				count = 0;
			}
			var bodyColumn = $('<td/>', {
	            'text': count	                
	        });
			bodyRow.append(bodyColumn);
		}
	}
	
	return table;
};

function createGraph(graphType, parentDiv){
	var sizes = new GraphSizes();	
	var dataArray = getDataArray();	
	
	var x = d3.scale.ordinal().rangeRoundBands([0, sizes.width], .45);
	var y = d3.scale.linear().range([sizes.height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")
	    .ticks(24);

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .ticks(15);				
	
	var svgDiv = $("<div/>", {
		'id' : 'generatedGraph'
	});
	
	var totalDataArray = [];
	for(var j = 0; j < 24; j++){				
		totalDataArray[j] = 0;				
	}		
	
	if(graphType == 'avgByHour'){
		var totalTimeArray = [];
		for(var j = 0; j < 24; j++){				
			totalTimeArray[j] = 0;				
		}
		
		for(var i = 0; i < dataArray.length; i++){
			var action = dataArray[i];
			var countByHourArray = action['countByHour'];
			var avgTimeTakenByHour = action['avgByHour']
			for(var j = 0; j < 24; j++){				
				totalTimeArray[j] += countByHourArray[j] * avgTimeTakenByHour[j];
				totalDataArray[j] += countByHourArray[j];
			}
		}
		
		for(var j = 0; j < 24; j++){				
			totalDataArray[j] = totalTimeArray[j]/totalDataArray[j];				
		}
	}else{
		for(var i = 0; i < dataArray.length; i++){
			var action = dataArray[i];
			var byHourArray = action[graphType];
			for(var j = 0; j < 24; j++){				
				totalDataArray[j] += byHourArray[j];				
			}
		}
	}
	
	parentDiv.append(svgDiv);
	
	var svg = d3.select("#generatedGraph").append("svg")
    	.attr("width", sizes.width + sizes.margin.left + sizes.margin.right)
    	.attr("height", sizes.height + sizes.margin.top + sizes.margin.bottom)
      .append("g")
    	.attr("transform", "translate(" + sizes.margin.left + "," + sizes.margin.top + ")");
	
	x.domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]);
	y.domain([0, d3.max(totalDataArray, function(d) { return d; })]);

	svg.append("g")
      .attr("class", "x axis")
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
      .data(totalDataArray)
     .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, index) { return x(index); })
      .attr("width", x.rangeBand())
      .attr("y", function(d, index) { return y(d); })
      .attr("height", function(d) { return sizes.height - y(d); })	
      
    return svgDiv;
};

function createCountByClientGraph(parentDiv){
	var sizes = new GraphSizes();	
	var dataArray = getDataArray();	
	
	var listOfAllClients = {};
	for(var i = 0; i < dataArray.length; i++){
		var apiData = dataArray[i];
		for (var client in apiData.clientRequestCount){
			listOfAllClients[client] = 0;
		}		
	};	
	
	for(var i = 0; i < dataArray.length; i++){
		var action = dataArray[i];
		var countByClient = action['clientRequestCount'];
		for(var client in countByClient){
			listOfAllClients[client] += countByClient[client];			
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
		'id' : 'generatedGraph'
	});
	
	parentDiv.append(svgDiv);
	
	var svg = d3.select("#generatedGraph").append("svg")
    	.attr("width", sizes.width + sizes.margin.left + sizes.margin.right)
    	.attr("height", sizes.height + sizes.margin.top + sizes.margin.bottom)
      .append("g")
    	.attr("transform", "translate(" + sizes.margin.left + "," + sizes.margin.top + ")");
	
	var clientArray = [];
	var i = 0;
	for(var client in listOfAllClients){
		clientArray[i] = client;
		i++;
	}	
	
	var valueArray = [];
	var i = 0;
	for(var client in listOfAllClients){
		var value = listOfAllClients[client];
		if(value == null || value == undefined)
			value = 0;
		valueArray[i] = +value;
		i++;
	}
	
	x.domain(clientArray);
	y.domain([0, d3.max(valueArray, function(d) { return d; })]);
	
	svg.append("g")
      .attr("class", "x axis")
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
      .data(valueArray)
     .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, index) { return x(clientArray[index]); })
      .attr("width", x.rangeBand())
      .attr("y", function(d, index) { return y(d); })
      .attr("height", function(d) { return sizes.height - y(d); })	
      
    return svgDiv;
};

function createCountByServerGraph(parentDiv){
	var sizes = new GraphSizes();	
	var dataArray = getDataArray();	
	
	var listOfAllServers = {};
	for(var i = 0; i < dataArray.length; i++){
		var apiData = dataArray[i];
		for (var server in apiData.serverRequestCount){
			listOfAllServers[server] = 0;
		}		
	};	
	
	for(var i = 0; i < dataArray.length; i++){
		var action = dataArray[i];
		var serverRequestCount = action['serverRequestCount'];
		for(var server in serverRequestCount){
			listOfAllServers[server] += serverRequestCount[server];			
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
		'id' : 'generatedGraph'
	});
	
	parentDiv.append(svgDiv);
	
	var svg = d3.select("#generatedGraph").append("svg")
    	.attr("width", sizes.width + sizes.margin.left + sizes.margin.right)
    	.attr("height", sizes.height + sizes.margin.top + sizes.margin.bottom)
      .append("g")
    	.attr("transform", "translate(" + sizes.margin.left + "," + sizes.margin.top + ")");
	
	var serverArray = [];
	var i = 0;
	for(var server in listOfAllServers){
		serverArray[i] = server;
		i++;
	}	
	
	var valueArray = [];
	var i = 0;
	for(var server in listOfAllServers){
		var value = listOfAllServers[server];
		if(value == null || value == undefined)
			value = 0;
		valueArray[i] = +value;
		i++;
	}
	
	x.domain(serverArray);
	y.domain([0, d3.max(valueArray, function(d) { return d; })]);
	
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
      .data(valueArray)
     .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, index) { return x(serverArray[index]); })
      .attr("width", x.rangeBand())
      .attr("y", function(d, index) { return y(d); })
      .attr("height", function(d) { return sizes.height - y(d); })	
      
    $(".vertical").find("g").find("text").attr("class","vertical-text-5").attr("transform","translate(-45,20)").attr("style", "text-anchor: none");  
    
    return svgDiv;
};

function createCountByErrorGraph(parentDiv){
	var sizes = new GraphSizes();	
	var dataArray = getDataArray();	
	
	var listOfAllErrors = {};
	for(var i = 0; i < dataArray.length; i++){
		var apiData = dataArray[i];
		for (var error in apiData.errorCountMap){
			listOfAllErrors[error] = 0;
		}		
	};	
	
	for(var i = 0; i < dataArray.length; i++){
		var action = dataArray[i];
		var errorCounts = action['errorCountMap'];
		for(var error in errorCounts){
			listOfAllErrors[error] += errorCounts[error];			
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
		'id' : 'generatedGraph'
	});
	
	parentDiv.append(svgDiv);
	
	var svg = d3.select("#generatedGraph").append("svg")
    	.attr("width", sizes.width + sizes.margin.left + sizes.margin.right)
    	.attr("height", sizes.height + sizes.margin.top + sizes.margin.bottom)
      .append("g")
    	.attr("transform", "translate(" + sizes.margin.left + "," + sizes.margin.top + ")");
	
	var errorArray = [];
	var i = 0;
	for(var error in listOfAllErrors){
		errorArray[i] = error;
		i++;
	}	
	
	var valueArray = [];
	var i = 0;
	for(var error in listOfAllErrors){
		var value = listOfAllErrors[error];
		if(value == null || value == undefined)
			value = 0;
		valueArray[i] = +value;
		i++;
	}
	
	x.domain(errorArray);
	y.domain([0, d3.max(valueArray, function(d) { return d; })]);
	
	svg.append("g")
      .attr("class", "x axis")
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
      .data(valueArray)
     .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, index) { return x(errorArray[index]); })
      .attr("width", x.rangeBand())
      .attr("y", function(d, index) { return y(d); })
      .attr("height", function(d) { return sizes.height - y(d); })	
      
    return svgDiv;
};

function getDataArray(){
	var dataArray = null;
	if(selectedType == 'A'){
		var dataArray = $.map(data.actions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});		
	}else{
		dataArray = $.map(data.dependencies[selectedName].dependencyActions, function( value, index ) {
			if(selectedSubName == null){
				return value;
			}else{
				if(value.name == selectedSubName){
					return value;
				}
			}
		});
	}
	
	return dataArray;
};

function GraphSizes(){
	var topVal = 20,
		rightVal = 20,
		bottomVal = 70,
		leftVal = 70;	
	
	this.margin = {top: topVal, right: rightVal, bottom: bottomVal, left: leftVal};
    this.width  = 1250 - leftVal - rightVal;
    this.height = 450 - topVal;
};
/**********END DATA PROCESSING******/
