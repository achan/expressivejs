var mongo = require('mongodb'), slugs = require('slugs'), moment = require('moment');
var Server = mongo.Server, Db = mongo.Db, Bson = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('expressivedb', server, {w: 1});
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

exports.config = {};

exports.index = function(req, res) {
  db.collection('posts', function(err, collection) {
    var cursor = collection.find({type: 'post'});
    cursor.sort({created: -1});
    cursor.limit(exports.config.web.numFrontPagePosts);
    cursor.toArray(function(err, items) {
      res.render('posts/index', {posts: items});
    });
  });
};

exports.view = function(req, res) {
  var slug = req.params.slug;
  var year = req.params.year;
  var month = req.params.month;
  var day = req.params.day;
  var createDate = new Date(year, month - 1, day);

  db.collection('posts', function(err, collection) {
    collection.findOne({'slug': req.params.slug, 'created': {'$gte': createDate, '$lte': new Date(year, month - 1, day + 1)}}, function(err, item) {
      res.render('posts/view', {post: item});
    });
  });
};

exports.viewPage = function(req, res) {
  db.collection('posts', function(err, collection) {
    collection.findOne({slug: req.params.slug, type: 'page'}, function(err, item) {
      res.render('posts/viewPage', {post: item});
    });
  });
}

exports.add = function(req, res) {
  res.render('posts/add');
};

exports.newPost = function(req, res) {
  var post = req.body.post;

  if (typeof post.slug === 'undefined' || post.slug === '')
    post.slug = slugs(post.title);

  post.created = new Date();
  post.tags = post.tags.split(',');
  var normalizedTags = [];
  post.tags.forEach(function(tag) {
    normalizedTags.push(tag.replace(/\W/g,''));
  });
  post.tags = normalizedTags;

  db.collection('posts', function(err, collection) {
    collection.insert(post, {safe: true}, function(err, result) {
      if (err) {
        res.send({'error':'An error has occurred'});
      } else {
        console.log('Success: ' + JSON.stringify(result[0]));
      }
    });
  });

  res.redirect('/');
};

exports.tags = function(req, res) {
  db.collection('posts', function(err, collection) {
    var postsByTag = {};
    collection.find({type: 'post'}, ['type', 'tags', 'created', 'title', 'slug']).toArray(function(err, posts) {
      posts.forEach(function(post) {
        post.tags.forEach(function(tag) {
          if (!postsByTag[tag])
            postsByTag[tag] = new Array();

          postsByTag[tag].push(post);
        });
      });

      var tags = new Array();
      for (var tag in postsByTag) {
        tags.push(tag);
      }

      var sortedPosts = {};
      tags.sort();
      tags.forEach(function(tag) {
        sortedPosts[tag] = postsByTag[tag];
      });

      res.render('posts/tags', {title: 'Tags', postsByTag: sortedPosts});
    });
  });
}
