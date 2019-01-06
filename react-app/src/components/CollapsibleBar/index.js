import React, { PureComponent } from 'react';
import toBe from 'prop-types';
import classNames from 'classnames';

import './styles.scss';

export default class CollapsibleBar extends PureComponent {
  static propTypes = {
    className: toBe.string,
    children: toBe.any,
    title: toBe.any,
    defaultOpen: toBe.bool,
  };

  constructor(props) {
    super();
    this.state = { open: props.defaultOpen || false };
  }

  render() {
    const { children, title, className } = this.props;
    const { open } = this.state;

    return (
      <div className={classNames('collapsible-bar', className, { open })}>
        <div className="header" onClick={() => this.setState(state => ({ open: !state.open }))}>
          <div className="collapse-button">▶</div>
          <div className="title">{title}</div>
        </div>
        {children && <div className="collapsible-children">{children}</div>}
      </div>
    );
  }
}
