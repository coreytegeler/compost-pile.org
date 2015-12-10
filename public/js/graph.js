var graphOffset = 100;
var light = '#f3fff3';
var dark = '#73db71';
var graphHeight = 400;
var ease = 400;
var logs, pile;
var type = 'compost';
function handleLogs(location) {
	function stretchCanvas() {
		papers[location] = new paper.PaperScope();
		canvases[location] = document.createElement('canvas');
		width = w();
		height = graphHeight;
		canvases[location].height = height;
		$(canvases[location]).css({
			height: height
		});
		$(canvases[location]).attr('resize', false).attr('id',location); 
		$(canvases[location]).appendTo($('#'+location+'  .graph .easel'));

		papers[location].setup(canvases[location]);
		groups[location] = new papers[location].Group();
		var groupNames = [
			'graph',
			'graphContent',
			'clippedGraphContent',
			'markers',
			'markerHovers',
			'fillSymbols',
			'ticks',
			'horzTicks',
			'vertTicks',
			'horzAxis',
			'vertAxis',
			'fillContent',
			'axes',
			'graphUtils'
		];
		for(var i = 0; i < groupNames.length; i++) {
			var groupName = groupNames[i];
			var newGroup = new papers[location].Group({name: groupName});
			var thisGroup = groups[location];
			thisGroup[groupName] = newGroup;
			groups[location].addChildren(thisGroup[groupName]);
		}		
		getData(location);
	}

	function getData(location) {
		$.ajax({
			url: '/logs/' + location,
			dataType: 'json',
			success: function(response) {
				logs = response;
				createLogList(logs);
	        	graphPoints(logs, type);
	        }
	    });
	}

	function createLogList(logs) {
		var $logList = $('#'+location+' .info .logList');
		for(var i = 0; i < logs.length; i++ ) {
			var row = logs[i];
			var id = row._id;
			var date = moment(row.date).format('MMMM Do, YYYY'),
				scraps = row.scraps,
				compost = row.compost;
			var dateHtml = '<div class="cell date">' + date + '</div>',
				scrapsHtml = '<div class="cell scraps">' + scraps + ' lbs.</div>',
				compostHtml = '<div class="cell compost">' + compost + ' lbs.</div>';
			var html = '<li data-id="'+id+'">'+dateHtml+scrapsHtml+compostHtml+'</li>';
			$logList.prepend(html);
		}
		$logList.on('mouseenter', 'li', function (event) {
			var id = $(this).attr('data-id');
			showPopUp(id);
		});
		$logList.on('mouseleave', 'li', function (event) {
			var id = $(this).attr('data-id');
			hidePopUp(id);
		});
		$logList.on('click', 'li', function (event) {
			var id = $(this).attr('data-id');
			slideToMarker(id);
		});
	}

	var startGraphing = 0;
	function graphPoints(logs, type) {
		var zoom = 300;
		var line = new papers[location].Path({
			name: 'line',
			strokeWidth: 4,
			strokeCap: 'round',
			strokeJoin: 'round',
			strokeColor: dark,
			opacity: 1
		});
		var width = w() - 60;
		line.add(0, height+5);
		var firstDayUnix = moment(logs[0].date).unix();
		var lastX;
		for(var i = 0; i < logs.length; i++) {
			var log = logs[i];
			var date = moment(log.date);
			var humanDate = date.format('MMMM Do, YYYY');
			var thisDayUnix = moment(date).unix();
			var id = log._id;

			var since = (thisDayUnix-firstDayUnix)/250000;
			var x = ease+(since*zoom);
			var y = height-parseInt(log[type])*5;

			var data = {
				date: humanDate,
				id: id,
				index: i,
				valueType: type,
				value: log[type],
				x, x
			};
			
			line.add(x, y);
			var marker = new papers[location].Shape.Circle({
				name: id,
				x: x,
				y: y,
				radius: 8,
				strokeWidth: 3,
				strokeColor: dark,
				fillColor: light,
				data: data,
				opacity: 1
			});
			var markerHover = marker.clone().set({
				radius: 25,
				strokeWidth: 0,
				opacity: 0
			});
			groups[location].markers.addChild(marker);
			groups[location].markerHovers.addChild(markerHover);

			var popupModel = $('.popup.model');
			var popup = $(popupModel).clone();
			$(popup).removeClass('model')
			$(popup).attr('data-id', id);
			$(popup).css({top:'1000px'});
			$(popup).children('.date').children('.data').html(humanDate)
			$(popup).children('.value').children('.title').html(type)
			$(popup).children('.value').children('.data').html(log[type]+' lbs.');
			$(popup).insertAfter($(popupModel));

			markerHover.onMouseEnter = function(event) {
				var id = event.target.data.id;
				showPopUp(id);
				$('.graph').css({'cursor':'pointer'});
			};

			markerHover.onMouseLeave = function(event) {
				var id = event.target.data.id;
				hidePopUp(id);
				$('.graph').css({'cursor':'default'});
			};

			markerHover.onClick = function(event) {
				var id = event.target.data.id;
				scrollToListItem(id);
			};
			lastX = x;
			if(i == logs.length - 1) {
				line.add(lastX+ease, height+5);
				line.sendToBack().simplify();
				loadFillSymbols(line);	
			}
		}
		
	}

	function showPopUp(id) {
		var pileX = pile.bounds.x;

		var markers = groups[location].markers;
		var marker = markers.children[id];
		marker.fillColor = dark;

		var popup = $('#'+location+' .popup[data-id='+id+']');

		var x = marker.x - $(popup)[0].offsetWidth/2 + pileX;
		var y = marker.y - $(popup)[0].offsetHeight - 30;
		$(popup).css({
			display: 'block',
			left: x,
			top: y,
		}).addClass('show');
		$('.logList li[data-id="'+id+'"]').addClass('hover');
	}

	function hidePopUp(id) {
		var markers = groups[location].markers;
		var marker = markers.children[id];
		marker.fillColor = light;

		var popup = $('#'+location+' .popup[data-id='+id+']');
		$(groups[location].markers).each(function(i, marker) {
			marker.fillColor = light;
		});

		$(popup).removeClass('show');
		$(popup).one('webkitTransitionEnd transitionend', function(e) {
			if(!$(popup).hasClass('show')) {
				$(popup).css({top:'1000px'});
			}
		});
		$('.logList li[data-id="'+id+'"]').removeClass('hover');
	}

	function scrollToListItem(id) {
		var logList = $('.logList');
		var logListItem = $('.logList li[data-id="'+id+'"]');
		var logListHeight = $(logList).height();
		var scrollTo = $(logListItem).index() * $(logListItem).outerHeight();
		var lastListItem = $(logList).children('li:last-child');
		$(lastListItem).css({marginBottom:scrollTo});
		$(logList).animate({
        	scrollTop: scrollTo
    	}, 200, function() {
	    	$(logList).on('scroll', function (event) {
				var lastListItem = $(this).children('li:last-child');
				var distance = $(lastListItem).index() * $(lastListItem).outerHeight() + $(lastListItem).outerHeight() + 30 - $(this).outerHeight();
				var scrollTop = $(this).scrollTop();
				if(scrollTop <= distance) {
					$(lastListItem).css({'marginBottom':'5px'});
				}
			});
    	});
	}

	function slideToMarker(id) {
		pile = groups[location].graphContent;
		var pileWidth = pile.bounds.width;
		var pileX = pile.position.x;
		var canvasWidth = $('.graph canvas').innerWidth();
		var thisGroup = groups[location];
		var markers = thisGroup.markers.children;
		var thisMarkerIndex = markers[id];
		var thisMarker = markers[id];
		console.log(thisMarker);
		var thisMarkerX = thisMarker.position.x;
		var newPileX = pileX - thisMarkerX + canvasWidth/2;
		pile.position.x = newPileX;
		$('.popup.show').removeClass('show');
		showPopUp(id);
		papers[location].view.draw();
	}


	var svgs = {};
	var compostables = [
		'apple',
		'banana',
		'beet',
		'eggshell',
		'peanut',
		'tomato',
		'dirt'
	];

	function loadFillSymbols(line) {
		$.each(compostables, function(i,compostable) {
			var imgUrl = '../images/compost/'+compostable+'.svg';
			$.get(imgUrl, null, function(svg) {
				importedSvg = papers[location].project.importSVG(svg);
				var symbol = new papers[location].Symbol(importedSvg);
				symbol.data = {'name':compostable};
				svgs[compostable] = symbol;
			}, 'xml').done(function() {
				if(i == compostables.length-1) {
					fillGraphWithSymbols(line);
				}
			});
		});
	}

	function fillGraphWithSymbols(line) {
		var mask = new papers[location].Path.Rectangle({
			name: 'mask',
			x: 0,
			y: 0,
			width: w(),
			height: h(),
			clipMask: false
		});

		var endPile;
		var lineLength = line.segments.length;
		var lastSeg = line.segments[lineLength-1];
		var lastPointX = lastSeg.point.x;

		var fill = line.clone().set({
			name: 'fill',
			fillColor: '#754e34',
			strokeCap: '',
			strokeJoin: '',
			strokeColor: '',
			strokeWidth: '',
			closed: true,
			opacity: 1
		});
		fill.add(lastPointX+200, height);
		var fillMask = fill.clone().set({
			name: 'fillMask',
			clipMask: true
		});
		var limits = [];
		for(var i=0; i<fillMask.length; i+=50) {
			var point = fillMask.getLocationAt(i).point;
			var coords = {
				x:point.x,
				y:point.y
			};
			limits.push(coords);
		}
		for(var i = 0; i < limits.length; i++) {
			var limit = limits[i];
			var size = 25;
			for(var ii = 0; ii < height-limit.y; ii += 20) {
				var shift = random(10,-10);
				var randInt = random(0, compostables.length - 1);
				var compostable = compostables[randInt];
				var fillSymbol = svgs[compostable];
				if(fillSymbol != undefined) {
					var newSymbol = fillSymbol.place({
						x: limit.x + shift,
						y: height-ii + shift
					});
					newSymbol.scale(0.25);
					newSymbol.rotate(random(0,360));
					newSymbol.sendToBack();
					newSymbol.onMouseDown = function(event) {
						if($('body').hasClass('single')) {
							var compostable = event.target.symbol.data.name;
						}
					}
					newSymbol.onMouseEnter = function(event) {
						
					}
					newSymbol.onMouseLeave = function(event) {
						
					}
					groups[location].fillSymbols.addChild(newSymbol);
				}
			}
		}
		groups[location].fillContent.addChildren([fill, fillMask, groups[location].fillSymbols]);
		groups[location].clippedGraphContent.addChildren([groups[location].fillContent, line, groups[location].markers, groups[location].markerHovers]);
		groups[location].graphContent.addChildren([mask, groups[location].clippedGraphContent, groups[location].ticks]);
		groups[location].graph.addChild(groups[location].graphContent);

		pile = groups[location].graphContent;
		var pileWidth = pile.bounds.width;
		var pileX = pile.position.x;
		var canvasWidth = $('.graph canvas').innerWidth();
		var thisGroup = groups[location];
		var markers = thisGroup.markers;
		var lastMarkerIndex = markers.children.length - 1;
		var lastMarker = markers.children[lastMarkerIndex];
		var lastMarkerX = lastMarker.position.x;
		var newPileX = pileX - lastMarkerX + canvasWidth - ease/4;
		pile.position.x = newPileX; 
		papers[location].view.draw();
		showGraph(location);
	}

	function showGraph(location) {
		$('.graph').addClass('show');
		var wrapper = $('.location#'+location);
		if($(wrapper).hasClass('opened')) {
			var id = wrapper[0].id;
			showGraphUtils(id);
		}
	}

	stretchCanvas();

	$('body').on('mousemove', '.graph canvas', function(event) {
		var graph = event.currentTarget;
		var pile = groups[location]['graphContent'];
		var x = event.offsetX;
		var width = graph.clientWidth;
		var cursor;
		if(x >= width - 200) {
			cursor = 'e-resize';
		} else if (x <= 200) {
			cursor = 'w-resize';
		} else {
			cursor = 'default';
		}
		$(graph).css({
			'cursor' : cursor
		});
	});	

	$('body').on('click', '.graph canvas', function(event) {
		var graph = event.currentTarget;
		var x = event.offsetX;
		var width = graph.clientWidth;
		var pile = groups[location]['graphContent'];

		if (x <= 200 && !isStart(pile)) {
			var newPosition = pile.position.x + width;
		} else if(x >= width - 200 && !isEnd(pile)) {
			var newPosition = pile.position.x - width;
		} else {
			return;
		}
		pile.position.x = newPosition;
		papers[location].view.draw();
	});	

	var typeSelect = $('.select.type');
	$('.type').on('click', '.option:not(.selected)', function() {
		var type = $(this).attr('data-type');
		$(typeSelect).find('.selected').removeClass('selected');
		$(this).addClass('selected');
		graphPoints(logs, type);
	});

}


function isStart(pile) {
	if(pile.bounds.x + 200 > 0) {
		return true;
	} else {
		return false;
	}
}
function isEnd(pile) {
	if(pile.bounds.width + pile.bounds.x < w()) {
		return true;
	} else {
		return false;
	}
}


function showGraphUtils(location) {
	var thisGroup = groups[location];
	var markers = thisGroup.markers;
	var line = thisGroup;
	var ticks = thisGroup.ticks;
	for(var i = 0; i < markers.children.length; i ++) {
		markers.children[i].opacity = 0;
	}
	papers[location].view.draw();
}

function hideGraphUtils(location) {
	var thisGroup = groups[location];
	var markers = thisGroup.markers;
	var line = papers[location];
	var ticks = thisGroup.ticks;
	var markerCount = markers.children.length;
	// var loadUtils = function onFrame(event) {
	for(var i = 0; i < markers.children.length; i ++) {
		markers.children[i].opacity = 0;
	}
	papers[location].view.draw();
	// };
	// papers[location].view.on('frame', loadUtils);
}

