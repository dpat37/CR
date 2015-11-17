var apiData; //holds processed data, organized on api
var clientsData; //holds processed data, organized on clients

var data; //used to store loaded JSON data
var apiDropDownID = '#apiDropdown';
var apiHeader = '#apiHeader';
var content = "#dynamicContent";
var urlPre = 'data/';

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
	var apiDropDown = $('#apiDropdown');		
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
		apiDropDown.append(option);
	}
		
	$("#apiDropdown").html($("#apiDropdown option").sort(function (a, b) {
		return a.text == b.text ? 0 : a.text < b.text ? -1 : 1
	}))
	
	$("#apiDropdown").val(0);
	apiChanged();
}

function apiChanged(){
	var refAPI = $(apiDropDownID).val();
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
	var name, date, count, hour, aHour;
	var clients = apiData[index].clients;
	for(var i=0; i<clients.length; i++){
		//add client data one by one
		name = clients[i].name;
		date = clients[i].max.date;
		count = clients[i].max.count;
		hour = clients[i].max.occuredHour;
		aHour = clients[i].max.hourlyCount;
		
		createContentHolder(content, name, date, count, hour, aHour);
	}
};

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

