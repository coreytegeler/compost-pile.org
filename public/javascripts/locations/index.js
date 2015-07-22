var locationsData = [];

$(document).ready(function() {
	fillLocationList();
    $('#locations').on('click', '.location .delete', deleteLocation);
});

function fillLocationList() {
	
	var listContent = '';

	//GET JSON data of locations
	$.getJSON('/locations/data', function(data) {
		locationsListData = data;
		$.each(data, function(i) {
			var address = this.street + ' ' + this.city + ', ' + this.state + ' ' + this.zip;
			var addressLink = "http://maps.google.com/?q=" + this.name + ' ' + address;
			if(i < data.length-1){var notLast=true}else{var notLast=false}
			listContent += '<div class="cell location">';
			listContent += '<a href="/locations/show/' + this.slug + '">' + this.name + '</a>';
            listContent += '&nbsp;<a href="#" class="delete" rel="'+ this._id +'">(X)</a>';
			// if(notLast) {
				listContent += ', ';	
			// }

			listContent += '</div>';
		});
	}).complete(function() {
        listContent += '<div class="cell" id="addLocation"><a href="/locations/new">New Location</a>.</div>'
        $('#locations').html(listContent);
    });
}

function deleteLocation(event) {
    var confirmation = confirm('Are you sure?');

    if(confirmation) {
        event.preventDefault();
        $.ajax({
            type: 'DELETE',
            url: '/locations/delete/' + $(this).attr('rel')
        }).done(function( response ) {
            if (response.msg === '') {
            }
            else {
                alert('Error: ' + response.msg);
            }
            fillLocationList();
        });
    } else {
        return false;
    }
}