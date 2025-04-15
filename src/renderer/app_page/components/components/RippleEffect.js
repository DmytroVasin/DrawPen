import React from 'react';
import './RippleEffect.scss';

const RippleEffect = ({ rippleEffects }) => {
  return (
    <div id='ripple-wrapper'>
      {
        rippleEffects.map((ripple) => {
          const [x, y] = ripple.points;

          return (
            <div
              className="ripple-loader"
              key={ripple.id}
              style={{
                top: `${y}px`,
                left: `${x}px`,
              }}
            >
              <span></span>
            </div>
          );
        })
      }
    </div>
  );
};

export default RippleEffect;
