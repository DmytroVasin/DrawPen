import React from 'react';
import './Toast.scss';

const Toast = ({ info, handleToastClicked }) => {
  return (
    <div id="toast-block" key={`${info.title}-${info.body}`}>
      <img src="../assets/icon.png" alt='drawpen' className="toast-icon" />

      <div className="toast-main">
        <div className="toast-main-title">{info.title}</div>
        <div className="toast-main-description">{info.body}</div>
      </div>

      {
        info.button_label &&
          <div className="toast-action">
            <div className="toast-action-button" onClick={handleToastClicked}>{info.button_label}</div>
          </div>
      }
    </div>
  );
};

export default Toast;
