var papers = {};
var canvases = {};
var groups = {};
var logoPaper = new paper.PaperScope();
var dirtPaper = new paper.PaperScope();
$(function() {
	createLogo();
	setSliderWidth();
	setUpSlider();
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
		return;
		event.preventDefault();
		if($('.location.opened')) {
			closeSection();
		}
	});
	logoPaper.setup(logoCanvas);
	papers['logo'] = logoPaper;
	canvases['logo'] = logoCanvas;
	var hovering = false;
	var logoUrl = '../images/logo.svg';
	$.get(logoUrl, null, function(data) {
		var logoSvg = new XMLSerializer().serializeToString(data.documentElement);
		logo = logoPaper.project.importSVG(logoSvg);
		logo.position.x = headerWidth/2;
		logo.position.y = headerHeight/2;
		logoObjs = logo.children;
		groups['logo'] = new papers['logo'].Group();
		for(var i = 0; i < logoObjs.length; i++) {
			var logoObj = logoObjs[i];
			logoObj.center = 'center';
			var logoGroup = new papers['logo'].Group();
			logoGroup.addChildren(logoObj);
			groups['logo'].addChildren(logoGroup);
		}
		logoPaper.view.draw();
	}, 'xml').done(function() {
		var jiggle = function onFrame(event) {
			if(hovering) {
				for(var i = 0; i < logoObjs.length; i++){
					wiggleAmount = (Math.random() * 2) + 6;
					logoObjs[i].rotation = Math.sin((event.count + i) / 3) * wiggleAmount;
				}
			}
		};
		$('header#logo').addClass('show');
		$('section').addClass('show');
		setTimeout(function() {
			handleLogs();
		}, 900);

		$('header.where').addClass('show');
		$('canvas#logo').on('mouseenter', function(event) {
			hovering = true;
			var wiggleSpeed;
			var wiggleAmount;
			$('body').css({'cursor':'pointer'});
			papers['logo'].view.on('frame', jiggle);
		});
		$('canvas#logo').on('mouseleave', function(event){
			hovering = false;
			$('body').css({'cursor':'default'});
			papers['logo'].view.off('frame', jiggle);
			for(var i = 0; i < logoObjs.length; i++){
				logoObjs[i].rotation = 0;
			}	
		});
		keepScrollin();
		fillSections();
		createDirt();
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
	$('#locations .location').each(function(i, wrapper) {
		groups[location] = {};
		var location = $(wrapper).data('slug');
		$(wrapper).attr('data-location', location);
		$(wrapper).attr('id', location);
		$(wrapper).appendTo('#locations');
		if(selected != undefined) {
			if (location == selected) {
				openSection(selected, '', false);
			}
		}
		$(wrapper).children('a').click(function(event) {
			event.preventDefault();
			if(!$(wrapper).hasClass('opened')) {
				openSection(location, this.href, true);
			}
		});
	});
}

function openSection(id, url, anim) {
	var speed = 500;
	history.pushState(null, null, url);
	var wrapper = $('.location#'+id)[0];
	var content = $('.location#'+id+' a .content')[0];
	var width = $(content).width();
	var height = $(content).height();
	if(anim == false) {
		var speed = 0;
	}
	var previousSibling = $(wrapper)[0].previousSibling;
	var nextSibling = $(wrapper)[0].nextSibling;
	if($(wrapper).is(':last-child')) {
		if(!$(previousSibling).hasClass('opened')) {
			var sibling = previousSibling;
		}
	}
	else if($(wrapper).is(':nth-child(odd)')) {
		if($(nextSibling).hasClass('opened')) {
			var sibling = previousSibling;
		} else {
			var sibling = nextSibling;
		}
	}
	else if($(wrapper).is(':nth-child(even)')) {
		if($(previousSibling).hasClass('opened')) {
			var sibling = nextSibling;
		} else {
			var sibling = previousSibling;
		}
	}

	$(sibling).transition({width:'0%'}, speed, 'cubic-bezier(.42,.15,.03,1)', function() {
		$(sibling).css({width:'50%'});
	});	

	var hidden = $('.location.hidden');
	$(hidden).removeClass('hidden')
	$(hidden).transition({'width':'50%'}, speed, 'cubic-bezier(.42,.15,.03,1)');
	
	// var top = $(wrapper).offset().top;
	// $('html, body').animate({
	// 	scrollTop: top
	// }, speed);

	var openedId = $('.location.opened').attr('id');
	$(wrapper).addClass('opened');
	$(wrapper).transition({'width':'calc(100% - 20px)'}, speed, 'cubic-bezier(.42,.15,.03,1)', function() {
		if($('.location#'+openedId)) {
			var opened = $('.location#'+openedId);
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

		$('#locations').prepend($(wrapper));
		if(anim) {
			showGraphUtils(id);		
		}
	});

	$('body').removeClass('multiple').addClass('single');
	
}
function closeSection() {
	var speed = 500;
	history.pushState(null, null, '/');
	var wrapper = $('.location.opened');
	var hidden = $('.location.hidden');
	$(hidden).removeClass('hidden').transition({'width':'50%'}, speed, 'cubic-bezier(.42,.15,.03,1)');

	if($(wrapper).is(':nth-child(odd)')) {
		var sibling = $(wrapper)[0].nextSibling;
	} else if($(wrapper).is(':nth-child(even)')) {
		var sibling = $(wrapper)[0].previousSibling;	
	}
	$(sibling).css({'width':'0%'});
	$(wrapper).removeClass('opened').transition({'width':'50%'}, speed, 'cubic-bezier(.42,.15,.03,1)');
	$(sibling).transition({width:'50%'}, speed, 'cubic-bezier(.42,.15,.03,1)');
	$('body').removeClass('single').addClass('multiple');

	var id = $(wrapper).attr('id');
	hideGraphUtils(id);
}

function setUpSlider() {
	var slider = $('.slider');
	var sliderWidth = $(slider).innerWidth();
	var slideWrapper = $(slider).find('.slides');
	var slides = $(slideWrapper).find('.slide');
	var slidesLength = $(slides).length;
	var arrow = $(slider).find('.arrow');
	var left_arrow = $(arrow).filter('.left');
	var right_arrow = $(arrow).filter('.right');

	var showingImage = $(slides)[0];

	$(showingImage).addClass('show');

	setSliderWidth();

	$(arrow).click(function() {
		var sliderWidth = $(slider).innerWidth();
		var showingSlide = $('.slide.show');
		var showingCaption = $('.caption.show');
		var showIndex = $(showingSlide).index();
		var shift = $(slideWrapper).css('left');
		var margin;
		if($(this).is('.left')) {
			var nextIndex = showIndex - 1;
			margin = 0;
			if(nextIndex == -1) {
				nextIndex = slidesLength - 1;
			}
		} else if($(this).is('.right')) {
			var nextIndex = showIndex + 1;
			margin = 0;
			if(nextIndex == slidesLength) {
				nextIndex = 0;
				margin = 0;
			}
		}
		var nextSlide = $(slides).eq(nextIndex);
		$(showingSlide).removeClass('show');
		$(nextSlide).addClass('show');
		var newLeft = -sliderWidth * nextIndex + margin;
		$(slideWrapper).removeClass('static').css({
			'left' : newLeft
		});
	});
}

function setSliderWidth() {
	var slider = $('.slider');
	var sliderWidth = $(slider).innerWidth();
	var slideWrapper = $(slider).find('.slides');
	var slides = $(slideWrapper).find('.slide');
	var slidesLength = $(slides).length;
	var newSliderWidth = (sliderWidth+50)*slidesLength;
	//size slide wrapper to fit all slides
	$(slideWrapper).css({width:newSliderWidth});
	//size all slides to fit in viewport
	$(slides).each(function() {
		$(this).css({width:sliderWidth});
	});

	//don't allow transition on size
	$(slideWrapper).addClass('static');
	var showingSlide = $('.slide.show');
	var showIndex = $(showingSlide).index();
	$(slideWrapper).css({
		'left' : -sliderWidth * showIndex
	}, 600);
}

dirtSvgs = [];
function createDirt() {
	dirtCanvas = document.createElement('canvas');
	var footerWidth = w();
	var footerHeight = 300;
	$(dirtCanvas).attr('id','dirt').attr('resize', true).css({width:footerWidth,height:footerHeight});
	dirtCanvas.width = footerWidth;
	dirtCanvas.height = footerHeight;
	$('footer .dirt').append(dirtCanvas);
	dirtPaper.setup(dirtCanvas);
	papers['dirt'] = dirtPaper;
	canvases['dirt'] = dirtCanvas;
	for(var i = 0; i < 6; i++) {
		var imgUrl = '../images/compost/'+i+'.svg';
		$.ajax({
			type: "GET",
			async: false,
			url: imgUrl,
			success: function(svg){
				var importedSvg = papers['dirt'].project.importSVG(svg);
				var symbol = new papers['dirt'].Symbol(importedSvg);
				symbol.data = {'name':i};
				dirtSvgs[i] = symbol;
				scatterDirt();
			}
	    });
	}
}

function scatterDirt() {
	for(var y = 0; y < 310; y += 80) {
		for(var x = 0; x < winW(); x += 80) {
			var index = Math.floor((Math.random() * 5) + 0);
			var dirtSvg = dirtSvgs[index];
			var shiftX = random(-90,90);
			var shiftY = random(-90,90);
			// console.log(dirtSvg);
			if(dirtSvg != undefined) {
				var newDirt = dirtSvg.place({
					x: x + shiftX,
					y: y + shiftY
				});
				newDirt.rotate(random(0,360));
				newDirt.scale(0.25);
				newDirt.sendToBack();
			}
		}
	}
	papers['dirt'].view.draw();
}

function winW() {
	return window.innerWidth;
}
