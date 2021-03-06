/* @flow */

import React, {Component} from 'react'
import commonStyles from '../styles/common'
import {globalStyles, globalColors} from '../styles/style-guide'
import {Icon, Text, ProgressIndicator} from '../common-adapters/index'
import {normal as proofNormal, checking as proofChecking, revoked as proofRevoked, error as proofError, warning as proofWarning} from '../constants/tracker'
import {metaNew, metaUpgraded, metaUnreachable, metaPending, metaDeleted, metaNone} from '../constants/tracker'
import electron from 'electron'

import type {Props as IconProps} from '../common-adapters/icon'

const shell = electron.shell || electron.remote.shell

import type {Proof, ProofsProps} from './proofs.render'

class ProofsRender extends Component {
  props: ProofsProps;

  openLink (url: string): void {
    shell.openExternal(url)
  }

  onClickProof (proof: Proof): void {
    if (proof.state !== proofChecking) {
      proof.humanUrl && this.openLink(proof.humanUrl)
    }
  }

  onClickProfile (proof: Proof): void {
    console.log('Opening profile link:', proof)
    if (proof.state !== proofChecking) {
      proof.profileUrl && this.openLink(proof.profileUrl)
    }
  }

  onClickUsername () {
    shell.openExternal(`https://keybase.io/${this.props.username}`)
  }

  iconNameForProof (proof: Proof): IconProps.type {
    return {
      'twitter': 'fa-twitter',
      'github': 'fa-github',
      'reddit': 'fa-reddit',
      'pgp': 'fa-key',
      'coinbase': 'fa-btc',
      'hackernews': 'fa-hacker-news',
      'rooter': 'fa-shopping-basket',
      'web': 'fa-globe',
      'dns': 'fa-globe'
    }[proof.type]
  }

  metaColor (proof: Proof): string {
    let color = globalColors.blue
    switch (proof.meta) {
      case metaNew: color = globalColors.blue; break
      case metaUpgraded: color = globalColors.blue; break
      case metaUnreachable: color = globalColors.red; break
      case metaPending: color = globalColors.black40; break
      case metaDeleted: color = globalColors.red; break
    }
    return color
  }

  _isTracked (proof: Proof): boolean {
    return this.props.currentlyFollowing && (!proof.meta || proof.meta === metaNone)
  }

  proofColor (proof: Proof): string {
    let color = globalColors.blue
    switch (proof.state) {
      case proofNormal: {
        color = this._isTracked(proof) ? globalColors.green2 : globalColors.blue
        break
      }
      case proofChecking:
        color = globalColors.black20
        break
      case proofRevoked:
      case proofWarning:
      case proofError:
        color = globalColors.red
        break
    }

    if (proof.state === proofChecking) color = globalColors.black20

    return color
  }

  proofStatusIcon (proof: Proof): ?IconProps.type {
    switch (proof.state) {
      case proofNormal:
        return this._isTracked(proof) ? 'fa-custom-icon-proof-good-followed' : 'fa-custom-icon-proof-good-new'

      case proofWarning:
      case proofError:
      case proofRevoked:
        return 'fa-custom-icon-proof-broken'
      default:
        return null
    }
  }

  renderProofRow (proof: Proof) {
    const metaColor = this.metaColor(proof)
    const proofNameColor = this.proofColor(proof)
    const proofStatusIcon = this.proofStatusIcon(proof)
    const onClickProfile = () => { this.onClickProfile(proof) }
    // TODO: State is deprecated, will refactor after nuking v1
    let isChecking = (proof.state === proofChecking)

    const proofStyle = {
      ...globalStyles.selectable,
      width: 208,
      display: 'inline-block',
      wordBreak: 'break-all',
      ...styleProofName
    }

    const proofNameStyle = {
      color: proofNameColor,
      ...(proof.meta === metaDeleted ? {textDecoration: 'line-through'} : {})
    }

    const meta = proof.meta &&
      proof.meta !== metaNone &&
      <Text type='Header' style={{...styleMeta, backgroundColor: metaColor}}>{proof.meta}</Text>
    const proofIcon = isChecking
      ? <ProgressIndicator style={styleLoader} />
      : proofStatusIcon && <Icon type={proofStatusIcon} style={styleStatusIcon} onClick={() => this.onClickProof(proof)} />

    return (
      <p style={styleRow} key={proof.id}>
        <Icon style={styleService} type={this.iconNameForProof(proof)} title={proof.type} onClick={onClickProfile} />
        <span style={styleProofNameSection}>
          <span style={styleProofNameLabelContainer}>
            <Text inline className='hover-underline-container' type='Body' onClick={onClickProfile} style={proofStyle}>
              <Text inline type='Body' className='underline' style={proofNameStyle}>{proof.name}</Text>
              <Text className='no-underline' inline type='Body' style={styleProofType}><wbr>@{proof.type}</wbr></Text>
            </Text>
            {meta}
          </span>
        </span>
        {proofIcon}
      </p>
    )
  }

  render () {
    return (
      <div style={styleContainer}>
        {this.props.proofs.map(p => this.renderProofRow(p))}
      </div>
    )
  }
}

const styleContainer = {
  ...globalStyles.flexBoxColumn,
  backgroundColor: globalColors.white
}

const styleRow = {
  ...globalStyles.flexBoxRow,
  paddingTop: 8,
  paddingLeft: 30,
  paddingRight: 30,
  alignItems: 'flex-start',
  justifyContent: 'flex-start'
}

const styleService = {
  ...globalStyles.clickable,
  height: 14,
  width: 14,
  color: globalColors.black75,
  hoverColor: globalColors.black75,
  marginRight: 9,
  marginTop: 4
}

const styleStatusIcon = {
  ...globalStyles.clickable,
  fontSize: 20,
  marginLeft: 10
}

const styleProofNameSection = {
  ...globalStyles.flexBoxRow,
  alignItems: 'flex-start',
  flex: 1
}

const styleProofNameLabelContainer = {
  ...globalStyles.flexBoxColumn,
  flex: 1
}

const styleProofName = {
  ...commonStyles.clickable,
  flex: 1
}

const styleProofType = {
  color: globalColors.black10,
  wordBreak: 'normal'
}

const styleMeta = {
  color: globalColors.white,
  borderRadius: 1,
  fontSize: 10,
  height: 11,
  lineHeight: '11px',
  paddingLeft: 2,
  paddingRight: 2,
  alignSelf: 'flex-start',
  textTransform: 'uppercase'
}

const styleLoader = {
  width: 20
}

export default ProofsRender
