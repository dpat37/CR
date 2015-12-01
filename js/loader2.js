var apiData = []; //holds processed data, organized on api
var clientData = []; //holds processed data, organized on clients
var apiList = [], clientList = [];

//var data; //used to store loaded JSON data
var selectDropDownID = '#selectDropdown';
var apiHeader = '#apiHeader';
var content = "#dynamicContent";

//pre-formed pretty hour strings
var hourString = ['12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM', '06:00 AM',
			'07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', 
			'02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', 
			'09:00 PM', '10:00 PM', '11:00 PM'];

function getNewHolderObj(name){
	return {
			"name":name,
			"date":"",
			"occuredHour":0,
			"occuredMinute":0,
			"values":[]
		};
}
/*****************Helper Functions: loading JSON Data*******************/
function getZippedJSON(url){
	var data = null;
	JSZipUtils.getBinaryContent(url, function(err, zipData) {
	    if(err) {
	      return data;
	    }

	    try {
	    	var result = pako.inflate(zipData);	
	    	var strData = String.fromCharCode.apply(null, new Uint16Array(result));
	        data = JSON.parse(strData);
	    } catch(e) {
	      //alert(e);
		  return data;
	    }
	 });
	 
	 return data;
};

function getJSON(url){
	var data = null;
	$.getJSON(url, function(d){
		console.log(d);
		data = d; 
	});
	
	return data;
};

//main loader 	
function load(year, app){
	var url = 'jsonSummaries/' + year + '/' + app + '.js';
	
	var data = getZippedJSON(url); //try the zipped version first
	
	if(data == undefined) //if doesn't return a JSON, probably not zipped
		data = getJSON(url); //try raw read
		
	console.log(data);
	
	//mapping of data from raw data to new mints
	
	//map all the client and api names to their respective list
	data.apis.map(function (obj){
		var name = obj.name;
		if(!apiList.find(function f(element, index, array){
			return element.valueOf() == name.valueOf();
		}))
			apiList.push(name);
		
		obj.clients.map(function(d){
			name = d.name;
			if(!clientList.find(function f(element, index, array){
				return element.valueOf() == name.valueOf();
			}))
				clientList.push(name);
		});
	});
	
		
	data.apis.map(function(obj){
		//iterate through all api objects in raw
		var apiObj = {
			"name":obj.name,
			"data":[]
		};
		//var holder = getNewHolderObj(obj.name);
		apiData.push(apiObj);
		
		obj.clients.map(function(d){
			//iterate - all client objs in each api obj
			var holder = getNewHolderObj(obj.name);
			holder.date = d.max.date;
			holder.occuredHour = d.max.occuredHour;
			holder.occuredMinute = d.max.occuredMinute;
			holder.hourCount = d.max.hourCount;
			holder.minuteCount = d.max.minuteCount;
			for(var i=0; i<d.max.hourlyCount.length; i++){
				holder.values.push({
					"label":hourString[i], 
					"name":obj.name, 
					"value":d.max.hourlyCount[i]
				});
			}
			
			
		});
	});
	
};



