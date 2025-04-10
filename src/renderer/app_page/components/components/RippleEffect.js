import React from 'react';
import './RippleEffect.scss';
import { colorList } from '../constants.js'
import { hslColor } from './drawer/figures.js';

const RippleEffect = ({ rippleEffects }) => {
  return (
    <div id='ripple-wrapper'>
      {
        rippleEffects.map((ripple) => {
          const [x, y] = ripple.points;
          let rippleColor = colorList[ripple.colorIndex].color

          if (colorList[ripple.colorIndex].name === 'color_rainbow') {
            rippleColor = hslColor(ripple.rainbowColorDeg);
          }

          if (ripple.type === 'laser') {
            rippleColor = '#E60000';
          }

          return (
            <div
              className="ripple-loader"
              key={ripple.id}
              style={{
                top: `${y}px`,
                left: `${x}px`,
              }}
            >
              <span style={{ borderColor: rippleColor }}></span>
            </div>
          );
        })
      }
    </div>
  );
};

export default RippleEffect;
