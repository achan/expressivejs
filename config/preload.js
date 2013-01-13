var mongo = require('mongodb'), slugs = require('slugs'), bcrypt = require('bcrypt'), fs = require('fs'), slugs = require('slugs');
var Server = mongo.Server;
var Db = mongo.Db;
var Bson = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
var preloadId = 'init';
var salt = 8;

db = new Db('expressivedb', server, { w: 1});

db.open(function(err, db) {
  if (!err) {
    console.log("Connected to 'expressive' database");
    db.collection('posts', {safe: true}, function(err, collection) {
      if (err) {
        console.log("The 'posts' collection doesn't exist. Initializing collection...");
      }
    });
  } else {
    console.log("error: " + err);
  }
});

exports.preload = function() {
  db.collection('preloadrequests', function(err, collection) {
    collection.findOne({'id': preloadId}, function(err, item) {
      if (err) {
      } else {
        if (item == null) {
          console.log('preloading...');
          preload();
        } else {
          console.log('preload request [' + preloadId + '] already processed.');
        }
      }
    });
  });
}

function preload() {
  console.log('start preloading...');

  preloadUsers();
  preloadPosts();
}

function preloadUsers() {
  console.log('populate default users');
  db.collection('users', function(err, collection) {
    console.log('clearing users collection...');
    collection.remove({}, function(err, results) {
      if (!err) {
        console.log('hashing password...');
        bcrypt.hash('password', salt, function(err, hash) {
          console.log('inserting achan with hash ' + hash + ' to users collection...');
          collection.insert({username: 'achan',
                             name: 'Amos Chan',
                             email: 'amos.chan+express@chapps.org',
                             joined: new Date(),
                             password: hash},
                            function (err, result) {
            if (err) {
              console.log('error occurred trying to add achan.');
            } else {
              console.log('achan added.');
            }
          });
        }); // end bcrypt
      };
    });
  });
}

function preloadPosts() {
  var title = 'The Raspberry Pi Mini-Computer Has Sold More Than 1 Million Units';
  var rpi = {title: title,
             content: fs.readFileSync('./preload/posts/rpi.md'),
             created: new Date(new Date().getTime() - parseInt(Math.random() * 365 * 1000000)),
             slug: slugs(title)};

  console.log('populate default users');
  db.collection('posts', function(err, collection) {
    console.log('clearing posts collection...');
    collection.remove({}, function(err, results) {
      if (!err) {
        collection.insert(rpi, function (err, result) {
          if (err) {
            console.log('error occurred trying to add post.');
          } else {
            console.log('post added.');
          }
        });
      }
    });
  });
}
