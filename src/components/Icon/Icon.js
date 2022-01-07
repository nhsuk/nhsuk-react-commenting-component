import PropTypes from 'prop-types';
import React from 'react';
import Icons from './icons.svg';

// Icons comes from an SVG sprite. If more icons need to be added,
// they should live in there. Add your SVG in another <symbol> with
// ID "icon-<nameOfIcon>" and use <nameOfIcon> for 'name' parameter

/**
 * Provide a `title` as an accessible label intended for screen readers.
 */
const Icon = ({ name, className, title }) => (
  <span>
    <svg className={`icon icon-${name} ${className || ''}`} viewBox="0 0 24 24">
      <use href={Icons + `#icon-${name}`}></use>
    </svg>
    {title ? (
      <span className="visuallyhidden">
        {title}
      </span>
    ) : null}
  </span>
);

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  title: PropTypes.string,
};

Icon.defaultProps = {
  className: null,
  title: null,
};

export default Icon;
