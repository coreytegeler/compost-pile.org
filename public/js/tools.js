function sortDesc(a, b) {
	if(a.date) {
		var dateA = new Date(a.date)
	} else {
		var dateA = new Date(a.dataset.date)
	}
	if(a.date) {
		var dateB = new Date(b.date)
	} else {
		var dateB = new Date(a.dataset.date)
	}
	return dateA < dateB ? 1 : -1
}