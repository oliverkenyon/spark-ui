
export default class DataStreamer {

  constructor(dataURL) {
    this.dataURL = dataURL
    this.subscribers = [];
    this.timer = null;
  }

  subscribe(subscriber) {
    this.subscribers.push(subscriber);
  }

  start() {
    if (this.timer) {
      console.info("DataStreamer: Already started");
      return;
    }
    
    d3.json(this.dataURL, (error, json) => { this.onDataReceived(error, json); });
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onDataReceived(error, json) {
    if (error) {
      console.info("Error retrieving json:");
      console.info(error);
      return;
    }

    this.data = json;
    this.startStreaming();
  }

  startStreaming() {
    this.timer = setInterval( () => this.publish(), 1000);
  }

  publish() {
    if (this.data.length == 0) {
      console.info("Ran out of data");
      clearInterval(this.timer);
      return;
    }

    var payload = this.data.pop();
    for (var i = 0; i < this.subscribers.length; ++i) {
      this.subscribers[i].onData(payload);
    }
  }


}
