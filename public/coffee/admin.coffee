$ ->
  $body = $('body')

  init = () ->
    $body.on 'click', 'header a.delete', deleteLocation
    $body.on 'submit', 'form.log', saveLog
    $body.on 'click', 'form.log a.delete', deleteLog

  deleteLocation = (event) ->
    event.preventDefault()
    location = this
    confirmation = confirm('Are you sure?')
    if confirmation
      url = location.href
      $.ajax
        type: 'DELETE'
        url: url
        error:  (jqXHR, status, error) ->
          console.log jqXHR, status, error
        success: (object, status, jqXHR) ->
          $(location).parent('.cell').remove()

  saveLog = (event) ->
    event.preventDefault()
    $logForm = $(this)
    data = $logForm.serialize();
    url = $logForm.attr('action')
    $.ajax
      type: 'POST'
      url: url
      data: data
      error:  (jqXHR, status, error) ->
        console.log jqXHR, status, error
      success: (response, status, jqXHR) ->
        console.log response

  deleteLog = (event) ->
    event.preventDefault()
    confirmation = confirm('Are you sure?')
    if confirmation
      url = this.href
      $log = $(this).parents('form.log')
      $.ajax
        type: 'DELETE'
        url: url
        error:  (jqXHR, status, error) ->
          console.log jqXHR, status, error
        success: (object, status, jqXHR) ->
          $log.remove()

  init()