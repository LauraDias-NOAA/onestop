import React from 'react'
import Drawer from './Drawer'

const styleMiddle = () => {
  return {
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
    overflowY: 'auto',
    boxSizing: 'border-box',
    margin: '0 auto',
    width: '100%',
    outline: 'none',
  }
}

export default class Middle extends React.Component {
  render() {
    const {content} = this.props
    const contentElement = (
      <main id="mainBlock" tabIndex="-1" style={styleMiddle()}>
        {content}
      </main>
    )
    return contentElement
  }
}
