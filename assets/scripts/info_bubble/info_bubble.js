import { app } from '../preinit/app_settings'
import { debug } from '../preinit/debug_settings'
import { system } from '../preinit/system_capabilities'
import { updateDescription, hideDescription } from './description'
import {
  BUILDING_VARIANTS,
  BUILDING_VARIANT_NAMES,
  MAX_BUILDING_HEIGHT,
  getBuildingAttributes,
  isFlooredBuilding,
  buildingHeightUpdated,
  changeBuildingHeight,
  createBuildings,
  onBuildingMouseEnter,
  updateBuildingPosition
} from '../segments/buildings'
import { DRAGGING_TYPE_NONE, draggingType } from '../segments/drag_and_drop'
import { SEGMENT_INFO } from '../segments/info'
import { removeSegment, removeAllSegments } from '../segments/remove'
import {
  RESIZE_TYPE_TYPING,
  MIN_SEGMENT_WIDTH,
  MAX_SEGMENT_WIDTH,
  resizeSegment,
  incrementSegmentWidth,
  scheduleControlsFadeout,
  resumeFadeoutControls,
  cancelFadeoutControls
} from '../segments/resizing'
import { VARIANT_ICONS } from '../segments/variant_icons'
import { msg } from '../app/messages'
import { trackEvent } from '../app/event_tracking'
import { KEYS } from '../app/keyboard_commands'
import { getElAbsolutePos } from '../util/helpers'
import {
  prettifyWidth,
  undecorateWidth,
  processWidthInput
} from '../util/width_units'
import { isAnyMenuVisible, hideAllMenus } from '../menus/menu'
import { registerKeypress } from '../app/keypress'
import { loseAnyFocus } from '../app/focus'
import {
  TILE_SIZE,
  changeSegmentVariant,
  switchSegmentElIn,
  switchSegmentElAway
} from '../segments/view'
import { getStreet, saveStreetToServerIfNecessary } from '../streets/data_model'
import {
  SEGMENT_WARNING_OUTSIDE,
  SEGMENT_WARNING_WIDTH_TOO_SMALL,
  SEGMENT_WARNING_WIDTH_TOO_LARGE
} from '../streets/width'

export const INFO_BUBBLE_TYPE_SEGMENT = 1
export const INFO_BUBBLE_TYPE_LEFT_BUILDING = 2
export const INFO_BUBBLE_TYPE_RIGHT_BUILDING = 3

const INFO_BUBBLE_MARGIN_BUBBLE = 20
const INFO_BUBBLE_MARGIN_MOUSE = 10

const MIN_TOP_MARGIN_FROM_VIEWPORT = 120

const WIDTH_EDIT_INPUT_DELAY = 200

let widthHeightEditHeld = false
let widthHeightChangeTimerId = -1

export const infoBubble = {
  mouseInside: false,

  visible: false,
  el: null,

  descriptionVisible: false,

  startMouseX: null,
  startMouseY: null,
  hoverPolygon: null,
  segmentEl: null,
  segment: null,
  type: null,

  lastMouseX: null,
  lastMouseY: null,

  suppressed: false,

  bubbleX: null,
  bubbleY: null,
  bubbleWidth: null,
  bubbleHeight: null,

  considerMouseX: null,
  considerMouseY: null,
  considerSegmentEl: null,
  considerType: null,

  hoverPolygonUpdateTimerId: -1,
  suppressTimerId: -1,

  suppress: function () {
    if (!infoBubble.suppressed) {
      infoBubble.hide()
      infoBubble.hideSegment(true)
      // infoBubble.el.classList.add('suppressed')
      infoBubble.suppressed = true
    }

    window.clearTimeout(infoBubble.suppressTimerId)
    infoBubble.suppressTimerId = window.setTimeout(infoBubble.unsuppress, 100)
  },

  unsuppress: function () {
    // infoBubble.el.classList.remove('suppressed')
    infoBubble.suppressed = false

    window.clearTimeout(infoBubble.suppressTimerId)
  },

  onTouchStart: function () {
    resumeFadeoutControls()
  },

  onMouseEnter: function () {
    if (infoBubble.segmentEl) {
      infoBubble.segmentEl.classList.add('hide-drag-handles-when-inside-info-bubble')
    }

    infoBubble.mouseInside = true

    infoBubble.updateHoverPolygon()
  },

  onMouseLeave: function (event) {
    // Prevent pointer taps from flashing the drag handles
    if (event.pointerType === 'mouse') {
      if (infoBubble.segmentEl) {
        infoBubble.segmentEl.classList.remove('hide-drag-handles-when-inside-info-bubble')
      }
    }

    infoBubble.mouseInside = false
  },

  _withinHoverPolygon: function (x, y) {
    return _isPointInPoly(infoBubble.hoverPolygon, [x, y])
  },

  updateHoverPolygon: function (mouseX, mouseY) {
    if (!infoBubble.visible) {
      infoBubble.hideDebugHoverPolygon()
      return
    }

    const bubbleX = infoBubble.bubbleX
    const bubbleY = infoBubble.bubbleY
    const bubbleWidth = infoBubble.bubbleWidth
    const bubbleHeight = infoBubble.bubbleHeight

    let marginBubble

    if (infoBubble.descriptionVisible) {
      // TODO const
      marginBubble = 200
    } else {
      marginBubble = INFO_BUBBLE_MARGIN_BUBBLE
    }

    if (infoBubble.mouseInside && !infoBubble.descriptionVisible) {
      var pos = getElAbsolutePos(infoBubble.segmentEl)

      var x = pos[0] - document.querySelector('#street-section-outer').scrollLeft

      var segmentX1 = x - INFO_BUBBLE_MARGIN_BUBBLE
      var segmentX2 = x + infoBubble.segmentEl.offsetWidth + INFO_BUBBLE_MARGIN_BUBBLE

      var segmentY = pos[1] + infoBubble.segmentEl.offsetHeight + INFO_BUBBLE_MARGIN_BUBBLE

      infoBubble.hoverPolygon = [
        [bubbleX - marginBubble, bubbleY - marginBubble],
        [bubbleX - marginBubble, bubbleY + bubbleHeight + marginBubble],
        [segmentX1, bubbleY + bubbleHeight + marginBubble + 120],
        [segmentX1, segmentY],
        [segmentX2, segmentY],
        [segmentX2, bubbleY + bubbleHeight + marginBubble + 120],
        [bubbleX + bubbleWidth + marginBubble, bubbleY + bubbleHeight + marginBubble],
        [bubbleX + bubbleWidth + marginBubble, bubbleY - marginBubble],
        [bubbleX - marginBubble, bubbleY - marginBubble]
      ]
    } else {
      var bottomY = mouseY - INFO_BUBBLE_MARGIN_MOUSE
      if (bottomY < bubbleY + bubbleHeight + INFO_BUBBLE_MARGIN_BUBBLE) {
        bottomY = bubbleY + bubbleHeight + INFO_BUBBLE_MARGIN_BUBBLE
      }
      var bottomY2 = mouseY + INFO_BUBBLE_MARGIN_MOUSE
      if (bottomY2 < bubbleY + bubbleHeight + INFO_BUBBLE_MARGIN_BUBBLE) {
        bottomY2 = bubbleY + bubbleHeight + INFO_BUBBLE_MARGIN_BUBBLE
      }

      if (infoBubble.descriptionVisible) {
        bottomY = bubbleY + bubbleHeight + marginBubble
        bottomY2 = bottomY
      }

      var diffX = 60 - (mouseY - bubbleY) / 5
      if (diffX < 0) {
        diffX = 0
      } else if (diffX > 50) {
        diffX = 50
      }

      infoBubble.hoverPolygon = [
        [bubbleX - marginBubble, bubbleY - marginBubble],
        [bubbleX - marginBubble, bubbleY + bubbleHeight + marginBubble],
        [(bubbleX - marginBubble + mouseX - INFO_BUBBLE_MARGIN_MOUSE - diffX) / 2, bottomY + (bubbleY + bubbleHeight + marginBubble - bottomY) * 0.2],
        [mouseX - INFO_BUBBLE_MARGIN_MOUSE - diffX, bottomY],
        [mouseX - INFO_BUBBLE_MARGIN_MOUSE, bottomY2],
        [mouseX + INFO_BUBBLE_MARGIN_MOUSE, bottomY2],
        [mouseX + INFO_BUBBLE_MARGIN_MOUSE + diffX, bottomY],
        [(bubbleX + bubbleWidth + marginBubble + mouseX + INFO_BUBBLE_MARGIN_MOUSE + diffX) / 2, bottomY + (bubbleY + bubbleHeight + marginBubble - bottomY) * 0.2],
        [bubbleX + bubbleWidth + marginBubble, bubbleY + bubbleHeight + marginBubble],
        [bubbleX + bubbleWidth + marginBubble, bubbleY - marginBubble],
        [bubbleX - marginBubble, bubbleY - marginBubble]
      ]
    }

    infoBubble.drawDebugHoverPolygon()
  },

  hideDebugHoverPolygon: function () {
    if (!debug.hoverPolygon) {
      return
    }

    var el = document.querySelector('#debug-hover-polygon canvas')

    el.width = el.width // clear
  },

  drawDebugHoverPolygon: function () {
    if (!debug.hoverPolygon) {
      return
    }

    infoBubble.hideDebugHoverPolygon()
    var el = document.querySelector('#debug-hover-polygon canvas')

    var ctx = el.getContext('2d')
    ctx.strokeStyle = 'red'
    ctx.fillStyle = 'rgba(255, 0, 0, .1)'
    ctx.beginPath()
    ctx.moveTo(infoBubble.hoverPolygon[0][0], infoBubble.hoverPolygon[0][1])
    for (var i = 1; i < infoBubble.hoverPolygon.length; i++) {
      ctx.lineTo(infoBubble.hoverPolygon[i][0], infoBubble.hoverPolygon[i][1])
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  },

  scheduleHoverPolygonUpdate: function () {
    window.clearTimeout(infoBubble.hoverPolygonUpdateTimerId)

    infoBubble.hoverPolygonUpdateTimerId = window.setTimeout(function () {
      infoBubble.updateHoverPolygon(infoBubble.lastMouseX, infoBubble.lastMouseY)
    }, 50)
  },

  onBodyMouseMove: function (event) {
    var mouseX = event.pageX
    var mouseY = event.pageY

    infoBubble.lastMouseX = mouseX
    infoBubble.lastMouseY = mouseY

    if (infoBubble.visible) {
      if (!infoBubble._withinHoverPolygon(mouseX, mouseY)) {
        infoBubble.show(false)
      }
    }

    infoBubble.scheduleHoverPolygonUpdate()
  },

  hideSegment: function (fast) {
    if (infoBubble.segmentEl) {
      infoBubble.segmentEl.classList.remove('hover')
      var el = infoBubble.segmentEl
      if (fast) {
        el.classList.add('immediate-show-drag-handles')
        window.setTimeout(function () {
          el.classList.remove('immediate-show-drag-handles')
        }, 0)
      } else {
        el.classList.remove('immediate-show-drag-handles')
      }
      infoBubble.segmentEl.classList.remove('hide-drag-handles-when-description-shown')
      infoBubble.segmentEl.classList.remove('hide-drag-handles-when-inside-info-bubble')
      infoBubble.segmentEl.classList.remove('show-drag-handles')
      infoBubble.segmentEl = null
      infoBubble.segment = null
    }
  },

  hide: function () {
    infoBubble.mouseInside = false

    if (infoBubble.el) {
      hideDescription()
      document.body.classList.remove('controls-fade-out')

      infoBubble.el.classList.remove('visible')
      infoBubble.visible = false

      document.body.removeEventListener('mousemove', infoBubble.onBodyMouseMove)
    }
  },

  considerShowing: function (event, segmentEl, type) {
    if (isAnyMenuVisible() === true || app.readOnly) {
      return
    }

    if (event) {
      infoBubble.considerMouseX = event.pageX
      infoBubble.considerMouseY = event.pageY
    } else {
      var pos = getElAbsolutePos(segmentEl)

      infoBubble.considerMouseX = pos[0] - document.querySelector('#street-section-outer').scrollLeft
      infoBubble.considerMouseY = pos[1]
    }
    infoBubble.considerSegmentEl = segmentEl
    infoBubble.considerType = type

    if ((segmentEl === infoBubble.segmentEl) && (type === infoBubble.type)) {
      return
    }

    if (!infoBubble.visible || !infoBubble._withinHoverPolygon(infoBubble.considerMouseX, infoBubble.considerMouseY)) {
      infoBubble.show(false)
    }
  },

  dontConsiderShowing: function () {
    infoBubble.considerSegmentEl = null
    infoBubble.considerType = null
  },

  onBuildingVariantButtonClick: function (event, left, variantChoice) {
    let street = getStreet()
    var side

    if (left) {
      street.leftBuildingVariant = variantChoice
      side = 'left'
    } else {
      street.rightBuildingVariant = variantChoice
      side = 'right'
    }

    var el = document.querySelector('#street-section-' + side + '-building')
    el.id = 'street-section-' + side + '-building-old'

    var newEl = document.createElement('div')
    newEl.className = 'street-section-building'
    newEl.id = 'street-section-' + side + '-building'

    el.parentNode.appendChild(newEl)
    updateBuildingPosition()
    switchSegmentElIn(newEl)
    switchSegmentElAway(el)

    // TODO repeat
    newEl.addEventListener('pointerenter', onBuildingMouseEnter)
    newEl.addEventListener('pointerleave', onBuildingMouseEnter)

    saveStreetToServerIfNecessary()
    createBuildings()

    infoBubble.updateContents()
  },

  getBubbleDimensions: function () {
    infoBubble.bubbleWidth = infoBubble.el.offsetWidth

    if (infoBubble.descriptionVisible) {
      var el = infoBubble.el.querySelector('.description-canvas')
      var pos = getElAbsolutePos(el)
      infoBubble.bubbleHeight = pos[1] + el.offsetHeight - 38
    } else {
      infoBubble.bubbleHeight = infoBubble.el.offsetHeight
    }

    var height = infoBubble.bubbleHeight + 30

    infoBubble.el.style.webkitTransformOrigin = '50% ' + height + 'px'
    infoBubble.el.style.MozTransformOrigin = '50% ' + height + 'px'
    infoBubble.el.style.transformOrigin = '50% ' + height + 'px'
  },

  updateDescriptionInContents: function () {
    // Not all info bubbles have a segment (e.g. buildings are not segments)
    if (!infoBubble.segment) {
      return
    }
    updateDescription(infoBubble.segment)
  },

  /**
   * Given a segment, update the infoBubble with its warnings
   */
  updateWarningsInContents: function (segment) {
    // TOFIX: We may need to check whether the segment given
    // matches the segment in the info bubble, but the
    // infoBubble.segment value is currently unreliable.
    var el = infoBubble.el.querySelector('.warnings')

    var html = ''

    if (segment.warnings[SEGMENT_WARNING_OUTSIDE]) {
      html += '<p>'
      html += msg('WARNING_DOESNT_FIT')
      html += '</p>'
    }
    if (segment.warnings[SEGMENT_WARNING_WIDTH_TOO_SMALL]) {
      html += '<p>'
      html += msg('WARNING_NOT_WIDE_ENOUGH')
      html += '</p>'
    }
    if (segment.warnings[SEGMENT_WARNING_WIDTH_TOO_LARGE]) {
      html += '<p>'
      html += msg('WARNING_TOO_WIDE')
      html += '</p>'
    }

    if (html) {
      el.innerHTML = html
      el.classList.add('visible')
    } else {
      el.classList.remove('visible')
    }

    infoBubble.getBubbleDimensions()
  },

  updateHeightButtonsInContents: function () {
    let street = getStreet()
    var height = (infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING) ? street.leftBuildingHeight : street.rightBuildingHeight
    var variant = (infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING) ? street.leftBuildingVariant : street.rightBuildingVariant

    if (!isFlooredBuilding(variant) || (height === 1)) {
      infoBubble.el.querySelector('.non-variant .decrement').disabled = true
    } else {
      infoBubble.el.querySelector('.non-variant .decrement').disabled = false
    }

    if (!isFlooredBuilding(variant) || (height === MAX_BUILDING_HEIGHT)) {
      infoBubble.el.querySelector('.non-variant .increment').disabled = true
    } else {
      infoBubble.el.querySelector('.non-variant .increment').disabled = false
    }
  },

  updateWidthButtonsInContents: function (width) {
    if (width === MIN_SEGMENT_WIDTH) {
      infoBubble.el.querySelector('.non-variant .decrement').disabled = true
    } else {
      infoBubble.el.querySelector('.non-variant .decrement').disabled = false
    }

    if (width === MAX_SEGMENT_WIDTH) {
      infoBubble.el.querySelector('.non-variant .increment').disabled = true
    } else {
      infoBubble.el.querySelector('.non-variant .increment').disabled = false
    }
  },

  updateHeightInContents: function (left) {
    let street = getStreet()
    if (!infoBubble.visible ||
      (left && (infoBubble.type !== INFO_BUBBLE_TYPE_LEFT_BUILDING)) ||
      (!left && (infoBubble.type !== INFO_BUBBLE_TYPE_RIGHT_BUILDING))) {
      return
    }

    var height = left ? street.leftBuildingHeight : street.rightBuildingHeight
    var variant = left ? street.leftBuildingVariant : street.rightBuildingVariant

    infoBubble.updateHeightButtonsInContents()

    if (isFlooredBuilding(variant)) {
      var el = infoBubble.el.querySelector('.non-variant .height')
      if (el) {
        el.realValue = height
        el.value = _prettifyHeight(height)
      } else {
        el = infoBubble.el.querySelector('.non-variant .height-non-editable')
        el.innerHTML = _prettifyHeight(height, { markup: true })
      }
    }
  },

  updateWidthInContents: function (segmentEl, width) {
    if (!infoBubble.visible || !infoBubble.segmentEl ||
      (infoBubble.segmentEl !== segmentEl)) {
      return
    }

    infoBubble.updateWidthButtonsInContents(width)

    var el = infoBubble.el.querySelector('.non-variant .width')
    if (el) {
      el.realValue = width
      el.value = prettifyWidth(width)
    } else {
      el = infoBubble.el.querySelector('.non-variant .width-non-editable')
      el.innerHTML = prettifyWidth(width, { markup: true })
    }
  },

  createVariantIcon: function (type, choice, buttonEl) {
    const variantIcon = VARIANT_ICONS[type][choice]

    if (variantIcon) {
      const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svgEl.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/1999/svg')
      svgEl.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink')

      if (svgEl.classList) {
        svgEl.classList.add('icon')
      } else {
        // Internet Explorer does not have the .classList methods on SVGElements
        svgEl.setAttribute('class', 'icon')
      }

      if (variantIcon.color) {
        svgEl.style.fill = variantIcon.color
      }

      const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use')
      useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#icon-' + variantIcon.id)

      buttonEl.appendChild(svgEl)
      svgEl.appendChild(useEl)

      if (variantIcon.title) {
        buttonEl.title = variantIcon.title
      }
    }
  },

  updateContents: function () {
    let street = getStreet()
    let infoBubbleEl = infoBubble.el
    let name, canBeDeleted, showWidth, innerEl, widthCanvasEl, el

    // If info bubble changes, wake this back up if it's fading out
    cancelFadeoutControls()

    switch (infoBubble.type) {
      case INFO_BUBBLE_TYPE_SEGMENT:
        var segment = street.segments[parseInt(infoBubble.segmentEl.dataNo)]
        var segmentInfo = SEGMENT_INFO[segment.type]
        var variantInfo = SEGMENT_INFO[segment.type].details[segment.variantString]

        name = variantInfo.name || segmentInfo.name
        canBeDeleted = true
        showWidth = true

        infoBubble.segment = segment

        infoBubble.el.setAttribute('type', 'segment')
        break
      case INFO_BUBBLE_TYPE_LEFT_BUILDING:
        name = BUILDING_VARIANT_NAMES[BUILDING_VARIANTS.indexOf(street.leftBuildingVariant)]
        canBeDeleted = false
        showWidth = false

        infoBubble.el.setAttribute('type', 'building')
        break
      case INFO_BUBBLE_TYPE_RIGHT_BUILDING:
        name = BUILDING_VARIANT_NAMES[BUILDING_VARIANTS.indexOf(street.rightBuildingVariant)]
        canBeDeleted = false
        showWidth = false

        infoBubble.el.setAttribute('type', 'building')
        break
    }

    infoBubbleEl.innerHTML = ''

    var triangleEl = document.createElement('div')
    triangleEl.classList.add('triangle')
    infoBubbleEl.appendChild(triangleEl)

    // Header

    var headerEl = document.createElement('header')

    headerEl.innerHTML = name

    if (canBeDeleted) {
      innerEl = document.createElement('button')
      innerEl.classList.add('remove')
      innerEl.innerHTML = 'Remove'
      innerEl.segmentEl = infoBubble.segmentEl
      innerEl.tabIndex = -1
      innerEl.setAttribute('title', msg('TOOLTIP_REMOVE_SEGMENT'))
      innerEl.addEventListener('pointerdown', onRemoveButtonClick)
      headerEl.appendChild(innerEl)
    }

    infoBubbleEl.appendChild(headerEl)

    // Building height canvas

    if ((infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING) ||
      (infoBubble.type === INFO_BUBBLE_TYPE_RIGHT_BUILDING)) {
      let variant

      if (infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING) {
        variant = street.leftBuildingVariant
      } else {
        variant = street.rightBuildingVariant
      }

      var disabled = !isFlooredBuilding(variant)

      widthCanvasEl = document.createElement('div')
      widthCanvasEl.classList.add('non-variant')
      widthCanvasEl.classList.add('building-height')

      innerEl = document.createElement('button')
      innerEl.classList.add('increment')
      innerEl.innerHTML = '+'
      innerEl.tabIndex = -1
      innerEl.title = msg('TOOLTIP_ADD_FLOOR')
      var addFloor = function () {
        changeBuildingHeight(infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING, true)
      }

      innerEl.addEventListener('pointerdown', addFloor)

      widthCanvasEl.appendChild(innerEl)
      if (!system.touch) {
        innerEl = document.createElement('input')
        innerEl.setAttribute('type', 'text')
        innerEl.classList.add('height')
        innerEl.title = msg('TOOLTIP_BUILDING_HEIGHT')

        innerEl.addEventListener('pointerdown', _onWidthHeightEditClick)
        innerEl.addEventListener('focus', _onHeightEditFocus)
        innerEl.addEventListener('blur', _onHeightEditBlur)
        innerEl.addEventListener('input', _onHeightEditInput)
        innerEl.addEventListener('mouseover', _onWidthHeightEditMouseOver)
        innerEl.addEventListener('mouseout', _onWidthHeightEditMouseOut)
        innerEl.addEventListener('keydown', _onHeightEditKeyDown)
      } else {
        innerEl = document.createElement('span')
        innerEl.classList.add('height-non-editable')
      }
      if (disabled) {
        innerEl.disabled = true
      }
      widthCanvasEl.appendChild(innerEl)

      innerEl = document.createElement('button')
      innerEl.classList.add('decrement')
      innerEl.innerHTML = '–'
      innerEl.tabIndex = -1
      innerEl.title = msg('TOOLTIP_REMOVE_FLOOR')
      var removeFloor = function () {
        changeBuildingHeight(infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING, false)
      }
      innerEl.addEventListener('pointerdown', removeFloor)

      widthCanvasEl.appendChild(innerEl)
      infoBubbleEl.appendChild(widthCanvasEl)
    }

    // Width canvas

    if (showWidth) {
      widthCanvasEl = document.createElement('div')
      widthCanvasEl.classList.add('non-variant')

      if (!segmentInfo.variants[0]) {
        widthCanvasEl.classList.add('entire-info-bubble')
      }

      innerEl = document.createElement('button')
      innerEl.classList.add('decrement')
      innerEl.innerHTML = '–'
      innerEl.segmentEl = segment.el
      innerEl.title = msg('TOOLTIP_DECREASE_WIDTH')
      innerEl.tabIndex = -1
      innerEl.addEventListener('pointerdown', _onWidthDecrementClick)
      widthCanvasEl.appendChild(innerEl)

      if (!system.touch) {
        innerEl = document.createElement('input')
        innerEl.setAttribute('type', 'text')
        innerEl.classList.add('width')
        innerEl.title = msg('TOOLTIP_SEGMENT_WIDTH')
        innerEl.segmentEl = segment.el

        innerEl.addEventListener('pointerdown', _onWidthHeightEditClick)
        innerEl.addEventListener('focus', _onWidthEditFocus)
        innerEl.addEventListener('blur', _onWidthEditBlur)
        innerEl.addEventListener('input', _onWidthEditInput)
        innerEl.addEventListener('mouseover', _onWidthHeightEditMouseOver)
        innerEl.addEventListener('mouseout', _onWidthHeightEditMouseOut)
        innerEl.addEventListener('keydown', _onWidthEditKeyDown)
      } else {
        innerEl = document.createElement('span')
        innerEl.classList.add('width-non-editable')
      }
      widthCanvasEl.appendChild(innerEl)

      innerEl = document.createElement('button')
      innerEl.classList.add('increment')
      innerEl.innerHTML = '+'
      innerEl.segmentEl = segment.el
      innerEl.tabIndex = -1
      innerEl.title = msg('TOOLTIP_INCREASE_WIDTH')
      innerEl.addEventListener('pointerdown', _onWidthIncrementClick)
      widthCanvasEl.appendChild(innerEl)

      infoBubbleEl.appendChild(widthCanvasEl)
    }

    // Variants

    var variantsEl = document.createElement('div')
    variantsEl.classList.add('variants')

    switch (infoBubble.type) {
      case INFO_BUBBLE_TYPE_SEGMENT:
        let first = true

        // Each segment has some allowed variant types (e.g. "direction")
        for (let variant in segmentInfo.variants) {
          const variantType = segmentInfo.variants[variant]

          // New row for each variant type
          if (!first) {
            let el = document.createElement('hr')
            variantsEl.appendChild(el)
          } else {
            first = false
          }

          // Each variant type has some choices.
          // VARIANT_ICONS is an object containing a list of what
          // each of the choices are and data for building an icon.
          // Different segments may refer to the same variant type
          // ("direction" is a good example of this)
          for (let variantChoice in VARIANT_ICONS[variantType]) {
            let el = document.createElement('button')
            infoBubble.createVariantIcon(variantType, variantChoice, el)

            if (segment.variant[variantType] === variantChoice) {
              el.disabled = true
            }

            el.addEventListener('pointerdown', (function (dataNo, variantType, variantChoice) {
              return function () {
                changeSegmentVariant(dataNo, variantType, variantChoice)
              }
            })(segment.el.dataNo, variantType, variantChoice))

            variantsEl.appendChild(el)
          }
        }
        break
      case INFO_BUBBLE_TYPE_LEFT_BUILDING:
      case INFO_BUBBLE_TYPE_RIGHT_BUILDING:
        let variant
        if (infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING) {
          variant = street.leftBuildingVariant
        } else {
          variant = street.rightBuildingVariant
        }

        for (var j in BUILDING_VARIANTS) {
          el = document.createElement('button')
          // TODO const
          infoBubble.createVariantIcon('building', BUILDING_VARIANTS[j], el)
          if (BUILDING_VARIANTS[j] === variant) {
            el.disabled = true
          }

          variantsEl.appendChild(el)

          el.addEventListener('pointerdown', (function (left, variantChoice) {
            return function () {
              infoBubble.onBuildingVariantButtonClick(null, left, variantChoice)
            }
          })(infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING, BUILDING_VARIANTS[j]))
        }

        break
    }

    infoBubbleEl.appendChild(variantsEl)

    // Warnings

    el = document.createElement('div')
    el.classList.add('warnings')

    infoBubbleEl.appendChild(el)

    infoBubble.updateDescriptionInContents()
    if (segment) {
      infoBubble.updateWarningsInContents(segment)
    }
    window.setTimeout(function () {
      if (infoBubble.type === INFO_BUBBLE_TYPE_SEGMENT) {
        infoBubble.updateWidthInContents(segment.el, segment.width)
      } else {
        infoBubble.updateHeightInContents(infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING)
      }
    }, 0)
  },

  // TODO rename
  show: function (force) {
    if (infoBubble.suppressed) {
      window.setTimeout(infoBubble.show, 100)
      return
    }

    if (draggingType() !== DRAGGING_TYPE_NONE) {
      return
    }

    if (!infoBubble.considerType) {
      infoBubble.hide()
      infoBubble.hideSegment(false)
      return
    }

    var segmentEl = infoBubble.considerSegmentEl
    var type = infoBubble.considerType

    if ((segmentEl === infoBubble.segmentEl) &&
      (type === infoBubble.type) && !force) {
      return
    }
    infoBubble.hideSegment(true)

    var mouseX = infoBubble.considerMouseX
    var mouseY = infoBubble.considerMouseY

    infoBubble.segmentEl = segmentEl
    infoBubble.type = type

    if (segmentEl) {
      segmentEl.classList.add('hover')
      segmentEl.classList.add('show-drag-handles')
    }
    if (infoBubble.visible) {
      segmentEl.classList.add('immediate-show-drag-handles')

      if (infoBubble.descriptionVisible) {
        hideDescription()
      }
    }

    infoBubble.startMouseX = mouseX
    infoBubble.startMouseY = mouseY

    var pos = getElAbsolutePos(segmentEl)
    var bubbleX = pos[0] - document.querySelector('#street-section-outer').scrollLeft
    var bubbleY = pos[1]

    infoBubble.el = document.querySelector('#main-screen .info-bubble')
    infoBubble.updateContents()

    var bubbleWidth = infoBubble.el.offsetWidth
    var bubbleHeight = infoBubble.el.offsetHeight

    // TODO const
    bubbleY -= bubbleHeight - 20
    if (bubbleY < MIN_TOP_MARGIN_FROM_VIEWPORT) {
      bubbleY = MIN_TOP_MARGIN_FROM_VIEWPORT
    }

    bubbleX += segmentEl.offsetWidth / 2
    bubbleX -= bubbleWidth / 2

    // TODO const
    if (bubbleX < 50) {
      bubbleX = 50
    } else if (bubbleX > system.viewportWidth - bubbleWidth - 50) {
      bubbleX = system.viewportWidth - bubbleWidth - 50
    }

    infoBubble.el.style.left = bubbleX + 'px'
    infoBubble.el.style.top = bubbleY + 'px'

    if (!infoBubble.visible) {
      infoBubble.visible = true
    }
    infoBubble.el.classList.add('visible')

    infoBubble.bubbleX = bubbleX
    infoBubble.bubbleY = bubbleY
    infoBubble.bubbleWidth = bubbleWidth
    infoBubble.bubbleHeight = bubbleHeight

    infoBubble.updateHoverPolygon(mouseX, mouseY)
    document.body.addEventListener('mousemove', infoBubble.onBodyMouseMove)
  }
}

function _isPointInPoly (vs, point) {
  var x = point[0]
  var y = point[1]

  var inside = false
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0]
    var yi = vs[i][1]
    var xj = vs[j][0]
    var yj = vs[j][1]

    var intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }

  return inside
}

function _onWidthDecrementClick (event) {
  var el = event.target
  var segmentEl = el.segmentEl
  var precise = event.shiftKey

  incrementSegmentWidth(segmentEl, false, precise)
  scheduleControlsFadeout(segmentEl)

  trackEvent('INTERACTION', 'CHANGE_WIDTH', 'INCREMENT_BUTTON', null, true)
}

function _onWidthIncrementClick (event) {
  var el = event.target
  var segmentEl = el.segmentEl
  var precise = event.shiftKey

  incrementSegmentWidth(segmentEl, true, precise)
  scheduleControlsFadeout(segmentEl)

  trackEvent('INTERACTION', 'CHANGE_WIDTH', 'INCREMENT_BUTTON', null, true)
}

function _onWidthHeightEditClick (event) {
  var el = event.target

  el.hold = true
  widthHeightEditHeld = true

  if (document.activeElement !== el) {
    el.select()
  }
}

function _onWidthHeightEditMouseOver (event) {
  if (!widthHeightEditHeld) {
    event.target.focus()
    event.target.select()
  }
}

function _onWidthHeightEditMouseOut (event) {
  if (!widthHeightEditHeld) {
    loseAnyFocus()
  }
}

function _onWidthEditFocus (event) {
  var el = event.target

  el.oldValue = el.realValue
  el.value = undecorateWidth(el.realValue)
}

function _onHeightEditFocus (event) {
  var el = event.target

  el.oldValue = el.realValue
  el.value = el.realValue
}

function _onWidthEditBlur (event) {
  var el = event.target

  _widthEditInputChanged(el, true)

  el.realValue = parseFloat(el.segmentEl.getAttribute('width'))
  el.value = prettifyWidth(el.realValue)

  el.hold = false
  widthHeightEditHeld = false
}

function _onHeightEditBlur (event) {
  let street = getStreet()
  var el = event.target

  _heightEditInputChanged(el, true)

  el.realValue = (infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING) ? street.leftBuildingHeight : street.rightBuildingHeight
  el.value = _prettifyHeight(el.realValue)

  el.hold = false
  widthHeightEditHeld = false
}

function _heightEditInputChanged (el, immediate) {
  window.clearTimeout(widthHeightChangeTimerId)
  let street = getStreet()

  var height = parseInt(el.value)

  if (!height || (height < 1)) {
    height = 1
  } else if (height > MAX_BUILDING_HEIGHT) {
    height = MAX_BUILDING_HEIGHT
  }

  if (immediate) {
    if (infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING) {
      street.leftBuildingHeight = height
    } else {
      street.rightBuildingHeight = height
    }
    buildingHeightUpdated()
  } else {
    widthHeightChangeTimerId = window.setTimeout(function () {
      if (infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING) {
        street.leftBuildingHeight = height
      } else {
        street.rightBuildingHeight = height
      }
      buildingHeightUpdated()
    }, WIDTH_EDIT_INPUT_DELAY)
  }
}

function _widthEditInputChanged (el, immediate) {
  window.clearTimeout(widthHeightChangeTimerId)

  var width = processWidthInput(el.value)

  if (width) {
    var segmentEl = el.segmentEl

    if (immediate) {
      resizeSegment(segmentEl, RESIZE_TYPE_TYPING,
        width * TILE_SIZE, false, false)
      infoBubble.updateWidthButtonsInContents(width)
    } else {
      widthHeightChangeTimerId = window.setTimeout(function () {
        resizeSegment(segmentEl, RESIZE_TYPE_TYPING,
          width * TILE_SIZE, false, false)
        infoBubble.updateWidthButtonsInContents(width)
      }, WIDTH_EDIT_INPUT_DELAY)
    }
  }
}

function _onWidthEditInput (event) {
  _widthEditInputChanged(event.target, false)

  trackEvent('INTERACTION', 'CHANGE_WIDTH', 'INPUT_FIELD', null, true)
}

function _onHeightEditInput (event) {
  _heightEditInputChanged(event.target, false)
}

function _onWidthEditKeyDown (event) {
  var el = event.target

  switch (event.keyCode) {
    case KEYS.ENTER:
      _widthEditInputChanged(el, true)
      loseAnyFocus()
      el.value = undecorateWidth(el.segmentEl.getAttribute('width'))
      el.focus()
      el.select()
      break
    case KEYS.ESC:
      el.value = el.oldValue
      _widthEditInputChanged(el, true)
      hideAllMenus()
      loseAnyFocus()
      break
  }
}

function _onHeightEditKeyDown (event) {
  let street = getStreet()
  var el = event.target

  switch (event.keyCode) {
    case KEYS.ENTER:
      _heightEditInputChanged(el, true)
      loseAnyFocus()
      el.value = _prettifyHeight((infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING) ? street.leftBuildingHeight : street.rightBuildingHeight)
      el.focus()
      el.select()
      break
    case KEYS.ESC:
      el.value = el.oldValue
      _heightEditInputChanged(el, true)
      hideAllMenus()
      loseAnyFocus()
      break
  }
}

function onRemoveButtonClick (event) {
  // Power move: a shift key will remove all segments
  if (event.shiftKey) {
    removeAllSegments()
  } else {
    // Otherwise, remove one segment
    removeSegment(event.target.segmentEl)
  }

  trackEvent('INTERACTION', 'REMOVE_SEGMENT', 'BUTTON', null, true)

  // Prevent this “leaking” to a segment below
  event.preventDefault()
}

function _prettifyHeight (height) {
  var heightText = height

  heightText += ' floor'
  if (height > 1) {
    heightText += 's'
  }

  var attr = getBuildingAttributes(getStreet(), infoBubble.type === INFO_BUBBLE_TYPE_LEFT_BUILDING)

  heightText += ' (' + prettifyWidth(attr.realHeight / TILE_SIZE) + ')'

  return heightText
}

// Register keyboard shortcuts to hide info bubble
// Only hide if it's currently visible, and if the
// description is NOT visible. (If the description
// is visible, the escape key should hide that first.)
registerKeypress('esc', {
  condition: function () { return infoBubble.visible && !infoBubble.descriptionVisible }
}, function () {
  infoBubble.hide()
  infoBubble.hideSegment(false)
})
