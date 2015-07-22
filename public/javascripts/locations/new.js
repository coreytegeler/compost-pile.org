$(document).ready(function() {
	$('#location.new input#submit').on('click', addLocation);
});

function addLocation(event) {
    event.preventDefault();
    var errorCount = 0;
    // $('#location.new input[type="text"]').each(function(index, val) {
    //     if($(this).val() === '') { errorCount++; }
    // });

	if($('input#name').val() === '') { errorCount++; }

    if(errorCount === 0) {
        var newLocation = {
            'name': $('form#info input#name').val(),
            'street': $('form#info input#street').val(),
            'city': $('form#info input#city').val(),
            'state': $('form#info input#state').val(),
            'zip' : $('form#info input#zip').val()
        }
        console.log(newLocation);
        $.ajax({
            type: 'POST',
            data: newLocation,
            url: '/locations/create',
            dataType: 'JSON'
        }).done(function( response ) {
            if (response.msg === '') {
                window.location = '/locations';
            }
            else {
                alert(response.msg);
            }
        });
    }
    else {
        alert('Please fill in all fields');
        return false;
    }
};