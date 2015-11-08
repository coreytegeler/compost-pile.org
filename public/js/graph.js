var graphOffset = 100;
var light = '#e9ffea';
var dark = '#73db71';
var graphHeight = 400;
var moveLeft;
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


		$(window).on('resize', function() {
			var mask = groups[location].graphContent.children['mask'];
			var clipped = groups[location].graphContent.children['clippedGraphContent'];
			// mask.set({ width: w() });
			// clipped.set({ width: w() });
		});
		getData(location);
	}

	function getData(location) {
		$.ajax({
			url: '/logs/' + location,
			dataType: 'json',
			success: function(response) {
				logs = response;
				createGraph(logs);
				createLogList(logs);
	        	graphPoints('scraps');
	        }
	    });
	}

	function createGraph(logs) {
		groups[location].ticks.addChildren([groups[location].horzTicks, groups[location].vertTicks]);
		// groups[location].graphContent.addChild(groups[location].ticks);
		var tickSize = 30;
		var tickInterval = 30;
		for(var i = graphHeight - tickInterval; i > 0; i-=tickInterval) {
			var tick = papers[location].Path.Line({
				from: [0, graphHeight - i],
				to: [tickSize, graphHeight - i],
				strokeWidth: 6,
				strokeCap: 'round',
				strokeColor: light,
				opacity: 0
			});
			groups[location].vertTicks.addChild(tick);
		}
		// tick.onMouseEnter = function(event) {
		// 	$('body').css({cursor: 'pointer'});
		// 	var y = this.segments[1].point.y;
		// 	this.insert(2, [w(), y]);
		// 	this.opacity = 1;
		// };

		// tick.onMouseLeave = function(event) {
		// 	$('body').css({cursor: 'default'});
		// 	this.removeSegment(2);
		// 	if(this.data.visibility === false) {
		// 		this.opacity = 0;
		// 	} else {
		// 		this.opacity = 1;
		// 	}
		// };
		papers[location].view.draw();
	}

	function createLogList(logs) {
		var $logList = $('#'+location+' .info .logList');
		$(logs).each(function(i, row) {
			var id = row._id;
			var date = moment(row.date).format('MMMM Do, YYYY'),
				scraps = row.scraps,
				compost = row.compost;
			var dateHtml = '<div class="cell date">' + date + '</div>',
				scrapsHtml = '<div class="cell scraps">' + scraps + ' lbs.</div>',
				compostHtml = '<div class="cell compost">' + compost + ' lbs.</div>';
			var html = '<li data-id="'+id+'">'+dateHtml+scrapsHtml+compostHtml+'</li>';
			$logList.append(html);
		});
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
			// scrollToMarker(id);
		});
	}

	var startGraphing = 0;
	function graphPoints(type) {
		var zoom = 100;
		var line = new papers[location].Path({
			name: 'line',
			strokeWidth: 4,
			strokeCap: 'round',
			strokeJoin: 'round',
			strokeColor: dark,
			opacity: 1
		});
		var width = w() - 60;
		line.add(0, height);

		var firstDay = moment(logs[0].date).dayOfYear();
		for(var i = 0; i < logs.length; i++) {
			var log = logs[i];
			var date = moment(log.date);
			var humanDate = date.format('MMMM Do, YYYY');
			var doy = date.dayOfYear();
			var id = log._id;
			var data = {
				date: humanDate,
				id: id,
				index: i,
				valueType: type,
				value: log[type]
			};
			var since = firstDay-doy;
			var x = since*zoom;
			var y = height-parseInt(log[type])*5;
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
				$('body').css({'cursor':'pointer'});
			};

			markerHover.onMouseLeave = function(event) {
				var id = event.target.data.id;
				hidePopUp(id);
				$('body').css({'cursor':'default'});
			};

			markerHover.onClick = function(event) {
				var id = event.target.data.id;
				console.log(id);
				scrollToListItem(id);
			};
			if(i==logs.length-1) {
				line.add(x, height);
				line.add(0, height);
				line.sendToBack().simplify();
				loadFillSymbols(line);
			}
		}
		
	}

	function showPopUp(id) {
		var markers = groups[location].markers;
		var marker = markers.children[id];
		marker.fillColor = dark;

		var popup = $('#'+location+' .popup[data-id='+id+']');

		var x = marker.x - $(popup)[0].offsetWidth/2;
		var y = marker.y - $(popup)[0].offsetHeight - 30;
		$(popup).css({
			display: 'block'
		});
		$(popup).css({
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
		var scrollTo = $(logListItem).index() * $(logListItem).outerHeight();
		// var scrollTo = $(logListItem).index();
		console.log(scrollTo);
		$(logList).animate({
        	scrollTop: scrollTo
    	}, 200);
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
						console.log(compostable);	
					}
				}
				newSymbol.onMouseEnter = function(event) {
					
				}
				newSymbol.onMouseLeave = function(event) {
					
				}
				groups[location].fillSymbols.addChild(newSymbol);
			}
		}
		groups[location].fillContent.addChildren([fill, fillMask, groups[location].fillSymbols]);
		groups[location].clippedGraphContent.addChildren([groups[location].fillContent, line, groups[location].markers, groups[location].markerHovers]);
		groups[location].graphContent.addChildren([mask, groups[location].clippedGraphContent, groups[location].ticks]);
		groups[location].graph.addChild(groups[location].graphContent);
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
		handleHands();
	}

	stretchCanvas();

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
	console.log(location);
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

function handleHands() {
	
}