//pseudocode - order of attack


//TODOs
//fix side bar flicker - perhaps change back to popup? or set box size to never change
//titlebar
//year label
//set zooming so it's more accurate

//make popup into scatterplot with regression line??
//different color scale for each region?

//refactor choropleth functions
//recactor chart creations
//general refactoring
//be rid of global variables when all is said and done.


//self calling global function
(function(){
  //global vars that i need to not be global before i turn this in
  var year = 1990;
  var region = "All";

  //constants
  const width = window.innerWidth * 0.29,
  height = window.innerHeight * 0.33,
  leftPadding = 40,
  rightPadding = 2,
  topBottomPadding = 5,
  chartInnerWidth = width - leftPadding - rightPadding,
  chartInnerHeight = height - topBottomPadding * 2,
  translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

  function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
    .node()
    .getBoundingClientRect()
    .width;
    console.log(labelWidth);
    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
    y1 = d3.event.clientY - 75,
    x2 = d3.event.clientX - labelWidth - 10,
    y2 = d3.event.clientY + 25;
    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;
    d3.select(".infolabel")
    .style("left", x + "px")
    .style("top", y + "px");
  };

  //function to create dynamic label
  function setLabel(props){
    //label content
    let labelAttribute = "<h1>" + props[year] +
    "</h1><b>" + props['Country'] + "</b>";

    //create info label div
    var infolabel = d3.select("body")
    .append("div")
    .attr("class", "infolabel")
    .attr("id", "co" + props.Code + "_label")
    .html(labelAttribute);
    //set country name to popup
    // var countryName = infolabel.append("div")
    // .attr("class", "labelname")
    // .html(props.Country);
  };
  function removeLabel(){

  }

  //function to initialize D3 bar chart
  function setChart(map, layers){
    let yScale = d3.scaleLinear().range([height,0]);
    let yAxis = d3.axisLeft(yScale);
    //get current regions
    let data = filterRegions(map);

    let max = d3.max(data, (d) => +d[year]);
    yScale.domain([0, max]);

    let filtered = data.filter(d=> +d[year]>0);
    var colorScale = makeColorScale(data);

    //create svg element to hold the bar chart
    var chart = d3.select("#regionChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "chart");

    //add axis to chart
    var axis = chart.append("g")
    .attr("class", "axis")
    .attr("transform", translate)
    .call(yAxis);

    //set bars
    var bars = chart.selectAll(".bars")
    .data(filtered)
    .enter()
    .append("rect")
    .sort((a, b)=> b[year]-a[year]);

    bars.attr("x", (d, i) => i * (chartInnerWidth / filtered.length)+ leftPadding)
    .attr("height", d => height - yScale(parseFloat(d[year])))
    .attr("y", d => yScale(parseFloat(d[year])) +topBottomPadding)
    .attr("country", d=> d['Country'])
    .attr("value", d=>d[year])
    .attr("class", d =>  "bar " +"co"+ d.CountryCode)
    .attr("width", chartInnerWidth / filtered.length)
    .style('fill', d => choropleth(d, colorScale))
    .on("mouseover", d => setLabel(d))
    .on("mouseout", (d) => d3.select(".infolabel").remove())
    .on("mousemove", moveLabel);

    //set y axis
    d3.selectAll("g.axis")
    .call(yAxis);
  };

  //make popup content, want to change this so it's stationay in corner
  function createChart(attributes){

    let max = d3.max(attributes, d=>d);
    let min = d3.min(attributes, d=>d);
    var xScale = d3.scaleTime().range([0, width-40]).domain([1990, 2015]);
    let yScale = d3.scaleLinear().range([height,0]).domain([(min - (min/5)), max]);
    var xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(5);
    var yAxis = d3.axisLeft(yScale);

    let svg = d3.select('.info')
    .select('svg')
    .attr("width", width)
    .attr("height", height)
    .attr("class", "chart")

    //add axis to chart
    var yAxis = svg.append('g')
    .attr('class', 'yAxis')
    .attr("transform", "translate(40, 0)")
    .call(yAxis);

    var xAxis =  svg.append('g')
    .attr("class", "xAxis")
    .attr("transform", `translate(${leftPadding}, ${height})`)
    .call(xAxis);

    //set bars
    var bars = svg.selectAll('.infoBars')
    .data(attributes)
    .enter()
    .append('rect');
    // var dots =  svg.selectAll(".dot")
    //   .data(attributes)
    //   .enter()
    //   .append("circle");

    bars.attr("x", (d, i) => i * (chartInnerWidth / attributes.length)+ leftPadding)
    .attr("height", d => height - yScale(parseFloat(d)))
    .attr("y", d => yScale(parseFloat(d)) + topBottomPadding)
    .attr("width", chartInnerWidth / attributes.length)
    .attr("transform", "translate(1,-5)")
    .style('fill', "blue");

    // dots.attr("cx", d => xScale(parseFloat(d)))
    // .attr("class", "dot")
    // .attr("r",6)
    // .attr("cy", d=> yScale(parseFloat(d)))
    // .style('fill', "blue");

  };

  //create leaflet map
  function createMap(error, countries, mdg){
    //initialize map, set coordniates and zoom
    //value of current indicator
    var indicator = $("#indicators").val();
    let current = mdg.filter(country => country.SeriesCode === indicator);

    let myMap = L.map('map').setView([51.1657, 10.4515], 4);
    //set basemap tile layer to map
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri; Data: MDGI'
    }).addTo(myMap);
    //convert topojson to geojson
    var copyWorld = JSON.parse(JSON.stringify(topojson.feature(countries, countries.objects.MDGCountries).features));
    let World = topojson.feature(countries, countries.objects.MDGCountries).features

    let regions = {
      All: [],
      Developed: [],
      Latin_America_Caribbean: [],
      Northern_Africa: [],
      SubSaharan_Africa: [],
      Central_Asia: [],
      Southern_Asia: [],
      Western_Asia: [],
      Oceania: [],
      Eastern_Asia: [],
      SouthEastern_Asia: []
    }

    var copyRegions = JSON.parse(JSON.stringify(regions));

    //join data
    joinData(current, World);

    //split into regions
    makeRegions(World, regions);
    //make geojson objects for leaflet, i can probably refacor along with changedata portion
    var  Developed = L.geoJson(regions['Developed'], {style: style, onEachFeature: onEachFeature}),
    Latin_America_Caribbean = L.geoJson(regions['Latin_America_Caribbean'], {style: style,onEachFeature: onEachFeature}),
    Northern_Africa = L.geoJson(regions['Northern_Africa'],{style: style,onEachFeature: onEachFeature}),
    SubSaharan_Africa = L.geoJson(regions['SubSaharan_Africa'],{style: style,onEachFeature: onEachFeature}),
    Central_Asia = L.geoJson(regions['Central_Asia'],{style: style,onEachFeature: onEachFeature}),
    Southern_Asia = L.geoJson(regions['Southern_Asia'],{style: style,onEachFeature: onEachFeature}),
    Western_Asia = L.geoJson(regions['Western_Asia'],{style: style,onEachFeature: onEachFeature}),
    Oceania = L.geoJson(regions['Oceania'],{style: style,onEachFeature: onEachFeature}),
    Eastern_Asia = L.geoJson(regions['Eastern_Asia'],{style: style,onEachFeature: onEachFeature}),
    SouthEastern_Asia = L.geoJson(regions['SouthEastern_Asia'],{style: style,onEachFeature: onEachFeature}),
    All = L.geoJson(regions["All"], {style: style, onEachFeature: onEachFeature}).addTo(myMap);

    var layers = {All, Developed, Latin_America_Caribbean, Northern_Africa, SubSaharan_Africa,
      Central_Asia, Southern_Asia, Western_Asia, Oceania, Eastern_Asia, Southern_Asia, SouthEastern_Asia};

      updateChoropleth(myMap);
      createSequenceControls(myMap,layers);
      sideMap(myMap, layers, World);
      setChart(myMap,layers);
      setInfo(myMap);
      indicators(layers, mdg, copyWorld, copyRegions, myMap);
    };

    //separate the world into regions
    function makeRegions(countries, regions){
      //loop through countries and group into regions object
      for (let country in countries){
        let setRegion = countries[country].properties.REGION_UN;
        regions[setRegion].push(countries[country]);
        regions["All"].push(countries[country]);
      };
      return regions;
    };

    function filterRegions(map){
      let currentRegions =[];
      map.eachLayer(function(layer){
        if(layer.feature){
          currentRegions.push(layer.feature.properties);
        }
      })
      return currentRegions
    }

    //update choropleth style
    function updateChoropleth(map){
      //create colorscale
      let current = filterRegions(map);
      var colorScale = makeColorScale(current);
      map.eachLayer(function(layer){
        if(layer.feature){
          let val = parseFloat(layer.feature.properties[year]);
          //should also have year not be global
          if(isFinite(val)){
            layer.setStyle({fillColor: colorScale(val)});
          } else {
            layer.setStyle({fillColor: "#CCC"});
          }
        };
      });
    };

    function choropleth(props, colorScale){
      //make sure attribute value is a number
      let val = parseFloat(props[year]);
      //if attribute value exists, assign a color; otherwise assign gray
      if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
      } else {
        return "#CCC";
      };
    };

    //ceate the side map for selecting regions
    function sideMap(mapView, layers, geojson){
      const regionColors = {
        Developed: ["#edf8e9", "#bae4b3","#74c476","#31a354","#006d2c"],
        Latin_America_Caribbean: ["#ffffd4", "#fed98e", "#fe9929", "#d95f0e", "#993404"],
        Northern_Africa: ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"],
        SubSaharan_Africa: ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"],
        Central_Asia: ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
        Southern_Asia: ["#feebe2", "#fbb4b9", "#f768a1", "#c51b8a", "#7a0177"],
        Western_Asia: ["#f1eef6", "#d7b5d8", "#df65b0", "#dd1c77", "#980043"],
        Oceania: ["#f1eef6", "#d7b5d8", "#df65b0", "#dd1c77", "#980043"],
        Eastern_Asia: ["#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"],
        SouthEastern_Asia: ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f"]
      };

      //map container
      const map = d3.select("#regionSelector")
      .append("svg")
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", height);
      //set projection
      const projection = d3.geoNaturalEarth1()
      .center([1, 25])
      .scale(75)
      .translate([width / 2, height / 2]);

      //create a path to draw the geometry and set the projection
      const path = d3.geoPath()
      .projection(projection);
      //add map
      const countries = map.selectAll('countries')
      .data(geojson)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', d=>  d.properties.REGION_UN)
      .style("fill", d => regionColors[d.properties.REGION_UN][2])
      .on("mousedown", d => zoom(d.properties.REGION_UN, mapView, layers));
      //button to zoom to all countries
      $('button').on('click',function(){
        zoom(this.className, mapView, layers) ;
      });
    };

    function removeLayers(map){
      map.eachLayer(function(layer){
        //only the basemap has an attribution
        if(layer.options.attribution == null){
          map.removeLayer(layer);
        }});
      };

      function changeData(layers, indicator, mdg, world, regions, map){
        //filter main mdg csv to only the current dataset
        let current = mdg.filter(country => country.SeriesCode === indicator);
        //join to copy of the world data
        joinData(current, world);
        //push into regions arrayso
        makeRegions(world, regions);
        //create reigon layers
        for (let layer in layers)
        layers[layer] = L.geoJson(regions[layer], {style: style,onEachFeature: onEachFeature});
        //assign currently selected region to countries
        let countries = layers[region];
        //remove every layer in map but basemap
        removeLayers(map);
        //add the regions to map
        countries.addTo(map);
        //update the colors
        updateChoropleth(map);
        var elem = document.querySelector('.chart');
        elem.parentNode.removeChild(elem);
        setChart(map, layers);

      };
      //function to zoom to region when clicked in side map
      function zoom(newRegion, map, layers){
        //remove every layer in map but basemap
        removeLayers(map);

        //gets the id the element just clicked
        region = newRegion;
        let layer = layers[region];
        layer.addTo(map);
        //get the extent and bounds of the new layer and zoom to it
        let extent = layer.getBounds()
        let neLat = extent._northEast.lat;
        let neLng = extent._northEast.lng
        let swLat = extent._southWest.lat;
        let swLng = extent._southWest.lng
        map.fitBounds([
          [neLat,neLng], [swLat,swLng]
        ]);
        //update map colors
        updateChoropleth(map);
        var elem = document.querySelector('.chart');
        elem.parentNode.removeChild(elem);
        setChart(map, layers);
      };

      //style the choropleth map
      function style(feature){
        return{
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7
        };
      };

      //function to create color scale generator
      function makeColorScale(data){
        const colorClasses = ["#edf8e9", "#bae4b3","#74c476","#31a354","#006d2c"];
        //create color scale generator

        var colorScale = d3.scaleQuantile().range(colorClasses);
        //build array of all values of the expressed attribute
        let domainArray = [];
        for (let i=0; i<data.length; i++){
          let val = parseFloat(data[i][year]);
          domainArray.push(val);
        };

        //assign array of expressed values as scale domain
        colorScale.domain(domainArray);
        return colorScale;
      };

      function joinData(current, countries){
        //loop through current to assign each set of current attribute values to geojson region

        for (let i=0; i<current.length; i++){
          let currentCountry = current[i]; //the current country in the CVS
          let currentCode = currentCountry.CountryCode; //the code of the current country in the current dataset

          //loop through geojson regions to find correct region
          for (let j=0; j<countries.length; j++){

            let jsonCountry = countries[j].properties; //the current region geojson properties
            let jsonCode = jsonCountry.code; //the geojson primary key code

            //where primary keys match, transfer current data to geojson properties object
            if (jsonCode == currentCode){
              //assign all attributes and values
              for (var attr in currentCountry){
                jsonCountry[attr] = currentCountry[attr];
              };
            };
          };
        };

        return countries;
      };

      //build an attributes array from the data
      function processData(data){
        //empty array to hold attributes
        let attributes = [];
        for (let attribute in data){
          //only take attributes with population values
          if (attribute.indexOf("1") === 0 || attribute.indexOf("1") === 5 || attribute.indexOf("0") === 1){
            attributes.push(parseInt(data[attribute]));
          };
        };

        return attributes;
      };



      //update the indicator selector in the side bar
      function indicators(layers, mdg, world, regions, map){
        var copyRegions = JSON.parse(JSON.stringify(regions));
        var copyWorld = JSON.parse(JSON.stringify(world));

        const indicatorList = {
          t5A : "<option value='553'>Maternal mortality ratio per 100,000 live births</option> <option value='570'>% of births attended by skilled health personnel</option>",
          t5B : "<option value='730'>Contraceptive use among married women 15-49 years</option><option value='761'>Adolescent birth rate, per 1,000 women</option><option value='762'>% of antenatal care coverage, at least one visit</option>"
        }
        //value of current target
        var target = $("#targets").val();
        //value of current indicator
        var indicator = $("#indicators").val()

        //updates indicator/target
        $("#targets").change(function () {
          target = $(this).val();
          //update indicator list
          $("#indicators").html(indicatorList[target]);
          indicator = $("#indicators").val()
          changeData(layers, indicator, mdg, copyWorld, copyRegions, map)
        });

        //updates indicator
        $("#indicators").change(function(){
          indicator = $(this).val();
          changeData(layers, indicator, mdg, copyWorld, copyRegions, map)
        })
      };
      //update info side popup
      function updateInfo(props){
        let attributes = processData(props);
        let notEmpty = false;
        for(let i in attributes){
          if (isFinite(attributes[i])){
            notEmpty = true;
          };
        };

        var infoDiv = document.querySelector('.info');

        if(!props){
          infoDiv.innerHTML = 'Hover over a state for data';
        }  else if(!notEmpty || !isFinite(props.SeriesCode)){
          infoDiv.innerHTML = `<b>${props.NAME_LONG}</b><br/>No data available`;
        } else if (isFinite(props.SeriesCode)){
          infoDiv.innerHTML = `<b>${props.NAME_LONG}<br/>${props.Series}</b><br/><svg/>`;
          createChart(attributes);
        }
      };

        function setInfo(map){
          //set up control container in bottom right for popups
          let info = L.control({position: 'bottomright'});
          info.onAdd = function(map){
            let infoDiv = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            return infoDiv;
          }
          info.addTo(map);
          //updates infomation contained in popup div
          updateInfo();
        }
        //controls hover over countries
        function onEachFeature(feature, layer) {
          layer.on({
            mouseover: function(e){
              updateInfo(layer.feature.properties, layer);
            },
            mouseout: function(e){
              updateInfo();
            }
          });
        }
        //Create new sequence controls within map   //this is only looking at initial data
        function createSequenceControls(map, layers){

          let SequenceControl = L.control({ position: 'bottomleft'} );
          SequenceControl.onAdd = function(map) {
            // create the control container with a particular class name
            let container = L.DomUtil.create('div', 'sequence-container');
            //create timestamp container
            let stamp = L.DomUtil.create('div', 'timestamp-container');
            //create slider and buttons to progress time, add to container
            let slider = L.DomUtil.create("input", "range-slider");

            $(container).append(stamp).append(slider);
            //stop the map from being dragged aroundwhen you interact with the slider
            L.DomEvent.on(container, 'mousedown touchstart touchmove dblclick pointerdown', function(e) {
              L.DomEvent.stopPropagation(e);
            });

            $(slider)
            //set attributes
            .attr({'type':'range', 'max': 2015, 'min': 1990, 'step': 1,'value': 1990})
            .on('input change', function() {
              year = $(this).val();
              var elem = document.querySelector('.chart');
              elem.parentNode.removeChild(elem);
              setChart(map,layers);
              updateChoropleth(map);
            });
            return container;
          }
          SequenceControl.addTo(map);
        };

        //pull in initial data and then create the map
        d3.queue()
        .defer(d3.json, "doc/MDGCountries.topojson") //Afria spatial data
        .defer(d3.csv, "doc/MDG.csv") //master data
        .await(createMap);
      })();
