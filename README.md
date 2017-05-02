
Like .batch() but for all operations on a levelup database.

This let's you batch operations across multiple sublevels:

```
var memdb = require('memdb');
var sublevel = require('subleveldown');
var batchlevel = require('batchlevel');

var mydb = memdb();
var db = batchlevel(mydb); // batch entire db

var idb = sublevel(db, 'i'); // index
var rdb = sublevel(db, 'r'); // reverse index

idb.put('foo', 'bar', function(err) {
  if(err) return console.error(err);

  rdb.put('bar', 'foo', function(err) {
    if(err) return console.error(err);

    db.write(function(err) {
      if(err) return console.error(err);

      console.log("Wrote changes to database");
    }); 
  });
});

```

# License and copyright

License: [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)

Copyright 2017 BioBricks Foundation
