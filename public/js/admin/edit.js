var slug, logs
$(document).ready(function() {
	slug = data.slug
	logs = data.logs.sort(sortDesc)
	setupNewLog()

	tinymce.init({
	  selector: '.wysiwyg',
	  height: 400,
	  theme: 'inlite',
	  selection_toolbar: 'h1 bold italic quicklink',
	  menubar: false,
	  inline: true,
	  insert_toolbar: 'false'
	});

	$('form.location').on('click', 'input.save', saveLocation)
	$('#logs').on('click', 'input.save', saveLog)
	$('#logs').on('click', '.row.saved input.delete', deleteLog)
	$('#logs').on('click', '.row:not(.saved) input.delete', function(event) {
		event.preventDefault()
		var row = $(this).parents('.row')
		clearLog(row)
	})
})

function saveLocation(event) {
	tinymce.triggerSave()
	event.preventDefault()
}

function setupNewLog() {
	var $newRow = $('table#logs .row:eq(0)')
	var now = {
		'month': moment().month(),
		'day': moment().date(),
		'year': moment().year()
	}

	var months = moment.months()
	var $monthSelect = $newRow.children('.cell.month').children('select')
	$.each(months, function(i,month) {
		$monthSelect.append('<option value="'+i+'">'+month+'</option>')      
	})

	var $yearSelect = $newRow.children('.cell.year').children('select')
	var year = 2000
	var years = []
	while (year <= now.year) {
		$yearSelect.append('<option value="'+year+'">'+year+'</option>')
		year++
	}

	fillDates($newRow, now['month'], now['day'], now['year'])
	fillLogs()
}

function fillDates(row, month, day, year) {
	var monthSelect = $(row).children('.cell.month').children('select')
	var daySelect = $(row).children('.cell.day').children('select')
	var yearSelect = $(row).children('.cell.year').children('select')
	var days = 31
	var dayCounter = 1
	while (dayCounter <= days) {
		$(daySelect).append('<option value="'+dayCounter+'">'+dayCounter+'</option>')
		dayCounter++
	}
	$(monthSelect).val(month).change()
	$(daySelect).val(day).change()
	$(yearSelect).val(year).change()
}

function fillLogs() {
	var $firstRow = $('#logs .row').eq(0);
	$.each(logs, function(i, log) {
		var id = log._id;
		var date = log.date;
		var $newRow = $firstRow.clone()
			.addClass('saved')
			.attr('data-id', id)
			.attr('data-date', date)
		var date = moment(log['date'])
		date = {
			'month' : date.month(), 
			'day' : date.date(),
			'year' : date.year()
		}

		$newRow.find('.date select').each(function(j, select) {
			var name = select.name
			$(select).val(date[name])
		})
		
		$newRow.find('.data input.text').each(function(j, input) {
			var name = input.name
			$(input).val(log[name])
		})

		$newRow.find('.buttons input.button').each(function(j, button) {
			$(button).attr('data-id',log['_id'])
		})
		$('#logs').append($newRow)
	})
}

function saveLog(event) {
	event.preventDefault()
	var self = event.target
	var row = $(self).parents('.row')
	var id = self.dataset.id
	var saved = $(row).is('.saved')
	var postUrl
	return
	if(saved) {
		postUrl = '/admin/update/log/'+slug+'/'+id
	} else {
		postUrl = '/admin/create/log/'+slug
	}

	var logData = {}
	var date = {}
	$(row).find('.field').each(function(i, field) {
		var type = field.name 
		var value = field.value
		if($(field).is('.text')) {
			logData[type] = value
		} else {
			date[type] = value
		}
	});
	date = moment([date.year, date.month, date.day])
	date = date.toJSON()
	console.log(date)
	$(row).attr('data-date', date)
	logData['date'] = date
	$.ajax({
		type: 'POST',
		data: logData,
		url: postUrl,
		dataType: 'JSON'
	}).done(function( response ) {
		if(response.error)
			return alert('Error: ' + response.error)
		console.log(response.success)
		if(!saved) {
			clearLog(row)
		}
		var rowDates = [], rowElems = []
		$('#logs .row.saved').each(function() {
			var id = this.dataset.id
			var date = this.dataset.date
			rowDates.push({
				id: date,
				date: date,
				elem: this			
			})
		})
		$('#logs .row.saved').remove()
		rowDates = rowDates.sort(sortDesc)
		$(rowDates).each(function() {
			$('#logs').append(this.elem)
		})
	})
}

function insertLog(newRow) {
	var $newRow = $(newRow)
	var newRowDate = moment($newRow.attr('data-date'))
	if(!$('#logs .row.saved').length) {
		$newRow.insertAfter($('.row:first-child'))
	}
	// $('#logs .row.saved').each(function(i, row) {
	// 	var $thisRow = $(row)
	// 	var thisRowDate = moment($thisRow.attr('data-date'))
	// 	var $nextRow = $(row).next()
	// 	var nextRowDate = moment($nextRow.attr('data-date'))
	// 	var $prevRow = $(row).prev()

	// 	if($newRow.attr('data-id') == $thisRow.attr('data-id')) {
	// 		return
	// 	}
	// 	console.log($thisRow)
	// 	if(newRowDate.isSame(thisRowDate)) {
	// 		console.log(1)
	// 		return $newRow.insertAfter($thisRow)
	// 	}

	// 	if(newRowDate.isAfter(thisRowDate)) {
	// 		console.log(2)
	// 		return $newRow.insertAfter($thisRow)
	// 	}
		
	// 	if(newRowDate.isBefore(thisRowDate)) {
	// 		if(newRowDate.isAfter(nextRowDate) || !$nextRow.length) {
	// 			console.log(3)
	// 			return $newRow.insertAfter($thisRow)
	// 		}
	// 	}

	// 	if(!$nextRow.length) {
	// 		if($prevRow.is(':not(.saved)')) {
	// 			console.log(4)
	// 			return $newRow.insertBefore($thisRow)
	// 		} else {
	// 			console.log(5)
	// 			return $newRow.insertAfter($thisRow)
	// 		}
	// 	}
	// })
}

function clearLog(row) {
	var $row = $(row)
	$row.find('input.text').val('')
	$row.find('.month select').val(moment().month()).change()
	$row.find('.day select').val(moment().date()).change()
	$row.find('.year select').val(moment().year()).change()
}

function deleteLog(event) {
	event.preventDefault()
	var id = event.target.dataset.id
	var $row = $('.row[data-id="'+id+'"]')
	var confirmation = confirm('Are you sure?')
	if(confirmation) {
		$.ajax({
			type: 'DELETE',
			url: '/admin/delete/log/' + slug + '/' + id
		}).done(function( response ) {
			if(response.error)
				return alert('Error: ' + response.error)
			console.log(response.success)
			$row.remove()
		})
	} else {
		return false
	}
}

function requireInput(target) {
	var $target = $(target)
	$target.addClass('require')
	$target.on('keyup', function() {
		if(this.value.length) {
			$target.removeClass('require')
		} else {
			$target.addClass('require')
		}
	})
}

document.addEventListener('invalid', (function() {
  return function(e) {
    e.preventDefault()
    requireInput(e.target)
  }
})(), true)