$(document).ready(function() {
	$('#location').on('click', 'input.save', addLocation);
});

function addLocation(event) {
    event.preventDefault();
    var errorCount = 0;
    // $('#location.new input[type="text"]').each(function(index, val) {
    //     if($(this).val() === '') { errorCount++; }
    // });

	if($('input.name').val() === '') { errorCount++; }

    if(errorCount === 0) {
        var newLocation = {
            'name': $('form#info input#name').val(),
            'email': $('form#info input#email').val(),
            'password': $('form#info input#password').val(),
            'how': $('form#info input#how').val(),
            'who': $('form#info input#who').val()
        }
        $.ajax({
            type: 'POST',
            data: newLocation,
            url: '/admin/create/location',
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