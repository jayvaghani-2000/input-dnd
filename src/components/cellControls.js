import React from "react";

const PlainInput =
  (type = "") =>
  (props) => {
    const _onKeyDown = (e) => {
      // removes the child if the block content is empty and the backspace key was pressed
      switch (e.key) {
        case "Backspace":
          if (props.value === "" || props.value === undefined)
            props.onKeyDown && props.onKeyDown(e);
          break;
        case "Enter":
          if (!e.ShiftKey) props.onKeyDown && props.onKeyDown(e);
          break;
        default:
          break;
      }
    };

    return !props.readOnly ? (
      <input
        ref={props.innerRef}
        type={type}
        onChange={(e) =>
          props.onChange && props.onChange({ value: e.target.value })
        }
        style={{ width: "100%"}}
        value={props.value}
        onKeyDown={_onKeyDown}
      />
    ) : (
      props.converter(props.value, props.userProfile)
    );
  };

const cellControls = new Map();
const controls = [
  {
    id: "textType",
    placeholder: "text",
    iconCss: "e-icons e-caption",
    text: "Text",
    autocompleteValue: "text",
    data: "text",
    category: "Texte",
    action: "setTextType",
    value: (v) => v?.toString(),
    control: PlainInput(),
  },
];

controls.map((control) => cellControls.set(control.id, control));

const Control = (props, Component) => {
  const {
    id,
    innerRef,
    value,
    store,
    items,
    userProfile,
    converter,
    type,
    field,
    readOnly,
    dataObj,
    onKeyDown,
    onChange,
  } = props;
  return Component ? (
    <Component
      innerRef={innerRef}
      id={id}
      key={id}
      store={store}
      type={type}
      converter={converter || ((v) => v)}
      userProfile={userProfile}
      onChange={onChange}
      onKeyDown={onKeyDown}
      readOnly={readOnly}
      items={items}
      value={value}
    />
  ) : null;
};

export default cellControls;
export { Control };
