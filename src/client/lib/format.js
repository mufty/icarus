const ADD_YEARS_IN_FUTURE = 1286

function formatBytes (bytes) {
  if (bytes >= 1073741824) {
    bytes = (bytes / 1073741824).toFixed(2) + ' GB'
  } else if (bytes >= 1048576) {
    bytes = (bytes / 1048576).toFixed(2) + ' MB'
  } else if (bytes >= 1024) {
    bytes = (bytes / 1024).toFixed(2) + ' KB'
  } else if (bytes > 1) {
    bytes = bytes + ' BYTES'
  } else if (bytes === 1) {
    bytes = bytes + ' BYTES'
  } else {
    bytes = '0 BYTES'
  }
  return bytes
}

function eliteDateTime (timestamp = Date.now()) {
  const date = new Date(timestamp)
  date.setFullYear(date.getFullYear() + ADD_YEARS_IN_FUTURE) // We are living in the future
  const dateTimeString = date.toUTCString()
    .replace(' GMT', '') // Time in the Elite universe is always in UTC
    .replace(/(.*), /, '') // Strip day of week
    .replace(/:[0-9]{2}$/, '') // Strip seconds
    .replace(/^0/, '') // Strip leading zeros from day of month

  const dateTimeObject = {
    dateTime: dateTimeString,
    date: dateTimeString.split(/^(.*)? (\d\d:\d\d)/)[1],
    time: dateTimeString.split(/^(.*)? (\d\d:\d\d)/)[2],
    day: date.getDate(),
    month: date.toLocaleString('en-us',{month:'short'}),
    year: date.getFullYear(),
    jsDate: date
  }

  return dateTimeObject
}

function objectToHtml (obj, depth = 0, type = null, previousPropertyName) {
  const tag = 'div'
  let str = ''

  if (depth === 0) str = `<${tag} class="text-formatted-object">`

  for (const prop in obj) {
    let propertyName = prop
    let propertyValue = obj[propertyName]

    if (propertyName.startsWith('_')) continue // Skip internal properties

    // Use only localised versions of property names (if exists)
    if (!propertyName.endsWith('_Localised') && obj[`${propertyName}_Localised`]) continue
    if (propertyName.endsWith('_Localised')) propertyName = propertyName.replace(/_Localised$/, '')

    if (propertyName === 'timestamp') {
      propertyName = 'Time'
      propertyValue = eliteDateTime(propertyValue).dateTime
    } else if (propertyName == 'Expires') {
      propertyValue = secondsToStr(propertyValue)
    }

    let propertyLabel
    if (type === 'array') {
      if (typeof propertyValue === 'object') {
        propertyLabel = `<label class="text-muted">${previousPropertyName.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').trim()} #${propertyName.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').trim()}</label>`
      } else {
        propertyLabel = '<label> ■</label>'
      }
    } else {
      propertyLabel = `<label>${propertyName.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').trim()}</label>`
    }

    str += `<div class="text-formatted-object-property" data-depth="${depth}" style="padding-left: ${(depth)}rem;">`

    switch (typeof propertyValue) {
      case 'string':
        str += propertyLabel + ' <span class="text-formatted-object-value">' + propertyValue.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^\$/, '').replace(/;$/, '').trim() + '</span>'
        break
      case 'number':
      case 'boolean':
        str += propertyLabel + ' <span class="text-formatted-object-value">' + propertyValue + '</span>'
        break
      case 'object':
      default:
        if (Array.isArray(propertyValue)) {
          if (propertyValue.length > 0) {
            str += propertyLabel + objectToHtml(propertyValue, depth + 1, 'array', propertyName)
          } else {
            str += propertyLabel + ' <span class="text-formatted-object-value">NONE</span>'
          }
        } else {
          str += propertyLabel + objectToHtml(propertyValue, depth > 1 ? depth - 1 : depth, null, propertyName)
        }
        break
    }
    str += '</div>'
  }

  if (depth === 0) str += `</${tag}>`

  return str
}

function secondsToStr (seconds = 0) {
  function numberEnding (number) {
    return (number > 1) ? 's' : '';
  }

  var years = Math.floor(seconds / 31536000);
  if (years) {
      return years + ' year' + numberEnding(years);
  }
  //TODO: Months! Maybe weeks? 
  var days = Math.floor((seconds %= 31536000) / 86400);
  if (days) {
      return days + ' day' + numberEnding(days);
  }
  var hours = Math.floor((seconds %= 86400) / 3600);
  if (hours) {
      return hours + ' hour' + numberEnding(hours);
  }
  var minutes = Math.floor((seconds %= 3600) / 60);
  if (minutes) {
      return minutes + ' minute' + numberEnding(minutes);
  }
  
  if (seconds) {
      return seconds + ' second' + numberEnding(seconds);
  }
  return 'less than a second';
}

module.exports = {
  formatBytes,
  eliteDateTime,
  secondsToStr,
  objectToHtml,
  ADD_YEARS_IN_FUTURE
}
