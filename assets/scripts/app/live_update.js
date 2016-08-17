import $ from 'jquery'

import { getStreet, updateEverything } from '../streets/data_model'
import { getFetchStreetUrl, unpackServerStreetData } from '../streets/xhr'

const LIVE_UPDATE_DELAY = 5000

const flashEl = document.getElementById('flash')

export function scheduleNextLiveUpdateCheck () {
  window.setTimeout(checkForLiveUpdate, LIVE_UPDATE_DELAY)
}

function checkForLiveUpdate () {
  var url = getFetchStreetUrl()

  $.ajax({
    url: url,
    dataType: 'json',
    type: 'HEAD'
  }).done(receiveLiveUpdateCheck)
}

function receiveLiveUpdateCheck (data, textStatus, jqXHR) {
  var newUpdatedDate =
    Math.floor((new Date(jqXHR.getResponseHeader('last-modified')).getTime()) / 1000)
  var oldUpdatedDate =
    Math.floor((new Date(getStreet().updatedAt).getTime()) / 1000)

  if (newUpdatedDate !== oldUpdatedDate) {
    var url = getFetchStreetUrl()
    $.ajax({
      url: url,
      dataType: 'json',
      type: 'GET'
    }).done(receiveLiveUpdateStreet)
  }

  scheduleNextLiveUpdateCheck()
}

function receiveLiveUpdateStreet (transmission) {
  window.setTimeout(function () {
    unpackServerStreetData(transmission, null, null, false)
    updateEverything(true)
  }, 1000)

  flash()
}

function flash () {
  flashEl.classList.add('visible')

  window.setTimeout(function () {
    flashEl.classList.add('fading-out')
  }, 100)

  window.setTimeout(function () {
    flashEl.classList.remove('visible')
    flashEl.classList.remove('fading-out')
  }, 1000)
}
