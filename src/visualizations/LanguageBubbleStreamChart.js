import SmoothedStream from "../utils/SmoothedStream";

export default class LanguageBubbleStreamChart {

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
    this.bubbleChart = d3.select(this.elem).append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .attr("class", "bars")
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.scale = d3.scale.linear()
         .range([0, this.height]);

    this.force = d3.layout.force()
      .gravity(0.3)
      .charge(d=> -this.scale(d.count))
      .nodes(this.wordGroups)
      .size([this.width, this.height]);

    this.force.on("tick", e => {
      this.bubbleChart.selectAll("circle")
        .each(this.collide(.5))
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
      this.bubbleChart.selectAll("text")
        .attr("x", (d)=>d.x)
        .attr("y", (d)=>d.y)
    });


   return this;
  }

  collide(alpha) {
    const padding = 1.5;
    const quadtree = d3.geom.quadtree(this.wordGroups);
    const maxRadius = this.scale(d3.max(this.wordGroups.map(d=>d.count)))
    return (d) => {
      const r = d.radius + maxRadius + padding*2;
      const nx1 = d.x - r;
      const nx2 = d.x + r;
      const ny1 = d.y - r;
      const ny2 = d.y + r;
      quadtree.visit((quad, x1, y1, x2, y2) => {
        if (quad.point && (quad.point !== d)) {
          let x = d.x - quad.point.x;
          let y = d.y - quad.point.y;
          let l = Math.sqrt(x * x + y * y);
          const r = d.radius + quad.point.radius + padding;
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }

  /**
   * Redraws the chart with the given data.
   * @param {Event[]} data
   */
  updateChart(data){
    this.force.start()

    this.scale.domain([0, d3.sum(data, d => d.count*2)]);

    const selection = this.bubbleChart.selectAll(".bar")
      .data(data, d=>d.language);

    data.forEach(d=>d.radius=this.scale(d.count))

    selection.enter()
      .append("circle")
      .attr("class", "bar")
      .attr("r", d => this.scale(d.count))
      .style("fill", "yellow")
    this.bubbleChart.selectAll("text")
      .data(data, d=>d.language)
      .enter()
      .append("text")
      .attr("x", (d)=>d.x)
      .attr("y", (d)=>d.y)
      .text(d => d.language)
      .style("font-family", "sans-serif")
      .attr("text-anchor", ()=>`middle`)

    selection
      .transition("r")
         .attr("r", d => this.scale(d.count))
         .duration(500)

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
