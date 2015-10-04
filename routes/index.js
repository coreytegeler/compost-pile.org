var express = require('express');
var router = express.Router();

// GET home page view
router.get('/', function(req, res, next) {
  var db = req.db;
  var collection = db.get('locations');
  var locations = [];
  return collection.find({}, {}, function (err, locationsDoc) {
    for (var i=0; i<locationsDoc.length; i++) {
      var slug = locationsDoc[i].slug;
      var name = locationsDoc[i].name;
      var who = locationsDoc[i].who;
      var how = locationsDoc[i].how;
      var email = locationsDoc[i].email;
      var location = {};
      location.slug = slug;
      location.name = name;
      location.who = who;
      location.how = how;
      location.email = email;
      locations.push(location);
    }
    if (err) {
      return res.render('/');
    } else {
      return res.render('index', {
        pageType: 'multiple',
        locations: locations,
        scripts: ['paper','moment','main','graph'],
        styles: ['public'],
        errors: err
      });
    }  
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

module.exports = router;
