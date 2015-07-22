$(document).ready(function() {
    fillLocationForm();
    fillLocationLog();
	$('#location #info input.submit').on('click', updateLocationInfo);
    $('#location #log input.submit').on('click', updateLocationLog);
});

//requests single location data query from DB via routes/locations.js
//fills form values with data when completed
function fillLocationForm() {
    $.getJSON('/locations/data/' + localData.slug, function(data) {
        locationData = data;
        $('form#info input[type="text"]').each(function(i,input) {
            var fieldName = $(input).attr('id');
            $('form#info input#'+fieldName).val(data[fieldName]);
        });
    }).complete(function() {

    });
}

function updateLocationInfo(event) {
    event.preventDefault();
    var errorCount = 0;
    // $('#location.new input[type="text"]').each(function(index, val) {
    //     if($(this).val() === '') { errorCount++; }
    // });

	if($('input#name').val() === '') { errorCount++; }

    if(errorCount === 0) {
        var infoData = {
            'name': $('form#info input#name').val(),
            'street': $('form#info input#street').val(),
            'city': $('form#info input#city').val(),
            'state': $('form#info input#state').val(),
            'zip' : $('form#info input#zip').val()
        };
        $.ajax({
            type: 'POST',
            data: infoData,
            url: '/locations/update/'+localData.id,
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

function fillLocationLog() {
    $.getJSON('/locations/data/' + localData.slug, function(data) {
        logData = data.log;
        if(logData) {
            $.each(logData, function(i, log) {
                var row = $('form#log .row:eq(0)').clone().appendTo('form#log').attr('data-entry',i);
                $(row).children('input[type="text"]').each(function(ii, input) {
                    var id = input.id;
                    $(input).val(log[id]);
                });
            });
        }
    });
}

function updateLocationLog(event) {
    event.preventDefault();
    var errorCount = 0;
    var row = $(event.target).parent('.row');
    $(row).children('input[type="text"]').each(function(index, val) {
        if($(this).val() === '') { errorCount++; }
    });

    if(errorCount === 0) {
        var logData = {
            'total': $(row).children('input#total').val(),
            'input': $(row).children('input#input').val(),
            'output': $(row).children('input#output').val()
        };

        $.ajax({
            type: 'POST',
            data: logData,
            url: '/locations/log/'+localData.id,
            dataType: 'JSON'
        }).done(function( response ) {
            if (response.msg === '') {
                $('form#log .row:eq(0) input[type="text"]').each(function() {
                    $(this).val('');
                });
                fillLocationLog();
            }
            else {
                console.log(response.msg);
            }
        });
    }
    else {
        alert('Please fill in all fields');
        return false;
    }
};