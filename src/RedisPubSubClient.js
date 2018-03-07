const EventEmitter = require('events');
const {clientMap, CHANNEL_PREFIX, STATES} = require('./shared');

class RedisPubSubClient extends EventEmitter{
  constructor(channel, redisClient) {
    super();
    this.channel = `${CHANNEL_PREFIX}:${channel}`;
    this.clientSubscribe = redisClient.clientSubscribe || redisClient;
    this.clientPublish = redisClient.clientPublish || redisClient;
    this.states = STATES;
    this.data = {};
    this.init();
  }
  init(){
    if(!clientMap.has(this.channel)) {
      clientMap.set(this.channel);
      this.clientSubscribe.subscribe(this.channel);
    }
    this.clientSubscribe.on('message', (channel, state)=>this.dispatch(channel, state));
    this.dispatch(this.channel, 'init');
  }
  dispatch(channel, state){
    if (Object.values(this.states).includes(state)) {
      this.clientPublish.get(this.channel, (err,res)=>{
        if (err) {
          this.emit('error',err);
        } else {
          try {
            this.data = JSON.parse(res);
          } catch (e) {
            this.data = res
          }
          try {
            this.emit(state,this.data);
          } catch (e) {
            this.emit('error',e);
          }
        }
      });
    }
  }
}

module.exports = RedisPubSubClient;
