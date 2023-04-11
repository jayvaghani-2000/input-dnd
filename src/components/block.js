import React, { useState } from "react";
import { observer } from "mobx-react";
import { HoverableComponent } from "./hoverableComponent";
import { BlockSelector } from "./blockSelector";
import cellControls, { Control } from "./cellControls";
import "./block.css";

const Imp = observer((props) => {
  const [value, setValue] = useState(props.initialValue);
  const inputRef = React.createRef(null);
  const hasFocus = props.store?.focusedBlockId === props?.blockId;

  const onChange = (t) => {
    const newValue = t.target?.value || "";
    setValue(newValue);
    props.onChange && props.onChange(newValue);
  };

  return (
    <div>
      <input
        style={{ width: 400 }}
        ref={inputRef}
        onKeyDown={props.onKeyDown}
        onChange={onChange}
        value={value}
      />
    </div>
  );
});

const Block = observer((props) => {
  const block = props.store?.findBlockInCurrentPage(props?.blockId);
  const hasFocus = props.store?.focusedBlockId === props?.blockId;
  let inputRef = undefined;
  let [lastClickEventPos, setLastClickEventPos] = useState();

  const _canMoveRight = (blockId) => props.store?.canMoveRight(blockId);
  const _canMoveLeft = (blockId) => props.store?.canMoveLeft(blockId);
  const _canMoveUp = (blockId) => props.store?.canMoveUp(blockId);
  const _canMoveDown = (blockId) => props.store?.canMoveDown(blockId);
  const _handleMenuAction = ({ action, data }) => {
    switch (action) {
      case "setTextType":
        // are we already displaying a text type component
        inputRef?.setStyle(data);
        break;
      default:
        props.onHandleMenuAction &&
          props.onHandleMenuAction({ id: props?.blockId, action, data });
    }
  };

  const _handleKeyDownOnChildComponent = async (e) => {
    // removes the child if the block content is empty and the backspace key was pressed
    const block = props.store?.findBlockInCurrentPage(props?.blockId);
    if (!block) return;
    switch (e.key) {
      case "Backspace":
        console.log("back");
        await props.store?.resetBlockToDefaultType(props?.blockId);
        break;
      case "Enter":
        if (!e.ShiftKey)
          props.onReturnKeyPressed && props.onReturnKeyPressed(props?.blockId);
        break;
      default:
        break;
    }
  };

  const _saveBlockValue = (blockId, content) => {
    // stores the change in block value to the store
    console.log(content);
    props.store?.updateBlock(blockId, content);
  };

  const _onHover = (hover, blockId) => {
    if (hover && props.store.hoveredBlockId !== blockId)
      props.store.hoveredBlockId = blockId; //_setHoveredBlockId(blockId)
    else if (!hover && props.store.hoveredBlockId === blockId)
      props.store.hoveredBlockId = undefined; //_setHoveredBlockId(undefined)*/
  };

  const _onClick = (blockId, e) => {
    setLastClickEventPos({ x: e.clientX, y: e.clientY });
    props.store?.setFocusedBlockId(blockId);
    e.stopPropagation();
  };

  const shouldShowBlockTypeSelector = () =>
    props.store?.findBlockInCurrentPage(props?.blockId)?.type === undefined;

  const setInputRef = (ref) => {
    if (ref) {
      inputRef = ref;
      if (props.store?.focusedBlockId === props?.blockId) {
        inputRef.focus && inputRef.focus(lastClickEventPos);
      }
    }
  };

  const ctrlType = props.store?.findBlockInCurrentPage(props?.blockId)?.type;
  const ctrl = cellControls.get(ctrlType)?.control;
  const converter = cellControls?.get(ctrlType)?.value;

  return props?.blockId ? (
    <div
      key={props?.blockId}
      className="block"
      onClick={(e) => _onClick(props?.blockId, e)}
    >
      <HoverableComponent onHover={(hover) => _onHover(hover, props?.blockId)}>
        <BlockSelector
          key={"selector_" + props?.blockId}
          isHover={props.store.hoveredBlockId === props?.blockId}
          onReturnKeyPressed={props.onReturnKeyPressed}
          onDeleteKeyPressed={props.onDeleteKeyPressed}
          showBlockTypeSelector={shouldShowBlockTypeSelector()}
          blockId={props?.blockId}
          canInsertBelow={!block?.isDummy}
          canBeMovedUp={_canMoveUp(props?.blockId)}
          canBeMovedDown={_canMoveDown(props?.blockId)}
          canBeMovedRight={_canMoveRight(props?.blockId)}
          canBeMovedLeft={_canMoveLeft(props?.blockId)}
          canBeDeleted={!block?.isDummy}
          canBeDupplicated={!block?.isDummy}
          onBlockContextMenuClick={_handleMenuAction}
        >
          <div onClick={(e) => _onClick(props?.blockId, e)}>
            {Control(
              {
                store: props.store,
                blockId: props?.blockId,
                innerRef: setInputRef,
                initialValue: block?.content,
                id: props?.blockId,
                converter,
                readOnly: props.store.focusedBlockId !== props.blockId,
                userProfile: props.store?.userProfile,
                onChange: (content) =>
                  _saveBlockValue(props?.blockId, content?.value),
                value: block.content,
                onKeyDown: _handleKeyDownOnChildComponent,
              },
              ctrl
            )}
          </div>
        </BlockSelector>
      </HoverableComponent>
      <div style={{ display: "none" }} key={props?.blockId}>
        {JSON.stringify(block?.content)}
      </div>
    </div>
  ) : null;
});

export { Block };
