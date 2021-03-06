//quick access to console.log
function log(input){ 
	console.log(input);
}
//global variables
var selectedFeature;
var elem;
var actions;

//implement map layer
var map = new OpenLayers.Map('map', {

                layers: [ //gets layers
                    new OpenLayers.Layer.OSM('OSM'),
                    new OpenLayers.Layer.OSM('OpenCycleMap',
                    ['http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png',
                    'http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png',
                    'http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png'])
                    ],
                controls: [
                    new OpenLayers.Control.Navigation(),
                    new OpenLayers.Control.Attribution(),
                    new OpenLayers.Control.ScaleLine(),
                    new OpenLayers.Control.MousePosition(),
                    new OpenLayers.Control.SelectFeature(),
                    new OpenLayers.Control.KeyboardDefaults()
                ],
                center: new OpenLayers.LonLat(8.4028, 49.011 ).transform('EPSG:4326', 'EPSG:3857'),
                zoom: 13
           
            });
			//add controls to map
			map.addControl(new OpenLayers.Control.MousePosition());

			//flashes splitted features
			function flashFeatures(features, index) {
				if(!index) {
					index = 0;
				}
				var current = editingLayer.features[index];
				if(current && current.layer === editingLayer) {
					editingLayer.drawFeature(features[index], "select");
				}
				var prev = editingLayer.features[index-1];
				if(prev && prev.layer === editingLayer) {
					editingLayer.drawFeature(prev, "default");
				}
				++index;
				if(index <= editingLayer.features.length) {
					window.setTimeout(function() {flashFeatures(editingLayer.features, index)}, 100);
				}
            }


           //-----------set Style for vector layers   
    var styleMap = new OpenLayers.StyleMap({
		"default": 	new OpenLayers.Style({
						 strokeWidth: 4,
						 //strokeColor: '#1c74cc',
						 strokeOpacity:1,
						 pointRadius:5,
						strokeColor: '#039',
						strokeOpacity: 1,
						fillColor: "#3366ff",
						graphicZIndex: 1
					}),
					
					   "select": new OpenLayers.Style({
						strokeWidth: 5,
						strokeColor: '#d81b23',
						strokeOpacity: 1,
						
					}),
						
		});
	//------------implement editingLayer		
		var editingLayer = new OpenLayers.Layer.Vector("Editing", {styleMap: styleMap});
		 editingLayer.events.register('featureadded', editingLayer, function(evt) {
			setVariables();
		 });
	//------------implement point layer
		var pointLayer = new  OpenLayers.Layer.Vector("Point", {styleMap: styleMap});
		 pointLayer.events.register('featureadded', pointLayer, function(evt) {
			toLine();
		 });

	//-----------add layers to map	
		map.addLayers([editingLayer]);
		map.addLayers([pointLayer]);

	//-----------set Variable of security to editing layer	
		function setVariables(){	
			editingLayer.refresh();
			actions= [];
			var loopAactions  = ["residence","iodine", "evacuation", "protecting_mask"];
			arrLength = editingLayer.features.length;
			editingLayer.features[arrLength-1].attributes["begin"]=begin; //set start date to editingLayer
			editingLayer.features[arrLength-1].attributes["end"]=fertig;//set end date to editingLayer
			
			for (var i = 0; i< loopAactions.length; i++){ //loops through possible actions
				elem = document.getElementById(loopAactions[i]);//gets the element of the checked feature
				
				if (elem.id=="residence"){
					editingLayer.features[arrLength-1].attributes[elem.id]=elem.value; //assigns action to editingLayer if attribute is checked
				}
				else if(elem.checked  == true){//checks which attribute is checked
					actions.push(elem.id);//adds attributes to editingLayer
				}
				editingLayer.features[arrLength-1].attributes["actions"]=actions;//assigns action to editingLayer if attribute is checked
			}
		}
		
		//---------transforms points to line	
		function toLine(){
			var x, y;
			var points=[];
			var ind = pointLayer.features.length-1; //gets current index of point feature
				points.push(pointLayer.features[ind].geometry);
				points.push(pointLayer.features[ind].geometry);//inserts two geometries for one feature to get start and end point
			var pline = new OpenLayers.Geometry.LineString(points);//adds point to new linestring feature
			var fL= new OpenLayers.Feature.Vector(pline);//get feature from linestring of point
		
			editingLayer.addFeatures(fL);//add feature of point to editingLayer
			points= [0];	//empties point layer;
		}
        
    //---------split function        
		var split = new OpenLayers.Control.Split({
			layer: editingLayer,
			eventListeners: {
				aftersplit: function(event) {
					flashFeatures(event.features);
				}
			}
		});
		  

	//--------snap function			  
	var snap = new OpenLayers.Control.Snapping({
				defaults:{
					tolerance: 40,
					edge: false,	//no snapping on edges
					node: true,		// snapping on nodes allowed
					vertex: false	//no snapping on vertices
				},
                layer: editingLayer,
                 targets: [editingLayer, pointLayer],//allows snapping of point- and editingLayer
                greedy: false
            });
            snap.activate();//activates  snapping
			
	

	var snap2 = new OpenLayers.Control.Snapping({//enables both layers to be snapped
				defaults:{
					tolerance: 40,
					edge: false,
					node: true,
					vertex: false
				},
                layer: pointLayer,
                targets: [editingLayer, pointLayer],
                greedy: false

            });
            snap2.activate();
	
			
 //--------controls options to interact with map content
         var drawControls ={
			point: new OpenLayers.Control.DrawFeature(pointLayer,
                        OpenLayers.Handler.Point),
			draw: new OpenLayers.Control.DrawFeature(editingLayer,
						OpenLayers.Handler.Path),			
			drag: new OpenLayers.Control.DragFeature(editingLayer),
			select: new OpenLayers.Control.SelectFeature(
					[editingLayer, pointLayer],
					{
						//layer:editingLayer,
						onSelect: showSelected,
						clickout: true, toggle: true,
						multiple: false, hover: false,
						toggleKey: "ctrlKey",
						multipleKey: "shiftKey", 
						box: true,
						click: true
					}),
			split: split
		};		
		
		
//------displays the selected checkboxes again 	
		function showSelected(feature){
			selectedFeature=feature;//gets selected feature
			var iodineSel, evacuationSel, protecting_maskSel, residenceSel;
			if(feature.attributes["actions"]){//checks if actions array has values
				iodineSel = feature.attributes.actions.includes("iodine");//assigns true if iodine was checked
				evacuationSel = feature.attributes.actions.includes("evacuation");//assigns true if evacuation was checked
				protecting_maskSel = feature.attributes.actions.includes("protecting_mask");//assigns true if protecting_mask was checked
			}else{
				iodineSel = false;// if it wasn't checked assigns false
				evacuationSel = false;
				protecting_maskSel = false;
			}
			residenceSel = feature.attributes.residence;//gets residence value
			$("#protecting_maskC").attr('checked', protecting_maskSel);//checks the boxes if true
			$("#iodineC").attr('checked', iodineSel);
			$("#evacuationC").attr('checked', evacuationSel);
			$("#residence").val(residenceSel);
			console.log("$('.daterangepickerCon').data('daterangepicker')");
			console.log($('.daterangepickerCon').data('daterangepicker'))
			$('.daterangepickerCon').data('daterangepicker').setStartDate(feature.attributes.begin);
			$('.daterangepickerCon').data('daterangepicker').setEndDate(feature.attributes.end);
			$("#wPSContainer").show('fade', 300);//opens info box
		}
		
	//-----saves changes to editingLayer attributes
		function saveChanges(){
			var actions = Array(0);
			selectedFeature.attributes.begin = $('.daterangepickerCon').data('daterangepicker').startDate;
			selectedFeature.attributes.end = $('.daterangepickerCon').data('daterangepicker').endDate;
			console.log("$('.daterangepickerCon').data('daterangepicker').startDate");
			console.log($('.daterangepickerCon').data('daterangepicker').startDate);
			if($("#protecting_maskC").is(":checked") == true){
				actions.push("protecting_mask")
			}
			if($("#iodineC").is(":checked") == true){
				actions.push("iodine")
			}
			if($("#evacuationC").is(":checked") == true){
				actions.push("evacuation")
			}
			console.log(selectedFeature.attributes);
			console.log(actions);
			console.log(selectedFeature.attributes["actions"]);
			if(selectedFeature.attributes["actions"]){
				selectedFeature.attributes["actions"] = actions;
			}
			else{
				console.log("Das Feature enthält kein actions Array!");
			}
			console.log(selectedFeature);
		}

		function resetSelected(feature){
			$("#protecting_mask").prop("checked",false);
			$("#iodine").prop("checked",false);
			$("#evacuation").prop("checked",false);
			$("#residence").val("outside");
			$("#wPContainer").show('fade', 300);
		}
		
		for(var key in drawControls) {
					map.addControl(drawControls[key]);
		}
		var residenceVal;
		function checkStay (element){
			if (element=="point"){
				document.getElementById("outside").style.display = "none";
				document.getElementById("residence").value = "house";
				residenceVal="house";				
			}
			toggleControl(element);
		}
		
	//---------checkes which draw control is activated-----------------------------------
	
	function toggleControl(element) {
				
				for(key in drawControls) {
					var control = drawControls[key];
					if(element == key && element) {
						log(editingLayer);
						control.activate();
					} else {
						control.deactivate();
					}
				}
			}
	//----------projects coordinates of editingLayer to WGS84			
		function project(){
			for (var i = 0; i<editingLayer.features.length; i++){
				editingLayer.features[i].geometry.transform(new OpenLayers.Projection("EPSG:3857"),new OpenLayers.Projection("EPSG:4326"));
				
			}
		}

//--------------- Geocoding Funktion mit Nominatim---------------------
var inp;
var items = [];
var inp_val;
var dtlat;
var dtlon;
var result;
function addr_search(id){
	//id = "#" + id;
	var resultContainer = '#results' + id.replace('#', '');
		//Zugriff auf EingabeObjekt
	inp = id;
	//Eingabe-Objekt wird als Wert gespeichert
	var inp_val = document.getElementById(inp).value;// ;  $(id).value;
	console.log("inp: " + inp + " inp_val: " + inp_val);
	//Sonderzeichen werden ersetzt
	inp_val = inp_val.replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/Ä/g,"Ae").replace(/Ö/g,"Oe").replace(/Ü/g,"Ue").replace(/ß/g,"ss");
	
	//Zugriff auf Nominatim
	$.ajax({url: ' http://nominatim.openstreetmap.org/search?q=135+pilkington+avenue,+birmingham&format=xml&polygon=1&addressdetails=1',
	        type: "HEAD",
	        timeout:1000,
	        statusCode: { //status code
	            200:
	            	$.getJSON('http://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + inp_val, function(data) {
					result=data;
					console.log("result:"+ data);
					items.length = 0;	 
						 $.each(data, function(key, val) {
						    items.push(
						     "<li id='list'><a href='#' onclick='chooseAddr(" +
						     val.lat + ", " + val.lon + "," + val.place_id +");'>" + val.display_name +
						     '</a></li>'
						  );
						});
					
						//var first_item = chooseAddr(val.lat, val.lon);
						    $(resultContainer).empty();
					     if (items.length != 0) {
					      $('<ul/>', {
					         'class': 'my-new-list',
							 'onclick' : '$('+ resultContainer + ').empty()',
					         html: items.join('')
					       }).appendTo(resultContainer);

					     } else {
					       $('<p>', { html: "Keine Vorschläge gefunden" }).appendTo(resultContainer);
					     }
					  }),
	            400: function (response) {
	                //alert('Bad Request');
					
				var error = "Der Nominatim Server is derzeit nicht verfügbar. ";
				  showPopup(error, "400 Bad Request");
					
					
	            },
	            
	            404: function (response){
	            	//alert('Server not found');
					var error = "Der Nominatim Server is derzeit nicht verfügbar. ";
				  showPopup(error, "404 Server not found");
	            },
	            444: function (response){
	            	//alert('No Response');
					var error = "Der Nominatim Server is derzeit nicht verfügbar. ";
				  showPopup(error, "444 No Response");
	            },
	            500: function(response){
	            	//alert('Server down! Please try again later...');
					var error = "Der Nominatim Server is derzeit nicht verfügbar. ";
				  showPopup(error, "500 Server down! Please try again later...");
	            }  

	        } //status code
	 });
}
//------------------ENDE Geocoding mit Nominatim-------------------------

//------------------ Setter methods for start and destination coordinate variables---

var lat_start, lon_start, lat_stop, lon_stop;

function setStart(startlat, startlon){
	lat_start = startlat;
	lon_start = startlon;
}

function setStop(stoplat, stoplon){
	lat_stop = stoplat;
	lon_stop = stoplon;
}

//------------------Routin Funktion mit OSRM--------------------------------------
var url = "http://router.project-osrm.org/viaroute?loc=";

var properties;
properties = 'cycling';

function routing(){
	
	var vectorLayer;
	var pArray = [];

	pointArray =[];
	var route_line;
	
$.ajax({url: 'http://router.project-osrm.org/route/v1/cycling/8.4044366,49.0140679;8.694,49.4093582?alternatives=true&steps=false&geometries=geojson&overview=full',
	        type: "HEAD",
	        timeout:1000,
	        statusCode: { //status code
	            200:  $.getJSON('http://router.project-osrm.org/route/v1/' + properties + '/'+lon_start+','+lat_start+';'+ lon_stop +','
	+ lat_stop + '?alternatives=true&steps=false&geometries=geojson&overview=full', function (data) {
        var test = data.routes[0].geometry.coordinates;
         epsg4326 =  new OpenLayers.Projection("EPSG:4326");
        projectTo = map.getProjectionObject();
		
		pArray.length = 0;
		pointArray.length = 0;

		
      for (i = 0; i< test.length; i++){//pushes coordinates to point array
        	pointArray.push(new OpenLayers.Geometry.Point( test[i][0], test[i][1]).transform(epsg4326, projectTo));
        	
        }
		route_line = new OpenLayers.Geometry.LineString(pointArray);//creates linestring of routing points


		var routeStyle = new OpenLayers.StyleMap({//assigns style for the route
	
				"default": 	new OpenLayers.Style({
		
			    strokeColor: "#ff9933",
				strokeOpacity: 1,
				fillColor: "#ff9933",
				graphicZIndex: 1

            })
		});
		
    	var vectorSource= new OpenLayers.Feature.Vector( pointArray);//creates feature layer of point array
		vectorLayer = new OpenLayers.Layer.Vector("Vector");// new vector layer 
		vectorLayer.addFeatures([vectorSource]);//features added to vector layer
		
		var feature = new OpenLayers.Feature.Vector(route_line, routeStyle);
		
		
    	var vectorLayer = new OpenLayers.Layer.Vector();
    	
    	vectorLayer.addFeatures([feature]);
		var clone = vectorLayer.clone();//duplicates vector layer
		editingLayer.addFeatures(clone.features);//add features to editingLayer
		
		vectorLayer.destroyFeatures();//delete all features from vectorLayer
		vectorSource.destroy();
		route_line.length = 0;
		
    }), 
	            400: function (response) {
	                //alert('Bad Request');
					
				var error = "Der OSRM Server is derzeit nicht verfügbar. ";
				  showPopup(error, "400 Bad Request");
					
					
	            },
	            
	            404: function (response){
	            	//alert('Server not found');
					var error = "Der OSRM Server is derzeit nicht verfügbar. ";
				  showPopup(error, "404 Server not found");
	            },
	            444: function (response){
	            	//alert('No Response');
					var error = "Der OSRM Server is derzeit nicht verfügbar. ";
				  showPopup(error, "444 No Response");
	            },
	            500: function(response){
	            	//alert('Server down! Please try again later...');
					var error = "Der OSRM Server is derzeit nicht verfügbar. ";
				  showPopup(error, "500 Server down! Please try again later...");
	            }         
	        }

});
}


//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//--------------------------------------------------------------------------
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

//------------------Fokus auf eingegebene Adresse-------------------------
	function chooseAddr(lat, lng, name) {
	
	//--------------write result to start input field---------------------
	for(placeid in result){
		if (result[placeid].place_id==name){
			log("placeid:"+result[placeid].place_id);			
			
		
		if(inp=='start'){
			document.getElementById("start").value=result[placeid].display_name;;
			setStart(lat, lng);
		}else{
			document.getElementById("stop").value=result[placeid].display_name;;
			setStop(lat, lng);
	  }
	}
	}

	 
	  var location = new OpenLayers.LonLat(lng,lat);
	  map.setCenter(location.transform('EPSG:4326', 'EPSG:3857'));
	  map.zoomTo(17);	 
	 $('.my-new-list').empty(); //remove list when item chosen
	 
	  
//------------------add Marker to map -------------------------------------
	  var markers = new OpenLayers.Layer.Markers( "Markers");
	  map.addLayer(markers);



	  var size = new OpenLayers.Size(42,50);
	  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	  var offset_2 = new OpenLayers.Pixel(-(size.w/5), -size.h);
	  if(inp=='start'){
	  	log(markers);

		var icon = new OpenLayers.Icon('./images/Start_icon.svg', size, offset);

	  }else{
	  	log(markers);
		var icon = new OpenLayers.Icon('./images/Ziel_icon.svg', size, offset_2);
		
	  }
	  
	  markers.addMarker(new OpenLayers.Marker(location,icon));
	  
		  
	  
	  
	} 








//-------------------Ende Fokus auf eingegebene Adresse

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//--------------------------------------------------------------------------
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


