$(document).ready(function() {
    fillLocationForm();
    setupNewLog();
	$('#location header input.save').on('click', updateLocation);
    $('#location header input.delete').on('click', deleteLocation);
    $('#location #log').on('click', 'input.save', saveLog);
    $('#location #log').on('click', '.row:not(.saved) input.delete', clearLog);
    $('#location #log').on('click', '.row.saved input.delete', deleteLog);
});

//requests single location data query from DB via routes/locations.js
//fills form values with data when completed
function fillLocationForm() {
    $.getJSON('/admin/data/' + localData.slug, function(data) {
        $('form#info input.text').each(function(i,input) {
            var fieldName = input.id;
            $('form#info input#'+fieldName).val(data[fieldName]);
        });
        $('form#info input.textarea').each(function(i,textarea) {
            var fieldName = textarea.id;
            $('form#info input#'+fieldName).val(data[fieldName]);
        });
    }).complete(function() {

    });
}

function updateLocation(event) {
    event.preventDefault();
    var errorCount = 0;

	if($('input#name').val() === '') { errorCount++; }

    if(errorCount === 0) {
        var infoData = {
            'name': $('form#info input#name').val(),
            'email': $('form#info input#email').val(),
            'password': $('form#info input#password').val(),
            'how': $('form#info input#how').val(),
            'who': $('form#info input#who').val()
        };
        $.ajax({
            type: 'POST',
            data: infoData,
            url: '/admin/update/location/'+localData.id,
            dataType: 'JSON'
        }).done(function( response ) {
            if (response.msg === '') {
               // var newSlug = response.slug;
               // var oldSlug = localData.slug;
               // if(newSlug !== oldSlug) {
               //      window.location = '/admin/'+newSlug;
               // }
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
            url: '/admin/delete/location/' + id
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

function setupNewLog() {
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
    fillLog(newRow);
}

function fillLog() {
    var newRow = $('.row')[0];
    $.getJSON('/admin/logs/' + localData.slug, function(logs) {
        if(logs) {
            $.each(logs, function(i, log) {
                var row = $(newRow).clone().addClass('saved').appendTo('table#log tbody')
                .attr('data-id',log._id)
                .attr('data-date',log.date);
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
                
                $(row).children('.cell.data').children('input.text').each(function(ii, input) {
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

function updateLog(newRow) {
    // newRow = newRow[0];
    // var newRowDate = newRow.dataset.date;
    // var newRowIndex = newRow.rowIndex - 1;
    // var putAfter;
    // $('.row.saved').each(function(i,thisRow) {
    //     var thisDate = thisRow.dataset.date;
    //     var difference = moment(newRowDate).diff(thisDate);
    //     if(difference < 0) {
    //         putAfter = newRow;
    //     }
    // });

    // if($('.row.saved').length == 0) {
    //     putAfter = $('.row')[0];
    //     console.log($(newRow));
    // }
    // $(putAfter).after(newRow);
    $('.row.saved').each(function(i,row) {
        $(row).remove();
    });
    fillLog();
}

function clearLog(event) {
    if(event) {
        event.preventDefault();    
    }
    $('table#log .row:eq(0) input.text').each(function() {
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
        postUrl = '/admin/update/log/'+localData.slug+'/'+id;
    } else {
        postUrl = '/admin/create/log/'+localData.slug;
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
        logData['date'] = date;

        $(row).children('.cell.data').each(function(i, cell) {
            var input = $(cell).children('input');
            var type = input.data('type');
            var value = input.val();
            logData[type] = value;
        });

        logData['createdAt'] = $(row).data('created');

        $.ajax({
            type: 'POST',
            data: logData,
            url: postUrl,
            dataType: 'JSON'
        }).done(function( response ) {
            if (response.msg === '') {
                clearLog();
                updateLog($(row).clone());
            }
            else {
                
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
    var row = $('.row[data-id="'+id+'"]');
    var confirmation = confirm('Are you sure?');
    if(confirmation) {
        event.preventDefault();
        $.ajax({
            type: 'DELETE',
            url: '/admin/delete/log/' + localData.slug + '/' + id
        }).done(function( response ) {
            if (response.msg === '') {
                row.remove();
            }
            else {
                alert('Error: ' + response.msg);
            }
        });
    } else {
        return false;
    }

}