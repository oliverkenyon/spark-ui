
export default class UIHandler {
  constructor(languageGraph, commitStack, bubbleGraph) {
    this.languageGraph = languageGraph;
    this.commitStack = commitStack;
    this.bubbleGraph = bubbleGraph;
  }

  startCommitStack() {
    this.commitStack.start();
  }

  stopCommitStack() {
    this.commitStack.stop();
  }

  startBubbleGraph() {
    this.bubbleGraph.start();
  }

  stopBubbleGraph() {
    this.bubbleGraph.stop();
  }

  refreshLanguageGraph() {
    this.languageGraph.refresh();
  }
}
