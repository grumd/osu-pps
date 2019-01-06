import React, { Component } from "react";
import toBe from "prop-types";
import { NavLink } from "react-router-dom";

import "./top-bar.scss";

import { routes } from "../constants";

export default class TopBar extends Component {
  static propTypes = {
    activeSection: toBe.string.isRequired,
    onChangeSection: toBe.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      text: "loading..."
    };
  }
  async componentDidMount() {
    const response = await fetch(
      "https://raw.githubusercontent.com/grumd/osu-pps/release/metadata.json"
    );
    const data = await response.json();
    this.setState({
      text: `last updated: ${new Date(data.lastUpdated).toLocaleDateString()}`
    });
  }

  render() {
    const { activeSection } = this.props;
    console.log(activeSection);
    return (
      <header className="top-bar">
        <nav>
          <ul>
            <li>
              <NavLink to={routes.maps.path}>maps</NavLink>
            </li>
            <li>
              <NavLink to={routes.mappers.path}>mappers</NavLink>
            </li>
            <li>
              <NavLink to={routes.farmers.path}>farmers</NavLink>
            </li>
          </ul>
        </nav>
        <div className="spacer" />
        <div>
          <div id="last-update">{this.state.text}</div>
          <div class="author">
            contact:{" "}
            <a href="https://www.reddit.com/message/compose/?to=grumd">
              /u/grumd
            </a>
          </div>
        </div>
      </header>
    );
  }
}
