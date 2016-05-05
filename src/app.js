"use strict";

import CommitStack from "./visualizations/CommitStack";
import BubbleGraph from "./visualizations/BubbleGraph";
import LanguageGraph from "./visualizations/LanguageGraph";
import UIHandler from "./utils/UIHandler";
import DataStreamer from "./utils/DataStreamer";

var uiHandler = null;

$(function () {
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    var baseURL = "http://localhost:9021/"

    var languageGraph = new LanguageGraph(d3.select("#bar-graph"), 960, 500, baseURL + "files?limit=30");
    languageGraph.initialize();

    var commitStackDataStreamer = new DataStreamer(baseURL + "commits");
    var commitStack = new CommitStack(d3.select("#commit-stack"), 960, 750, commitStackDataStreamer);

    var bubbleGraphDataStreamer = new DataStreamer(baseURL + "commits");
    var bubbleGraph = new BubbleGraph(d3.select("#commit-bubbles"), 960, 300, 1, bubbleGraphDataStreamer);

    uiHandler = new UIHandler(languageGraph, commitStack, bubbleGraph);
});
