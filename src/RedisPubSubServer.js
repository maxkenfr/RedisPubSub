const EventEmitter = require('events');
const {CHANNEL_PREFIX, STATES} = require('./shared');

class RedisPubSubServer extends EventEmitter{
  constructor(channel, redisClient) {
    super();
    this.channel = `${CHANNEL_PREFIX}:${channel}`;
    this.clientPublish = redisClient.clientPublish || redisClient;
    this.states = STATES;
    this.publish(this.states.INIT);
    process.on('SIGINT',()=> {
      this.publish(this.states.STOP);
      process.exit(0);
    });
    process.on('SIGTERM',()=> {
      this.publish(this.states.STOP);
      process.exit(0);
    });
  }
  publish(state, data, callback){
    if (data !== undefined) {
      try {
        this.clientPublish.set(this.channel, JSON.stringify(data));
      } catch (e) {
        this.clientPublish.set(this.channel, data);
      }
    }
    this.clientPublish.publish(this.channel, state, callback);
  }
}

module.exports = RedisPubSubServer;
