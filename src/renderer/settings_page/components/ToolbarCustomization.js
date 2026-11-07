import React, { useState } from 'react';

const ToolbarCustomization = ({ toolbarOptions, onChange, onError, Icons }) => {
  const [expandedGroup, setExpandedGroup] = useState(null);

  const hasVisibleBrushes = (options) => {
    return options.tool_bar_show_brush ||
           options.tool_bar_show_pen ||
           options.tool_bar_show_fadepen;
  };

  const hasVisibleShapes = (options) => {
    return options.tool_bar_show_arrow ||
           options.tool_bar_show_flat_arrow ||
           options.tool_bar_show_rectangle ||
           options.tool_bar_show_diamond ||
           options.tool_bar_show_oval ||
           options.tool_bar_show_line ||
           options.tool_bar_show_stamp;
  };

  const hasBrushes = hasVisibleBrushes(toolbarOptions);
  const hasShapes = hasVisibleShapes(toolbarOptions);

  const toggleGroup = (group) => {
    setExpandedGroup(currentGroup => currentGroup === group ? null : group);
  };

  const getVisibleToolCount = (options) => {
    return Number(hasVisibleBrushes(options)) +
           Number(hasVisibleShapes(options)) +
           Number(options.tool_bar_show_text) +
           Number(options.tool_bar_show_highlighter) +
           Number(options.tool_bar_show_laser) +
           Number(options.tool_bar_show_eraser);
  };

  const applyToolbarVisibility = (changedToolbarOptions) => {
    const allToolbarOptions = { ...toolbarOptions, ...changedToolbarOptions };

    const visibleToolCount = getVisibleToolCount(toolbarOptions);
    const nextVisibleToolCount = getVisibleToolCount(allToolbarOptions);

    if (nextVisibleToolCount < 3 && nextVisibleToolCount < visibleToolCount) {
      onError('Keep at least 3 tools visible.');
      return;
    }

    onChange(allToolbarOptions, changedToolbarOptions);
  };

  const toggleBrushes = () => {
    applyToolbarVisibility({
      tool_bar_show_brush: !hasBrushes,
      tool_bar_show_pen: !hasBrushes,
      tool_bar_show_fadepen: !hasBrushes,
    });
  };

  const toggleShapes = () => {
    applyToolbarVisibility({
      tool_bar_show_arrow: !hasShapes,
      tool_bar_show_flat_arrow: !hasShapes,
      tool_bar_show_rectangle: !hasShapes,
      tool_bar_show_diamond: !hasShapes,
      tool_bar_show_oval: !hasShapes,
      tool_bar_show_line: !hasShapes,
      tool_bar_show_stamp: !hasShapes,
    });
  };

  return (
    <>
      <div className={`toolbar-customization-group${expandedGroup === 'brushes' ? ' expanded' : ''}`}>
        <div className="settings-item">
          <div className="settings-item-hint" onClick={() => toggleGroup('brushes')}>
            <Icons.chevron_forward className="icon" />
          </div>

          <div className="settings-item-info" onClick={() => toggleGroup('brushes')}>
            <div className="settings-item-title">Brushes</div>
          </div>

          <div className="settings-item-control">
            <div
              className={`toggle ${hasBrushes ? 'active' : ''}`}
              onClick={toggleBrushes}
            ></div>
          </div>
        </div>

        <div className="settings-group-content">
          <div className="settings-group-content-inner">
            <div className="toolbar-customization-tools toolbar-customization-tools--brushes">
              <div className="toolbar-customization-tool">
                <Icons.brush className="toolbar-customization-tool-icon" />
                <div className="toolbar-customization-tool-title">Brush</div>
                <div
                  className={`toolbar-customization-tool-toggle ${toolbarOptions.tool_bar_show_brush ? 'active' : ''}`}
                  onClick={() => applyToolbarVisibility({ tool_bar_show_brush: !toolbarOptions.tool_bar_show_brush })}
                ></div>
              </div>

              <div className="toolbar-customization-tool">
                <Icons.pen className="toolbar-customization-tool-icon" />
                <div className="toolbar-customization-tool-title">Pen</div>
                <div
                  className={`toolbar-customization-tool-toggle ${toolbarOptions.tool_bar_show_pen ? 'active' : ''}`}
                  onClick={() => applyToolbarVisibility({ tool_bar_show_pen: !toolbarOptions.tool_bar_show_pen })}
                ></div>
              </div>

              <div className="toolbar-customization-tool">
                <Icons.fadepen className="toolbar-customization-tool-icon" />
                <div className="toolbar-customization-tool-title">Fade Pen</div>
                <div
                  className={`toolbar-customization-tool-toggle ${toolbarOptions.tool_bar_show_fadepen ? 'active' : ''}`}
                  onClick={() => applyToolbarVisibility({ tool_bar_show_fadepen: !toolbarOptions.tool_bar_show_fadepen })}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`toolbar-customization-group${expandedGroup === 'shapes' ? ' expanded' : ''}`}>
        <div className="settings-item">
          <div className="settings-item-hint" onClick={() => toggleGroup('shapes')}>
            <Icons.chevron_forward className="icon" />
          </div>

          <div className="settings-item-info" onClick={() => toggleGroup('shapes')}>
            <div className="settings-item-title">Shapes</div>
          </div>

          <div className="settings-item-control">
            <div
              className={`toggle ${hasShapes ? 'active' : ''}`}
              onClick={toggleShapes}
            ></div>
          </div>
        </div>

        <div className="settings-group-content">
          <div className="settings-group-content-inner">
            <div className="toolbar-customization-tools toolbar-customization-tools--shapes">
              <div className="toolbar-customization-tool">
                <Icons.arrow className="toolbar-customization-tool-icon" />
                <div className="toolbar-customization-tool-title">Arrow</div>
                <div
                  className={`toolbar-customization-tool-toggle ${toolbarOptions.tool_bar_show_arrow ? 'active' : ''}`}
                  onClick={() => applyToolbarVisibility({ tool_bar_show_arrow: !toolbarOptions.tool_bar_show_arrow })}
                ></div>
              </div>

              <div className="toolbar-customization-tool">
                <Icons.flat_arrow className="toolbar-customization-tool-icon" />
                <div className="toolbar-customization-tool-title">Flat Arrow</div>
                <div
                  className={`toolbar-customization-tool-toggle ${toolbarOptions.tool_bar_show_flat_arrow ? 'active' : ''}`}
                  onClick={() => applyToolbarVisibility({ tool_bar_show_flat_arrow: !toolbarOptions.tool_bar_show_flat_arrow })}
                ></div>
              </div>

              <div className="toolbar-customization-tool">
                <Icons.rectangle className="toolbar-customization-tool-icon" />
                <div className="toolbar-customization-tool-title">Rectangle</div>
                <div
                  className={`toolbar-customization-tool-toggle ${toolbarOptions.tool_bar_show_rectangle ? 'active' : ''}`}
                  onClick={() => applyToolbarVisibility({ tool_bar_show_rectangle: !toolbarOptions.tool_bar_show_rectangle })}
                ></div>
              </div>

              <div className="toolbar-customization-tool">
                <Icons.diamond className="toolbar-customization-tool-icon" />
                <div className="toolbar-customization-tool-title">Diamond</div>
                <div
                  className={`toolbar-customization-tool-toggle ${toolbarOptions.tool_bar_show_diamond ? 'active' : ''}`}
                  onClick={() => applyToolbarVisibility({ tool_bar_show_diamond: !toolbarOptions.tool_bar_show_diamond })}
                ></div>
              </div>

              <div className="toolbar-customization-tool">
                <Icons.oval className="toolbar-customization-tool-icon" />
                <div className="toolbar-customization-tool-title">Oval</div>
                <div
                  className={`toolbar-customization-tool-toggle ${toolbarOptions.tool_bar_show_oval ? 'active' : ''}`}
                  onClick={() => applyToolbarVisibility({ tool_bar_show_oval: !toolbarOptions.tool_bar_show_oval })}
                ></div>
              </div>

              <div className="toolbar-customization-tool">
                <Icons.line className="toolbar-customization-tool-icon" />
                <div className="toolbar-customization-tool-title">Line</div>
                <div
                  className={`toolbar-customization-tool-toggle ${toolbarOptions.tool_bar_show_line ? 'active' : ''}`}
                  onClick={() => applyToolbarVisibility({ tool_bar_show_line: !toolbarOptions.tool_bar_show_line })}
                ></div>
              </div>

              <div className="toolbar-customization-tool">
                <Icons.stamp className="toolbar-customization-tool-icon" />
                <div className="toolbar-customization-tool-title">Stamp</div>
                <div
                  className={`toolbar-customization-tool-toggle ${toolbarOptions.tool_bar_show_stamp ? 'active' : ''}`}
                  onClick={() => applyToolbarVisibility({ tool_bar_show_stamp: !toolbarOptions.tool_bar_show_stamp })}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-item">
        <div className="settings-item-hint">
          <Icons.text className="icon" />
        </div>

        <div className="settings-item-info">
          <div className="settings-item-title">Text</div>
        </div>

        <div className="settings-item-control">
          <div
            className={`toggle ${toolbarOptions.tool_bar_show_text ? 'active' : ''}`}
            onClick={() => applyToolbarVisibility({ tool_bar_show_text: !toolbarOptions.tool_bar_show_text })}
          ></div>
        </div>
      </div>

      <div className="settings-item">
        <div className="settings-item-hint">
          <Icons.highlighter className="icon" />
        </div>

        <div className="settings-item-info">
          <div className="settings-item-title">Highlighter</div>
        </div>

        <div className="settings-item-control">
          <div
            className={`toggle ${toolbarOptions.tool_bar_show_highlighter ? 'active' : ''}`}
            onClick={() => applyToolbarVisibility({ tool_bar_show_highlighter: !toolbarOptions.tool_bar_show_highlighter })}
          ></div>
        </div>
      </div>

      <div className="settings-item">
        <div className="settings-item-hint">
          <Icons.laser className="icon" />
        </div>

        <div className="settings-item-info">
          <div className="settings-item-title">Laser</div>
        </div>

        <div className="settings-item-control">
          <div
            className={`toggle ${toolbarOptions.tool_bar_show_laser ? 'active' : ''}`}
            onClick={() => applyToolbarVisibility({ tool_bar_show_laser: !toolbarOptions.tool_bar_show_laser })}
          ></div>
        </div>
      </div>

      <div className="settings-item">
        <div className="settings-item-hint">
          <Icons.eraser className="icon" />
        </div>

        <div className="settings-item-info">
          <div className="settings-item-title">Eraser</div>
        </div>

        <div className="settings-item-control">
          <div
            className={`toggle ${toolbarOptions.tool_bar_show_eraser ? 'active' : ''}`}
            onClick={() => applyToolbarVisibility({ tool_bar_show_eraser: !toolbarOptions.tool_bar_show_eraser })}
          ></div>
        </div>
      </div>

      <div className="settings-item">
        <div className="settings-item-hint">
          <Icons.clear_desk className="icon" />
        </div>

        <div className="settings-item-info">
          <div className="settings-item-title">Clear Desk</div>
        </div>

        <div className="settings-item-control">
          <div
            className={`toggle ${toolbarOptions.tool_bar_show_clear_desk ? 'active' : ''}`}
            onClick={() => applyToolbarVisibility({ tool_bar_show_clear_desk: !toolbarOptions.tool_bar_show_clear_desk })}
          ></div>
        </div>
      </div>
    </>
  );
};

export default ToolbarCustomization;
