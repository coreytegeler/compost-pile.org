var express = require('express');
var router = express.Router();

// GET home page view
router.get('/', function(req, res, next) {
  res.render('index', {
  	title: 'Compost'
  });
});

//GET locations page view
router.get('/locations', function(req, res, next) {
  res.render('locations', {
  	title: 'Locations',
  	scripts: ['locations/index']
  });
});

module.exports = router;
