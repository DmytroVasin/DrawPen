import React, { useEffect} from 'react';

function DisableZoom() {
    useEffect(() => {
      const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
        }
      };

      const handleKeyDown = (e) => {
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.keyCode == "61" ||
            e.keyCode == "107" ||
            e.keyCode == "173" ||
            e.keyCode == "109" ||
            e.keyCode == "187" ||
            e.keyCode == "189")
        ) {
          e.preventDefault();
        }
      };

      window.addEventListener('wheel', handleWheel);
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

    return null;
  }

export default DisableZoom;
