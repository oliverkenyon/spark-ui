export default class LanguageGraph {
  constructor(parent, width, height, dataURL) {
    this.parent = parent;
    this.dataURL = dataURL;

    this.margin = {top: 40, right: 20, bottom: 50, left: 50};

    this.width = width - this.margin.left - this.margin.right;
    this.height = height - this.margin.top - this.margin.bottom;
  }

  initialize() {
    this.initializeSvg();
    this.refresh();
  }

  initializeSvg() {
    // TODO: Very similar to commit stack, refactor?
    this.svg = this.parent.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .attr("class", "bars")
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.xScale= d3.scale.ordinal()
      .rangeRoundBands([0, this.width], 0.5);

    this.yScale = d3.scale.linear()
        .range([this.height, 0]);

    this.xAxis = d3.svg.axis()
      .scale(this.xScale)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.yScale)
      .orient("left");

    this.svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis);


    this.svg.append("g")
       .attr("class", "y-axis")
       .call(this.yAxis)
       .append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 6)
       .attr("dy", ".71em")
       .style("text-anchor", "end")
       .text("Count");

    this.parent.append("button")
      .attr("onclick", "uiHandler.refreshLanguageGraph();")
      .text("Refresh");

    this.tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return "Files commited: <span style='color:red'>" + d.count + "</span>";
      });

    this.svg.call(this.tip);
  }

  refresh() {
      d3.json(this.dataURL, (error, json) => { this.onDataReceived(error, json); });
  }

  onDataReceived(error, json) {
    if (error) {
      console.info("Error retrieving json:");
      console.info(error);
      return;
    }

    this.updateBars(json);
  }

  updateBars(json) {
    this.yScale.domain([0, d3.max(json, function(d) { return d.count; })]);
    this.xScale.domain(json.map(function(d) { return d.extension; }));

    this.svg.select(".x-axis")
    .call(this.xAxis)
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".3em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");

    this.svg.select(".y-axis").call(this.yAxis);

    var selection =  this.svg.selectAll(".bar")
       .data(json);

   selection.enter()
     .append("rect")
     .attr("class", "bar");

   selection
    .attr("x", d => { return this.xScale(d.extension); })
    .attr("width", this.xScale.rangeBand())
    .attr("y", d => { return this.yScale(d.count); })
    .attr("height", d => { return this.height - this.yScale(d.count); })
    .on('mouseover', this.tip.show)
    .on('mouseout', this.tip.hide);
  }
}
