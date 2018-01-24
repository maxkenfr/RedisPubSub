let clientMap = new Map();
const EventEmitter = require('events');

class RedisPubSub extends EventEmitter {
  constructor(path, redisClient) {
    super();
    this.path = `PUBSUB:${path}`;
    this.clientPublish = redisClient.clientPublish || redisClient;
    this.clientSubscribe = redisClient.clientSubscribe || redisClient;
    this.state = {
      INIT : 'init',
      UPDATE : 'update',
      ERROR : 'error',
      STOP : 'stop'
    }
  }
}

class RedisPubSubServer extends RedisPubSub{
  constructor(path, redisClient) {
    super(path, redisClient);
    this.publish(this.state.INIT);
    process.on('SIGINT',()=> {
      this.publish(this.state.STOP);
      process.exit(0);
    });
    process.on('SIGTERM',()=> {
      this.publish(this.state.STOP);
      process.exit(0);
    });
  }
  publish(state, data){
    switch (typeof data) {
      case 'object':
        this.clientPublish.set(this.path, JSON.stringify(data));
        break;
      default:
    }
    this.clientPublish.publish(this.path, `${state}_${typeof data}`);
  }
}

class RedisPubSubClient extends RedisPubSub{
  constructor(path, redisClient) {
    super(path, redisClient);
    this.data = {};
    if(!clientMap.has(this.path)) {
      clientMap.set(this.path);
      this.clientSubscribe.subscribe(this.path);
    }
    this.clientSubscribe.on('message', channel=>this.dispatch(channel));
    this.dispatch(this.path);
  }
  dispatch(channel){
    if (channel == this.path) {
      this.clientPublish.get(this.path, (err,res)=>{
        if (err) {
          this.emit('error',err);
        } else {
          this.data = JSON.parse(res);
          this.emit('update',this.data);
        }
      });
    }
  }
}

module.exports = {RedisPubSubServer, RedisPubSubClient};
