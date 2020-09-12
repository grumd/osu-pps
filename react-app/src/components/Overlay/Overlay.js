import React from 'react';
import ReactDOM from 'react-dom';
import toBe from 'prop-types';
import { Popper } from 'react-popper';
import classNames from 'classnames';
import listensToClickOutside from 'react-onclickoutside';

import './overlay.scss';

const PLACEMENT_ARROW_MAPPING = {
  right: 'left',
  left: 'right',
  top: 'bottom',
  bottom: 'top',
};

const getArrowPlacement = placement => {
  return placement && PLACEMENT_ARROW_MAPPING[placement.split('-')[0]];
};

class Overlay extends React.PureComponent {
  static propTypes = {
    placement: toBe.string,
    overlayItem: toBe.any,
    hideWhenOutOfBounds: toBe.bool,
  };

  static defaultTypes = {
    placement: 'bottom',
  };

  constructor() {
    super();
    this.state = {
      isVisible: false,
    };
    this.containerItemRef = React.createRef();
    this.renderPopper = this.renderPopper.bind(this);
    this.toggleOverlayVisibility = this.toggleOverlayVisibility.bind(this);
  }

  hideOverlay() {
    this.setState({
      isVisible: false,
    });
  }

  toggleOverlayVisibility() {
    this.setState({
      isVisible: !this.state.isVisible,
    });
  }

  handleClickOutside(event) {
    const preventHiding = event && event.target.closest('.inner-popper-overlay'); // prevent overlays from hiding when a modal is opened within overlay

    if (!preventHiding) {
      this.hideOverlay();
    }
  }

  renderPopper({ ref, style, placement, arrowProps, scheduleUpdate, outOfBoundaries }) {
    const { children, hideWhenOutOfBounds } = this.props;
    return (
      <div
        ref={ref}
        style={style}
        data-placement={placement}
        className={classNames(
          'inner-popper-overlay',
          `arrow-${getArrowPlacement(placement)}`,
          this.props.overlayClassName,
          { 'out-of-bounds': outOfBoundaries && hideWhenOutOfBounds }
        )}
      >
        <div className="arrow-hider">
          <div className="arrow" ref={arrowProps.ref} style={arrowProps.style} />
        </div>
        <div
          className="inner-popper-content"
          // ref={ref => this.setupPopperContentRef(scheduleUpdate, ref)}
        >
          {children}
        </div>
      </div>
    );
  }

  render() {
    const { placement, overlayItem } = this.props;
    const { isVisible } = this.state;
    return (
      <React.Fragment>
        <div
          className="overlay-item"
          ref={this.containerItemRef}
          onClick={this.toggleOverlayVisibility}
        >
          {overlayItem}
        </div>
        {isVisible &&
          ReactDOM.createPortal(
            <Popper
              container={document.body}
              placement={placement}
              referenceElement={this.containerItemRef.current}
            >
              {this.renderPopper}
            </Popper>,
            document.body
          )}
      </React.Fragment>
    );
  }
}

export default listensToClickOutside(Overlay);
