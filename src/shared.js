const CHANNEL_PREFIX = 'MK_REDIS_PUBSUB';

let clientMap = new Map();

const STATES = {
  INIT : 'init',
  UPDATE : 'update',
  ERROR : 'error',
  STOP : 'stop'
}

module.exports = {clientMap, CHANNEL_PREFIX, STATES};
