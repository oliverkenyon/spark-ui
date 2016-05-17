import SmoothedStream from "../utils/SmoothedStream";

export default class LanguageStreamChart {

  constructor(elem, width, height, dataUrl){
    this.elem = elem;
    this.dataUrl = dataUrl;

    this.margin = {top: 40, right: 20, bottom: 50, left: 50};
    this.width = width - this.margin.left - this.margin.right;
    this.height = height - this.margin.top - this.margin.bottom;
  }

  /**
   * Connects websocket and starts processing and charting data.
   * Must be called after setup.
   */
  run(){
    new SmoothedStream(this.dataUrl,(d)=>this.processData(d),console.error).run()
  }

  /**
   * Sets up the scales and axes for the chart
   */
  setup(){
    this.wordGroups = []
    this.langChart = d3.select(this.elem).append("svg")
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

    this.langChart.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis);

    this.langChart.append("g")
       .attr("class", "y-axis")
       .call(this.yAxis)
       .append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 6)
       .attr("dy", ".71em")
       .style("text-anchor", "end")
       .text("Count");

    return this;
  }

  /**
   * Redraws the chart with the given data.
   * @param {Event[]} data
   */
  updateChart(data){
    this.yScale.domain([0, d3.max(data, function(d) { return d.count; })]);
    this.xScale.domain(data.map(function(d) { return d.language; }));

    this.langChart.select(".x-axis")
      .transition()
      .call(this.xAxis)
      .selectAll("text")
      .attr("transform", "rotate(90)")
      .attr("y", 0)
      .attr("x", 9)
      .duration(200)
    this.langChart.select(".x-axis").selectAll("text")
      .attr("dy", ".3em")
      .style("text-anchor", "start")

    this.langChart.select(".y-axis")
      .transition()
      .call(this.yAxis)
      .duration(200)

    const selection =  this.langChart.selectAll(".bar")
       .data(data, d=>d.language);

    // Add new bars
    selection.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => this.xScale(d.language))
      .attr("width", this.xScale.rangeBand())
      .attr("y", d => this.yScale(d.prev))
      .attr("height", d => this.height - this.yScale(d.prev))
      .style("fill", "yellow")

    // Move bars to the correct position
    selection
      .transition("x")
        .attr("x", d => this.xScale(d.language))
        .attr("width", this.xScale.rangeBand())
        .duration(200)
    selection
      .transition("y")
        .attr("y", d => this.yScale(d.count))
        .attr("height", d => this.height - this.yScale(d.count))
        .duration(500)

    // Flash the latest data point
    selection.filter(d=>d.ping)
      .transition("colour")
        .style("fill", "yellow")
        .duration(200)
      .delay(300)
      .transition("colour")
        .style("fill", "#2BB3BB")
        .duration(1000)
  }

  /**
   * Adds a new event to the data being plotted.
   * @param {Event} event
   */
  processData(event){
    event.language = event.language || "N/A"
    const lang = this.wordGroups.find(wg=>wg.language == event.language)

    this.wordGroups.forEach(wg=>wg.ping = false)

    if(lang === undefined){
      this.wordGroups.push({language: event.language, count: 1, prev: 0, ping: true})
    } else {
      lang.prev = lang.count;
      lang.count++
      lang.ping = true;
    }
    this.wordGroups.sort((a,b)=> a.count !== b.count ? b.count - a.count : a.language.localeCompare(b.language))
    this.updateChart(this.wordGroups);
  }

}
