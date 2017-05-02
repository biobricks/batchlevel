#!/usr/bin/env node

var memdb = require('memdb');
var sublevel = require('subleveldown');
var tape = require('tape');;

tape('basic', function(t) {

  t.plan(3);

  var batchlevel = require('../index.js')

  var rdb = memdb();
  var db = batchlevel(rdb);

  var idb = sublevel(db, 'i');
  var rdb = sublevel(db, 'r');

  idb.put('foo', 'bar', function(err) {
    if(err) return console.error(err);

    rdb.batch([{type: 'put', key: 'foo', value: 'baz'}], function(err) {
      if(err) return console.error(err);

      rdb.batch().put('bar', 'baz').write(function(err) {
        
        idb.get('foo', function(err, data) {
          if(!err) t.fail(err);
          if(!err.notFound) t.fail("Found key before it should have been there");
          
          rdb.get('foo', function(err, data) {
            if(!err) t.fail(err);
            if(!err.notFound) t.fail("Found key before it should have been there");
            
            rdb.get('bar', function(err, data) {
              if(!err) t.fail(err);
              if(!err.notFound) t.fail("Found key before it should have been there");
              
              db.write(function(err) {
                if(err) t.fail(err);
                
                idb.get('foo', function(err, value) {
                  if(err) t.fail(err);
                  
                  t.equal(value, "bar");

                  rdb.get('foo', function(err, value) {
                    if(err) t.fail(err);
                    
                    t.equal(value, "baz");

                    rdb.get('bar', function(err, value) {
                      if(err) t.fail(err);
                      
                      t.equal(value, "baz");
                    });
                  });
                });
              });
            }); 
          });
        });
      });
    });
  });
});
