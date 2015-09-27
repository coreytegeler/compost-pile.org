var papers = {};
var canvases = {};
var groups = {};
var logoPaper = new paper.PaperScope();
$(function() {
	createLogo();
});

function createLogo() {
	logoCanvas = document.createElement('canvas');
	var headerWidth = 530;
	var headerHeight = 300;
	$(logoCanvas).attr('id','logo').attr('resize', true).css({width:headerWidth,height:headerHeight});
	logoCanvas.width = headerWidth;
	logoCanvas.height = headerHeight;
	$('header#logo a#logoLink').append(logoCanvas);
	$('header#logo a#logoLink').click(function(event) {
		event.preventDefault();
		if($('section.location.opened')) {
			closeSection();
		}
	});
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
		logo.position.x = headerWidth/2;
		logo.position.y = headerHeight/2;
		logoObjs = logo.children;
		groups['logo'] = new papers['logo'].Group();
		for(var i = 0; i < logoObjs.length; i++) {
			var hovering = false;
			var logoObj = logoObjs[i];
			var newGroup = new papers['logo'].Group();
			newGroup.addChildren(logoObj);
			groups['logo'].addChildren(newGroup);

			var jiggle = function onFrame(event) {
				if(hovering) {
					hoverObj.rotation = Math.sin((event.count + i) / 2) * 3;	
				} else if(hoverObj.rotation != 0) {
					hoverObj.rotation = Math.sin((event.count + i) / 2) * 3;
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
				hoverObj = null;
			});
		}
		logoPaper.view.draw();
	}, 'xml').done(function() {
		keepScrollin();
		fillSections();
	});
}

function keepScrollin() {
	// var lastScrolled = 0;
	// var distance = $('header#logo').outerHeight();
	// $(window).scroll(function(event) {
	// 	var distance = $('header#logo').outerHeight();
	// 	var scrolled = $(window).scrollTop();
	// 	lastScrolled = scrolled;
	// 	var height = distance - scrolled;
	// 	if(height >= 100) {
	// 		console.log("!");
	// 		$('header#logo').css({height:height});
	// 		$('#locations').css({marginTop: height});
	// 	} else if (scrolled = 0) {
	// 		$('header#logo').css({height:height+1});
	// 	}
	// });
}


function fillSections() {
	$('#locations section.location').each(function(i, section) {
		groups[location] = {};
		var location = $(section).data('slug');
		$(section).attr('data-location', location);
		$(section).attr('id', location);
		$(section).appendTo('#locations');
		if(selected != undefined) {
			if (location == selected) {
				openSection(selected, '', false);
			}
		}
		$(section).children('a').click(function(event) {
			event.preventDefault();
			if(!$(section).hasClass('opened')) {
				openSection(location, this.href, true);
			}
		});
		createGraph(location);
	});
}


function openSection(id, url, anim) {
	var speed = 500;
	history.pushState(null, null, url);
	var section = $('section.location#'+id)[0];
	var content = $('section.location#'+id+' a .content')[0];
	var width = $(content).width();
	var height = $(content).height();

	if(anim == false) {
		var speed = 0;
	}

	var previousSibling = $(section)[0].previousSibling;
	var nextSibling = $(section)[0].nextSibling;
	if($(section).is(':last-child')) {
		if(!$(previousSibling).hasClass('opened')) {
			var sibling = previousSibling;
		}
	}
	else if($(section).is(':nth-child(odd)')) {
		if($(nextSibling).hasClass('opened')) {
			var sibling = previousSibling;
		} else {
			var sibling = nextSibling;
		}
	}
	else if($(section).is(':nth-child(even)')) {
		if($(previousSibling).hasClass('opened')) {
			var sibling = nextSibling;
		} else {
			var sibling = previousSibling;
		}
	}

	$(sibling).transition({width:'0%'}, speed, 'cubic-bezier(.42,.15,.03,1)', function() {
		$(sibling).css({width:'50%'});
	});	

	var hidden = $('section.location.hidden');
	$(hidden).removeClass('hidden')
	$(hidden).transition({'width':'50%'}, speed, 'cubic-bezier(.42,.15,.03,1)');
	
	// var top = $(section).offset().top;
	// $('html, body').animate({
	// 	scrollTop: top
	// }, speed);

	var openedId = $('section.location.opened').attr('id');
	$(section).addClass('opened');
	$(section).transition({'width':'100%'}, speed, 'cubic-bezier(.42,.15,.03,1)', function() {
		if($('section.location#'+openedId)) {
			var opened = $('section.location#'+openedId);
			$(opened).removeClass('opened');
			$(opened).transition({'width':'50%'}, speed, 'cubic-bezier(.42,.15,.03,1)', function() {
				hideGraphUtils(openedId);
			});
		}

		var top = $('#locations').offset().top;
		
		// $('html, body').animate({
		// 	scrollTop: top
		// }, 0, function() {
			
		// });

		$('#locations').prepend($(section));
		if(anim) {
			showGraphUtils(id);		
		}
	});

	$('body').removeClass('multiple').addClass('single');
	
}
function closeSection() {
	var speed = 500;
	history.pushState(null, null, '/');
	var section = $('section.location.opened');
	var hidden = $('section.location.hidden');
	$(hidden).removeClass('hidden').transition({'width':'50%'}, speed, 'cubic-bezier(.42,.15,.03,1)');

	if($(section).is(':nth-child(odd)')) {
		var sibling = $(section)[0].nextSibling;
	} else if($(section).is(':nth-child(even)')) {
		var sibling = $(section)[0].previousSibling;
		
	}
	$(sibling).css({'width':'0%'});
	$(section).removeClass('opened').transition({'width':'50%'}, speed, 'cubic-bezier(.42,.15,.03,1)');
	$(sibling).transition({width:'50%'}, speed, 'cubic-bezier(.42,.15,.03,1)');
	$('body').removeClass('single').addClass('multiple');

	var id = $(section).attr('id');
	hideGraphUtils(id);
}
