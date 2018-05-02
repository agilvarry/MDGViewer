//self calling global function
(function(){
  //these two global variables are actually bad practice. I should revisit this program and refactor it to get rid of them
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
  //for title
  const titleInfo = {
    t5A : "Reduce Maternal Mortality Rates",
    t5B : "Access to Reproductive Healthcare",
    t3A : "Promote Gender Equality",
    553 : "Maternal mortality ratio per 100,000 live births",
    730 : "Contraceptive use among married women 15-49 years",
    570 : "% of births attended by skilled health personnel",
    761 : "Adolescent birth rate, per 1,000 women",
    762 : "% of antenatal care coverage, at least one visit",
    722 : "Share of women in non-agricultural wage employment",
    557 : "Percent of Seats held by women in national parliament"
  };
  //holder for region labeling
  const regionNames ={
    All: "All UN Nations",
    Developed: '"Developed" Countries',
    Latin_America_Caribbean: "Latin America and the Caribbean",
    Northern_Africa: "Northern Afirca",
    SubSaharan_Africa: "Sub-Saharan Africa",
    Central_Asia: "Caucasus and Central Asia",
    Southern_Asia: "Southern Asia",
    Western_Asia: "Western Asia",
    Oceania: "Oceania",
    Eastern_Asia: "Eastern Asia",
    SouthEastern_Asia: "South-Eastern Asia"
  }

  //create leaflet map
  function createMap(error, countries, mdg){


    //ID of current indicator
    let indicator = $("#indicators").val();
    //initialize variable to hold all datasets as they are generated
    let datasets = {};
    //filter mdg csv file to the current indicator
    let current = mdg.filter(country => country.SeriesCode === indicator);
    //set up map
    let myMap = L.map('map').setView([20.1657, 10.4515], 2);
    //set basemap tile layer to map
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri; Data: MDGI'
    }).addTo(myMap);
    //convert topojson to geojson, and make a copy for use in later datasets
    var copyWorld = JSON.parse(JSON.stringify(topojson.feature(countries, countries.objects.MDGCountries).features));
    let World = topojson.feature(countries, countries.objects.MDGCountries).features
    //varaible to hold layers with dataset information
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
    //make copy of regions object for use in adding additional layers
    var copyRegions = JSON.parse(JSON.stringify(regions));

    //join data
    let currentcountries = joinData(current, World);

    //split into regions
    let currentRegions = makeRegions(currentcountries, regions);
    //group regions into object for storage, add to map
    datasets[indicator] = makeGroup(currentRegions);
    datasets[indicator][region].addTo(myMap);
    //call all functions necessary to set up program
    updateChoropleth(myMap, datasets[indicator]);
    createSequenceControls(myMap,datasets[indicator], datasets);
    sideMap(myMap, datasets[indicator], World, datasets);
    setChart(myMap, datasets[indicator]);
    setInfo(myMap);
    indicators(mdg, copyWorld, copyRegions, myMap, datasets);
    //makes make visible after everything is loaded
    document.getElementsByTagName("html")[0].style.visibility = "visible";
  };
  //make geojson objects for leaflet and group them
  function makeGroup(regions){
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
    All = L.geoJson(regions["All"], {style: style, onEachFeature: onEachFeature})

    var layers = {All, Developed, Latin_America_Caribbean, Northern_Africa, SubSaharan_Africa,
      Central_Asia, Southern_Asia, Western_Asia, Oceania, Eastern_Asia, Southern_Asia, SouthEastern_Asia};

      return layers
    }
    //control movement of label popup for side bars
    function moveLabel(){
      //get width of label
      var labelWidth = d3.select(".infolabel")
      .node()
      .getBoundingClientRect()
      .width;

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
      //object for popup labels
      const popSeries = {
        553 : "Maternal Mortality rate per 100k",
        570 : "Births with Health Professional",
        730 : "Contraceptive use",
        761 : "Adolecent Birth Rate per 1k",
        762 : "Antenatal care coverage",
        722 : "Share of employed women",
        557 : "Percent women in national parliament"
      }

      //add a % sign to popup if dataset calls for it
      if (props['SeriesCode'] == 570 || props['SeriesCode'] == 730 || props['SeriesCode'] == 762 || props['SeriesCode'] == 722 || props['SeriesCode'] == 557){
        var labelAttribute = `<h1> ${props[year]}% </h1>${popSeries[props['SeriesCode']]}<br/>
        <b>${props['Country']} </b>`;
      } else {
        var labelAttribute = `<h1> ${props[year]} </h1>${popSeries[props['SeriesCode']]}<br/>
        <b>${props['Country']} </b>`;
      }
      //create info label div
      var infolabel = d3.select("body")
      .append("div")
      .attr("class", "infolabel")
      .attr("id", "co" + props.Code + "_label")
      .html(labelAttribute);
    };

    //function to initialize D3 bar chart in side panel
    function setChart(map, layers){
      //scales
      let yScale = d3.scaleLinear().range([height,0]);
      let yAxis = d3.axisLeft(yScale);
      //get current regions
      //get data for current region
      let data = filterRegions(layers[region]);

      //get max value to set domain
      let max = d3.max(data, (d) => +d[year]);
      yScale.domain([0, max]);
      //remove any values that are less than zero, meaning they don't have a value
      let filtered = data.filter(d=> +d[year]>0);
      //set coloscale
      var colorScale = makeColorScale(data);
      //if there are nondatapoints display message
      if (filtered.length===0){
        var text = d3.select("#regionChart")
        .append("svg")
        .attr("height", height)
        .attr("class", "chart");
        text.append("text")
        .attr("transform", `translate(${height/2}, ${height/2})`)
        .text("No Data Available");
      }else{
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
        .style('fill', d => barColors(d, colorScale))
        .on("mouseover", d => setLabel(d))
        .on("mouseout", (d) => d3.select(".infolabel").remove())
        .on("mousemove", moveLabel);
        //set y axis
        d3.selectAll("g.axis")
        .call(yAxis);
      };
    };

    //make popup content, want to change this so it's stationay in corner
    function createChart(attributes){
      let max = d3.max(attributes, d=>parseFloat(d));
      let min = d3.min(attributes, d=>parseFloat(d));
      var xScale = d3.scaleTime().range([0, width-40]).domain([1990, 2015]);
      let yScale = d3.scaleLinear().range([height,0]).domain([(min - (min/5)), max]);
      var xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(5);
      var yAxis = d3.axisLeft(yScale);
      //if the value is NaN set to 0 for
      attributes.forEach(function(item, i) { if (!isFinite(item)) attributes[i] = 0; });
      //svg
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
      //axis
      var xAxis =  svg.append('g')
      .attr("class", "xAxis")
      .attr("transform", `translate(${leftPadding}, ${height})`)
      .call(xAxis);
      //set bars
      var bars = svg.selectAll('.infoBars')
      .data(attributes)
      .enter()
      .append('rect');
      bars.attr("x", (d, i) => i * (chartInnerWidth / attributes.length)+ leftPadding)
      .attr("height", function(d){let val=height - yScale(parseFloat(d));if(val<0){val=0;}return val;}) //checks if yScale is giving negative values when input is 0, if so returns a 0
      .attr("y", d => yScale(parseFloat(d)) + topBottomPadding)
      .attr("width", chartInnerWidth / attributes.length)
      .attr("transform", "translate(1,-5)")
      .style('fill', "#54278f");
    };

    //separate the world into regions
    function makeRegions(countries, regions){
      //make copy of blank regions
      let newRegions = JSON.parse(JSON.stringify(regions));
      //loop through countries and group into regions object
      for (let country in countries){
        let setRegion = countries[country].properties.REGION_UN;
        newRegions[setRegion].push(countries[country]);
        newRegions["All"].push(countries[country]);
      };
      return newRegions;
    };
    //filters countries to just the current region
    function filterRegions(layers){
      let currentRegions =[];
      layers.eachLayer(function(layer){
        if(layer.feature){
          currentRegions.push(layer.feature.properties);
        }
      })
      return currentRegions;
    };

    //update choropleth style in map
    function updateChoropleth(map, layers){
      //filter countries to just the current region
      let current = filterRegions(layers[region]);
      //create colorscale
      var colorScale = makeColorScale(current);
      //set color to each country in layer
      layers[region].eachLayer(function(layer){
        if(layer.feature){
          //current coutnry value
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
    //updating color scale for side bars
    function barColors(props, colorScale){
      //make sure attribute value is a number
      let val = parseFloat(props[year]);
      //if attribute value exists, assign a color; otherwise assign gray
      if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
      }
    };

    //ceate the side map for selecting regions
    function sideMap(mapView, layers, geojson, datasets){
      const regionColors = {
        Developed: "#458945",
        Latin_America_Caribbean: "#D7CC5A",
        Northern_Africa: "#FEE6A0",
        SubSaharan_Africa: "#F2A405",
        Central_Asia: "#B8CEB6",
        Southern_Asia: "#DDA563",
        Western_Asia: "#DC807D",
        Oceania: "#3BAFAF",
        Eastern_Asia: "#E6CBB3",
        SouthEastern_Asia: "#F9DA06"
      };

      //map container
      const map = d3.select("#regionSelector")
      .append("svg")
      .attr("class", "zoom")
      .attr("width", width)
      .attr("height", height);
      //set projection
      const projection = d3.geoNaturalEarth1()
      .center([10, 15])
      .scale(width *0.22)
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
      .style("fill", d => regionColors[d.properties.REGION_UN])
      .on("mousedown", d => zoom(d.properties.REGION_UN, mapView, layers, datasets));
      //button to zoom to all countries
      $('button').on('click',function(){
        zoom(this.className, mapView, layers, datasets) ;
      });
    };
    //function to clear layers from the map view, apparently doesn't delete them outright though
    function removeLayers(map){
      map.eachLayer(function(layer){
        //if the layer doesn't have attribution it's not the basemap, so we remove it
        if (!layer.options.attribution){
          map.removeLayer(layer);
        }
      })
    };
    //use sidebar dropdowns to control the dataset displaying in the map
    function changeData(indicator, mdg, world, regions, map, datasets){
      //if the overall dataset doesn't contain current dataset, add it
      if(!(datasets.hasOwnProperty(indicator))){
        //make new copy of world data
        let newWorld = JSON.parse(JSON.stringify(world));
        //filter main mdg csv to only the current dataset
        let current = mdg.filter(country => country.SeriesCode === indicator);
        //join to copy of the world data
        let currentcountries = joinData(current, newWorld);
        //push into regions array
        let currentRegions = makeRegions(currentcountries, regions);
        //group regions into a set to store in overall datasets object
        datasets[indicator] =  makeGroup(currentRegions);
      };
      //remove every layer in map but basemap
      removeLayers(map);
      //add current region from current dataset to the map
      datasets[indicator][region].addTo(map);
      //update the choropleth of the map
      updateChoropleth(map, datasets[indicator]);
      //update the colors
      //wipe the sidebar chart before updating with setChart()
      var elem = document.querySelector('.chart');
      elem.parentNode.removeChild(elem)
      setChart(map, datasets[indicator]);

    };
    //function to zoom to region when clicked in side map
    function zoom(newRegion, map, layers, datasets){
      //remove every layer in map but basemap
      removeLayers(map);
      let indicator = $("#indicators").val();
      //gets the id the element just clicked
      region = newRegion;
      //new region reigon
      let layer = datasets[indicator][region];
      layer.addTo(map);
      //hardcoded zooms for a few regions
      if (region == "All" || region == "Developed"){
        map.setView([20.1657, 10.4515], 2);
      } else if(region == "Oceania"){
        map.setView([-9.6457, 160.1562], 4);
      } else{
        //get the extent and bounds of the new layer and zoom to it
        let extent = layer.getBounds()
        let neLat = extent._northEast.lat;
        let neLng = extent._northEast.lng
        let swLat = extent._southWest.lat;
        let swLng = extent._southWest.lng
        map.fitBounds([
          [neLat,neLng], [swLat,swLng]
        ]);
      }
      //update map colors
      $("#regionName").html(regionNames[region]);
      updateChoropleth(map,datasets[indicator]);
      var elem = document.querySelector('.chart');
      elem.parentNode.removeChild(elem);
      setChart(map, datasets[indicator]);
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
      const colorClasses = ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f"];
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
    //join data from csv with geojson layer
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

    //control text in title bar
    function changeTitle(target, indicator){
      let currentTarget = d3.select("#CurrentTarget")//.append("text")
      .text(titleInfo[target]);
      let currentIndicator =  d3.select("#CurrentIndicator")//.append("text")
      .text(titleInfo[indicator]);
    };
    //update the indicator selector in the side bar
    function indicators(mdg, world, regions, map, datasets){
      //make blank copies of the region andworld objects
      var copyRegions = JSON.parse(JSON.stringify(regions));
      var copyWorld = JSON.parse(JSON.stringify(world));
      const indicatorList = {
        t5A : "<option value='553'>Maternal mortality ratio per 100,000 births</option> <option value='570'>% of births attended by skilled health personnel</option>",
        t5B : "<option value='730'>Contraceptive use for married women 15-49</option><option value='761'>Adolescent birth rate, per 1,000 women</option><option value='762'>% of antenatal care coverage, at least one visit</option>",
        t3A : "<option value='722'>% of women in non-agricultural wage employment</option><option value='557'>% of Seats held by women in national parliament</option>"
      }
      //value of current target
      var target = $("#targets").val();
      //value of current indicator
      var indicator = $("#indicators").val()
      changeTitle(target, indicator);
      //updates indicator/target
      $("#targets").change(function () {
        target = $(this).val();
        //update indicator list
        $("#indicators").html(indicatorList[target]);
        indicator = $("#indicators").val();
        //change in map data and title
        changeData(indicator, mdg, copyWorld, copyRegions, map, datasets);
        changeTitle(target, indicator);
      });
      //updates indicator
      $("#indicators").change(function(){
        indicator = $(this).val();
        //change in map data and title
        changeData(indicator, mdg, copyWorld, copyRegions, map, datasets);
        changeTitle(target, indicator);
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
      //set up Div for popup
      var infoDiv = document.querySelector('.info');
      //set popup info base on props
      if(!props){
        infoDiv.innerHTML = 'Hold down on a country for more information';
      }  else if(!notEmpty || !isFinite(props.SeriesCode)){
        infoDiv.innerHTML = `<b>${props.NAME_LONG}</b><br/>No Data Available`;
      } else if (isFinite(props.SeriesCode)){
        let num;
        if(0<props[year]){ num = props[year]} else {num = "N/A"}
        if (props.SeriesCode == 553 || props.SeriesCode == 761 || num == "N/A"){
          infoDiv.innerHTML = `<b>${props.NAME_LONG} - ${year}<br/>${props.Series}:</b> ${num}<br/><svg/>`;
        }else{
          infoDiv.innerHTML = `<b>${props.NAME_LONG} - ${year}<br/>${props.Series}:</b> ${num}%<br/><svg/>`;
      }
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
      //removed the popup (after it's been added) as soon as you move the mouse

      map.on('mouseup touchend', function(){
        updateInfo();
      });
      //updates infomation contained in popup div
      updateInfo();
    };
    //controls click for country popups, open when clicked
    function onEachFeature(feature, layer) {

      layer.on('mousedown touchstart', function(){
        updateInfo(layer.feature.properties, layer);
      });
    };
    //Create new sequence controls within map   //this is only looking at initial data
    function createSequenceControls(map, layers, datasets){
      let SequenceControl = L.control({ position: 'bottomleft'} );
      SequenceControl.onAdd = function(map) {
        // create the control container with a particular class name
        let container = L.DomUtil.create('div', 'sequence-container');
        //create timestamp container
        let stamp = L.DomUtil.create('div', 'timestamp-container');
        //create slider and buttons to progress time, add to container
        let slider = L.DomUtil.create("input", "range-slider");
        $(stamp).html(`<b>Year:</b>   ${year}` );
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
          let indicator = $("#indicators").val();
          var elem = document.querySelector('.chart');
          elem.parentNode.removeChild(elem);
          setChart(map,datasets[indicator]);
          updateChoropleth(map, datasets[indicator]);
          $(stamp).html("<b>Year:</b> " + year);
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
