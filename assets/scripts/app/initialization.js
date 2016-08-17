import $ from 'jquery'

import { hideLoadingScreen, getImagesToBeLoaded } from './load_resources'
import { initLocale } from './locale'
import { scheduleNextLiveUpdateCheck } from './live_update'
import { setEnvironmentBadge } from './env_badge'
import { shareMenu } from '../menus/_share'
import { showGallery } from '../gallery/view'
import { feedbackMenu } from '../menus/_feedback'
import { app } from '../preinit/app_settings'
import { debug } from '../preinit/debug_settings'
import { system } from '../preinit/system_capabilities'
import { prepareSegmentInfo } from '../segments/info'
import { createPalette } from '../segments/palette'
import { fillEmptySegments, segmentsChanged } from '../segments/view'
import { onNewStreetLastClick } from '../streets/creation'
import {
  createDomFromData,
  setLastStreet,
  trimStreetData,
  getStreet
} from '../streets/data_model'
import { updateStreetName } from '../streets/name'
import { getPromoteStreet, remixStreet } from '../streets/remix'
import { setIgnoreStreetChanges } from '../streets/undo_stack'
import { resizeStreetWidth, buildStreetWidthMenu } from '../streets/width'
import { loadSignIn, isSignInLoaded } from '../users/authentication'
import {
  updateSettingsFromCountryCode,
  detectGeolocation,
  setGeolocationLoaded,
  getGeolocationLoaded
} from '../users/localization'
import { ENV } from './config'
import { addEventListeners } from './event_listeners'
import { trackEvent } from './event_tracking'
import { getMode, setMode, MODES, processMode } from './mode'
import { processUrl, updatePageUrl, getGalleryUserId } from './page_url'
import { onResize } from './window_resize'

let initializing = false

export function getInitializing () {
  return initializing
}

export function setInitializing (value) {
  initializing = value
}

let bodyLoaded
let readyStateCompleteLoaded
let serverContacted

export function setServerContacted (value) {
  serverContacted = value
}

let abortEverything

export function getAbortEverything () {
  return abortEverything
}

export function setAbortEverything (value) {
  abortEverything = value
}

export const Stmx = {}

Stmx.preInit = function () {
  initializing = true
  setIgnoreStreetChanges(true)

  var language = window.navigator.userLanguage || window.navigator.language
  if (language) {
    language = language.substr(0, 2).toUpperCase()
    updateSettingsFromCountryCode(language)
  }
}

Stmx.init = function () {
  if (!debug.forceUnsupportedBrowser) {
    // TODO temporary ban
    if ((navigator.userAgent.indexOf('Opera') !== -1) ||
      (navigator.userAgent.indexOf('Internet Explorer') !== -1) ||
      (navigator.userAgent.indexOf('MSIE') !== -1)) {
      setMode(MODES.UNSUPPORTED_BROWSER)
      processMode()
      return
    }
  }

  window.dispatchEvent(new window.CustomEvent('stmx:init'))

  fillEmptySegments()
  prepareSegmentInfo()

  // TODO make it better
  // Related to Enter to 404 bug in Chrome
  $.ajaxSetup({ cache: false })

  readyStateCompleteLoaded = false
  document.addEventListener('readystatechange', onReadyStateChange)

  bodyLoaded = false
  window.addEventListener('load', onBodyLoad)

  processUrl()
  processMode()

  if (abortEverything) {
    return
  }

  // Asynchronously loading…

  // …detecting country from IP for units and left/right-hand driving
  var mode = getMode()
  if ((mode === MODES.NEW_STREET) || (mode === MODES.NEW_STREET_COPY_LAST)) {
    detectGeolocation()
  } else {
    setGeolocationLoaded(true)
  }

  // …sign in info from our API (if not previously cached) – and subsequent
  // street data if necessary (depending on the mode)
  loadSignIn()

// Note that we are waiting for sign in and image info to show the page,
// but we give up on country info if it’s more than 1000ms.
}

export function checkIfEverythingIsLoaded () {
  if (abortEverything) {
    return
  }

  if ((getImagesToBeLoaded() === 0) && isSignInLoaded() && bodyLoaded &&
    readyStateCompleteLoaded && getGeolocationLoaded() && serverContacted) {
    onEverythingLoaded()
  }
}

function onEverythingLoaded () {
  switch (getMode()) {
    case MODES.NEW_STREET_COPY_LAST:
      onNewStreetLastClick()
      break
  }

  onResize()
  resizeStreetWidth()
  updateStreetName()
  createDomFromData()
  segmentsChanged()

  initializing = false
  setIgnoreStreetChanges(false)
  setLastStreet(trimStreetData(getStreet()))

  updatePageUrl()
  buildStreetWidthMenu()
  addEventListeners()

  var event = new window.CustomEvent('stmx:everything_loaded')
  window.dispatchEvent(event)

  var mode = getMode()
  if (mode === MODES.USER_GALLERY) {
    showGallery(getGalleryUserId(), true)
  } else if (mode === MODES.GLOBAL_GALLERY) {
    showGallery(null, true)
  }

  if (getPromoteStreet()) {
    remixStreet()
  }

  // Track touch capability in Google Analytics
  if (system.touch === true) {
    trackEvent('SYSTEM', 'TOUCH_CAPABLE', null, null, true)
  }
}

function onBodyLoad () {
  bodyLoaded = true

  document.querySelector('#loading-progress').value++
  checkIfEverythingIsLoaded()
}

function onReadyStateChange () {
  if (document.readyState === 'complete') {
    readyStateCompleteLoaded = true

    document.querySelector('#loading-progress').value++
    checkIfEverythingIsLoaded()
  }
}

// Toggle debug features
if (debug.hoverPolygon) {
  createDebugHoverPolygon()
}

// Toggle experimental features
if (!debug.experimental) {
  document.getElementById('settings-menu-item').style.display = 'none'
} else {
  // Initalize i18n / localization
  // Currently experimental-only
  initLocale()
}

// Other
addBodyClasses()
setEnvironmentBadge()

// Check if no internet mode
if (system.noInternet === true) {
  setEnvironmentBadge('Demo')
  setupNoInternetMode()
}

function createDebugHoverPolygon () {
  var el = document.createElement('div')
  el.id = 'debug-hover-polygon'
  document.body.appendChild(el)

  var canvasEl = document.createElement('canvas')
  canvasEl.width = window.innerWidth
  canvasEl.height = window.innerHeight
  el.appendChild(canvasEl)
}

function addBodyClasses () {
  document.body.classList.add('environment-' + ENV)

  if (system.windows) {
    document.body.classList.add('windows')
  }

  if (system.safari) {
    document.body.classList.add('safari')
  }

  if (system.touch) {
    document.body.classList.add('touch-support')
  }

  if (app.readOnly) {
    document.body.classList.add('read-only')
  }

  if (system.phone) {
    document.body.classList.add('phone')
  }

  if (system.noInternet) {
    document.body.classList.add('no-internet')
  }
}

function setupNoInternetMode () {
  // Disable all external links
  // CSS takes care of altering their appearance to resemble normal text
  document.body.addEventListener('click', function (e) {
    if (e.target.nodeName === 'A' && e.target.getAttribute('href').indexOf('http') === 0) {
      e.preventDefault()
    }
  })
}

// Temp: use this while in transition
export function _onEverythingLoaded2 () {
  shareMenu.update()
  feedbackMenu.update()
  createPalette()

  if (debug.forceLiveUpdate) {
    scheduleNextLiveUpdateCheck()
  }

  window.setTimeout(hideLoadingScreen, 0)
}

window._onEverythingLoaded2 = _onEverythingLoaded2
