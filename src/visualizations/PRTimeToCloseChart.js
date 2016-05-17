import SmoothedStream from "../utils/SmoothedStream";

export default class PRTimeToCloseChart {

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

    this.yScale = d3.time.scale()
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
    this.yScale.domain([d3.min(data, d => d.lowerBound), d3.max(data, d => d.upperBound)]);
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

    const selection =  this.langChart.selectAll(".boxwhisker")
       .data(data, d=>d.language);

    const flash = (selection)=>{
      selection.filter(d=>d.ping)
        .transition("colour")
          .style("stroke", "yellow")
          .duration(100)
        .delay(300)
        .transition("colour")
          .style("stroke", "#2BB3BB")
          .duration(1000)
    }

    // Draw and animate the boxes
    const boxX = (duration)=>(selection)=>{
      selection
        .transition("x")
          .attr("x", d => this.xScale(d.language))
          .attr("width", this.xScale.rangeBand())
          .duration(duration)
    }
    const boxY = (duration)=>(selection)=>{
      selection
        .transition("y")
          .attr("y", d => this.yScale(d.q3))
          .attr("height", d => {
            //console.log(`${d.language}: ${d.q1} - ${d.q3} or ${this.yScale(d.q1)} - ${this.yScale(d.q3)} = ${this.yScale(d.q1) - this.yScale(d.q3)}`)
            return this.yScale(d.q1) - this.yScale(d.q3)
          })
          .duration(duration)
    }

    const whisker = (duration)=>(selection)=>{
      selection.transition("whisker")
        .duration(duration)
        // The whiskers drawn as top whisker, median line, bottom whisker
        .attr("d",d=>`
          M ${this.xScale(d.language)} ${this.yScale(d.upperBound)}
          h ${this.xScale.rangeBand()}
          m ${-this.xScale.rangeBand()/2} 0
          V ${this.yScale(d.q3)}

          M ${this.xScale(d.language)} ${this.yScale(d.median)}
          h ${this.xScale.rangeBand()}

          M ${this.xScale(d.language)} ${this.yScale(d.lowerBound)}
          h ${this.xScale.rangeBand()}
          m ${-this.xScale.rangeBand()/2} 0
          V ${this.yScale(d.q1)}
          `)
    }

    // Using .each() on a selection so need to use old function(){} style
    const self = this
    const outliers = (duration)=>(selection)=>{
      selection.each(function(d){
        // `this` is now the selection for this data point
        // i.e. g.outliers
        const pointsInDomain = d.outliers.filter(o=>o>self.yScale.domain()[0]&&o<self.yScale.domain()[1])
        const circles = d3.select(this).selectAll("circle")
          .data(pointsInDomain, o=>o)

        circles.enter()
          .append("circle")
          .attr("r",10)
          .attr("cx",o=>self.xScale(d.language)+self.xScale.rangeBand()/2)
          .attr("cy",o=>self.yScale(o))
          .style("stroke-opacity", 0)

        circles.exit()
          .remove()

        circles.transition("circle")
          .duration(duration)
          .attr("cx",o=>self.xScale(d.language)+self.xScale.rangeBand()/2)
          .attr("cy",o=>self.yScale(o))
          .style("stroke-opacity", 0.5)
      })
    }

    const draw = (selection)=>{
      const entered = selection.enter()
        .append("g")
        .attr("class", "boxwhisker")
      entered.append("rect")
        .attr("class", "box")
        .call(boxX(0))
        .call(boxY(0))
      entered.append("path")
        .attr("class", "whisker")
        .call(whisker(0))
      entered.append("g")
        .attr("class", "outliers")
        .call(outliers(0))

      // Update to existing position
      selection.select(".box")
        .call(boxX(200))
        .call(boxY(500))
        .call(flash)
      selection.select(".whisker")
        .call(whisker(200))
        .call(flash)
      selection.select(".outliers")
        .call(outliers(500))
    }

    // Add new bars
    selection.call(draw)
  }

  /**
   * Adds a new event to the data being plotted.
   * @param {Event} event
   */
  processData(event){
    if(!event.closedAt)
      return;

    // tidy the data
    event.closedAt = new Date(event.closedAt)
    event.createdAt = new Date(event.createdAt)
    event.language = event.language || "N/A"

    let lang = this.wordGroups.find(d=>d.language == event.language)

    this.wordGroups.forEach(d=>d.ping = false)

    if(lang === undefined){
      lang = {language: event.language, closedPRs: [event]}
      this.wordGroups.push(lang)
    } else {
      lang.closedPRs.push(event)
    }

    if(lang.closedPRs.length <2)
      return;

    // set the new max, min, quartiles, etc.
    const durations = lang.closedPRs.map(pr => pr.closedAt - pr.createdAt).sort((a,b)=>a-b)
    lang.max = durations[durations.length-1]
    lang.min = durations[0]
    lang.median = durations[Math.floor((durations.length-1)/2)]
    lang.q1 = durations[Math.floor((durations.length-1)/4)]
    lang.q3 = durations[Math.floor(3*(durations.length-1)/4)]
    if(lang.q3==lang.q1)
      lang.q3 = durations[Math.floor(3*(durations.length-1)/4)+1]
    const iqr = lang.q3 - lang.q1
    const inRange = durations.filter(d=> d >= lang.q1-1.5*iqr && d <= lang.q3+1.5*iqr)
    lang.inRange = inRange
    lang.lowerBound = inRange[0]
    lang.upperBound = inRange[inRange.length -1]
    lang.outliers = durations.filter(d=> d < lang.q1-1.5*iqr || d > lang.q3+1.5*iqr)
    lang.ping = true

    console.log(lang)

    this.wordGroups.sort((a,b)=> a.closedPRs.length !== b.closedPRs.length ? b.closedPRs.length - a.closedPRs.length : a.language.localeCompare(b.language))
    this.updateChart(this.wordGroups.filter(d=>d.closedPRs.length>1));
  }

}
