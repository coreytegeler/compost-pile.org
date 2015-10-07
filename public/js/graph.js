var graphOffset = 100;
var white = '#e9ffea';
var green = '#73db71';
var graphHeight = 300;
var moveLeft;
function handleLogs(location) {
	function stretchCanvas() {
		papers[location] = new paper.PaperScope();
		canvases[location] = document.createElement('canvas');
		width = w();
		height = graphHeight;
		$('.easel').css({
			width: width - 60
		});
		canvases[location].width = width;
		canvases[location].height = height;
		$(canvases[location]).css({
			width: width * 10,
			height: height
		});
		$(canvases[location]).attr('resize', true).attr('id',location); 
		$(canvases[location]).appendTo($('#'+location+'  .graph .easel'));
		papers[location].setup(canvases[location]);
		groups[location] = new papers[location].Group();
		var groupNames = [
			'graph',
			'graphContent',
			'clippedGraphContent',
			'markers',
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

		$(window).on('resize', function() {
			// graph.children['background'].set({
			// 	width: w(),
			// 	height: graphHeight
			// });
			// graphContent.children['mask'].set({
			// 	width: w(),
			// 	height: graphHeight
			// });
			var mask = groups[location].graphContent.children['mask'];
			var width = w() - 60;
			$('.easel').css({
				width: width
			});
			// canvases[location].width = width;
			// $(canvases[location]).css({
			// 	width: width
			// });
			papers[location].view.draw();
		});
	}

	function getData(location) {
		$.ajax({
			url: '/logs/' + location,
			dataType: 'json',
			success: function(response) {
				logs = response;
				createGraph(logs);
				createLogList(logs);
	        	graphPoints('input');
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
				strokeColor: white,
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
				input = row.input,
				output = row.output;
			var dateHtml = '<div class="cell date">' + date + '</div>',
				inputHtml = '<div class="cell input">' + input + '</div>',
				outputHtml = '<div class="cell output">' + output + '</div>';
			var html = '<li data-id="'+id+'">'+dateHtml+inputHtml+outputHtml+'</li>';
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
	}

	var startGraphing = 0;
	function graphPoints(type) {
		var zoom = 50;
		var line = new papers[location].Path({
			name: 'line',
			strokeWidth: 4,
			strokeCap: 'round',
			strokeJoin: 'round',
			strokeColor: green,
			opacity: 1
		});

		line.add(0, height);
		var firstDay = moment(logs[0].date).dayOfYear();
		for(var i = startGraphing; i < logs.length; i++) {
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
			var x = (doy - firstDay) * zoom;
			var y = height - parseInt(log[type])*5;
			line.add(x, y);
			var marker = new papers[location].Shape.Circle({
				name: id,
				x: x,
				y: y,
				radius: 8,
				strokeWidth: 3,
				strokeColor: green,
				fillColor: white,
				data: data,
				opacity: 1
			});
			groups[location].markers.addChild(marker);

			marker.onMouseEnter = function(event) {
				var id = event.target.data.id;
				showPopUp(id);
				$('body').css({'cursor':'pointer'});
			};

			marker.onMouseLeave = function(event) {
				var id = event.target.data.id;
				hidePopUp(id);
				$('body').css({'cursor':'default'});
			};

			marker.onClick = function(event) {

			};
		}
		line.sendToBack().simplify();
		loadFillSymbols(line);
	}

	function showPopUp(id) {
		var markers = groups[location].markers;
		var marker = markers.children[id];
		marker.fillColor = green;
		$('#'+location+' a').css({cursor: 'pointer'});
		var x = marker.x;
		var y = marker.y;
		var date = marker.data.date;
		var valueType = marker.data.valueType;
		var value = marker.data.value;
		$('#'+location+' .popup .row.date .data').html(date);
		$('#'+location+' .popup .row.value .title').html(valueType);
		$('#'+location+' .popup .row.value .data').html(value+' lbs.');
		$('#'+location+' .popup').css({
			display: 'block'
		}).css({
			left: x - $('#'+location+' .popup')[0].offsetWidth/2,
			top: y - $('#'+location+' .popup')[0].offsetHeight - 20,
		}).addClass('show');
		$('.logList li[data-id="'+id+'"]').addClass('hover');
	}

	function hidePopUp(id) {
		var markers = groups[location].markers;
		var marker = markers.children[id];
		$(groups[location].markers).each(function(i, marker) {
			marker.fillColor = white;
		});
		$('#'+location+' a').css({cursor: 'default'});
		$('#'+location+' .popup').removeClass('show');
		$('#'+location+' .popup').one('webkitTransitionEnd transitionend', function(e) {
			if(!$('#'+location+' .popup').hasClass('show')) {
				$('#'+location+' .popup').css({'display':'none'});
			}
		});
		$('.logList li[data-id="'+id+'"]').removeClass('hover');
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
			width: w() * 900,
			height: h(),
			clipMask: true
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
		groups[location].clippedGraphContent.addChildren([groups[location].fillContent, line, groups[location].markers]);
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