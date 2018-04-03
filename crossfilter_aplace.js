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
var censusDictionary = null
var currentTopics = ["SE_T145_002","SE_T013_002","SE_T025_005","SE_T147_001"]

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
    censusDictionary = makeDictionary(census)
    
    basemap()
    setupCharts()
}
function makeDictionary(data){
    var formatted = {}
    for(var i in data){
        var gid = data[i]["Gid"]
        formatted[gid] = data[i]
    }
    return formatted
}
function replaceCurrentTopics(oldTopic,newTopic){
    var index = currentTopics.indexOf(oldTopic);
    if (index !== -1) {
        currentTopics[index] = newTopic;
    }
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
        
        var newTopic = this.value
        replaceCurrentTopics(currentKey,newTopic)

        var tcolumn = ndx.dimension(function(d){
          return parseFloat(d[ newTopic])
        })
        var tgroup = tcolumn.group()
        
        charts["_"+t].group(tgroup)
            .dimension(tcolumn)  
        charts["_"+t].render()

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
        var topics=currentTopics

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
function  getIds(filteredData){
    var gids = []
    filteredData.forEach(function (d) {
        var gid = d["Gid"].replace("14000US","1400000US")
        gids.push(gid);
    });
    return gids
}
function filtermap(filteredData){
    var filteredIds = getIds(filteredData)
    var filter =  ["in","AFFGEOID"].concat(filteredIds)
    map.setFilter("tracts", filter);
//    d3.selectAll(".smallMap").remove()
   // for(var i in filteredIds.slice(0,20)){
   //     var gid = filteredIds.slice(0,20)[i]
   //    // drawSmallMap(gid)
   // }
    
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
        filteredData=tcolumn.top(Infinity)
        filtermap(filteredData)
       var max = tcolumn.top(1)[0][topic]
       var min = tcolumn.bottom(1)[0][topic]
        d3.select("#reset_"+t).html(min+" - "+max+" <u>click to reset</u>")
           //charts[key].filterAll()
    })
}
function getFeatureData(geoId){
    var data = censusDictionary[geoId]
    dc.filterAll();
    
    for(var t in currentTopics){
        var topic = currentTopics[t]
        var value = parseFloat(data[topic])
        charts["_"+t].filter(dc.filters.RangedFilter(value-3, value+3));        
    }
    dc.redrawAll();
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
      //  map.setFilter("tracts", ["==",  "AFFGEOID", ""]);
        map.on("click",function(e){
            var features = map.queryRenderedFeatures(e.point,"tracts");
            var geoId = features[0]["properties"]["AFFGEOID"]
          //  filterByMap(map)
            getFeatureData(geoId)
        })
    })
}  