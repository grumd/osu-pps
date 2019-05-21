import React from 'react';
import { NavLink } from 'react-router-dom';
import pathToRegexp from 'path-to-regexp';

const ParamLink = ({
  children,
  match: { url = '', path = '', params: currentParams = {} } = {},
  location: { pathname = '' } = {},
  params = {},
}) => {
  const urlPartToInsert = pathToRegexp.compile(path)({
    ...currentParams,
    ...params,
  });
  const to = pathname.replace(url, urlPartToInsert);
  return <NavLink to={to}>{children}</NavLink>;
};

export default ParamLink;
