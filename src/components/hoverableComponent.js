import React from 'react'

const HoverableComponent = (props) => {
  const className = (props.cls || '') + ' hoverable '
  return <div className={className}
      onMouseEnter={() => {
          if(props.onHover) props.onHover(true)
      }}
      onMouseLeave={() => {
          if(props.onHover) props.onHover(false)
      }}>{props.children}</div>
}

export {HoverableComponent}