//load census data
//crossfilter
//export filtered data ids
//load map
//click on map filter
//var topics = ["SE_T025_006","SE_T025_007","SE_T025_004","SE_T025_005","SE_T025_002"]
var charts = {}
var filteredData = null
var map = null
var centroids = null
var names = null
var dataKeys = null
var census = null
queue()
    .defer(d3.csv,"census_filtered_population_10.csv")
    .defer(d3.json,"census_keys_short.json")
    .defer(d3.csv,"geo_names.csv")
    .defer(d3.csv,"centroids.csv")
    .await(dataDidLoad);
    
function dataDidLoad(error,censusfile,censusDictionaryFile,namesFile,centroidsFile){
    dataKeys = censusDictionaryFile
    census = censusfile
    names = namesFile
    centroids = centroidsFile
    
    basemap()
    setupCharts()
    
      
}
function addSelect(div,currentKey,ndx,t){
    var select = div.append("select").attr("class","dropdown").attr("id","dropdown"+t).attr("name","dropdown")
    var topics = Object.keys(dataKeys)
    for(var k in topics){
        if(topics[k]==currentKey){
            select.append("option").attr("class","option").attr("value",topics[k]).html(dataKeys[topics[k]]).attr("selected","selected")
        }else{
            select.append("option").attr("class","option").attr("value",topics[k]).html(dataKeys[topics[k]])
        }
    }
    document.getElementById("dropdown"+t).onchange=function(){
//        console.log(this.value)
        var newtopic = this.value
        var tcolumn = ndx.dimension(function(d){
          return parseFloat(d[ newtopic])
        })
        var tgroup = tcolumn.group()
        
        charts["_"+t].group(tgroup)
            .dimension(tcolumn)  
        
        charts["_"+t].render()
//        d3.select("#chart_"+t).remove()
//       // d3.select("#reset"+div).remove()
//        d3.select("#"+currentKey).append("div")
//        .attr("id","chart_"+t).attr("class","chartContent")
//        drawBar(column,ndx)
    }
}
function setupCharts(){
    var ndx = dc.crossfilter(census)
    var all = ndx.groupAll()
    
    dc.dataCount("#count")
        .dimension(ndx)
        .group(all)
        .html({
            some:"%filter-count Selected Out of <strong>%total-count</strong> Tracts | <a href='javascript:dc.filterAll(); dc.renderAll();''>Reset All</a><br/>",
            all:"%total-count Tracts<br/>"
        })
        //SE_T145_002
        var topics=["SE_T145_002","SE_T013_002","SE_T025_005","SE_T147_001"]

    for(var t in topics){
        var topic = topics[t]
        setupBar(topic,ndx,t)
        drawBar(topic,ndx,t)
    }
    dc.renderAll();
    
}
function setupBar(topic,ndx,t){
    var chartContainer = d3.select("#charts")
            .append("div")
            .attr("class","row")
            .attr("id","_"+t)
    var chartTitle = addSelect(chartContainer,topic,ndx,t)
    var chartFilter = chartContainer.append("div")
            .attr("class","reset")
            .html(" <br/>")
            .on("click",function(){
                charts["_"+t].filterAll()
                dc.redrawAll()
                d3.select("#reset_"+t).html(" <br/>")
            })
            .style("cursor","pointer")
            .attr("id","reset_"+t)
    var chartContent = chartContainer.append("div")
        .attr("id","chart_"+t).attr("class","chartContent")
}
function drawBar(topic,ndx,t){
    var tcolumn = ndx.dimension(function(d){
      return parseFloat(d[topic])
    })
    var tgroup = tcolumn.group()
    var max = tcolumn.top(1)[0][topic]
    var min = tcolumn.bottom(1)[0][topic]    
    var width = $("#chart_"+t).innerWidth()
    charts["_"+t] =dc.barChart("#chart_"+t)
    
//    console.log([min,max])
    
    charts["_"+t].width(width)
            .height(100)
            .ordinalColors(["#63D965"])
            .margins({top: 20, left: 40, right: 10, bottom: 20})
            .group(tgroup)
            .dimension(tcolumn)   
            .elasticY(true)       
            .x(d3.scale.linear().domain([0, max]))
    
     charts["_"+t].xAxis().ticks(3)
     charts["_"+t].yAxis().ticks(3)
    
    charts["_"+t].on("filtered",function(){
       // filteredData=column.top(Infinity)
      //  filtermap(filteredData)
       var max = tcolumn.top(1)[0][topic]
       var min = tcolumn.bottom(1)[0][topic]
        d3.select("#reset_"+t).html(min+" - "+max+" <u>click to reset</u>")
           //charts[key].filterAll()
    })
}

function basemap(){
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jjjiia123/cjfgqj2dscri62ro3h9ysrzi3',
        center: [-96, 37.8],
        zoom: 4
    });

    map.on("load",function(){
        map.setFilter("tracts", ["==",  "AFFGEOID", ""]);
        map.on("click",function(){
          //  filterByMap(map)
        })
    })
    console.log("map")
}  