import React, { createRef } from "react";
import cellControls from "./cellControls";
import { observer } from "mobx-react";
import "./form.css";
import store from "../store/rootStore";

const _getContextMenuItems = (options) => [];

const BlockSelector = observer(
  class BlockSelector extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        blockIsHovered: false,
      };

      this.blockContextMenuRef = createRef();
      this.contextMenuHandleRef = createRef();
      this.blockTypeChooserRef = createRef();

      this.onBlockContextMenuClick = this._onBlockContextMenuClick.bind(this);
      this.beforeOpenMenuItems = this._setMenuItemAccess.bind(this);

      this.setHovered = (blockIsHovered) => this.setState({ blockIsHovered });
      this.menuId = "contextMenuHandleId_" + props.blockId;
      this.menuIsCustomized = false;
    }

    _onContextMenuChange = async (item) => {
      const blockId = this.props.blockId;
      const currentBlock = store.blocksForCurrentPage.find(
        (block) => block.id === blockId
      );

      await store.updateBlock(
        blockId,
        currentBlock?.content || "",
        item.id,
        item.data
      );
      this.props.onFocusChild && this.props.onFocusChild(blockId);
    };

    _onReturnKeyPressed = (_) =>
      this.props.onReturnKeyPressed && this.props.onReturnKeyPressed();
    _onDeleteKeyPressed = (_) =>
      this.props.onDeleteKeyPressed && this.props.onDeleteKeyPressed();
    _onHover = (isHover) => this.setHovered(isHover);

    _onSelectBlockTypeReceivedKeyInput = async (text) => {
      // we have entered some text in the autoinput block selector
      // that doesn't start with '/', need to show the client block
      if (text?.length > 0 && text[0] !== "/") {
        const blockId = this.props.blockId;
        await store.updateBlock(blockId, text, "textType");
        this.props.onFocusChild && this.props.onFocusChild(blockId);
      }
    };

    _openMenuHandleClick = (e) => {
      const boundingBox =
        this.contextMenuHandleRef.current?.getBoundingClientRect() || {
          height: 0,
          width: 0,
        };
      this.blockContextMenuRef.current?.open(
        boundingBox.top + boundingBox.height,
        boundingBox.left
      ); //this.contextMenuHandleRef.current?.offsetLeft)
    };

    _onBlockContextMenuClick(args) {
      const { data, action } = args.item || {};

      switch (action) {
        //case 'setTextType':
        case "setGridType":
        case "setSchedulerType":
        case "setRatingType":
        case "setSliderType":
        case "setDateTypeDate":
        case "setDateTypeTime":
        case "setDateTypeDateTime":
        case "setLinkType":
        case "setCheckboxType":
        case "setUserType":
        case "setNumberTypePercentage":
        case "setEmailType":
          this._onContextMenuChange(args.item);
          break;
        default:
          this.props.onBlockContextMenuClick &&
            this.props.onBlockContextMenuClick({ data, action });
      }
    }

    _setMenuItemAccess = (e) => {
      //set enabled/disabled items for first level of item menu
      if (e.parentItem === null) {
        const enabledItems = e.items
          .filter((data) => data.enable)
          .map((data) => data.text);
        const disabledItems = e.items
          .filter((data) => !data.enable)
          .map((data) => data.text);

        if (this.blockContextMenuRef.current) {
          if (enabledItems.length > 0)
            this.blockContextMenuRef.current?.enableItems(enabledItems, true);
          if (disabledItems.length > 0)
            this.blockContextMenuRef.current?.enableItems(disabledItems, false);
        }
      }

      if (e.parentItem?.properties?.id === "tranformItem") {
        e.element.style.height = "350px";
        e.element.style.width = "200px";
        e.element.style.overflow = "auto";
      }
    };

    componentDidMount() {
      this.componentDidUpdate();
    }

    componentDidUpdate() {
      if (
        this.props.showBlockTypeSelector &&
        store.focusedBlockId === this.props.blockId
      ) {
        this.blockTypeChooserRef.current?.element?.focus();
      }
    }

    _beforeItemRender = (e) => {
      //change the class for header items
      if (e.item?.isHeader) {
        e.element.classList.add("custom-menu-header");
      }
    };

    _onChangeControlTitle = (e) => {};

    _getBlock = (_) => store.findBlockInCurrentPage(this.props.blockId) || {};
    _getBlockControlModel = (_) =>
      cellControls.get(this._getBlock()?.type) || {};

    _getContextMenuHandleIcon = (_) =>
      this.props.showBlockTypeSelector ? "+" : "#";
    _getControls = (_) =>
      BlockSelectorControls.map((ctrl) => ({ ...ctrl, control: undefined }));

    render() {
      const Menu = (
        <>
          <div
            id={this.menuId}
            ref={this.contextMenuHandleRef}
            className={`menuHandle ${
              this.props.isHover ||
              true ||
              store.focusedBlockId === this.props.blockId
                ? "show"
                : ""
            }`}
          >
            <i
              className="fa-solid fa-ellipsis-vertical"
              onClick={this._openMenuHandleClick}
            ></i>
            {this._getContextMenuHandleIcon()}
          </div>
        </>
      );

      return (
        <div
          className={
            "blockSelector blockChooser input" +
            (this.props.showBlockTypeSelector ? "blockSelectorDisplay" : "")
          }
          style={{display: "flex", columnGap: "10px"}}
        >
         <div
            className={
              "menu-handler" +
              (this._getBlockControlModel().hasTitle ? " menutitle" : "")
            }
          >
            {Menu}
          </div> 
          <div className={`control display`} onClick={this.props.onClick}>
            {this.props.children}
          </div>
        </div>
      );
    }
  }
);

const component = [{ type: "text", component: BlockSelector }];
export default component;
export { BlockSelector };
