/**
 * A websocket handler that receives messages with lists of elements, and smoothly
 * passes these elements individually to a callback handler.
 * The goal here is to make a stream of data seem 'streamier' when visualised.
 */
export default class SmoothedStream {

  constructor(webSocketUrl, callback, error){
    this.webSocketUrl = webSocketUrl;
    this.callback = callback;
    this.error = error;

    this.windowTime = 10000
    this.buffer = [];
    this.timeOut = null;
  }

  /**
   * Start the websocket and begin passing elements to the callback function.
   */
  run(){
    const ws = new WebSocket(this.webSocketUrl)
    ws.onerror = this.error
    ws.onmessage = (event) => {
      var data = JSON.parse(event.data)
      this.addToBuffer(data)
    }
  }

  /**
   * Removes an element from the buffer and passes it to the callback function.
   * It will then wait a short while before passing the next element in the buffer.
   */
  timeUp(){
    if(this.buffer.length == 0){
      return;
    }

    const element = this.buffer.shift();
    const wait = this.windowTime / this.buffer.length;

    this.callback(element);
    this.timeOut = setTimeout(()=>this.timeUp(),wait)
  }

  /**
   * Adds new list of datapoints to the buffer.
   * Will trigger `timeUp()` to be called.
   */
  addToBuffer(words){
    const bufferLength = this.buffer.length;
    this.buffer = this.buffer.concat(words);

    if(this.timeOut)
      clearTimeout(this.timeOut);
    this.timeUp();
  }

}
