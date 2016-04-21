var express = require('express');
var router = express.Router();
var slug = require('slug');
var moment = require('moment');
var path = require('path');
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

slug.defaults.modes['pretty'] = {
    replacement: '-',
    symbols: true,
    remove: /[.]/g,
    lower: true,
    charmap: slug.charmap,
    multicharmap: slug.multicharmap
};
router.get('/', function(req, res, next) {  
  var db = req.db;
  var collection = db.get('locations');
  var locations = [];
  return collection.find({}, {}, function (err, locationsDoc) {
    for (var i=0; i<locationsDoc.length; i++) {
      var slug = locationsDoc[i].slug;
      var name = locationsDoc[i].name;
      var location = {};
      location.slug = slug;
      location.name = name;
      locations.push(location);
    }
    if (err) {
      return res.render('/');
    } else {
      return res.render('admin/index', {
        locations: locations,
        scripts: ['admin/index'],
        styles: ['admin'],
        errors: err
      });
    }  
  });
});
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

router.get('/login', function(req, res, next) {
  res.render('admin/login', {
    title: 'Login',
    scripts: ['admin/login'],
    styles: ['admin']
  });
});

router.get('/new', function(req, res, next) {
  res.render('admin/new', {
    title: 'New Location',
    scripts: ['admin/new'],
    styles: ['admin']
  });
});

router.get('/:slug', function(req, res, next) {  
  var db = req.db;
  var collection = db.get('locations');
  var slug = req.params.slug;
  // importCsv(db, collection, slug);
  return collection.findOne({ 'slug' : slug }, function (err, location) {
    if (err) {
      return res.render('admin');
    } else {
      return res.render('admin/edit', {
        title: location.name,
        data: {
          'slug' : location.slug,
          'id' : location._id
        },
        scripts: ['moment', 'admin/edit'],
        styles: ['admin'],
        errors: err
      });
    }  
  });
});

function importCsv(db, collection, slug) {
  converter.on("end_parsed", function (json) {
      var slug = 'purchase-college';
      var data = json;
      for(var i = 0; i< data.length; i++) {
        var date = data[i].date.split(/\//g);
        var m = date[0];
        var d = date[1];
        var y = date[2];
        var validDate = y+' '+m+' '+d;
        var ISODate = moment(validDate, "YYYY MM DD").toISOString();
        data[i].date = ISODate;
        data[i].createdAt = moment().toJSON();
        data[i].updatedAt = moment().toJSON();
      }
      var collectionName = slug.replace(/-/g, '_') + '_logs';
      var collectionLogs = db.get(collectionName);
      collectionLogs.insert(data, function(err, result){
        
      });
  });
   
  require("fs").createReadStream("./data.csv").pipe(converter);
}

router.post('/create/location', function(req, res) {
    var db = req.db;
    var collection = db.get('locations');
    var data = req.body;
    data.slug = slug(data.name);
    collection.insert(data, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

router.post('/update/location/:id', function(req, res) {
    var db = req.db;
    var collection = db.get('locations');
    var id = req.params.id;
    var data = req.body;
    // data.slug = slug(req.body.name);
    data.slug = 'purchase-college';
    collection.update({'_id':id}, data, function(err, result){
        console.error(err);
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

router.delete('/delete/location/:id', function(req, res) {
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

router.post('/create/log/:slug', function(req, res) {
    var slug = req.params.slug;
    var collectionName = slug.replace(/-/g, '_') + '_logs';
    var db = req.db;
    var collection = db.get(collectionName);
    var data = req.body;
    data.createdAt = moment().toJSON();
    data.updatedAt = moment().toJSON();
    collection.insert(data, function(err, result){
      res.send(
          (err === null) ? { msg: '' } : { msg: err }
      );
    });
});

router.post('/update/log/:slug/:id', function(req, res) {
    var id = req.params.id;
    var slug = req.params.slug;
    var collectionName = slug.replace(/-/g, '_') + '_logs';
    var db = req.db;
    var collection = db.get(collectionName);
    var data = req.body;
    data.updatedAt = moment().toJSON();
    collection.update({'_id':id}, data, function(err, result){
      res.send(
          (err === null) ? { msg: '' } : { msg: err }
      );
    });
});

router.delete('/delete/log/:slug/:id', function(req, res) {
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