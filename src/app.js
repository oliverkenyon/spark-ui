"use strict";

import CommitStack from "./visualizations/CommitStack";
import BubbleGraph from "./visualizations/BubbleGraph";
import LanguageGraph from "./visualizations/LanguageGraph";
import LanguageStreamChart from "./visualizations/LanguageStreamChart";
import LanguageBubbleStreamChart from "./visualizations/LanguageBubbleStreamChart";
import PRTimeToCLoseChart from "./visualizations/PRTimeToCLoseChart";
import UIHandler from "./utils/UIHandler";
import DataStreamer from "./utils/DataStreamer";

var uiHandler = null;

$(function () {
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    const baseURL = "http://localhost:9022/"
    const streamURL = "ws://localhost:5001/"

    var languageGraph = new LanguageGraph(d3.select("#bar-graph"), 960, 500, baseURL + "files?limit=30");
    languageGraph.initialize();

    var commitStackDataStreamer = new DataStreamer(baseURL + "commits");
    var commitStack = new CommitStack(d3.select("#commit-stack"), 960, 750, commitStackDataStreamer);

    var bubbleGraphDataStreamer = new DataStreamer(baseURL + "commits");
    var bubbleGraph = new BubbleGraph(d3.select("#commit-bubbles"), 960, 300, 1, bubbleGraphDataStreamer);

    uiHandler = new UIHandler(languageGraph, commitStack, bubbleGraph);

    const languageStreamChart = new LanguageStreamChart("#language-stream-chart", 960, 500, streamURL);
    languageStreamChart.setup().run();

    const languageBubbleStreamChart = new LanguageBubbleStreamChart("#language-bubble-stream-chart", 800, 800, streamURL);
    languageBubbleStreamChart.setup().run();

    const prTimeToCLoseChart = new PRTimeToCLoseChart("#pr-timetoclose-stream-chart", 960, 500, streamURL);
    prTimeToCLoseChart.setup().run();

});
