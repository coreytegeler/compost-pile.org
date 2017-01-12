var locationsData = [];

$(document).ready(function() {
  fillLocationList()
  $('#locations').on('click', '.delete', deleteLocation)
});

function fillLocationList() {
	var listContent = ''
	//GET JSON data of locations
	$.getJSON('/admin/data', function(data) {
		locationsListData = data
		$.each(data, function(i) {
			var address = this.street + ' ' + this.city + ', ' + this.state + ' ' + this.zip
			var addressLink = "http://maps.google.com/?q=" + this.name + ' ' + address
			if(i < data.length-1){var notLast=true}else{var notLast=false}
			listContent += '<div class="cell location">'
			listContent += '<a href="/admin/' + this.slug + '">' + this.name + '</a>'
      listContent += '&nbsp;<a href="#" class="delete" rel="'+ this._id +'">(X)</a>'
			if(notLast) {
  			listContent += ', '	
			}
			listContent += '</div>'
		});
	}).complete(function() {
    listContent += '<div class="cell" id="addLocation"><a href="/admin/new">New Location</a>.</div>'
    $('#locations').html(listContent)
  });
}

function deleteLocation(event) {
  var confirmation = confirm('Are you sure?')
  if(confirmation) {
    event.preventDefault()
    $.ajax({
      type: 'DELETE',
      url: '/admin/delete/location/' + $(this).attr('rel')
    }).done(function( response ) {
      console.log(response.msg)
      fillLocationList()
    });
  } else {
    return false
  }
}