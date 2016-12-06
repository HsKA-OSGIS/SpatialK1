function log(input){
	console.log(input);
}

var map = new OpenLayers.Map('map', {
                layers: [
                    new OpenLayers.Layer.OSM('OSM'),
                    new OpenLayers.Layer.OSM('OpenCycleMap',
                    ['http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png',
                    'http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png',
                    'http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png'])
                    ],
                controls: [
                    new OpenLayers.Control.Navigation(),
                    new OpenLayers.Control.Attribution(),

                    //new OpenLayers.Control.PanZoomBar(),

                   //new OpenLayers.Control.PanZoomBar(),

                    new OpenLayers.Control.LayerSwitcher({
                        'ascending': true
                    }),
                    new OpenLayers.Control.ScaleLine(),
                    new OpenLayers.Control.MousePosition(),
                    new OpenLayers.Control.SelectFeature(),
                    new OpenLayers.Control.KeyboardDefaults(),
                    
                ],
                center: new OpenLayers.LonLat(8.4028, 49.011 ).transform('EPSG:4326', 'EPSG:3857'),
                zoom: 13
           
            });
     



        // we will use this vector layer to demonstrate editing vector features
        var styleMap = new OpenLayers.StyleMap({
				
				"default": 	new OpenLayers.Style({
				 strokeWidth: 4,
				 strokeColor: '#1c74cc',
				 strokeOpacity:1,
            }),
               "select": new OpenLayers.Style({
                strokeWidth: 5,
			    strokeColor: '#d81b23',
				strokeOpacity: 1,
            })
		});
		var editingLayer = new OpenLayers.Layer.Vector("Editing", {styleMap: styleMap} );
        map.addLayers([editingLayer]);
        //var snapVertex = {methods: ['vertex', 'edge'], layers: [vectors]};

		
		        

  // init the editing toolbar and a basic selection control
         var drawControls ={
			line: new OpenLayers.Control.DrawFeature(editingLayer,
						OpenLayers.Handler.Path),
			drag: new OpenLayers.Control.DragFeature(editingLayer),
			select: new OpenLayers.Control.SelectFeature(
					editingLayer,
					{
						clickout: true, toggle: false,
						multiple: false, hover: false,
						toggleKey: "ctrlKey", // ctrl key removes from selection
						multipleKey: "shiftKey", // shift key adds to selection
						box: true,
						click: true
					}
				)
		};		

		
		for(var key in drawControls) {
					map.addControl(drawControls[key]);
		}
		
		//---------------------Zeichenfunktion-----------------------------------
		  function toggleControl(element) {
				
				for(key in drawControls) {
					var control = drawControls[key];
					if(element == key && element) {
						control.activate();
					} else {
						control.deactivate();
					}
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
		  console.log(val);
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
function routing(){
	/*lat_start = dtlat_start;
	lon_start = dtlon_start;
	lat_stop = dtlat_stop;
	lon_stop = dtlon_stop;*/
	

	var routingResult = $.getJSON('http://router.project-osrm.org/route/v1/driving/'+lon_start+','+lat_start+';'+ lon_stop +','
	+ lat_stop + '?alternatives=false&steps=false&geometries=geojson&overview=full', function (data) {
        var test = data.routes[0].geometry.coordinates;
		var testLine = new OpenLayers.Geometry.LineString(test);
        alert(testLine);
		
		//test to add linestring to display
		
		var routeStyle = new OpenLayers.StyleMap({
				
				"default": 	new OpenLayers.Style({
				 strokeWidth: 4,
				 strokeColor: '#1c74cc',
				 strokeOpacity:1,
            })
		});
		
		var feature = new OpenLayers.Feature({
        	geometry: new OpenLayers.Geometry.LineString(test)
   		});
		
    	var vectorSource= new OpenLayers.Feature.Vector(
			"Routing",
			{
			type: "LineString",
        	features: [feature],
			styleMap: routeStyle
    	});

    	var vectorLayer = new OpenLayers.Layer.Vector({
        	features: vectorSource
    	});

    	map.addLayer(vectorLayer);
		//end test
    });

	//$.getJSON('http://router.project-osrm.org/route/v1/driving/'+lat_start+','+lon_start+';'+ lat_stop +','+ lon_stop);
	log('http://router.project-osrm.org/route/v1/driving/'+lon_start+','+lat_start+';'+ lon_stop +','+ lat_stop + '?alternatives=false&steps=false&geometries=geojson&overview=full');
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
	  var markers = new OpenLayers.Layer.Markers( "Markers" );
	  map.addLayer(markers);

	  var size = new OpenLayers.Size(42,50);
	  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	  if(inp=='start'){
		var icon = new OpenLayers.Icon('./icons/Start_icon.svg', size, offset);
	  }else{
		var icon = new OpenLayers.Icon('./icons/Ziel_icon.svg', size, offset);
	  }
	  markers.addMarker(new OpenLayers.Marker(location,icon));
	  markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(0,0),icon.clone()));
		  
	  
	  
	}
//-------------------Ende Fokus auf eingegebene Adresse

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//--------------------------------------------------------------------------
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

