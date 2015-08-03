var express = require('express');
var router = express.Router();

// GET home page view
router.get('/', function(req, res, next) {
  res.render('index', {
  	title: 'Compost'
  });
});

//GET locations page view
router.get('/admin', function(req, res, next) {
  res.render('admin', {
  	title: 'Locations',
  	scripts: ['admin/index'],
    styles: ['admin']
  });
});

router.get('/logs/:slug', function(req, res) {
  var slug = req.params.slug;
  var collectionName = slug.replace(/-/g, '_') + '_logs';
  var db = req.db;
  var collection = db.get(collectionName);
  collection.find({}, {sort: {'date': 1}}, function(e, logs) {
    res.json(logs);
  });
});

router.get('/:slug', function(req, res, next) {
  var db = req.db;
  var collection = db.get('locations');
  var slug = req.params.slug;
  return collection.findOne({ 'slug' : slug }, function (err, location) {
    if (err) {
      return res.render('/');
    } else {
      return res.render('graph', {
        title: location.name,
        data: {
          'slug' : location.slug,
          'id' : location._id
        },
        scripts: ['paper','moment','graph'],
        styles: ['graph'],
        errors: err
      });
    }  
  });
});

module.exports = router;
