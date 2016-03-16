$(document).ready(function() {
    fillLocationForm();
    setupNewLog();
	$('#location header a.save').on('click', updateLocation);
    $('#location header a.view').on('click', viewLocation);
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
        $('form#info textarea').each(function(i,textarea) {
            var fieldName = textarea.id;
            $('form#info textarea#'+fieldName).val(data[fieldName]);
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
            'who': $('form#info textarea#who').val(),
            'how': $('form#info textarea#how').val(),
            'what': $('form#info textarea#what').val(),
            'compostable': $('form#info textarea#compostable').val(),
            'dropoff': $('form#info textarea#dropoff').val()
        };
        $.ajax({
            type: 'POST',
            data: infoData,
            url: '/admin/update/location/'+localData.id,
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

function viewLocation(event) {
    event.preventDefault();
    window.location = '/'+localData.slug;
}

function fillDates(row,month,day,year) {
    var monthSelect = $(row).children('.cell.month').children('select');
    var daySelect = $(row).children('.cell.day').children('select');
    var yearSelect = $(row).children('.cell.year').children('select');

    var days = 31;
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
    fillLog();
}

function fillLog() {
    var firstRow = $('.row')[0];
    $.getJSON('/admin/logs/' + localData.slug, function(logs) {
        if(logs) {
            $.each(logs, function(i, log) {
                var id = log._id;
                var date = log.date;
                if(!$('.row[data-id="' + id + '"]').length || $('.row[data-id="' + id + '"]').is('.updated')) {
                    if($('.row[data-id="' + id + '"]').is('.updated') && $('.row[data-id="' + id + '"]').is('.saved')) {
                        $('.row.updated').remove();
                    }
                    var newRow = $(firstRow).clone().addClass('saved')
                    .attr('data-id', id)
                    .attr('data-date', date);
                    var date = moment(log['date']);
                    date = {
                        'month' : date.month(), 
                        'day' : date.date(),
                        'year' : date.year()
                    };
                    $(newRow).children('.cell.date').children('select').each(function(ii, select) {
                        var type = select.dataset.type;
                        $(select).val(date[type]);
                    });
                    
                    $(newRow).children('.cell.data').children('input.text').each(function(ii, input) {
                        var type = input.dataset.type;
                        $(input).val(log[type]);
                    });

                    $(newRow).children('.buttons').children('input[type="submit"]').each(function(ii, button) {
                        $(button).attr('data-id',log['_id']);
                    });

                    var newRowDate = moment($(newRow).attr('data-date'));
                    if(!$('.row.saved').length) {
                        $(newRow).insertAfter($('.row:first-child'));
                    }
                    $('.row.saved').each(function(i, row) {
                        var thisRow = $(this);
                        var thisRowDate = moment($(thisRow).attr('data-date'));
                        var nextRow = $(this).next();
                        var nextRowDate = moment($(nextRow).attr('data-date'));
                        var prevRow = $(this).prev();
                        if(newRowDate.isSame(thisRowDate)) {
                            $(newRow).insertAfter(thisRow);
                            return false;
                        }

                        if(newRowDate.isAfter(thisRowDate)) {
                            $(newRow).insertBefore(thisRow);
                            return false;
                        }
                        
                        if(newRowDate.isBefore(thisRowDate)) {
                            if(newRowDate.isAfter(nextRowDate) || !$(nextRow).length) {
                                $(newRow).insertAfter(thisRow);
                                return false;
                            }
                        }
                        if(!$(nextRow).length) {
                            if($(prevRow).is(':not(.saved)')) {
                                $(newRow).insertBefore(thisRow);
                                return false;
                            } else {
                                $(newRow).insertAfter(thisRow);
                                return false;
                            }
                        }
                    });
                } else {
                    
                }
            });
        }
    });
}

function updateLog(row) {
    fillLog();
    return;
    var newRow = (row).clone().addClass('saved');
    var rowDate = moment($(newRow).attr('data-date'));
    $(row).find('select').each(function(i, input) {
        $(newRow).find('select').eq(i).val($(input).val());
    });
    $('.row.saved').each(function() {
        var thisRow = $(this);
        var thisRowDate = moment($(thisRow).attr('data-date'));
        var nextRow = $(this).next();
        var nextRowDate = moment($(nextRow).attr('data-date'));
        var prevRow = $(this).prev();
        if(rowDate.isBefore(thisRowDate)) {
            if(rowDate.isAfter(nextRowDate) || !$(nextRow).length) {
                $(newRow).insertAfter(thisRow);
                return false;
            }
        } else if($(prevRow).is(':not(.saved):first-child')) {
            $(newRow).insertAfter(prevRow);
            return false;
        } else if(!$(nextRow).length) {
            $(newRow).insertAfter(thisRow);
            return false;
        }
    });
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

    if(errorCount === 0) {
        var logData = {};
        var date = {};
        $(row).children('.cell.date').each(function(i, cell) {
            var select = $(cell).children('select');
            var type = select.data('type');            
            var value = select.val();
            date[type] = value;
        });
        var year = date['year'];
        var month = date['month'];
        var day = date['day'];
        date = moment([year, month, day]);
        date = date.toJSON();
        $(row).attr('data-date', date);
        logData['date'] = date;

        var isEmpty;
        $(row).children('.cell.data').each(function(i, cell) {
            var input = $(cell).children('input');
            var type = input.data('type');
            var value = input.val();
            if(!value.length) {
                isEmpty = true;
            }
            logData[type] = value;
        });
        if(isEmpty) {
            return;
        }

        logData['createdAt'] = $(row).data('created');

        $.ajax({
            type: 'POST',
            data: logData,
            url: postUrl,
            dataType: 'JSON'
        }).done(function( response ) {
            if (response.msg === '') {
                $(row).addClass('updated');
                fillLog(row);
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