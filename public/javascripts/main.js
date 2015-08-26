var papers = {};
var canvases = {};
var groups = {};
var logoPaper = new paper.PaperScope();
$(function() {
	createLogo();
});

function createLogo() {
	logoCanvas = document.createElement('canvas');
	var headerHeight = 300;
	$(logoCanvas).attr('id','logo').attr('resize', true).css({width:w(),height:headerHeight});
	logoCanvas.width = w();
	logoCanvas.height = headerHeight;
	$('header#logo').append(logoCanvas);
	logoPaper.setup(logoCanvas);
	papers['logo'] = logoPaper;
	canvases['logo'] = logoCanvas;

	var logoUrl = '../images/logo.svg';
	$.get(logoUrl, null, function(data) {
		var logoSvg = new XMLSerializer().serializeToString(data.documentElement);
		// var inlineLogpSvg = $('#logo').append(logoSvg);
		// var logoLayers = $($(inlineLogpSvg).children()[0]).children();
		// $.each(logoLayers, function(i, layer) {
		// 	$(layer).hover(function(event) {
		// 		var obj = event.target
		// 		$(obj).css({scale:'0'});
		// 		$(this).css({cursor:'pointer'});
		// 	});
		// });

		logo = logoPaper.project.importSVG(logoSvg);
		logo.position.x = w()/2;
		logo.position.y = headerHeight/2;
		logoObjs = logo.children;


		for(var i = 0; i < logoObjs.length; i++) {
			var hovering = false;
			var logoObj = logoObjs[i];
			var newGroup = new papers['logo'].Group();
			newGroup.addChildren(newGroup);
			groups[i] = newGroup;

			var jiggle = function onFrame(event) {
				if(hovering) {
					hoverObj.rotation = Math.sin((event.count + i) / 2) * 7;	
				}
			};

			logoObj.on('mouseenter', function(event) {
				hovering = true;
				$('body').css({'cursor':'pointer'});
				papers['logo'].view.on('frame', jiggle);
				hoverObj = this;
			});
			logoObj.on('mouseleave', function(event){
				hovering = false;
				$('body').css({'cursor':'default'});
				papers['logo'].view.off('frame', jiggle);
				hoverObj.rotation = 0;
				hoverObj = null;
			});


			// logoObj.onMouseEnter = function(event) {
			// 	hoverObj = event.target;
			// 	hovering = true;	
			// 	console.log(hoverObj);			
			// }

			// logoObj.onMouseLeave = function(event) {
			// 	hovering = false;
			// }

			// logoObj.onFrame = function() {
			// 	if(hovering) {
			// 		hoverObj.rotate(1);
			// 	} else {

			// 	}
			// }
		}

		logoPaper.view.draw();
	}, 'xml').done(function() {
		fillSections();
	});
}

function fillSections() {
	$('#locations section').each(function(i, section) {
		$(section).attr('data-location', location);
		$(section).attr('id', location);
		$(section).appendTo('#locations');
		$(section).children('header').children('a').click(function(event) {
			event.preventDefault();
			if($('body').hasClass('multiple')) {
				window.location = this.attributes.href;	
			}
		});
		var location = $(section).data('slug');
		createGraph(location);
	});
}