papers = {}
canvases = {}
groups = {}
logoPaper = new (paper.PaperScope)
dirtPaper = new (paper.PaperScope)
graphOffset = 100
light = '#f3fff3'
dark = '#73db71'
graphHeight = 600
ease = 400
logs = null
pile = null
startGraphing = 0
svgs = 
  scraps: {}
  compost: {}
svgNames = 
  scraps: ['apple','banana','beet','egg1','egg2','peanut','tomato','carrot','dirt0','dirt1','dirt2','dirt3','dirt5','dirt5']
  compost: [1,2,3,4,5,6]
transitionEnd = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd'

$ ->

  $main = $('main')
  $logList = $('.info .logList')
  $logList.on 'mouseenter', 'li', (event) ->
    showPopUp $(this).attr('data-id')
  $logList.on 'mouseleave', 'li', (event) ->
    hidePopUp $(this).attr('data-id')
  $logList.on 'click', 'li', (event) ->
    slideToMarker $(this).attr('data-id')

  getData = (date) ->
    id = $('.location').attr('data-id')
    if(date)
      url = '/logs/'+id+'/'+date
    else
      url = '/logs/'+id+'/'
    $.ajax
      url: url
      dataType: 'json'
      error:  (jqXHR, status, error) ->
        console.log jqXHR, status, error
      success: (response) ->
        if(!response)
          return
        else if(response.date)
          logs = response.logs
          date = response.date
          $('select.date').val(date)
        else
          logs = response
        stretchCanvas('scraps')
        stretchCanvas('compost')
        return
    return

  stretchCanvas = (type) ->
    papers[type] = new (paper.PaperScope)
    canvases[type] = document.createElement('canvas')
    width = w()
    height = graphHeight
    canvases[type].height = height
    $(canvases[type]).css height: height
    $(canvases[type]).attr('resize', false).attr('id', type)
    $(canvases[type]).appendTo($('.easel'))
    papers[type].setup canvases[type]
    graphPoints(logs, type)

  createLogList = () ->
    i = 0
    while i < logs.length
      row = logs[i]
      id = row._id
      date = moment(row.date).format('MMMM Do, YYYY')
      scraps = row.scraps
      compost = row.compost
      dateHtml = '<div class="cell date">' + date + '</div>'
      scrapsHtml = '<div class="cell scraps">' + scraps + ' lbs.</div>'
      compostHtml = '<div class="cell compost">' + compost + ' lbs.</div>'
      html = '<li data-id="' + id + '">' + dateHtml + scrapsHtml + compostHtml + '</li>'
      $logList.prepend(html)

  graphPoints = (logs, type) ->
    if logs.length == 0
      return
    groups[type] = new (papers[type].Group)
    groupNames = ['graph','graphContent','clippedGraphContent','markers','markerHovers','fillSymbols','ticks','horzTicks','vertTicks','horzAxis','vertAxis','fillContent','axes','graphUtils']
    i = 0
    while i < groupNames.length
      groupName = groupNames[i]
      newGroup = new (papers[type].Group)(name: groupName)
      thisGroup = groups[type]
      thisGroup[groupName] = newGroup
      groups[type].addChildren thisGroup[groupName]
      i++
    xFactor = 250
    line = new (papers[type].Path)(
      name: 'line'
      strokeWidth: 4
      strokeCap: 'round'
      strokeJoin: 'round'
      strokeColor: dark
      opacity: 1
    )
    width = $('canvas#'+type).innerWidth()
    lastX = undefined
    firstDayUnix = moment(logs[0].date).unix()
    line.add(-ease, graphHeight + 5)
    $(logs).each (i, log) ->
      if(log[type] >= 0)
        date = moment(log.date)
        humanDate = date.format('MMMM Do, YYYY')
        thisDayUnix = moment(date).unix()
        id = log._id
        since = (thisDayUnix - firstDayUnix) / 250000
        x = since * xFactor
        lastX = x
        yFactor = 5
        y = graphHeight - (parseInt(log[type]) * yFactor) - 15
        data = 
          date: humanDate
          id: id
          index: i
          valueType: type
          value: log[type]
          x: x
          y: y
        line.add(x, y)
        marker = new (papers[type].Shape.Circle)(
          name: id
          x: x
          y: y
          radius: 8
          strokeWidth: 3
          strokeColor: dark
          fillColor: light
          data: data
          opacity: 1)
        markerHover = marker.clone().set(
          radius: 15
          strokeWidth: 0
          opacity: 0)
        groups[type].markers.addChild marker
        groups[type].markerHovers.addChild markerHover
        popupModel = $('.popup.model')
        popup = $(popupModel).clone()
        $(popup).removeClass 'model'
        $(popup).attr 'data-id', id
        $(popup).css top: '1000px'
        $(popup).children('.date').children('.data').html humanDate
        $(popup).children('.value').children('.title').html type
        $(popup).children('.value').children('.data').html log[type] + ' lbs.'
        $(popup).attr('data-type', type).addClass type
        $(popup).insertAfter $(popupModel)

        markerHover.onMouseEnter = (event) ->
          id = event.target.data.id
          showPopUp id, type
          $('.graph').css 'cursor': 'pointer'

        markerHover.onMouseLeave = (event) ->
          id = event.target.data.id
          hidePopUp id, type
          $('.graph').css 'cursor': 'default'

        markerHover.onClick = (event) ->
          id = event.target.data.id
          scrollToListItem id

      if(i == logs.length - 1)
        line.add(lastX + ease, graphHeight + 5)
        line.sendToBack()
        line.simplify()
        loadFillSymbols line, type

  loadFillSymbols = (line, type) ->
    $.each svgNames[type], (i, svgName) ->
      imgUrl = '../images/' + type + '/' + svgName + '.svg'
      $.get(imgUrl, null, ((svg) ->
      ), 'xml').done (svg) ->
        importedSvg = papers[type].project.importSVG(svg)
        symbol = new (papers[type].Symbol)(importedSvg)
        symbol.data = 'name': svgName
        svgs[type][svgName] = symbol
        if i == svgNames[type].length - 1
          fillGraphWithSymbols line, type
        return
      return
    return

  fillGraphWithSymbols = (line, type) ->
    mask = new (papers[type].Path.Rectangle)(
      name: 'mask'
      x: 0
      y: 0
      width: w()
      height: h()
      clipMask: false
    )
    endPile = undefined
    lineLength = line.segments.length
    lastSeg = line.segments[lineLength - 1]
    lastPointX = lastSeg.point.x
    fill = line.clone().set(
      name: 'fill'
      fillColor: '#754e34'
      strokeCap: ''
      strokeJoin: ''
      strokeColor: ''
      strokeWidth: ''
      closed: true
      opacity: 1)
    fill.add lastPointX + 200, graphHeight
    fillMask = fill.clone().set(
      name: 'fillMask'
      clipMask: true)
    limits = []
    i = 0
    while i < fillMask.length
      point = fillMask.getLocationAt(i).point
      coords = 
        x: point.x
        y: point.y
      limits.push coords
      i += 50
    i = 0
    while i < limits.length
      limit = limits[i]
      size = 25
      ii = 0
      while ii < graphHeight - (limit.y)
        shift = random(20, -20)
        randInt = random(0, svgNames[type].length - 1)
        svgName = svgNames[type][randInt]
        fillSymbol = svgs[type][svgName]
        if fillSymbol != undefined
          newSymbol = fillSymbol.place(
            x: limit.x + shift
            y: graphHeight - ii + shift)
          newSymbol.scale 0.25
          newSymbol.rotate random(0, 360)
          newSymbol.sendToBack()
          groups[type].fillSymbols.addChild newSymbol
        ii += 20
      i++
    groups[type].fillContent.addChildren [fill, fillMask, groups[type].fillSymbols]
    groups[type].clippedGraphContent.addChildren [groups[type].fillContent, line, groups[type].markers, groups[type].markerHovers]
    groups[type].graphContent.addChildren [mask, groups[type].clippedGraphContent, groups[type].ticks]
    groups[type].graph.addChild groups[type].graphContent
    pile = groups[type].graphContent
    pileWidth = pile.bounds.width
    pileX = pile.position.x
    canvasWidth = $('.graph canvas').innerWidth()
    thisGroup = groups[type]
    markers = thisGroup.markers
    lastMarkerIndex = markers.children.length - 1
    lastMarker = markers.children[lastMarkerIndex]
    lastMarkerX = lastMarker.position.x
    newPileX = pileX - lastMarkerX + canvasWidth - (ease / 4)
    pile.position.x = newPileX
    papers[type].view.draw()
    showGraph(type)
    return



  showGraph = (type) ->
    $('.graph').addClass('show').removeClass 'loading'
    wrapper = $('.location#' + type)
    if $(wrapper).hasClass('opened')
      id = wrapper[0].id
      showGraphUtils id
    if type == 'scraps'
      $(canvases[type]).addClass 'show'

  showPopUp = (id) ->
    type = $('canvas.show').attr('id')
    if !groups[type] || !groups[type].markers
      return
    markers = groups[type].markers.children
    marker = markers[id]
    if marker == undefined
      return
    pile = groups[type].graphContent
    pileOffset = pile.bounds.x
    pileWidth = pile.bounds.width
    pileX = pile.position.x
    easelWidth = $('.easel').innerWidth()
    popup = $('.popup[data-id=' + id + '].' + type)
    x = marker.position.x - (popup).outerWidth()/2
    y = marker.position.y - $(popup).outerHeight() - 30
    $('.popup.show').removeClass 'show'
    $(popup).css(
      display: 'block'
      left: x
      top: y).addClass 'show'
    $('.logList li[data-id="' + id + '"]').addClass 'hover'

  hidePopUp = (id) ->
    type = $('canvas.show').attr('id')
    if !groups[type] || !groups[type].markers
      return
    markers = groups[type].markers.children
    marker = markers[id]
    if marker == undefined
      return
    popup = $('.popup[data-id=' + id + ']')
    $(popup).one transitionEnd, (e) ->  
      $(popup).css top: '1000px'
    $(popup).removeClass 'show'
    $('.logList li[data-id="' + id + '"]').removeClass 'hover'

  scrollToListItem = (id) ->
    logList = $('.logList')
    logListItem = $('.logList li[data-id="' + id + '"]')
    logListHeight = $(logList).height()
    scrollTo = $(logListItem).index() * $(logListItem).outerHeight()
    lastListItem = $(logList).children('li:last-child')
    $(lastListItem).css marginBottom: scrollTo
    $(logList).animate { scrollTop: scrollTo }, 200, ->
      $(logList).on 'scroll', (event) ->
        lastListItem = $(this).children('li:last-child')
        distance = $(lastListItem).index() * $(lastListItem).outerHeight() + $(lastListItem).outerHeight() + 30 - $(this).outerHeight()
        scrollTop = $(this).scrollTop()
        if scrollTop <= distance
          $(lastListItem).css 'marginBottom': '5px'
        return
      return
    return

  slideToMarker = (id) ->
    type = $('canvas.show').attr('id')
    pile = groups[type].graphContent
    pileWidth = pile.bounds.width
    pileX = pile.position.x
    canvasWidth = $('.graph canvas').innerWidth()
    group = groups[type]
    markers = group.markers.children
    markerIndex = markers[id]
    if(markerIndex)
      marker = markers[id]
      markerX = marker.position.x
      newPileX = pileX - markerX + canvasWidth / 2
      $('.graph').addClass 'loading'
      setTimeout (->
        pile.position.x = newPileX
        papers[type].view.draw()
        $('.popup.show').removeClass 'show'
        showPopUp id, type
        $('.graph').removeClass 'loading'
      ), 200
    else
      date = $('.logList li[data-id="'+id+'"]').data('date')
      swapPileDate(date)

  browsePile = (e)->
    type = $('canvas.show').attr('id')
    if $('.popup.show').length >= 1
      return
    graph = $(this).parent('.graph')[0]
    width = graph.clientWidth
    pile = groups[type]['graphContent']
    if $(this).hasClass('left') and !isStart(pile)
      newPosition = pile.position.x + width
    else if $(this).hasClass('right') and !isEnd(pile)
      newPosition = pile.position.x - width
    else
      return
    $(graph).addClass 'loading'
    setTimeout (->
      pile.position.x = newPosition
      papers[type].view.draw()
      $(graph).removeClass 'loading'
    ), 200
    return

  swapPileType = (e) ->
    type = $(this).attr('data-type')
    $('.button.selected').removeClass 'selected'
    $(this).addClass 'selected'
    $('canvas.show').one transitionEnd, ->
      $('canvas#' + type).addClass 'show'
      $('canvas.show').off transitionEnd
      return
    $('canvas.show').removeClass 'show'
    $('.popup').removeClass 'show'

  swapPileDate = (date) ->
    if(!date)
      date = this.value
    $('.graph').addClass 'loading'
    $('canvas.show').one transitionEnd, ->
      papers['scraps'].remove()
      papers['compost'].remove()
      getData(date)
    $('canvas.show').removeClass 'show'
    
  isStart = (pile) ->
    if pile.bounds.x + 200 > 0
      true
    else
      false

  isEnd = (pile) ->
    if pile.bounds.width + pile.bounds.x < w()
      true
    else
      false

  showGraphUtils = (type) ->
    thisGroup = groups[type]
    markers = thisGroup.markers
    line = thisGroup
    ticks = thisGroup.ticks
    i = 0
    while i < markers.children.length
      markers.children[i].opacity = 0
      i++
    papers[type].view.draw()
    return

  hideGraphUtils = (type) ->
    thisGroup = groups[type]
    markers = thisGroup.markers
    line = papers[type]
    ticks = thisGroup.ticks
    markerCount = markers.children.length
    i = 0
    while i < markers.children.length
      markers.children[i].opacity = 0
      i++
    papers[type].view.draw()


  createLogo = ->
    logoCanvas = document.createElement('canvas')
    headerWidth = 530
    headerHeight = 300
    $(logoCanvas).attr('id', 'logo').attr('resize', true).css
      width: headerWidth
      height: headerHeight
    logoCanvas.width = headerWidth
    logoCanvas.height = headerHeight
    $('header#logo a#logoLink').append logoCanvas
    $('header#logo a#logoLink').click (event) ->
      return
      event.preventDefault()
      if $('.location.opened')
        closeSection()
      return
    logoPaper.setup logoCanvas
    papers['logo'] = logoPaper
    canvases['logo'] = logoCanvas
    hovering = false
    logoUrl = '../images/logo.svg'
    $.get(logoUrl, null, ((data) ->
      logoSvg = (new XMLSerializer).serializeToString(data.documentElement)
      logo = logoPaper.project.importSVG(logoSvg)
      logo.position.x = headerWidth / 2
      logo.position.y = headerHeight / 2
      logoObjs = logo.children
      groups['logo'] = new (papers['logo'].Group)
      i = 0
      while i < logoObjs.length
        logoObj = logoObjs[i]
        logoObj.center = 'center'
        logoGroup = new (papers['logo'].Group)
        logoGroup.addChildren logoObj
        groups['logo'].addChildren logoGroup
        i++
      logoPaper.view.draw()
      return
    ), 'xml').done ->

      jiggle = (event) ->
        if hovering
          i = 0
          while i < logoObjs.length
            wiggleAmount = Math.random() * 2 + 6
            logoObjs[i].rotation = Math.sin((event.count + i) / 3) * wiggleAmount
            i++
        return

      $('header#logo').addClass('show')
      $('section#locations').addClass('show')
      # $('header.where').addClass('show')
      # $('canvas#logo').on 'mouseenter', (event) ->
      #   hovering = true
      #   wiggleSpeed = undefined
      #   wiggleAmount = undefined
      #   $('body').css 'cursor': 'pointer'
      #   papers['logo'].view.on 'frame', jiggle
      #   return
      # $('canvas#logo').on 'mouseleave', (event) ->
      #   hovering = false
      #   $('body').css 'cursor': 'default'
      #   papers['logo'].view.off 'frame', jiggle
      #   i = 0
      #   while i < logoObjs.length
      #     logoObjs[i].rotation = 0
      #     i++
      #   return
      fillSections()
      createDirt()
      return
    return

  fillSections = ->
    $('#locations .location').each (i, wrapper) ->
      groups[location] = {}
      location = $(wrapper).data('slug')
      $(wrapper).attr 'data-location', location
      $(wrapper).attr 'id', location
      $(wrapper).appendTo '#locations'
      if selected != undefined
        if location == selected
          openSection selected, '', false
      $(wrapper).children('a').click (event) ->
        event.preventDefault()
        if !$(wrapper).hasClass('opened')
          openSection location, @href, true
        return
      return
    return

  openSection = (id, url, anim) ->
    speed = 500
    history.pushState null, null, url
    wrapper = $('.location#' + id)[0]
    content = $('.location#' + id + ' a .content')[0]
    width = $(content).width()
    height = $(content).height()
    if anim == false
      speed = 0
    previousSibling = $(wrapper)[0].previousSibling
    nextSibling = $(wrapper)[0].nextSibling
    if $(wrapper).is(':last-child')
      if !$(previousSibling).hasClass('opened')
        sibling = previousSibling
    else if $(wrapper).is(':nth-child(odd)')
      if $(nextSibling).hasClass('opened')
        sibling = previousSibling
      else
        sibling = nextSibling
    else if $(wrapper).is(':nth-child(even)')
      if $(previousSibling).hasClass('opened')
        sibling = nextSibling
      else
        sibling = previousSibling
    $(sibling).transition { width: '0%' }, speed, 'cubic-bezier(.42,.15,.03,1)', ->
      $(sibling).css width: '50%'
      return
    hidden = $('.location.hidden')
    $(hidden).removeClass 'hidden'
    $(hidden).transition { 'width': '50%' }, speed, 'cubic-bezier(.42,.15,.03,1)'
    openedId = $('.location.opened').attr('id')
    $(wrapper).addClass 'opened'
    $(wrapper).transition { 'width': 'calc(100% - 20px)' }, speed, 'cubic-bezier(.42,.15,.03,1)', ->
      if $('.location#' + openedId)
        opened = $('.location#' + openedId)
        $(opened).removeClass 'opened'
        $(opened).transition { 'width': '50%' }, speed, 'cubic-bezier(.42,.15,.03,1)', ->
          hideGraphUtils openedId
          return
      top = $('#locations').offset().top
      $('#locations').prepend $(wrapper)
      if anim
        showGraphUtils id
      return
    $('body').removeClass('multiple').addClass('single')

  closeSection = ->
    speed = 500
    history.pushState null, null, '/'
    wrapper = $('.location.opened')
    hidden = $('.location.hidden')
    $(hidden).removeClass('hidden').transition { 'width': '50%' }, speed, 'cubic-bezier(.42,.15,.03,1)'
    if $(wrapper).is(':nth-child(odd)')
      sibling = $(wrapper)[0].nextSibling
    else if $(wrapper).is(':nth-child(even)')
      sibling = $(wrapper)[0].previousSibling
    $(sibling).css 'width': '0%'
    $(wrapper).removeClass('opened').transition { 'width': '50%' }, speed, 'cubic-bezier(.42,.15,.03,1)'
    $(sibling).transition { width: '50%' }, speed, 'cubic-bezier(.42,.15,.03,1)'
    $('body').removeClass('single').addClass 'multiple'
    id = $(wrapper).attr('id')
    hideGraphUtils id
    return

  setUpSlider = ->
    slider = $('.slider')
    sliderWidth = $(slider).innerWidth()
    slideWrapper = $(slider).find('.slides')
    slides = $(slideWrapper).find('.slide')
    slidesLength = $(slides).length
    arrow = $(slider).find('.arrow')
    left_arrow = $(arrow).filter('.left')
    right_arrow = $(arrow).filter('.right')
    showingImage = $(slides)[0]
    $(showingImage).addClass 'show'
    setSliderWidth()
    $('section#slider').addClass('show')
    $(arrow).click ->
      sliderWidth = $(slider).innerWidth()
      showingSlide = $('.slide.show')
      showingCaption = $('.caption.show')
      showIndex = $(showingSlide).index()
      shift = $(slideWrapper).css('left')
      margin = undefined
      if $(this).is('.left')
        nextIndex = showIndex - 1
        margin = 0
        if nextIndex == -1
          nextIndex = slidesLength - 1
      else if $(this).is('.right')
        nextIndex = showIndex + 1
        margin = 0
        if nextIndex == slidesLength
          nextIndex = 0
          margin = 0
      nextSlide = $(slides).eq(nextIndex)
      $(showingSlide).removeClass 'show'
      $(nextSlide).addClass 'show'
      newLeft = -sliderWidth * nextIndex + margin
      $(slideWrapper).removeClass('static').css 'left': newLeft
      return
    return

  setSliderWidth = ->
    slider = $('.slider')
    sliderWidth = $(slider).innerWidth()
    slideWrapper = $(slider).find('.slides')
    slides = $(slideWrapper).find('.slide')
    slidesLength = $(slides).length
    newSliderWidth = (sliderWidth + 50) * slidesLength
    #size slide wrapper to fit all slides
    $(slideWrapper).css width: newSliderWidth
    #size all slides to fit in viewport
    $(slides).each ->
      $(this).css width: sliderWidth
      return
    #don't allow transition on size
    $(slideWrapper).addClass 'static'
    showingSlide = $('.slide.show')
    showIndex = $(showingSlide).index()
    $(slideWrapper).css { 'left': -sliderWidth * showIndex }, 600
    return

  createDirt = ->
    dirtCanvas = document.createElement('canvas')
    footerWidth = w()
    footerHeight = 300
    $(dirtCanvas).attr('id', 'dirt').attr('resize', true).css
      width: footerWidth
      height: footerHeight
    dirtCanvas.width = footerWidth
    dirtCanvas.height = footerHeight
    $('footer .dirt').append dirtCanvas
    dirtPaper.setup dirtCanvas
    papers['dirt'] = dirtPaper
    canvases['dirt'] = dirtCanvas
    i = 0
    while i < 6
      imgUrl = '../images/compost/' + i + '.svg'
      $.ajax
        type: 'GET'
        async: false
        url: imgUrl
        success: (svg) ->
          importedSvg = papers['dirt'].project.importSVG(svg)
          symbol = new (papers['dirt'].Symbol)(importedSvg)
          symbol.data = 'name': i
          dirtSvgs[i] = symbol
          scatterDirt()
          return
      i++
    return

  scatterDirt = ->
    y = 0
    while y < 310
      x = 0
      while x < winW()
        index = Math.floor(Math.random() * 5 + 0)
        dirtSvg = dirtSvgs[index]
        shiftX = random(-90, 90)
        shiftY = random(-90, 90)
        # console.log(dirtSvg);
        if dirtSvg != undefined
          newDirt = dirtSvg.place(
            x: x + shiftX
            y: y + shiftY)
          newDirt.rotate random(0, 360)
          newDirt.scale 0.25
          newDirt.sendToBack()
        x += 80
      y += 80
    papers['dirt'].view.draw()
    return

  winW = ->
    window.innerWidth

  
  createLogo()
  setSliderWidth()
  setUpSlider()
  getData()
  $('body').on 'click', '.graph .arrow', browsePile
  $('body').on 'click', '.button.type:not(.selected)', swapPileType
  $('body').on 'change', 'select.date', swapPileDate
  dirtSvgs = []