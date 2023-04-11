import React, { useEffect, useRef, useState } from "react";
import store from "../store/rootStore";
import rowColArray from "./rowColArrayUtils";
import { observer } from "mobx-react";
import { Block } from "./block";
import "./page.css";
import classNames from "classnames";

const Page = observer((props) => {
  const { clientXRef } = props;
  const draggedElementRef = useRef();
  const dummyRef = useRef();
  const previousDraggedOverParent = useRef("");

  const [parents, setParents] = useState([]);
  const [draggedOverParent, setDraggedOverParent] = useState("");
  const [draggedItem, setDraggedItem] = useState({});
  const [placeholderIndex, setPlaceholderIndex] = useState();
  const [activeDragOverParent, setActiveDragOverParent] = useState();
  const [dragXDifference, setDragXDifference] = useState(0);

  const storeBlock = store.blocksForCurrentPage;

  useEffect(() => {
    if (storeBlock.length === 0) return;
    setParents(rowColArray.handleCreateChildParentRelation(storeBlock));
  }, [storeBlock]);

  const onReturnKeyPressed = async (block) => {
    if (block) {
      console.log('block', block)
      // it's coming from a non dummy block we need to give the focus to the next block
      const nextBlock = rowColArray.getNextRowBlock(
        store.blocksForCurrentPage,
        block.row
      );

      if (false) store.setFocusedBlockId(nextBlock.id);
      else {
        // it was the last block, need to update it and add a new dummy one
        await store.updateBlock(block.id, block.content, "textType", "", block.row, block.col);
      }
    }
  };

  const onHandleMenuAction = async ({ id, action, data }) => {
    let blockIdToFocus = id;
    let block = store.findBlockInCurrentPage(id);

    if (block === undefined) {
      console.warn("tried to handle unknown block " + id);
      return;
    }

    switch (action) {
      case "deleteBlock":
        store.blocksForCurrentPage = store.blocksForCurrentPage.filter(
          (b) => b.id !== id
        );

        let blockToFocus = store.blocksForCurrentPage
          .filter((b) => b.row === block.row)
          .sort((a, b) => a.col - b.col);
        if (blockToFocus.length === 0)
          blockToFocus = store.blocksForCurrentPage
            .filter((b) => b.row === block.row)
            .sort((a, b) => a.col - b.col);

        if (blockToFocus.length >= 0) store.focusedBlockId = blockToFocus[0].id;
        break;
      case "moveBlockUp":
        await store.moveBlockUp(id);
        break;
      case "moveBlockDown":
        await store.moveBlockDown(id);
        break;
      case "insertBlockAbove":
        await store.insertBlockAbove(id);
        break;
      case "insertBlockBelow":
        await store.insertBlockBelow(id);
        break;
      case "insertBlockRight":
        await store.insertBlockRight(id);
        break;
      case "insertBlockLeft":
        await store.insertBlockLeft(id);
        break;
      case "moveBlockRight":
        await store.moveBlockRight(id);
        break;
      case "moveBlockLeft":
        await store.moveBlockLeft(id);
        break;
      case "copyBlock":
        /* const block = store.findBlockInCurrentPage(id)
                if (block) {
                    const newBlock = createNewEmptyBlock()
                    newBlock.type = block.type
                    newBlock.content = block.content
                    store.insertBelow(id, newBlock)
                    blockIdToFocus = newBlock.id
                }*/
        break;
      default:
        console.error("Got unknown action from block menu " + action);
    }
    if (blockIdToFocus !== id) {
      store.setFocusedBlockId(blockIdToFocus);
    }
  };

  const onChange = async (title) => {
    // TODO need to handle multiple trottle
    await store.updatePage({ title });
  };

  const getDraggedParentIndex = (parents, item) => {
    return parents.findIndex((parent) => parent.id === item.parentId);
  };

  const handleDragEnter = (e, targetParentId) => {
    e.preventDefault();
    e.target.style = null;
    if (Object.keys(draggedItem).length === 0) {
      return;
    }
    const targetIndex = placeholderIndex === -1 ? 0 : placeholderIndex;

    const updatedParents = [...parents];
    const draggedParentIndex = getDraggedParentIndex(
      updatedParents,
      draggedItem
    );
    const targetParentIndex = parents.findIndex(
      (parent) => parent.id === targetParentId
    );

    const filteredChildren = updatedParents[draggedParentIndex].children.filter(
      (_, index) => index !== draggedItem.index
    );
    const draggedChild =
      updatedParents[draggedParentIndex].children[draggedItem.index];

    if (draggedParentIndex === targetParentIndex) {
      filteredChildren.splice(targetIndex, 0, draggedChild);
      updatedParents[draggedParentIndex].children = filteredChildren;
    } else {
      const targetChildren = updatedParents[targetParentIndex].children;
      targetChildren.splice(targetIndex, 0, draggedChild);
      updatedParents[targetParentIndex].children = targetChildren;

      updatedParents[draggedParentIndex].children = filteredChildren;
    }

    const handleAddIntermediateDroppable = [
      {
        id: "droppable0",
        children: [],
      },
      ...updatedParents
        .filter((i) => i.children.length)
        .map((j, index) => {
          if (j.id === targetParentId) {
            onReturnKeyPressed({
              ...j.children[placeholderIndex],
              row: index,
              col: placeholderIndex,
            });
          }
          return [
            {
              id: `droppable${2 * index + 1}`,
              children: j.children.map((k, colIndex) => ({
                ...k,
                col: colIndex,
                row: index,
              })),
            },
            { id: `droppable${2 * index + 2}`, children: [] },
          ];
        })
        .flat(),
    ];
    setParents(handleAddIntermediateDroppable);
    setDraggedItem({});
  };

  const handleDropEndCapture = (e) => {
    e.preventDefault();
    if (draggedElementRef.current) {
      draggedElementRef.current.classList.remove("handleRemoveSelectedElement");
    }
    previousDraggedOverParent.current = "";
    setDraggedOverParent("");
    setActiveDragOverParent(undefined);
    setDragXDifference(0);
  };

  const handleDragOverParent = (e, parentId) => {
    e.preventDefault();
    if (previousDraggedOverParent.current !== parentId) {
      setDraggedOverParent(parentId);
      previousDraggedOverParent.current = parentId;
    }
    if (parentId !== activeDragOverParent) {
      setActiveDragOverParent(parentId);
    }
  };

  const getDragOverClass = (parent) => {
    return parent.children.length > 0
      ? "activeDragOverWithChild"
      : "activeDragOver";
  };

  const handleDragStart = (event, item) => {
    setDragXDifference(event.clientX - item.index * 120);
    setDraggedItem(item);
    event.target.style.boxShadow = "inset 0 0 10px 10px rgba(39, 43, 84, 0.5)";
  };

  const handleDragEnd = (e) => {
    e.target.style = null;
    if (draggedElementRef.current) {
      draggedElementRef.current.classList.remove("handleRemoveSelectedElement");
    }
    setDraggedItem({});
    setDraggedOverParent("");
    previousDraggedOverParent.current = "";
    setActiveDragOverParent(undefined);
    setDragXDifference(0);
  };

  const handleDrag = (e) => {
    if (draggedElementRef.current) {
      draggedElementRef.current.classList.add("handleRemoveSelectedElement");
    }
    const dragBetweenIndex = Math.round(
      (clientXRef.current - dragXDifference) / 120
    );
    if (
      placeholderIndex !== dragBetweenIndex &&
      typeof clientXRef.current !== "undefined"
    ) {
      setPlaceholderIndex(dragBetweenIndex);
    }
  };

  const renderChild = (item, index, parent) => {
    return item.id === "placeholder" ? (
      <div key={item.id} className="childPlaceholder"></div>
    ) : (
      <Block
        key={item.id}
        id={item.id}
        store={store}
        onHandleMenuAction={onHandleMenuAction}
        blockId={item.id}
        onReturnKeyPressed={async (_) => await onReturnKeyPressed(item)}
        draggedItem={draggedItem}
        indexKey={index}
        handleDragStart={(e) =>
          handleDragStart(e, { item, index, parentId: parent.id })
        }
        className={`child ${
          Object.keys(draggedItem).length === 0 ? "makeChildVisible" : ""
        }`}
        handleDragEnd={handleDragEnd}
        parent={parent}
        handleDrag={handleDrag}
        item={item}
        draggedElementRef={draggedElementRef}
      />
    );
  };

  const addPlaceholderHelper = (childrens) => {
    const updatedChildren = [...childrens];
    const placeholder = { id: "placeholder", text: "" };

    if (placeholderIndex < 0) {
      updatedChildren.unshift(placeholder);
    } else {
      updatedChildren.splice(
        draggedItem.index < placeholderIndex &&
          draggedItem.parentId === activeDragOverParent
          ? placeholderIndex + 1
          : placeholderIndex,
        0,
        placeholder
      );
    }
    return updatedChildren;
  };

  return (
    <div className="page">
      {parents.map((parent) => {
        return (
          <div
            key={parent.id}
            className={classNames("droppable", {
              [getDragOverClass(parent)]: draggedOverParent === parent.id,
              ["activeDragWithChildOneChild"]:
                draggedItem.parentId === parent.id &&
                parent.children.length === 1,
            })}
            onDragOver={(e) => handleDragOverParent(e, parent.id)}
            onDrop={(e) => handleDragEnter(e, parent.id)}
            onDropCapture={handleDropEndCapture}
          >
            {parent.id === activeDragOverParent
              ? addPlaceholderHelper(parent.children).map((child, index) =>
                  renderChild(child, index, parent)
                )
              : parent.children.map((child, index) =>
                  renderChild(child, index, parent)
                )}
          </div>
        );
      })}

      {/* {getSortedBlockArray().map((cols, rowIndex) => (
        <div className="pagerow" key={"row_" + rowIndex} id={"row_" + rowIndex}>
          {cols?.map((block) => (
            <Block
              key={block.id}
              onHandleMenuAction={onHandleMenuAction}
              blockId={block.id}
              store={store}
              onReturnKeyPressed={async (_) => await onReturnKeyPressed(block)}
            />
          ))}
        </div>
      ))} */}
    </div>
  );
});

export { Page };
