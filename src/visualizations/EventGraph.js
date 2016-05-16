export default class EventGraph {

  constructor(parent, width, height) {
    this.parent = parent;

    this.margin = {top: 20, right: 20, bottom: 60, left: 50},

    this.width = 960 - this.margin.left - this.margin.right,
    this.height = 500 - this.margin.top - this.margin.bottom;

    this.data = [];
    this.eventTypesMap = {};
    this.pointsToShow = 25;

    this.millisecondsToKeepData = (60 * 1000);

    this.eventTypes = [
      "CommitCommentEvent",
      "CreateEvent",
      "DeleteEvent",
      "DeploymentEvent",
      "DeploymentStatusEvent",
      "FollowEvent",
      "ForkEvent",
      "ForkApplyEvent",
      "DownloadEvent",
      "GistEvent",
      "GollumEvent",
      "IssueCommentEvent",
      "IssuesEvent",
      "MemberEvent",
      "MembershipEvent",
      "PageBuildEvent",
      "PublicEvent",
      "PullRequestEvent",
      "PullRequestReviewCommentEvent",
      "PushEvent",
      "ReleaseEvent",
      "RepositoryEvent",
      "StatusEvent",
      "TeamAddEvent",
      "WatchEvent"
    ];

    this.xScale = d3.scale.linear()
      .range([0, this.width]);

    var maxEventsPerPayload = 100;
    this.yScale = d3.scale.linear()
      .range([this.height, 0])
      .domain([0, maxEventsPerPayload]);

    this.colorScale = d3.scale.category20();

    this.xAxis = d3.svg.axis()
      .scale(this.xScale)
      .tickFormat( d => {
        var date = new Date(d);
        return date.toLocaleTimeString();

      })
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.yScale)
      .orient("left");

    this.initializeSvg();
  }

  initializeSvg() {
      this.svg = this.parent.append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .attr("overflow", "visible")
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

      this.area = d3.svg.area()
        .x(d => { return this.xScale(d.timestamp); })
        .y0(d => { return this.yScale(d.y0); })
        .y1(d => { return this.yScale(d.y0 + d.y); })
        .interpolate("basis");

      this.stack = d3.layout.stack()
        .values(d => { return d.values; } );

      this.svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + this.height + ")");

      this.svg.append("g")
        .attr("class", "y-axis");

      this.graphArea = this.svg.append("svg")
        .attr("id", "graphArea")
        .attr("width", this.width)
        .attr("height", this.height)
        .on("mouseenter", () => { this.showVerticalLine(); })
        .on("mouseleave", () => { this.hideVerticalLine(); })
        .on("mousemove", () => {this.updateVerticalLine(); });

      this.tip = d3.tip()
        .attr('class', 'event-graph-tip')
        .offset(() => {
          var mousex = d3.mouse(this.tipTarget);
          var boundingBox = this.tipTarget.getBBox();
          var centrex = (boundingBox.width / 2) + boundingBox.x;

          var xoffset = mousex[0] - centrex;
          var yoffset = mousex[1] - boundingBox.y - 5;  // A few pixels above mouse so we don't get mouseleave events when the cursor is moved upwards
          return [yoffset, xoffset];
        })
        .html(function(d) {
          return d.name;
        });

      this.svg.call(this.tip);
  }

  showVerticalLine() {
    var mousex = d3.mouse(this.graphArea.node());
    mousex = mousex[0] + 5;

    verticalLine = this.graphArea
     .append("rect")
     .attr("class", "verticalLine")
     .attr("width", "1")
     .attr("height", this.height)
     .attr("fill", "#fff")
     .attr("y", 0)
     .attr("x", mousex);
  }

  hideVerticalLine() {
    d3.select(".verticalLine").remove();
  }

  updateVerticalLine() {
    var mousex = d3.mouse(this.graphArea.node());
    mousex = mousex[0] + 5;

    d3.select(".verticalLine").
      attr("x", mousex);
  }

  onData(eventSummary) {
      this.colorScale.domain(this.eventTypes);

      this.nextMostRecentTimestamp = this.mostRecentTimestamp;
      this.mostRecentTimestamp = parseInt(eventSummary.timestamp);

      this.pushNewDataPoint(eventSummary);
      this.update();
  }

  pushNewDataPoint(eventSummary) {
    var typesInSummary = Object.keys(eventSummary).filter( key => { return key != "timestamp"; });

    // For all the event types in the payload, we either add a new even type to the data if not seen before,
    // or we add a new value to the existing event type.
    this.eventTypes.forEach(eventType => {
      var y = 0;
      if (eventSummary.hasOwnProperty(eventType)) {
        y = parseInt(eventSummary[eventType]);
      }
      var point = {
        "y":  y,
        timestamp: eventSummary.timestamp
      };

      if (eventType in this.eventTypesMap) {
        var index = this.eventTypesMap[eventType];
        this.data[index].values.push(point);
      }
      else {
        this.eventTypesMap[eventType] = this.data.length;
        this.data.push({ "name": eventType, values: [point] });
      }
    });
  }

  updateHorizontalScale() {
    var oldestTimestamp = this.data[0].values[0].timestamp;
    var isFull = this.data[0].values.length == this.pointsToShow;

    var oldestTimeToDisplay;
    if (isFull) {
      oldestTimeToDisplay = oldestTimestamp;
    }
    else {
      oldestTimeToDisplay = this.mostRecentTimestamp - this.millisecondsToKeepData;
    }

    this.xScale.domain([oldestTimeToDisplay, this.mostRecentTimestamp]);
  }

  updateVerticalScale() {
    var totals = {};
    this.data.forEach( d => {
      var total = 0;
      d.values.forEach( v => {
        if (totals.hasOwnProperty(v.timestamp)) {
          totals[v.timestamp] += v.y;
        }
        else {
          totals[v.timestamp] = v.y;
        }
      })
    });

    totalsArray = Object.keys(totals).map(key => { return totals[key] } );
    var maxEventsPerTimestamp = Math.max(...totalsArray);

    this.yScale.domain([0, maxEventsPerTimestamp]);
  }

  clearOldData() {
    this.data = this.data.map( d => {
      return {
        "name": d.name,
        values: d.values.slice(Math.max(d.values.length - this.pointsToShow, 0), d.values.length)
      };
    })
  }

  update() {
    var eventStacks = this.stack(this.data.filter( d => {
      return d.values.length > 1;  // Filter out event types where we've not had at least 2 data points
    }));

    var selection = this.graphArea.selectAll(".eventStack")
      .data(eventStacks, function(d) { return d.name; });

    selection
      .enter()
      .append("g")
      .attr("class", "eventStack")
      .on('mouseleave', this.tip.hide)
      .append("path")
      .attr("class", "area")
      .style("fill", d => { return this.colorScale(d.name); })
      .attr("stroke", "#f5f5f5")
      .attr("stroke-width", "0px");

    this.updateHorizontalScale();
    this.updateVerticalScale();

    selection.select(".area")
        .attr("transform", "translate(" + (this.xScale(this.mostRecentTimestamp + (this.mostRecentTimestamp - this.nextMostRecentTimestamp)) - this.xScale(this.mostRecentTimestamp)) + ")")
        .attr("d", d => { return this.area(d.values); })
        .transition()
        .duration(1000)
        .ease("linear")
        .attr("transform", "translate(0,0)");

    var localThis = this;
    this.graphArea.selectAll(".eventStack")
      .on("mouseenter", function(d, i) {
        localThis.tipTarget = this;
        localThis.tip.show(d);
        localThis.graphArea.selectAll(".eventStack")
        .transition()
        .duration(250)
        .attr("opacity", function(d, j) {
          return j == i ? 1 : 0.6;
        });
      })
      .on("mouseleave", (d, i) => {
        this.graphArea.selectAll(".eventStack")
          .transition()
          .duration(250)
          .attr("opacity", 1);
      })
      .on("mousemove", (d, i) => {
        this.tip.hide();
        this.tip.show(d);
      });

    this.graphArea.selectAll(".area")
      .on("mouseenter", function(d, i) {
          d3.select(this)
            .attr("stroke-width", "2px");
      })
      .on("mouseleave", function(d, i) {
        d3.select(this)
          .attr("stroke-width", "0px");
      })

    this.svg.select(".x-axis")
      .call(this.xAxis)
      .selectAll("text")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".3em")
      .attr("transform", "rotate(90)")
      .style("text-anchor", "start");

    this.svg.select(".y-axis")
      .call(this.yAxis);

    this.clearOldData();
  }
}
