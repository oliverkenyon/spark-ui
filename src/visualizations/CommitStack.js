export default class CommitStack {
  constructor(parent, width, height, dataStreamer) {
    this.parent = parent;

    this.margin = {top: 40, right: 20, bottom: 30, left: 40};

    this.width = width - this.margin.left - this.margin.right;
    this.height = height - this.margin.top - this.margin.bottom;

    this.dataStreamer = dataStreamer;
    this.isStarted = false;

    this.fallHeight = Math.round(height / 3);

    this.languagesToShow = 20;

    this.commits = [];

    this.initializeSvg();
    this.createButtons();

    this.dataStreamer.subscribe(this);
  }

  initializeSvg() {
    this.svg = this.parent.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .attr("class", "bars")
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.xScale= d3.scale.ordinal()
      .rangeRoundBands([0, this.width], 0.5);

    this.yScale = d3.scale.linear()
        .range([this.height - this.fallHeight, 0]);

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
       .attr("transform", "translate(0," + this.fallHeight + ")")
       .call(this.yAxis)
       .append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 6)
       .attr("dy", ".71em")
       .style("text-anchor", "end")
       .text("File count");

     this.tip = d3.tip()
       .attr('class', 'd3-tip')
       .offset([-10, 0])
       .html(function(d) {
         return "Total files commited: <span style='color:red'>" + d.totalCount + "</span>";
       });

    this.svg.call(this.tip);
  }

  createButtons() {
    this.parent.append("button")
      .text("Start")
      .attr("onclick", "uiHandler.startCommitStack()");

    this.parent.append("button")
      .text("Stop")
      .attr("onclick", "uiHandler.stopCommitStack()");
  }

  start() {
    this.dataStreamer.start();
  }

  stop() {
    this.dataStreamer.stop();
  }

  onData(commit) {
    var index = this.findIndex(commit);
    if (index == -1) {
      commit.index = this.commits.length;
      commit.lastCount = 0;
      this.commits.push(commit);
    }
    else {
      this.commits[index].lastCount = this.commits[index].totalCount;
      this.commits[index].totalCount += commit.totalCount;
    }

    this.reorderData();
    commit.index = this.findIndex(commit);
    commit.oldIndex = this.commits[commit.index].oldIndex;

    var oldYScale = d3.scale.linear()
        .range([this.height - this.fallHeight, 0]);

    oldYScale.domain(this.yScale.domain());

    this.yScale.domain([0, d3.max(this.commits, function(d) { return d.totalCount; })]);
    this.xScale.domain(this.commits.filter((d, i) => { return d.index < this.languagesToShow; }).map(d => { return d.index; }));
    this.xAxis.tickFormat((d,i) => { return this.commits[d].mostCommonExtension; });

    this.svg.select(".x-axis")
    .call(this.xAxis)
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".3em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");

    this.svg.select(".y-axis").call(this.yAxis);

    this.animateFallingBlock(commit, oldYScale);
    this.updateBars(commit);
  }

  getShownLanguageNames() {
    var names = [];
    for( var i = 0; i < this.commits.length && i < this.languagesToShow; ++i) {
      names.push(this.commits[i].mostCommonExtension);
    }

    return names;
  }

  reorderData() {
      this.commits.sort(function(a,b) { return b.totalCount - a.totalCount});
      for( var i = 0; i < this.commits.length; ++i) {
        this.commits[i].oldIndex = this.commits[i].index;
        this.commits[i].index = i;
      }
  }

  findIndex(commit) {
    for( var i = 0; i < this.commits.length; ++i) {
      if (this.commits[i].mostCommonExtension == commit.mostCommonExtension) {
        return i;
      }
    }
    return -1;
  }

  animateFallingBlock(commit, oldYScale) {
    if (commit.index >= this.languagesToShow) {
      return;
    }

    var blockHeight = (this.height - this.fallHeight - this.yScale(commit.totalCount));

     this.svg.append("rect")
      .attr("class", "falling-bar")
      .attr("width", this.xScale.rangeBand())
      .attr("height", blockHeight)
      .attr("x", this.xScale(commit.index))
      .attr("y", 0)
      .transition()
      .duration(1000)
      .attr("y", this.yScale(this.commits[commit.index].totalCount - commit.totalCount) - blockHeight + this.fallHeight) // TODO: Can simplify using lastCount
      .remove();

  }

  updateBars(commit) {
    // TODO: These locals can be eliminated by using lamdba expressions
    var localXScale = this.xScale;
    var localYScale = this.yScale;
    var localHeight = this.height - this.fallHeight;

    var selection =  this.svg.selectAll(".bar")
       .data(this.commits);

       selection.enter()
         .append("rect")
         .attr("class", "bar")
         .attr("height", 0)
         .attr("transform", "translate(0," + this.fallHeight + ")")
         .on('mouseover', this.tip.show)
         .on('mouseout', this.tip.hide);

       selection
        .filter((d, i) => { return i < this.languagesToShow && i != commit.index;})
        .attr("x", function(d) { return localXScale(d.index); })
        .attr("width", this.xScale.rangeBand())
        .attr("y", function(d) { return localYScale(d.totalCount); })
        .attr("height", function(d) { return localHeight - localYScale(d.totalCount); });

        selection
         .filter((d, i) => { return i < this.languagesToShow && i == commit.index;})
         .attr("x", function(d) { return localXScale(d.index); })
         .attr("width", this.xScale.rangeBand())
         .attr("y", function(d) { return localYScale(d.lastCount); })
         .attr("height", function(d) { return localHeight - localYScale(d.lastCount); })
         .transition()
           .delay(900)
           .duration(1)
           .attr("y", function(d) { return localYScale(d.totalCount); })
           .attr("height", function(d) { return localHeight - localYScale(d.totalCount); });
  }

}
