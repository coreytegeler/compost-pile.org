var mongoose = require('mongoose')

var LogSchema = mongoose.Schema({
	month: String,
	day: String,
	year: String,
	date: String,
	dateDisplay: String,
	scraps: String,
	compost: String,
	browns: String,
	comments: String,
	location: String
}, { 
	timestamps: true
});

module.exports = mongoose.model('Log', LogSchema);