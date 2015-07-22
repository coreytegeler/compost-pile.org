var express = require('express');
var router = express.Router();
var slug = require('slug');
slug.defaults.modes['pretty'] = {
    replacement: '-',
    symbols: true,
    remove: /[.]/g,
    lower: true,
    charmap: slug.charmap,
    multicharmap: slug.multicharmap
};

// Find all records from 'locations' collection in database
router.get('/data', function(req, res) {
	var db = req.db;
	var collection = db.get('locations');
	collection.find({},{},function(e, location) {
		res.json(location);
	});
});

// Find single record from 'locations' collection in database with given slug
router.get('/data/:slug', function(req, res) {
  var db = req.db;
  var collection = db.get('locations');
  var slug = req.params.slug;
  collection.findOne({'slug':slug},{},function(e, location) {
    res.json(location);
  });
});

router.get('/new', function(req, res, next) {
  console.log(req);
  res.render('locations/new', {
    title: 'New Location',
    scripts: ['locations/new']
  });
});

router.get('/show/:slug', function(req, res, next) {
  var db = req.db;
  var collection = db.get('locations');
  var slug = req.params.slug;
  return collection.findOne({ 'slug' : slug }, function (err, location) {
    if (err) {
      return res.render('locations');
    } else {
      return res.render('locations/show', {
        title: location.name,
        data: {
          'slug' : location.slug,
          'id' : location._id
        },
        scripts: ['moment', 'locations/show'],
        errors: err
      });
    }  
  });
});

router.post('/create', function(req, res) {
    var db = req.db;
    var collection = db.get('locations');
    var data = req.body;
    data.slug = slug(data.name);
    data.log = [];
    collection.insert(data, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

router.post('/update/:id', function(req, res) {
    var db = req.db;
    var collection = db.get('locations');
    var id = req.params.id;
    var data = req.body;
    data.slug = slug(req.body.name);
    collection.update({'_id':id}, data, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

router.delete('/delete/:id', function(req, res) {
    var db = req.db;
    var collection = db.get('locations');
    var id = req.params.id;
    collection.remove({ '_id' : id }, function(err) {
        res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
    });
});

router.get('/logs/:slug', function(req, res) {
  var slug = req.params.slug;
  var collectionName = slug.replace(/-/g, '_') + '_logs';
  var db = req.db;
  var collection = db.get(collectionName);
  collection.find({}, {sort: {'date': -1}}, function(e, location) {
    res.json(location);
  });
});

router.post('/insert-log/:slug', function(req, res) {
    var slug = req.params.slug;
    var collectionName = slug.replace(/-/g, '_') + '_logs';
    var db = req.db;
    var collection = db.get(collectionName);
    var data = req.body;
    console.log(data);
    collection.insert(data, function(err, result){
      res.send(
          (err === null) ? { msg: '' } : { msg: err }
      );
    });
});

router.post('/update-log/:slug/:id', function(req, res) {
    var id = req.params.id;
    var slug = req.params.slug;
    var collectionName = slug.replace(/-/g, '_') + '_logs';
    var db = req.db;
    var collection = db.get(collectionName);
    var data = req.body;
    console.log(data);
    collection.update({'_id':id}, data, function(err, result){
      res.send(
          (err === null) ? { msg: '' } : { msg: err }
      );
    });
});

router.delete('/delete-log/:slug/:id', function(req, res) {
    var slug = req.params.slug;
    var id = req.params.id;
    var collectionName = slug.replace(/-/g, '_') + '_logs';
    var db = req.db;
    var collection = db.get(collectionName);
    collection.remove({ '_id' : id }, function(err) {
        res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;