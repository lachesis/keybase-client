/* @flow */

import _ from 'lodash'
import enums from '../constants/types/keybase-v1'
import {getTLF} from '../util/kbfs'
import path from 'path'
import type {FSNotification} from '../constants/types/flow-types'

type DecodedKBFSError = {
  'title': string;
  'body': string;
}

export function decodeKBFSError (user: string, notification: FSNotification): DecodedKBFSError {
  const basedir = notification.filename.split(path.sep)[0]
  const tlf = `/keybase${getTLF(notification.publicTopLevelFolder, basedir)}`
  const errors = {
    [enums.kbfs.FSErrorType.accessDenied]: {
      title: 'Keybase: Access denied',
      body: `${user} does not have ${notification.params.mode} access to ${tlf}`
    },
    [enums.kbfs.FSErrorType.userNotFound]: {
      title: 'Keybase: User not found',
      body: `${notification.params.username} is not a Keybase user`
    },
    [enums.kbfs.FSErrorType.revokedDataDetected]: {
      title: 'Keybase: Possibly revoked data detected',
      body: `${tlf} was modified by a revoked or bad device. Use 'keybase log send' to file an issue with the Keybase admins.`
    },
    [enums.kbfs.FSErrorType.notLoggedIn]: {
      title: `Keybase: Permission denied in ${tlf}`,
      body: "You are not logged into Keybase. Try 'keybase login'."
    },
    [enums.kbfs.FSErrorType.timeout]: {
      title: `Keybase: ${_.capitalize(notification.params.mode)} timeout in ${tlf}`,
      body: `The ${notification.params.mode} operation took too long and failed. Please run 'keybase log send' so our admins can review.`
    },
    [enums.kbfs.FSErrorType.rekeyNeeded]: notification.rekeyself ? {
      title: 'Keybase: Files need to be rekeyed',
      body: `Please open one of your other computers to unlock ${tlf}`
    } : {
      title: 'Keybase: Friends needed',
      body: `Please ask another member of ${tlf} to open Keybase on one of their computers to unlock it for you.`
    },
    [enums.kbfs.FSErrorType.badFolder]: {
      title: 'Keybase: Bad folder',
      body: `${tlf} is not a Keybase folder. All folders begin with /keybase/private or /keybase/public.`
    }
  }

  if (notification.errorType in errors) {
    return errors[notification.errorType]
  }

  if (notification.errorType === enums.kbfs.FSErrorType.notImplemented) {
    if (notification.feature === '2gbFileLimit') {
      return ({
        title: 'Keybase: Not yet implemented',
        body: `You just tried to write a file larger than 2GB in ${tlf}. This limitation will be removed soon.`
      })
    } else if (notification.feature === '512kbDirLimit') {
      return ({
        title: 'Keybase: Not yet implemented',
        body: `You just tried to write too many files into ${tlf}. This limitation will be removed soon.`
      })
    } else {
      return ({
        title: 'Keybase: Not yet implemented',
        body: `You just hit a ${notification.feature} limitation in KBFS. It will be fixed soon.`
      })
    }
  } else {
    return ({
      title: 'Keybase: KBFS error',
      body: `${notification.status}`
    })
  }
}

// TODO: Once we have access to the Redux store from the thread running
// notification listeners, store the sentNotifications map in it.
var sentNotifications = {}

export function kbfsNotification (notification: FSNotification, notify: any, getState: any) {
  const action = {
    [enums.kbfs.FSNotificationType.encrypting]: 'Encrypting and uploading',
    [enums.kbfs.FSNotificationType.decrypting]: 'Decrypting, verifying, and downloading',
    [enums.kbfs.FSNotificationType.signing]: 'Signing and uploading',
    [enums.kbfs.FSNotificationType.verifying]: 'Verifying and downloading',
    [enums.kbfs.FSNotificationType.rekeying]: 'Rekeying'
  }[notification.notificationType]

  const state = {
    [enums.kbfs.FSStatusCode.start]: 'starting',
    [enums.kbfs.FSStatusCode.finish]: 'finished',
    [enums.kbfs.FSStatusCode.error]: 'errored'
  }[notification.statusCode]

  // KBFS fires a notification when it changes state between connected
  // and disconnected (to the mdserver).  For now we just log it.
  if (notification.notificationType === enums.kbfs.FSNotificationType.connection) {
    const state = (notification.statusCode === enums.kbfs.FSStatusCode.start) ? 'connected' : 'disconnected'
    console.log(`KBFS is ${state}`)
    return
  }

  if (notification.statusCode === enums.kbfs.FSStatusCode.finish) {
    // Since we're aggregating dir operations and not showing state,
    // let's ignore file-finished notifications.
    return
  }

  const basedir = notification.filename.split(path.sep)[0]
  const tlf = getTLF(notification.publicTopLevelFolder, basedir)

  let title = `KBFS: ${action}`
  let body = `Files in ${tlf} ${notification.status}`
  let user = 'You'
  try {
    user = getState().config.status.user.username
  } catch (e) {}
  // Don't show starting or finished, but do show error.
  if (notification.statusCode === enums.kbfs.FSStatusCode.error) {
    ({title, body} = decodeKBFSError(user, notification))
  }

  function rateLimitAllowsNotify (action, state, tlf) {
    if (!(action in sentNotifications)) {
      sentNotifications[action] = {}
    }
    if (!(state in sentNotifications[action])) {
      sentNotifications[action][state] = {}
    }

    // 20s in msec
    const delay = 20000
    const now = new Date()

    // If we haven't notified for {action,state,tlf} or it was >20s ago, do it.
    if (!(tlf in sentNotifications[action][state]) || now - sentNotifications[action][state][tlf] > delay) {
      sentNotifications[action][state][tlf] = now
      return true
    }

    // We've already notified recently, ignore this one.
    return false
  }

  if (rateLimitAllowsNotify(action, state, tlf)) {
    notify(title, {body})
  }
}
