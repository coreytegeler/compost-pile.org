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
locs = {}
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

  class Location
    constructor: (loc) ->
      @id= loc._id
      @name= loc.name
      @slug= loc.slug
      @dropoff= loc.dropoff
      @what= loc.what
      @who= loc.who
      @how= loc.how
      @compostable= loc.compostable
      @email= loc.email
      @elem= null
      @graph= null
      @easel= null
      @papers = {}
      @groups = {}

    getData: (date) ->
      loc = this
      id = loc.id
      slug = loc.slug
      if(date)
        url = '/api/logs/'+id+'/'+date
      else
        url = '/api/logs/'+id+'/'
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
          loc.graphPoints('scraps')
          loc.graphPoints('compost')
          $(loc.elem).addClass('show')
          return
      return

    graphPoints: (type) ->
      loc = this
      loc[type] = d3.select(loc.easel).append('svg')
      width = w()
      height = graphHeight
      $svg = $(loc[type].node())
      $svg.css height: height
      $svg.attr('resize', false)
      $svg.addClass(type)
      if logs.length == 0
        return
      i = 0
      data = d3.range(40).map( (i) ->
        if i % 5
          x: i / 39,
          y: (Math.sin(i / 3) + 2) / 4
        else null
      )
      console.log data
      margin = 
        top: 40
        right: 40
        bottom: 40
        left: 40
      width = 960 - (margin.left) - (margin.right)
      height = 500 - (margin.top) - (margin.bottom)
      x = d3.scaleLinear().range([0,width])
      y = d3.scaleLinear().range([height,0])
      line = d3.line().defined((d) ->
        d
      ).x((d) ->
        x d.x
      ).y((d) ->
        y d.y
      )
      # console.log loc[type]
      # svg = loc[type]
      # console.log $('#'+loc.id)

      loc[type]
          .datum(data).attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      loc[type].append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))

      loc[type].append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(y))

      loc[type].append('path')
        .attr('class', 'line')
        .attr('d', line)

      loc[type].selectAll('.dot').data(data.filter((d) ->
        return d
      )).enter().append('circle')
          .attr('class', 'dot')
          .attr('cx', line.x())
          .attr('cy', line.y())
          .attr('r', 3.5)

      this.showGraph(type)
      # width = $('canvas#'+type).innerWidth()
      # lastX = undefined
      # firstDayUnix = moment(logs[0].date).unix()
      # line.add(-ease, graphHeight + 5)
      # $(logs).each (i, log) ->
      #   if(log[type] > 0)
      #     date = moment(log.date)
      #     humanDate = date.format('MMMM Do, YYYY')
      #     thisDayUnix = moment(date).unix()
      #     id = log._id
      #     since = (thisDayUnix - firstDayUnix) / 250000
      #     x = since * xFactor
      #     lastX = x
      #     yFactor = 5
      #     value = log[type]
      #     y = graphHeight - (parseInt(value) * yFactor) - 15
      #     data = 
      #       date: humanDate
      #       id: id
      #       index: i
      #       valueType: type
      #       value: log[type]
      #       x: x
      #       y: y
      #     line.add(x, y)
      #     marker = new (loc.papers[type].Shape.Circle)(
      #       name: id
      #       x: x
      #       y: y
      #       radius: 8
      #       strokeWidth: 3
      #       strokeColor: dark
      #       fillColor: light
      #       data: data
      #       opacity: 1
      #     )
      #     markerHover = marker.clone().set(
      #       radius: 15
      #       strokeWidth: 0
      #       opacity: 0
      #     )
      #     loc.groups[type].markers.addChild(marker)
      #     loc.groups[type].markerHovers.addChild(markerHover)
      #     popupModel = $('.popup.model')
      #     popup = $(popupModel).clone()
      #     $(popup).removeClass 'model'
      #     $(popup).attr 'data-id', id
      #     $(popup).css top: '1000px'
      #     $(popup).children('.date').children('.data').html humanDate
      #     $(popup).children('.value').children('.title').html type
      #     $(popup).children('.value').children('.data').html log[type] + ' lbs.'
      #     $(popup).attr('data-type', type).addClass type
      #     $(popup).insertAfter $(popupModel)

      #     markerHover.onMouseEnter = (event) ->
      #       id = event.target.data.id
      #       loc.showPopUp(id)
      #       $('.graph').css 'cursor': 'pointer'

      #     markerHover.onMouseLeave = (event) ->
      #       id = event.target.data.id
      #       loc.hidePopUp(id)
      #       $('.graph').css 'cursor': 'default'

      #     markerHover.onClick = (event) ->
      #       id = event.target.data.id
      #       loc.scrollToListItem(id)

      #   if(i == logs.length - 1)
      #     line.add(lastX + ease, graphHeight + 5)
      #     line.sendToBack()
      #     line.simplify()
      #     loc.loadFillSymbols(line, type)

    loadFillSymbols: (line, type) ->
      loc = this
      $.each svgNames[type], (i, svgName) ->
        imgUrl = '../images/' + type + '/' + svgName + '.svg'
        $.get(imgUrl, null, ((svg) ->
        ), 'xml').done (svg) ->
          importedSvg = loc.papers[type].project.importSVG(svg)
          symbol = new (loc.papers[type].Symbol)(importedSvg)
          symbol.data = 'name': svgName
          svgs[type][svgName] = symbol
          if i == svgNames[type].length - 1
            loc.fillGraphWithSymbols(line, type)
          return
        return
      return

    fillGraphWithSymbols: (line, type) ->
      loc = this
      mask = new (loc.papers[type].Path.Rectangle)(
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
        opacity: 1
      )
      fill.add lastPointX + 200, graphHeight
      fillMask = fill.clone().set(
        name: 'fillMask'
        clipMask: true
      )
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
            loc.groups[type].fillSymbols.addChild(newSymbol)
          ii += 20
        i++
      loc.groups[type].fillContent.addChildren([fill, fillMask, loc.groups[type].fillSymbols])
      loc.groups[type].clippedGraphContent.addChildren([loc.groups[type].fillContent, line, loc.groups[type].markers, loc.groups[type].markerHovers])
      loc.groups[type].graphContent.addChildren([mask, loc.groups[type].clippedGraphContent])
      loc.groups[type].graph.addChild(loc.groups[type].graphContent)
      pile = loc.groups[type].graphContent
      pileWidth = pile.bounds.width
      pileX = pile.position.x
      canvasWidth = $('.graph canvas').innerWidth()
      thisGroup = loc.groups[type]
      markers = thisGroup.markers
      lastMarkerIndex = markers.children.length - 1
      lastMarker = markers.children[lastMarkerIndex]
      lastMarkerX = lastMarker.position.x
      newPileX = pileX - lastMarkerX + canvasWidth - (ease / 4)
      pile.position.x = newPileX
      loc.papers[type].view.draw()
      loc.showGraph(type)


    showGraph: (type) ->
      $(this.graph).addClass('show').removeClass('loading')
      $(this.elem).addClass('loaded')
      if type == 'compost'
        $(this[type].node()).addClass 'show'

    showPopUp: (id) ->
      loc = this
      type = loc.getType()
      if !loc.groups[type] || !loc.groups[type].markers
        return
      markers = loc.groups[type].markers.children
      marker = markers[id]
      if marker == undefined
        return
      pile = loc.groups[type].graphContent
      pileOffset = pile.bounds.x
      pileWidth = pile.bounds.width
      pileX = pile.position.x
      easelWidth = $(this.easel).innerWidth()
      popup = $('.popup[data-id=' + id + '].' + type)
      x = marker.position.x - (popup).outerWidth()/2
      y = marker.position.y - $(popup).outerHeight() - 30
      $('.popup.show').removeClass 'show'
      $(popup).css(
        display: 'block'
        left: x
        top: y
      ).addClass 'show'
      $('.logList li[data-id="' + id + '"]').addClass 'hover'

    hidePopUp: (id) ->
      loc = this
      type = $('canvas.show').attr('id')
      if !loc.groups[type] || !loc.groups[type].markers
        return
      markers = loc.groups[type].markers.children
      marker = markers[id]
      if marker == undefined
        return
      popup = $('.popup[data-id=' + id + ']')
      $(popup).one transitionEnd, (e) ->  
        $(popup).css top: '1000px'
      $(popup).removeClass 'show'
      $('.logList li[data-id="' + id + '"]').removeClass 'hover'

    scrollToListItem: (id) ->
      loc = this
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

    slideToMarker: (id) ->
      loc = this
      type = $('canvas.show').attr('id')
      pile = loc.groups[type].graphContent
      pileWidth = pile.bounds.width
      pileX = pile.position.x
      canvasWidth = $('.graph canvas').innerWidth()
      group = loc.groups[type]
      markers = group.markers.children
      markerIndex = markers[id]
      if(markerIndex)
        marker = markers[id]
        markerX = marker.position.x
        newPileX = pileX - markerX + canvasWidth / 2
        $('.graph').addClass('loading')
        setTimeout (->
          pile.position.x = newPileX
          loc.papers[type].view.draw()
          $('.popup.show').removeClass('show')
          loc.showPopUp(id, loc)
          $('.graph').removeClass('loading')
        ), 200
      else
        date = $('.logList li[data-id="'+id+'"]').data('date')
        $('select.date').val(date).change()
        # swapPileDate(date)

    getType: () ->
      return $(this.easel).find('canvas.show').attr('id')

    createLogList: () ->
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


  setup = () ->
    if slug = $('.location').attr('data-slug')
      url = 'api/location?slug='+slug
    else
      url = 'api/location'
    $.ajax
      url: url
      dataType: 'json'
      error:  (jqXHR, status, error) ->
        console.log jqXHR, status, error
      success: (response) ->
        $.each response, (i, loc) ->
          createLocation(loc)

  createLocation = (loc) ->
    if $('.location.sample').length
      $loc = $('.location.sample')
        .clone()
        .removeClass('sample')
        .attr('id', loc._id)
        .attr('data-id', loc._id)
        .attr('data-slug', loc.slug)
        .appendTo('.container')
    else
      $loc = $('.location')
    loc = new Location(loc)
    loc.elem = $loc
    loc.graph = $loc.find('.graph')[0]
    loc.easel = $loc.find('.easel')[0]
    locs[loc.slug] = loc
    loc.getData()

  whichLoc = (elem) ->
    id = $(elem).attr('data-id')
    slug = $(elem).parents('.location').attr('data-slug')
    return locs[slug]

  browsePile = (e) ->
    $loc = $(this).parents('.location')
    slug = $loc.attr('data-slug')
    loc = locs[slug]
    type = loc.getType()
    if $('.popup.show').length >= 1
      return
    graph = $(this).parent('.graph')[0]
    width = graph.clientWidth
    pile = loc.groups[type]['graphContent']
    if $(this).hasClass('left') and !isStart(pile)
      newPosition = pile.position.x + width
    else if $(this).hasClass('right') and !isEnd(pile)
      newPosition = pile.position.x - width
    else
      return
    $(graph).addClass 'loading'
    setTimeout (->
      pile.position.x = newPosition
      loc.papers[type].view.draw()
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
    $loc = $(this).parents('.location')
    slug = $loc.attr('data-slug')
    loc = locs[slug]
    type = loc.getType()
    if(!date || typeof date != 'string')
      date = this.value
    $(loc.graph).addClass 'loading'
    $(loc[type]).one transitionEnd, ->
      loc.papers['scraps'].remove()
      loc.papers['compost'].remove()
      getData(date)
    $(loc[type]).removeClass 'show'
    
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


  createLogo = ->
    loc = this
    logoSVG = document.createElement('canvas')
    headerWidth = 530
    headerHeight = 300
    $(logoSVG).attr('id', 'logo').attr('resize', true).css
      width: headerWidth
      height: headerHeight
    logoSVG.width = headerWidth
    logoSVG.height = headerHeight
    $('header#logo a#logoLink').append logoSVG
    $('header#logo a#logoLink').click (event) ->
      return
      event.preventDefault()
      if $('.location.opened')
        closeSection()
      return
    logoPaper.setup logoSVG
    hovering = false
    logoUrl = '../images/logo.svg'
    $.get(logoUrl, null, ((data) ->
      logoSvg = (new XMLSerializer).serializeToString(data.documentElement)
      logo = logoPaper.project.importSVG(logoSvg)
      logo.position.x = headerWidth / 2
      logo.position.y = headerHeight / 2
      logoObjs = logo.children
      logoGroups = new logoPaper.Group
      i = 0
      while i < logoObjs.length
        logoObj = logoObjs[i]
        logoObj.center = 'center'
        logoGroup = new logoPaper.Group
        logoGroup.addChildren logoObj
        logoGroups.addChildren logoGroup
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
      $('section.container').addClass('show')
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
      createDirt()
      return
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
    dirtSVG = document.createElement('canvas')
    footerWidth = w()
    footerHeight = 300
    $(dirtSVG).attr('id', 'dirt').attr('resize', true).css
      width: footerWidth
      height: footerHeight
    dirtSVG.width = footerWidth
    dirtSVG.height = footerHeight
    $('footer .dirt').append dirtSVG
    dirtPaper.setup dirtSVG
    i = 0
    while i < 6
      imgUrl = '../images/compost/' + i + '.svg'
      $.ajax
        type: 'GET'
        async: false
        url: imgUrl
        success: (svg) ->
          importedSvg = dirtPaper.project.importSVG(svg)
          symbol = new (dirtPaper.Symbol)(importedSvg)
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
        if dirtSvg != undefined
          newDirt = dirtSvg.place(
            x: x + shiftX
            y: y + shiftY)
          newDirt.rotate random(0, 360)
          newDirt.scale 0.25
          newDirt.sendToBack()
        x += 80
      y += 80
    dirtPaper.view.draw()
    return

  winW = ->
    window.innerWidth

  
  createLogo()
  setSliderWidth()
  setUpSlider()
  setup()
  $('body').on 'click', '.loaded .graph .arrow', browsePile
  $('body').on 'click', '.loaded .button.type:not(.selected)', swapPileType
  $('body').on 'change', '.loaded select.date', swapPileDate
  $logList.on 'mouseenter', 'li', (event) ->
    id = $(this).attr('data-id')
    loc = whichLoc(this)
    loc.showPopUp(id)
  $logList.on 'mouseleave', 'li', (event) ->
    id = $(this).attr('data-id')
    loc = whichLoc(this)
    loc.hidePopUp(id)
  $logList.on 'click', 'li', (event) ->
    id = $(this).attr('data-id')
    loc = whichLoc(this)
    loc.slideToMarker(id)
  $(window).resize () ->
    setSliderWidth()
  dirtSvgs = []