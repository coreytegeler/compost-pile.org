var express = require('express');
var router = express.Router();

// GET home page view
router.get('/', function(req, res, next) {
  var db = req.db;
  var collection = db.get('locations');
  var locations = [];
  return collection.find({}, {}, function (err, locationsDoc) {
    console.log('docs: '+locationsDoc);
    if (err) {
      return res.render('/error');
    } else {
      if(locationsDoc) {
        for (var i=0; i<locationsDoc.length; i++) {
          var slug = locationsDoc[i].slug;
          var name = locationsDoc[i].name;
          var email = locationsDoc[i].email;
          var who = locationsDoc[i].who;
          var how = locationsDoc[i].how;
          var what = locationsDoc[i].what;
          var location = {};
          location.slug = slug;
          location.name = name;
          location.email = email;
          location.who = who;
          location.how = how;
          location.what = what;
          locations.push(location);
        }
      }
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
  collection.find({}, {sort: {'date': -1}}, function(e, logs) {
    console.log(logs);
    res.json(logs);
  });
});

module.exports = router;
