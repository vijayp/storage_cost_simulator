var parseUserData = function() {
    rval = {};
    rval["items_per_month"] = parseFloat($("#items_per_month").val());
    rval["size_per_item"] = parseFloat($("#size_per_item").val());
    rval["growth_rate_r"] = parseFloat($("#growth_rate_r").val());
    rval["storage_cost_per_byte"] = parseFloat($("#storage_cost_per_byte").val());
    rval["bw_cost_per_byte"] = parseFloat($("#bw_cost_per_byte").val());
    rval["qps_peak"] = parseFloat($("#qps_peak").val());
    rval["qps_ratio"] = parseFloat($("#qps_ratio").val());
    rval["frac_undelivered_messages"] = parseFloat($("#frac_undelivered_messages").val());
    rval["fanout"] = parseFloat($("#fanout").val());
    rval.frac_qpm = rval.qps_peak*rval.qps_ratio * 3600*24*30;
    return rval;
};


var makeGraph2 = function(data1, data2) {
    // from https://gist.github.com/benjchristensen/2579619
        /* implementation heavily influenced by http://bl.ocks.org/1166403 */
        /* some arguments AGAINST the use of dual-scaled axes line graphs can be found at http://www.perceptualedge.com/articles/visual_business_intelligence/dual-scaled_axes.pdf */
        
        // define dimensions of graph
        var m = [80, 80, 80, 80]; // margins
        var w = 800 - m[1] - m[3];  // width
        var h = 800 - m[0] - m[2]; // height
        
        // create a simple data array that we'll plot with a line (this array represents only the Y values, X will just be the index location)
        var allData = data1.concat(data2);
        var allMax = Math.max.apply(null, allData);
        // X scale will fit all values from data[] within pixels 0-w
        var x = d3.scale.linear().domain([0, data1.length]).range([0, w]);
        // Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
        var y1 = d3.scale.linear().domain([0, allMax]).range([h, 0]);
        var y2 = d3.scale.linear().domain([0, allMax]).range([h, 0]);
            // automatically determining max range can work something like this
            // var y = d3.scale.linear().domain([0, d3.max(data)]).range([h, 0]);
 
        // create a line function that can convert data[] into x and y points
        var line1 = d3.svg.line()
            // assign the X function to plot our line as we wish
            .x(function(d,i) { 
                // verbose logging to show what's actually being done
                console.log('Plotting X1 value for data point: ' + d + ' using index: ' + i + ' to be at: ' + x(i) + ' using our xScale.');
                // return the X coordinate where we want to plot this datapoint
                return x(i); 
            })
            .y(function(d) { 
                // verbose logging to show what's actually being done
                console.log('Plotting Y1 value for data point: ' + d + ' to be at: ' + y1(d) + " using our y1Scale.");
                // return the Y coordinate where we want to plot this datapoint
                return y1(d); 
            })
            
        // create a line function that can convert data[] into x and y points
        var line2 = d3.svg.line()
            // assign the X function to plot our line as we wish
            .x(function(d,i) { 
                // verbose logging to show what's actually being done
                console.log('Plotting X2 value for data point: ' + d + ' using index: ' + i + ' to be at: ' + x(i) + ' using our xScale.');
                // return the X coordinate where we want to plot this datapoint
                return x(i); 
            })
            .y(function(d) { 
                // verbose logging to show what's actually being done
                console.log('Plotting Y2 value for data point: ' + d + ' to be at: ' + y2(d) + " using our y2Scale.");
                // return the Y coordinate where we want to plot this datapoint
                return y2(d); 
            })
 
 
            // Add an SVG element with the desired dimensions and margin.
            var graph = d3.select("#chart").append("svg:svg")
                  .attr("width", w + m[1] + m[3])
                  .attr("height", h + m[0] + m[2])
                .append("svg:g")
                  .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
 
            // create yAxis
            var xAxis = d3.svg.axis().scale(x).tickSize(-h).tickSubdivide(true);
            // Add the x-axis.
            graph.append("svg:g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + h + ")")
                  .call(xAxis);
 
 /*
            // create left yAxis
            var yAxisLeft = d3.svg.axis().scale(y1).ticks(4).orient("left");
            // Add the y-axis to the left
            graph.append("svg:g")
                  .attr("class", "y axis axisLeft")
                  .attr("transform", "translate(-15,0)")
                  .call(yAxisLeft);
 */
            // create right yAxis
            var yAxisRight = d3.svg.axis().scale(y2).ticks(30).orient("left").tickSubdivide(true);
            // Add the y-axis to the right
            graph.append("svg:g")
                  .attr("class", "y axis axisRight")
                  .attr("transform", "translate(-15,0)")
                  .call(yAxisRight)
                  ;
            graph.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y", 6)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("Cost (thousands of $)");

            // add lines
            // do this AFTER the axes above so that the line is above the tick-lines
            graph.append("svg:path").attr("d", line1(data1)).attr("class", "data1");
            graph.append("svg:path").attr("d", line2(data2)).attr("class", "data2");
            graph.append("text")
                .attr("class", "x label")
                .attr("text-anchor", "end")
                .attr("x", w)
                .attr("y", h - 6)
                .text("Months");

};

var generateTableWithStorage = function(data, max, done, table) {
    table = table ? table : [];
    var thisMonth,lastMonth;
    if (done === max) {
        return table;
    }
    if (!done) {
        done = 0;
        thisMonth = {items_this_month:data.items_per_month};
        lastMonth = null;
    } else {
        lastMonth = table[done-1];
        thisMonth = {items_this_month: lastMonth.items_this_month * Math.exp(data.growth_rate_r)};
    }
    thisMonth.month = done;
    thisMonth.bytes_uploaded = data.size_per_item * thisMonth.items_this_month;
    thisMonth.total_storage = thisMonth.bytes_uploaded + (lastMonth ? lastMonth.total_storage:0);
    thisMonth.bandwidth = thisMonth.bytes_uploaded + (lastMonth? (lastMonth.total_storage * data.frac_qpm) : 0); //TODO: scale down images
    thisMonth.storageCost = thisMonth.total_storage * data.storage_cost_per_byte;
    thisMonth.bwCost = thisMonth.bandwidth * data.bw_cost_per_byte;
    thisMonth.totalCost = thisMonth.bwCost + thisMonth.storageCost;
    thisMonth.annualizedCost = thisMonth.totalCost * 12;
    table.push(thisMonth);
    return generateTableWithStorage(data, max, done+1, table);
};

var generateTableWithoutStorage = function(data, max, done, table) {
    table = table ? table : [];
    var thisMonth,lastMonth;
    if (done === max) {
        return table;
    }
    if (!done) {
        done = 0;
        thisMonth = {items_this_month:data.items_per_month};
        lastMonth = null;
    } else {
        lastMonth = table[done-1];
        thisMonth = {items_this_month: lastMonth.items_this_month * Math.exp(data.growth_rate_r)};
    }
    thisMonth.month = done;
    thisMonth.bytes_uploaded = data.size_per_item * thisMonth.items_this_month;
    thisMonth.total_storage = (thisMonth.bytes_uploaded + (lastMonth ? lastMonth.total_storage:0)) * data.frac_undelivered_messages;
    thisMonth.bandwidth = thisMonth.bytes_uploaded + (lastMonth? (lastMonth.total_storage * data.frac_qpm) : 0); //TODO: scale down images
    thisMonth.storageCost = thisMonth.total_storage * data.storage_cost_per_byte;
    thisMonth.bwCost = thisMonth.bandwidth * data.bw_cost_per_byte * (data.fanout);
    thisMonth.totalCost = thisMonth.bwCost + thisMonth.storageCost;
    thisMonth.annualizedCost = thisMonth.totalCost * 12;
    table.push(thisMonth);
    return generateTableWithoutStorage(data, max, done+1, table);
};

var writeRow = function(row, $table) {
    var $tr = $('<tr>');
    for (var i = 0; i < row.length; ++i) {
        var $td = $('<td>');
        $td.text(row[i]);
        $tr.append($td);
    }
    $table.append($tr);
};

var writeTable = function(table, selector) {

    var HEADERS  = ['month', 'items_this_month', 'bytes_uploaded', 'total_storage', 'storageCost', 'bandwidth', 'bwCost', 'totalCost', 'annualizedCost'];
    $(selector).empty();
    var $table = $(selector);
    // get headers
    var row = [];
    for (var k in HEADERS) {
        row.push(HEADERS[k]);
    }
    writeRow(row, $table);
    for (var i = 0; i < table.length; ++i) {
        row = [];
        for (k in HEADERS) {
            var str = table[i][HEADERS[k]].toPrecision(3);
            if (HEADERS[k].indexOf('Cost') !== -1) {
                str = '$ ' + str;
            }
            row.push(str);
        }
        writeRow(row, $table);
    }

};

$(function(){
    $('#show-raw-data').click(function() {
        $('#data-container').show();
        $('#show-raw-data').hide();
    });
    var simulate = function() {
              $('#chart').empty();
        var data = parseUserData();
        console.log(JSON.stringify(data));
        var max = 12*7;
        var table2 = generateTableWithoutStorage(data, max);
        var table1 = generateTableWithStorage(data, max);
        var data1 = [];
        var data2 = [];
        for (var i = 0; i < max; ++i) {
            data1.push(table1[i].annualizedCost/1000.0);
            data2.push(table2[i].annualizedCost/1000.0);
        }
        makeGraph2(data1, data2);
        writeTable(table1, '#data-table');
        writeTable(table2, '#data-table-2');
        $('#chart-container').show();
      };
    $('#simulate_fb').click(simulate);
    $('input').keyup(simulate);
    simulate();
});
