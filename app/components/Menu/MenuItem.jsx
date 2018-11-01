import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import MenuSheet from './MenuSheet'
import MenuContextTypes from './MenuContextTypes'
import { isFunction, isBoolean } from 'utils/is'
import { connect } from 'react-redux'
import keymapStore, { modifierKeysMap, getFlattenAllKeymaps } from 'commands/keymaps'

const handleMenuItemCommand = (command, menuContext) => {
  if (typeof command === 'function') {
    command(menuContext)
    return true
  } else {
    // ↓ temporary measure to resolve a cyclic dependent conflict
    require('../../commands').dispatchCommand(command)
    return true
  }
}

const findKeyByValue = value => {
  return Object.keys(getFlattenAllKeymaps()).reduce((p, v) => {
    p[getFlattenAllKeymaps()[v]] = v
    return p
  }, {})[value] || ''
}

const withModifierKeys = value =>
  value
    .split('+')
    .map(e => modifierKeysMap[e] || e.toUpperCase())
    .join('')


class MenuItem extends Component {
  constructor (props) {
    super()
    this.state = {
      submenuActiveItemIndex: -1
    }
    this.submenuShowTimeout = null
    const { item, state } = props
  }

  componentWillReceiveProps (nextProps) {
    // if has no submenu, noop
    if (!this.props.item.items) return
    // isActive transits from true to false
    if (this.props.isActive && !nextProps.isActive) {
      clearTimeout(this.submenuShowTimeout)
      if (this.state.isSubmenuShown) this.setState({ isSubmenuShown: false })
    } else if (nextProps.isActive && !this.props.isActive) {
      if (this.props.item.onActive) {
        this.props.item.onActive()
      }
    }
  }

  componentDidUpdate () {
    if (this.props.isActive) {
      this.nodeDOM.scrollIntoViewIfNeeded && this.nodeDOM.scrollIntoViewIfNeeded()
    }
  }

  componentWillUnmount () {
    clearTimeout(this.submenuShowTimeout)
  }

  onMouseEnter = () => {
    this.props.toggleActive(this.props.index)
    this.submenuShowTimeout = setTimeout(
      () => {
        this.setState({ isSubmenuShown: true })
        this.context.setFocus(this.props.parentMenu)
      }
    , 200)
  }

  onSubmenuMount = (ref) => {
    this.submenu = ref
  }

  showSubmenu = () => {
    this.setState({ isSubmenuShown: true, submenuActiveItemIndex: 0 })
  }

  execCommand = () => {
    const { item } = this.props
    const command = item.command

    if (item.isDisabled) return null // no-op

    if (item.items) return this.showSubmenu()

    let execCommandSuccess = false
    if (typeof command === 'function') {
      command(this.context.menuContext)
      execCommandSuccess = true
    } else {
      // @fixme: ↓ temporary measure to resolve a cyclic dependent conflict
      require('../../commands').dispatchCommand(command)
      execCommandSuccess = true
    }

    if (execCommandSuccess) this.context.deactivateTopLevelMenu()
  }

  getShortCut = (command) => {
    return withModifierKeys(findKeyByValue(command))
  }

  render () {
    const { item, isActive, currentBranch } = this.props
    const itemElement = item.element ? React.createElement(item.element, { item }) : null
    const isDisabled = isBoolean(item.isDisabled) ? item.isDisabled
      : isFunction(item.getIsDisabled) ? item.getIsDisabled(this.context.menuContext)
      : isFunction(item.isNotGitProject) && item.isNotGitProject(currentBranch)
    return (
      <li className='menu-item' ref={r => this.nodeDOM = r}>
        <div
          className={cx('menu-item-container', {
            active: isActive,
            disabled: isDisabled,
          })}
          onMouseEnter={this.onMouseEnter}
          onClick={!isDisabled ? this.execCommand : undefined}
          id={item.id}
        >
          {(item.icon || item.iconElement) && (
            <div className={cx('menu-item-icon', item.icon)}>
              {item.iconElement}
            </div>
          )}
          <div className='menu-item-name'>{itemElement || item.displayName || item.name}{item.showMore && '...'}</div>
          { this.getShortCut(item.command)
            && <div className='menu-item-shortcut'>{this.getShortCut(item.command)}</div>}
          {item.items && <div className='menu-item-triangle'>▶</div>}
        </div>
        {item.items && (isActive && this.state.isSubmenuShown) &&
          <MenuSheet isSubmenu
            ref={this.onSubmenuMount}
            items={item.items}
            deactivate={() => {
              this.context.setFocus(this.props.parentMenu)
              this.setState({ isSubmenuShown: false })
            }}
            activeItemIndex={this.state.submenuActiveItemIndex}
          />
        }
      </li>
    )
  }
}

MenuItem.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  toggleActive: PropTypes.func.isRequired,
  parentMenu: PropTypes.any.isRequired,
  onActive: PropTypes.func,
  currentBranch: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
}

MenuItem.contextTypes = MenuContextTypes

export default connect(
  state => ({ currentBranch: state.GitState.branches.current }),
  {}
)(MenuItem)
