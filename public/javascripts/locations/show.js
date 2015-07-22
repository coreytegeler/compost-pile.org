$(document).ready(function() {
    fillLocationForm();
    fillLog(0);
	$('#location #info input.save').on('click', updateLocation);
    $('#location #info input.delete').on('click', deleteLocation);
    $('#location #log').on('click', 'input.save', saveLog);
    $('#location #log').on('click', '.row:not(.saved) input.delete', clearLog);
    $('#location #log').on('click', '.row.saved input.delete', deleteLog);
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

function updateLocation(event) {
    event.preventDefault();
    var errorCount = 0;
    // $('#location.new input[type="text"]').each(function(index, val) {
    //     if($(this).val() === '') { errorCount++; }
    // });

	if($('input#name').val() === '') { errorCount++; }

    if(errorCount === 0) {
        var infoData = {
            'name': $('form#info input.name').val(),
            'street': $('form#info input.street').val(),
            'city': $('form#info input.city').val(),
            'state': $('form#info input.state').val(),
            'zip' : $('form#info input.zip').val()
        };
        $.ajax({
            type: 'POST',
            data: infoData,
            url: '/locations/update/'+localData.id,
            dataType: 'JSON'
        }).done(function( response ) {
            if (response.msg === '') {

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
}

function deleteLocation(event) {
    event.preventDefault();
    var id = localData.id;
    var confirmation = confirm('Are you sure?');
    if(confirmation) {
        event.preventDefault();
        $.ajax({
            type: 'DELETE',
            url: '/locations/delete/' + id
        }).done(function( response ) {
            if (response.msg === '') {
            }
            else {
                alert('Error: ' + response.msg);
            }
            window.location = '/locations';
        });
    } else {
        return false;
    }
}

function fillDates(row,month,day,year) {
    var monthSelect = $(row).children('.cell.month').children('select');
    var daySelect = $(row).children('.cell.day').children('select');
    var yearSelect = $(row).children('.cell.year').children('select');

    var days = moment(year+'-'+month+1, "YYYY-MM").daysInMonth();
    var dayCounter = 1;
    while (dayCounter <= days) {
        $(daySelect).append('<option value="'+dayCounter+'">'+dayCounter+'</option>');        
        dayCounter++;
    }

    $(monthSelect).val(month).change();
    $(daySelect).val(day).change();
    $(yearSelect).val(year).change();
}

function fillLog() {
    var newRow = $('table#log .row:eq(0)');

    var now = {
        'month': moment().month(),
        'day': moment().date(),
        'year': moment().year()
    };

    var months = moment.months();
    var monthSelect = $(newRow).children('.cell.month').children('select');
    $.each(months, function(i,month) {
        $(monthSelect).append('<option value="'+i+'">'+month+'</option>');        
    });
    
    var yearSelect = $(newRow).children('.cell.year').children('select');
    var year = 2000;
    var years = [];
    while (year <= now.year) {
        $(yearSelect).append('<option value="'+year+'">'+year+'</option>');        
        year++;
    }
    
    fillDates(newRow,now['month'],now['day'],now['year']);

    $.getJSON('/locations/logs/' + localData.slug, function(logs) {
        if(logs) {
            $.each(logs, function(i, log) {
                var row = $(newRow).clone().addClass('saved').appendTo('table#log tbody');
                var date = moment(log['date']);
                date = {
                    'month' : date.month(), 
                    'day' : date.date(),
                    'year' : date.year()
                };
                $(row).children('.cell.date').children('select').each(function(ii, select) {
                    var type = select.dataset.type;
                    $(select).val(date[type]);
                });
                
                $(row).children('.cell.data').children('input[type="text"]').each(function(ii, input) {
                    var type = input.dataset.type;
                    $(input).val(log[type]);
                });

                $(row).children('.buttons').children('input[type="submit"]').each(function(ii, button) {
                    $(button).attr('data-id',log['_id']);
                });
            });
        }
    });
}
function clearLog(event) {
    event.preventDefault();
    $('table#log .row:eq(0) input[type="text"]').each(function() {
        $(this).val('');
    });
}

function saveLog(event) {
    event.preventDefault();
    var self = event.target;
    var errorCount = 0;
    var row = $(self).parent('.buttons').parent('.row');
    var id = self.dataset.id;
    var saved = $(row).is('.saved');
    var postUrl;
    if(saved) {
        postUrl = '/locations/update-log/'+localData.slug+'/'+id;
    } else {
        postUrl = '/locations/insert-log/'+localData.slug;
    }

    $(row).children('.cell.data').each(function(index, val) {
        if($(this).children('input').val() === '') { errorCount++; }
    });

    if(errorCount === 0) {

        var logData = {};

        var date = {};
        $(row).children('.cell.date').each(function(i, cell) {
            var select = $(cell).children('select');
            var type = select.data('type');            
            var value = select.val();
            date[type] = value;
        });
        date = moment([date['year'],date['month'],date['day']]);
        date = date.toJSON();
        console.log(date);
        logData['date'] = date;

        $(row).children('.cell.data').each(function(i, cell) {
            var input = $(cell).children('input');
            var type = input.data('type');
            var value = input.val();
            logData[type] = value;
        });

        $.ajax({
            type: 'POST',
            data: logData,
            url: postUrl,
            dataType: 'JSON'
        }).done(function( response ) {
            if (response.msg === '') {
                $('table#log .row:eq(0) input[type="text"]').each(function() {
                    $(this).val('');
                });
                // fillLog();
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
}

function deleteLog(event) {
    event.preventDefault();
    var id = event.target.dataset.id;
    var confirmation = confirm('Are you sure?');
    if(confirmation) {
        event.preventDefault();
        $.ajax({
            type: 'DELETE',
            url: '/locations/delete-log/' + localData.slug + '/' + id
        }).done(function( response ) {
            if (response.msg === '') {
            }
            else {
                alert('Error: ' + response.msg);
            }
        });
    } else {
        return false;
    }
}