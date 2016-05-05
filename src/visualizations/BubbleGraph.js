export default class BubbleGraph {
  constructor(parent, width, height, numberToStore, dataStreamer) {
    this.parent = parent;
    this.width = width;
    this.height = height;
    this.numberToStore = numberToStore;
    this.dataStreamer = dataStreamer;

    this.biggestId = 0;
    this.bubbles = [];

    this.initializeSvg();
    this.createButtons();
    this.dataStreamer.subscribe(this);
  }

  initializeSvg() {
    this.svg = this.parent.append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .attr("class", "bubbles");

    this.colorScale = d3.scale.category20c()
      .domain(["JavaScipt", "Java", "Python", "CSS", "PHP", "Ruby", "C++", "C", "Shell"]);

    this.sizeScale = d3.scale.linear()
        .domain([0, 50])  // File counts of 1-50 will produce proportionally sized bubbles, bigger commits will be clamped at the height of the graph
        .range([0, this.height/2])
        .clamp(true);

    this.tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) { return "<p><strong>Files changed:</strong> " + d.totalCount + "</p><p><strong>Language:</strong> " + d.mostCommonExtension + "</p>" })
            .direction('se');

    this.svg.call(this.tip);
  }

  createButtons() {
    this.parent.append("button")
      .text("Start")
      .attr("onclick", "uiHandler.startBubbleGraph()");

    this.parent.append("button")
      .text("Stop")
      .attr("onclick", "uiHandler.stopBubbleGraph()");
  }

  start() {
    this.dataStreamer.start();
  }

  stop() {
      this.dataStreamer.stop();
  }

  onData(commit) {
    commit.cx = Math.random() * this.width;
    commit.id = "bubble" + (++this.biggestId);

    if (this.bubbles.length == this.numberToStore) {
          this.bubbles.shift();
    }

    this.bubbles.push(commit);
    this.update();
  }

  update() {
    var selection =  this.svg.selectAll("circle")
       .data(this.bubbles, function(commit) { return commit.id });

       var colorScale = this.colorScale;
       var sizeScale = this.sizeScale;

    selection.enter()
      .append("circle")
      .attr("id", function(d) { return d.id })
      .attr("cx", function(d) { return d.cx })
      .attr("cy", this.height/2)
      .attr("r", 1)
      .attr("fill-opacity", 0.75)
      .style("fill", function(d) { return colorScale(d.mostCommonExtension) } )
      .on("mouseover", this.tip.show)
      .on("mouseout", this.tip.hide)
      .transition()
         .attr("r", function(d) { return sizeScale(d.totalCount)});

    selection.exit()
      .transition()
      .duration(2000)
      .attr("fill-opacity", 0)
      .remove();
  }


}
