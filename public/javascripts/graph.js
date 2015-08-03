var graphGroup, markerGroup,stuffGroup, tickGroup, horzAxis, vertAxis;
var graphOffset = 150;
$(function() {
	canvas = document.createElement('canvas');
	width = w();
	height = h();
	createCanvas(width,height);
});

$(window).resize(function() {
	// paper.view.draw();
});

function createCanvas(w,h) {
	canvas.width = width;
	canvas.height = height;
	$(canvas).attr('resize', true); 
	$(canvas).appendTo($('#graph'));
	paper.setup(canvas);
	getData();
}

function getData() {
	$.getJSON('/logs/' + localData.slug, function(logs) {
        graphPoints(logs, 'total');
    });
}
function graphPoints(logs, type) {
	graphGroup = new paper.Group();	
	markerGroup = new paper.Group();	
	stuffGroup = new paper.Group();	
	tickGroup = new paper.Group();	
	horzAxis = new paper.Group();	
	vertAxis = new paper.Group();	
	var line = new paper.Path({
		strokeWidth: 5,
		strokeCap: 'round',
		strokeJoin: 'round',
		strokeColor: 'rgba(17,70,122,1)'
	});
	graphGroup.addChild(line);

	for(var i = 0; i < logs.length; i++) {
		var log = logs[i];
		var data = {
			date: moment(log.date).format('MMMM Do, YYYY'),
			valueType: type,
			value: log[type]
		};
		var x = 100*i;
		var y = height - parseInt(log.total);
		line.add(x, y);
		var marker = new paper.Shape.Circle({
			x: x,
			y: y,
			radius: 8,
			strokeWidth: 3,
			strokeColor: 'rgba(17,70,122,1)',
			fillColor: 'rgba(41,235,150,1)',
			data: data
		});
		markerGroup.addChild(marker);

		marker.onMouseEnter = function(event) {
			var marker = event.target;
			marker.fillColor = 'rgba(17,70,122,1)';
			$('body').css({cursor: 'pointer'});
			showData(event.target);
		};

		marker.onMouseLeave = function(event) {
			var marker = event.target;
			marker.fillColor = 'rgba(41,235,150,1)';
			$('body').css({cursor: 'default'});
			$('#popup').css({
				display: 'none'
			});
		};

		marker.onClick = function(event) {

		};
	}
	line.sendToBack().smooth();

	var limits = [];

	for(var i = 0; i< line.length; i+=50) {
		var point = line.getLocationAt(i).point;
		var coords = {
			x:point.x,
			y:point.y
		};
		limits.push(coords);
	}

	for(var i = 0; i < limits.length; i++) {
		var limit = limits[i];
		var size = 25;
		for(var ii = 0; ii < height-limit.y; ii += 5) {
			var shift = random(10,-10);
			var stuff = new paper.Shape.Circle({
				x: limit.x + shift,
				y: height-ii,
				radius: size,
				fillColor: 'rgba(17,70,122,0.1)'
			});
			stuff.sendToBack();
			stuffGroup.addChild(stuff);
		}
	}
	graphGroup.addChild(stuffGroup).addChild(markerGroup);
	graphGroup.position.x += graphOffset;
	graphGroup.position.y -= graphOffset;

	createAxes(logs);
}

function createAxes(logs) {
	var graphWidth = width - graphOffset;
	var graphHeight = height - graphOffset;
	var tickSize = 15;
	var strokeWidth = 3;
	for(var i = 0; i < graphWidth; i+=10) {
		var x = graphOffset + i;
		var y = height - graphOffset + 15;
		var tick = paper.Path.Line({
			from:[x, y],
			to:[x, y + tickSize],
			strokeWidth: strokeWidth,
			strokeCap: 'round',
			strokeJoin: 'round',
			strokeColor: 'rgba(17,70,122,1)'
		});

		horzAxis.addChild(tick);
	}
	tickGroup.addChild(horzAxis);


	var smallInterval = graphHeight - 10;
	var mediumInterval = graphHeight - 50;
	var largeInterval = graphHeight - 100;
	for(var i = graphHeight; i > 0; i-=1) {
		var x = graphOffset - 15;
		var y = i;
		var opacity = 1;
		var visibility = true;
		if(i == smallInterval) {
			tickSize = 15;
			smallInterval -= 10;
			size = 'small';
			if(i == mediumInterval) {
				tickSize = 20;
				mediumInterval -= 50;
				size = 'medium';
				if(i == largeInterval) {
					tickSize = 25;
					largeInterval -= 100;
					size = 'large';
				}
			}
		} else {
			visibility = false;
			opacity = 0;
			tickSize = 15;
		}

		var tick = paper.Path.Line({
			from: [x - tickSize, y],
			to:[x, y],
			strokeWidth: 3,
			strokeCap: 'round',
			strokeJoin: 'round',
			strokeColor: 'rgba(17,70,122,1)',
			opacity: opacity,
			data: {visibility: visibility}
		});

		tick.onMouseEnter = function(event) {
			$('body').css({cursor: 'pointer'});
			var y = this.segments[1].point.y;
			this.insert(2, [w(), y]);
			this.opacity = 1;
		};

		tick.onMouseLeave = function(event) {
			$('body').css({cursor: 'default'});
			this.removeSegment(2);
			if(this.data.visibility === false) {
				this.opacity = 0;
			}
		};

		vertAxis.addChild(tick);
	}
	tickGroup.addChild(vertAxis);
	paper.view.draw();
}

function showData(marker) {
	var x = marker.x;
	var y = marker.y;
	var date = marker.data.date;
	var valueType = marker.data.valueType;
	var value = marker.data.value;
	$('#popup .row.date .data').html(date);
	$('#popup .row.value .title').html(valueType);
	$('#popup .row.value .data').html(value+' lbs.');
	$('#popup').css({
		display: 'block'
	}).css({
		left: x - $('#popup')[0].offsetWidth/2 + graphOffset,
		top: y - $('#popup')[0].offsetHeight - 20 - graphOffset,

	});
}
