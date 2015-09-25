'use strict'

import React from 'react-native'
const {
  Component,
  ListView,
  StyleSheet,
  View,
  Text,
  TouchableHighlight
} = React

import commonStyles from '../styles/common'
import LoginActions from '../actions/login'
import { navigateTo } from '../actions/router'

class More extends Component {
  constructor (props) {
    super(props)
  }

  componentWillMount () {
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

    this.state = {
      dataSource: ds.cloneWithRows([
        {name: 'Sign Out', onClick: () => {
          this.props.dispatch(LoginActions.logout())
        }},
        {name: 'About', hasChildren: true, onClick: () => {
          this.props.dispatch(navigateTo(['more', 'about']))
        }},
        {name: 'Developer', hasChildren: true, onClick: () => {
          this.props.dispatch(navigateTo(['more', 'developer']))
        }},
        {name: 'Nav debug', hasChildren: true, onClick: () => {
          this.props.dispatch(navigateTo(['more', 'navDebug']))
        }},
        {name: 'Bridging', hasChildren: true, onClick: () => {
          this.props.dispatch(navigateTo(['more', 'bridging']))
        }}
      ])
    }
  }

  renderRow (rowData, sectionID, rowID) {
    const sep = (rowID < (this.state.dataSource.getRowCount() - 1)) ? <View style={styles.separator} /> : null

    return (
      <TouchableHighlight
        underlayColor={commonStyles.buttonHighlight}
        onPress={rowData.onClick}>
        <View>
          <View style={{margin: 10, flexDirection: 'row', flex: 1, justifyContent: 'space-between'}}>
            <Text>{rowData.name}</Text>
            <Text>{rowData.hasChildren ? '>' : ''}</Text>
          </View>
          {sep}
        </View>
      </TouchableHighlight>
    )
  }

  render () {
    return (
      <View style={styles.container}>
        <ListView
        dataSource={this.state.dataSource}
        renderRow={(...args) => { return this.renderRow(...args) }}
        />
      </View>
    )
  }

  static parseRoute (store, currentPath, nextPath) {
    const routes = {
      'about': require('./about').parseRoute,
      'developer': require('./developer').parseRoute,
      'navDebug': require('../debug/nav-debug').parseRoute,
      'bridging': require('../debug/bridging-tabs').parseRoute
    }

    const componentAtTop = {
      title: 'More',
      mapStateToProps: state => state.router.toObject(),
      component: More
    }

    return {
      componentAtTop,
      parseNextRoute: routes[nextPath.get('path')] || null
    }
  }
}

More.propTypes = {
  navigator: React.PropTypes.object,
  dispatch: React.PropTypes.func.isRequired
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
    marginTop: 60
  },
  separator: {
    height: 1,
    backgroundColor: '#CCCCCC'
  }
})

module.exports = More