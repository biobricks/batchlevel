
var util = require('util');
var levelup = require('levelup')
var abstract = require('abstract-leveldown');

var BatchDown = function(db, add, opts) {
  if(!(this instanceof BatchDown)) return new BatchDown(db, add, opts);
  if(!opts) opts = {};

  this.db = db;

  this.leveldown = null;
  this._add = add;
  this._beforeOpen = opts.open

  abstract.AbstractLevelDOWN.call(this, 'no-location');
}

util.inherits(BatchDown, abstract.AbstractLevelDOWN);

BatchDown.prototype.type = 'batchdown'

BatchDown.prototype._open = function(opts, cb) {
  var self = this;

  if(this.db.isOpen()) {
    this.leveldown = this.db.db;
    return done();
  }

  this.db.on('open', this.open.bind(this, opts, done));

  function done(err) {
    if (err || !self._beforeOpen) return cb(err);
    self._beforeOpen(cb);
  }
}

BatchDown.prototype._close = function () {
  this.leveldown.close.apply(this.leveldown, arguments)
}

BatchDown.prototype.setDb = function () {
  this.leveldown.setDb.apply(this.leveldown, arguments)
}

BatchDown.prototype.put = function (key, value, opts, cb) {
  var o = {type: 'put', key: key, value: value};

  if(opts.keyEncoding) o.keyEncoding = opts.keyEncoding;
  if(opts.valueEncoding) o.valueEncoding = opts.valueEncoding;

  this._add(o);
  if(cb) process.nextTick(cb);
}

BatchDown.prototype._get = function (key, opts, cb) {
  this.leveldown.get(key, opts, cb)
}

BatchDown.prototype._del = function (key, opts, cb) {
  var o = {type: 'del', key: key};

  if(opts.keyEncoding) o.keyEncoding = opts.keyEncoding;

  this._add(o);
  if(cb) process.nextTick(cb);
}

BatchDown.prototype._batch = function(operations, opts, cb) {
  if(arguments.length === 0) return new abstract.AbstractChainedBatch(this)

  var i, o, cur;
  for(i=0; i < operations.length; i++) {
    o = operations[i];
    cur = {type: o.type, key: o.key, value: o.value, opts: opts};

    if(opts.keyEncoding) cur.keyEncoding = opts.keyEncoding;
    if(opts.valueEncoding) cur.valueEncoding = opts.valueEncoding;    

    this._add(cur);
  }

  if(cb) process.nextTick(cb);
}

BatchDown.prototype._approximateSize = function (start, end, cb) {
  this.leveldown.approximateSize.apply(this.leveldown, arguments)
}

BatchDown.prototype._getProperty = function () {
  return this.leveldown.getProperty.apply(this.leveldown, arguments)
}

BatchDown.prototype._destroy = function () {
  return this.leveldown.destroy.apply(this.leveldown, arguments)
}

BatchDown.prototype._iterator = function (opts) {
  return this.leveldown.iterator.apply(this.leveldown, arguments)
}


module.exports = function(db, opts) {
  if(!opts) opts = {};

  var operations = [];

  function add(op) {
    operations.push(op);
  }

  opts.db = function() {
    return BatchDown(db, add, opts);
  }

  var lup = levelup(opts);

  var writeLock = false;
  
  lup.write = function(cb) {

    var ops = operations;
    operations = [];

    db.batch(ops, cb);

  };

  return lup;
}
