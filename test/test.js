const assert = require('chai').assert;
const sinon = require('sinon');

const {RedisPubSubServer, RedisPubSubClient, CHANNEL_PREFIX, STATES} = require('../index.js');

const configRedis = {host:"localhost", port:"32768"};
const createClient = require('redis').createClient;
const clientPublish = createClient(configRedis);
const clientSubscribe = createClient(configRedis);
const testChannel = 'TESTCHANNEL';
let redisPubSubServerInstance;
let redisPubSubClientInstance;

describe('RedisPubSubServer', ()=> {
  describe('initialize', ()=> {
    it('should create an instance of RedisPubSubServer', ()=> {
      redisPubSubServerInstance = new RedisPubSubServer(testChannel, {clientPublish,clientSubscribe});
      assert.instanceOf(redisPubSubServerInstance,RedisPubSubServer);
    });
    it(`should have channel equal to ${CHANNEL_PREFIX}:${testChannel}`, ()=> {
      assert.equal(redisPubSubServerInstance.channel,`${CHANNEL_PREFIX}:${testChannel}`);
    });
    it('should have redis client publish', ()=> {
      assert.isOk(redisPubSubServerInstance.clientPublish.connected);
    });
  });
  describe('publish', ()=> {
    it('should publish in channel with state update and data object', (done)=> {
      redisPubSubServerInstance.publish(STATES.UPDATE, {test:true}, err=>{
        if (err) throw err;
        done();
      });
    });
  });
});

describe('RedisPubSubClient', ()=> {
  describe('initialize', ()=> {
    it('should create an instance of RedisPubSubClient', ()=> {
      redisPubSubClientInstance = new RedisPubSubClient(testChannel, {clientPublish,clientSubscribe});
      assert.instanceOf(redisPubSubClientInstance,RedisPubSubClient);
    });
    it(`should have channel equal to ${CHANNEL_PREFIX}:${testChannel}`, ()=> {
      assert.equal(redisPubSubClientInstance.channel,`${CHANNEL_PREFIX}:${testChannel}`);
    });
    it('should have redis client subscribe', ()=> {
      assert.isOk(redisPubSubClientInstance.clientSubscribe.connected);
    });
  });
  describe('previous data', ()=> {
    it(`should restore previous data on start`, ()=> {
      assert.deepEqual(redisPubSubClientInstance.data,{test:true});
    });
  });
  describe('subscribe', ()=> {
    it(`should receive an init from RedisPubSubServer`, (done)=> {
      redisPubSubServerInstance = new RedisPubSubServer(testChannel, {clientPublish,clientSubscribe});
      redisPubSubClientInstance.on(STATES.INIT, ()=>{
        redisPubSubClientInstance.removeAllListeners(STATES.INIT);
        done();
      });
    });
    it(`should receive an update object from RedisPubSubServer`, (done)=> {
      redisPubSubServerInstance.publish(STATES.UPDATE, {success:true})
      redisPubSubClientInstance.on(STATES.UPDATE, data=>{
        assert.deepEqual(data,{success:true});
        redisPubSubClientInstance.removeAllListeners(STATES.UPDATE);
        done();
      });
    });
    it(`should receive an update number from RedisPubSubServer`, (done)=> {
      redisPubSubServerInstance.publish(STATES.UPDATE, 256);
      redisPubSubClientInstance.on(STATES.UPDATE, data=>{
        assert.equal(data,256);
        redisPubSubClientInstance.removeAllListeners(STATES.UPDATE);
        done();
      });
    });
    it(`should receive an update boolean from RedisPubSubServer`, (done)=> {
      redisPubSubServerInstance.publish(STATES.UPDATE, true);
      redisPubSubClientInstance.on(STATES.UPDATE, (data)=>{
        assert.isOk(data);
        redisPubSubClientInstance.removeAllListeners(STATES.UPDATE);
        done();
      });
    });
    it(`should receive an error from RedisPubSubServer`, (done)=> {
      redisPubSubServerInstance.publish(STATES.ERROR)
      redisPubSubClientInstance.on(STATES.ERROR, data=>{
        redisPubSubClientInstance.removeAllListeners(STATES.ERROR);
        done();
      });
    });
    it(`should receive an stop from RedisPubSubServer`, (done)=> {
      redisPubSubServerInstance.publish(STATES.STOP)
      redisPubSubClientInstance.on(STATES.STOP, data=>{
        redisPubSubClientInstance.removeAllListeners(STATES.STOP);
        done();
      });
    });
  });
});
