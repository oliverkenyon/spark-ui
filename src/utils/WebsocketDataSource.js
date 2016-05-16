export default class WebsocketDataSource {

  constructor(serverURL) {
    this.serverURL = serverURL;

    this.readyStateEnum = {
      notOpened: 0,
      opened: 1,
      closing: 2,
      closed: 3
    };

    this.websocket = null;
    this.subscribers = [];
  }

  open() {
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    this.websocket = new WebSocket(this.serverURL);
    this.websocket.onopen = () => {
      console.info("Connection opened to " + this.serverURL);
      this.websocket.send("StartStream");
    }

    this.websocket.onmessage = message => {
        //console.info(message.data);
      this.subscribers.forEach( subscriber => {

        subscriber.onData(JSON.parse(message.data));
      });
    }

    this.websocket.onclose = () => {
      console.info("Connection closed to " + this.serverURL);
    }
  }

  subscribe(subscriber) {
    if (this.subscribers.indexOf(subscriber) == -1) {
      this.subscribers.push(subscriber);
    }
  }

  unsubscribe(subscriber) {
    var index = this.subscribers.indexOf(subscriber);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }
  }
}
