import { v4 as uuidv4 } from 'uuid';
import api from '../sync/api'
import cacheManager from './cacheManager'
import rowColArray from '../components/rowColArrayUtils'
import { makeAutoObservable, runInAction } from "mobx"

const createNewEmptyBlock = (content, type, row, col) => ({id: uuidv4(), content, type, row, col, isDummy:false})
const removeDummyBlock = (page, dummyBlockId) => ({ ...page, blocks: page.blocks.filter(id => id !== dummyBlockId) })

class rootStore {
  secondsPassed = []
  currentDraggedElementPayload = undefined
  currentDropTargetId = undefined
  currentFocusedBlock = undefined
  currentHoveredBlock = undefined
  knownBlocksTypes = [] //known controls
  workspace = {pages:[]}
  currentPage = { blocks: [] }
  blocksForCurrentPage = []
  focusedBlockId = undefined
  dummyBlockId = undefined
  isBusy = false
  userProfile = {}
  currentUser = undefined

  constructor() {
    makeAutoObservable(this)
  }

  fetchTableData = async id => {
    var p = new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 2000)
    })
    
    let q = await p
    let data = await api.fetchTableData(id)
    if (data) {
      runInAction(() => {
        let table = this.tables.find(table => table.id === id)
        if (table) table.data = data
        else table.push({id, data:[]})
      })
    }
  }
  login = async (name, password) => {
    const noTitle = 'no title'

    let pageDefinition
    let workspace 
    const user = await api.login(name, password)

    // TODO need to handle login error
    if (user !== undefined) {
       workspace = await api.fetchWorkspace(user?.id)

      if (!workspace) {
        //no cache available should get from server
        //here we will only warn and create a new empty workspace
        //REMOVE FOR PROD
        workspace = { pages: [], createdBy: user.id, creationDate: Date.now() }
        await api.saveWorkspace(workspace, user?.id)

        //we create a new page for the workspace and assign it to the user profile
        const nextNum = workspace.pages.filter(page => page.title.indexOf(noTitle) > -1).length + 1
        const newPage = this._addNewPage(noTitle + ' ' + nextNum)
        /* for testsonly */
        let block1 = {id:uuidv4(), type:'textType', content:'block1', row:0, col:0}
        let block2 = {id:uuidv4(), type:'textType', content:'block2', row:0, col:1}
        let block3 = {id:uuidv4(), type:'textType', content:'block3', row:1, col:0}
        let block4 = {id:uuidv4(), type:'textType', content:'block4', row:2, col:0}
        newPage.blocks=[block1.id, block2.id, block3.id, block4.id]
        const blocks = [block1, block2, block3, block4]
        /* end of test only section */
        await api.savePage(newPage, blocks)
        workspace.pages.push(newPage)
        await api.saveWorkspace(workspace, user.id)
        pageDefinition = await this._fetchAndSetAsCurrentPage(newPage.id)
      } else {
        let pageToFetchId = user.lastPageId

        // we have a workspace, let's find which page to display
        if (!workspace.pages.find(p => p.id === pageToFetchId)) {
          // try to find the first public page in the workspace
          pageToFetchId = workspace.pages.find(p => !p.isDeleted && !p.isTemplate)?.id
          if (pageToFetchId)
            pageDefinition = await this._fetchAndSetAsCurrentPage(pageToFetchId)
          else {
            //we haven't found a page in the workspace, let's create a new page
            const nextNum = workspace.pages.filter(page => page.title.indexOf(noTitle) > -1).length + 1
            const newPage = this._addNewPage(noTitle + ' ' + nextNum)

            await api.savePage(newPage)
            workspace.pages.push(newPage)
            await api.saveWorkspace(workspace, user.id)
            pageDefinition = await this._fetchAndSetAsCurrentPage(newPage.id)
          }
        } else {
          //we found the page in the workspace, let' fetch it
          pageDefinition = await this._fetchAndSetAsCurrentPage(pageToFetchId)
        }
      }

      await api.saveUser(user)
    }

    runInAction(() => {
      this.currentPage = pageDefinition?.currentPage
      this.blocksForCurrentPage = pageDefinition?.blocksForCurrentPage
      user.lastPageId = pageDefinition?.currentPage?.id
      this.currentUser = user
      this.workspace = workspace
      this.initCurrentPage()
    })
  }
  _fetchAndSetAsCurrentPage = async pageToFetchId => {
    let pageDefinition = await api.fetchPage(pageToFetchId)

    if (!pageDefinition) {
      console.log('Could not fetch page ' + pageToFetchId + ' from cache');
    } else {
      // we got a page
      if (pageDefinition?.blocksInError?.length > 0) {
        // we where able to get the page from the cache but not all block definitions
        // at this point we could decide to get the missing blocks from the remote server
        console.warn('Page ' + pageToFetchId + ' was fetched from cache but contains missing blocks ')
      }
    }
    return pageDefinition
  }
  insertBlockAbove = async id => {
    const block = this.findBlockInCurrentPage(id)
    let arr = rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)
    const newBlock = createNewEmptyBlock(undefined, 'none')
    arr.splice(block.row, 0, [newBlock])
    this.blocksForCurrentPage.push(newBlock)
    rowColArray.calcRowColPositionsInArray(arr)

    let p = []
    rowColArray.flattenArray(arr).forEach(b => {
      p.push(new Promise(() => this.updateBlock(b.id, b.content, b.type, b.data, b.row, b.col, b.isDummy)))
    })

    await Promise.all(p)
  }
  insertBlockRight = async id => {
    const block = this.findBlockInCurrentPage(id)
    let arr = rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)
    const newBlock = createNewEmptyBlock(undefined, 'none')
    if(block.col === arr[block.row].length-1)  arr[block.row].push(newBlock)
    else arr[block.row].splice(block.col + 1, 0, newBlock)
    this.blocksForCurrentPage.push(newBlock)
    rowColArray.calcRowColPositionsInArray(arr)
    console.log(rowColArray.toString(arr))

    let p = []
    rowColArray.flattenArray(arr).forEach(b => {
      p.push(new Promise(() => this.updateBlock(b.id, b.content, b.type, b.data, b.row, b.col, b.isDummy)))
    })

    await Promise.all(p)    
  }
  insertBlockLeft = async id => {
    const block = this.findBlockInCurrentPage(id)
    let arr = rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)
    const newBlock = createNewEmptyBlock(undefined, 'none')
    arr[block.row].splice(block.col, 0, newBlock)
    this.blocksForCurrentPage.push(newBlock)
    rowColArray.calcRowColPositionsInArray(arr)

    let p = []
    rowColArray.flattenArray(arr).forEach(b => {
      p.push(new Promise(() => this.updateBlock(b.id, b.content, b.type, b.data, b.row, b.col, b.isDummy)))
    })
    
    await Promise.all(p)
  }
  insertBlockBelow = async id => {
    const block = this.findBlockInCurrentPage(id)
    let arr = rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)
    const newBlock = createNewEmptyBlock(undefined, 'none')
    arr.splice(block.row + 1, 0, [newBlock])
    this.blocksForCurrentPage.push(newBlock)
    rowColArray.calcRowColPositionsInArray(arr)
    let p = []
    rowColArray.flattenArray(arr).forEach(b => {
      p.push(new Promise(() => this.updateBlock(b.id, b.content, b.type, b.data, b.row, b.col, b.isDummy)))
    })
    
    await Promise.all(p)
  }
  moveBlockRight = async id => {
    const block = this.findBlockInCurrentPage(id)
    let arr = rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)  
    arr[block.row].splice(block.col, 1)
    arr[block.row].splice(block.col + 1, 0, block)
    rowColArray.calcRowColPositionsInArray(arr)
    let p = []
    rowColArray.flattenArray(arr).forEach(b => {
      p.push(new Promise(() => this.updateBlock(b.id, b.content, b.type, b.data, b.row, b.col, b.isDummy)))
    })
    
    await Promise.all(p)
  }
  moveBlockLeft = async id => {
    const block = this.findBlockInCurrentPage(id)
    let arr = rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)  
    arr[block.row].splice(block.col, 1)
    arr[block.row].splice(block.col-1, 0, block)
    rowColArray.calcRowColPositionsInArray(arr)
    let p = []
    rowColArray.flattenArray(arr).forEach(b => {
      p.push(new Promise(() => this.updateBlock(b.id, b.content, b.type, b.data, b.row, b.col, b.isDummy)))
    })
    
    await Promise.all(p)
  }
  moveBlockUp = async id => {
    const block = this.findBlockInCurrentPage(id)
    let arr = rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)
    //if (block.row > 0) {
      //case 1 there is only one block on the line
      //we remove the block from the line and add it in the first column of the next row
      if (arr[block.row].length === 1) { 
        //skip last block
        arr.splice(block.row, 1)
        arr[block.row-1].splice(0, 0, block) // insert the block at the start of the next line
      }
      else {
        //case 2 there is more than one block on the block line,
        //we remove the block from the column and add it as a single element on a new line
        arr[block.row].splice(block.col, 1)
        arr.splice(block.row, 0, [block])
      }
    //}    
    rowColArray.calcRowColPositionsInArray(arr)
    let p = []
    rowColArray.flattenArray(arr).forEach(b => {
      p.push(new Promise(() => this.updateBlock(b.id, b.content, b.type, b.data, b.row, b.col, b.isDummy)))
    })

    await Promise.all(p)    
  }
  moveBlockDown = async id => {
    const block = this.findBlockInCurrentPage(id)
    let arr = rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)
    if (block.row < arr.length) {
      //case 1 there is only one block on the line
      //we remove the block from the line and add it in the first column of the next row
      if (arr[block.row].length === 1) { 
        if (block.row < arr.length - 1) {
          //skip last block
          arr.splice(block.row, 1)
          arr[block.row].splice(0, 0, block) // insert the block at the start of the next line
        }
      }
      else {
        //case 2 there is more than one block on the block line,
        //we remove the block from the column and add it as a single element on a new line
        arr[block.row].splice(block.col, 1)
        arr.splice(block.row + 1, 0, [block])
      }
    }

    rowColArray.calcRowColPositionsInArray(arr)
    let p = []
    rowColArray.flattenArray(arr).forEach(b => {
      p.push(new Promise(() => this.updateBlock(b.id, b.content, b.type, b.data, b.row, b.col, b.isDummy)))
    })
    
    await Promise.all(p)    
  }
  canMoveLeft = id => {
    const block = this.findBlockInCurrentPage(id)
    return block?.col > 0 && !block.isDummy
  }
  canMoveRight = id => {
    const block = this.findBlockInCurrentPage(id)
    return(block?.col < rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)[block.row]?.length-1) && !block.isDummy
  }
  canMoveUp = id => {
    const block = this.findBlockInCurrentPage(id)
    return (block?.row > 0 || (block.row === 0 && rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)[block.row]?.length > 1)) && !block.isDummy
  }
  canMoveDown = id => {
    //cannot move down if you are the pre last block unless there is more than one block in the row
    const block = this.findBlockInCurrentPage(id)
    return block?.row < Math.max(...this.blocksForCurrentPage.map(b => b.row)) - 1 || (
      rowColArray.getRowOrderedColOrderedArray(this.blocksForCurrentPage)[block.row]?.length > 1 && 
      block?.row < Math.max(...this.blocksForCurrentPage.map(b => b.row)))
  }
  updatePage = async obj => {
    const newPage = { ...this.currentPage, ...obj }
    const index = this.workspace.pages.findIndex(page => page.id === newPage.id)

    runInAction(() => {
      this.currentPage = newPage
      if(index >= 0) this.workspace.pages[index] = newPage
    })
    
    await this._storeCurrentPageToCache()
    await api.saveWorkspace(this.workspace, this.currentUser?.id)
  }
  getSeconds = _ => this.secondsPassed.length > 0 ? this.secondsPassed.find(block => block.id === 1).count : 0
  findBlockInCurrentPage = blockId => this.blocksForCurrentPage.find(block => block.id === blockId)
  findBlockIndexInCurrentPage = blockId => this.blocksForCurrentPage.findIndex(block => block.id === blockId)
  setFocusedBlockId = blockId => this.focusedBlockId = blockId
  setCurrentFocusedBlock = blockId => { this.currentFocusedBlock = blockId }
  setCurrentHoveredBlock = blockId => { this.currentHoveredBlock = blockId }
  resetBlockToDefaultType = async blockId => { await this.updateBlock(blockId, '', 'none') }
  _getMaxRows = _ => this.blocksForCurrentPage && this.blocksForCurrentPage.length > 0 ? Math.max(...((this.blocksForCurrentPage || []).map(b => b.row))) + 1 : 0
  _addDummyBlockAtEndOfPage = () => {
    const newDummyBlock = ({
      id: uuidv4(), content: '', type: undefined,
      isDummy: true, row: this._getMaxRows(),
      col: 0
    })
    this.dummyBlockId = newDummyBlock.id
    this.blocksForCurrentPage.push(newDummyBlock)
    this.currentPage.blocks.push(newDummyBlock.id)
  }
  openPage = async id => {
    let pageDefinition = await this._fetchAndSetAsCurrentPage(id)
    runInAction(() => {
      this.currentPage = pageDefinition?.currentPage
      this.blocksForCurrentPage = pageDefinition?.blocksForCurrentPage
      if(this.currentUser) this.currentUser.lastPageId = this.currentPage?.id
      this.initCurrentPage()
    })
    await cacheManager.saveUser(this.currentUser)
  }
  addNewPage = async _ => {
    const noTitle = 'no title'
    const nextNum = this.workspace.pages.filter(page => page.title.indexOf(noTitle) > -1).length + 1
    const newPage = this._addNewPage(noTitle + ' ' + nextNum)

    await api.savePage(newPage)
    runInAction(() => {
      this.workspace.pages.push(newPage)
    })
    await api.saveWorkspace(this.workspace, this.currentUser.id)
    let pageDefinition = await this._fetchAndSetAsCurrentPage(newPage.id)
    runInAction(() => {
      this.currentPage = pageDefinition?.currentPage
      this.blocksForCurrentPage = pageDefinition?.blocksForCurrentPage
      this.initCurrentPage()
    })
  }
  _addNewPage = title => {
    const noTitle = 'sans titre'
    const newPage = { id: uuidv4(), blocks: [], title, creationDate: Date.now() } 
    return newPage
  }
  initCurrentPage = () => {
    //if(!this.currentPage || !this.currentPage?.blocks) return
    const blocks = this.currentPage?.blocks
    if(!blocks) return
    const lastBlockId = blocks.length > 0 ? blocks[blocks.length - 1] : undefined
    if (lastBlockId === undefined || !this.findBlockInCurrentPage(lastBlockId)?.isDummy) this._addDummyBlockAtEndOfPage()
  }
  updateBlock = async (blockId, content, type, data, row, col, keepDummyFlag = false) => {
   runInAction(() => {
      //update the block content for the current page
      const block = this.findBlockInCurrentPage(blockId)
      if (!block) return
      
      const needToAddNewDummyBlock = block?.isDummy && !keepDummyFlag

      block.content = content
      block.isDummy = block.isDummy && keepDummyFlag
      block.data = data

      if (row !== undefined) block.row = row
      if (col !== undefined) block.col = col

      if (type === 'none') block.type = undefined
      else if (type) block.type = type

      // this was the last block of the page, we need to add a new one at the end
      if (needToAddNewDummyBlock) this._addDummyBlockAtEndOfPage()
    })
  
    // we save the changes in the local storage
    await this._updateBlockInCache(this.findBlockInCurrentPage(blockId))
  }

  _storeCurrentPageToCache = async _ => {
    if (!this.currentPage) { console.error('Could not store undefined page'); return }
    const dummyBlockId = this.blocksForCurrentPage.find(block => block.isDummy)?.id
    await api.savePage(removeDummyBlock(this.currentPage, dummyBlockId), this.blocksForCurrentPage)
  }
  _updateBlockInCache = async block => {
    // need to store the current page changes as well
    const dummyBlockId = this.blocksForCurrentPage.find(block => block.isDummy)?.id
    await api.saveBlock(removeDummyBlock(this.currentPage, dummyBlockId), block )
  }
  _deleteBlockFromCache = async blockId => {
    // need to store the current page changes as well
    const dummyBlockId = this.blocksForCurrentPage.find(block => block.isDummy)?.id
    await api.deleteBlock(removeDummyBlock(this.currentPage, dummyBlockId), blockId)
  }
  fetchPageAndDependencies_old = (pageId, createIfNotFound) => {
    this.currentPage = undefined
    this.blocksForCurrentPage = []
    
    
    // gets the page from the localStorage cache
    const pageDefinition = cacheManager.fetchPage(pageId)

    if (!pageDefinition) {
      // page not found in the localStorage, add a new one if allowed and store its definition
      // into local cache
      if (!createIfNotFound) console.log('Could not fetch page ' + pageId + ' from cache');
      else {
        this._addNewPage(pageId)
        this._storeCurrentPageToCache()
      }
    } else {
      if (pageDefinition?.blocksInError?.length > 0) {
        // we where able to get the page from the cache but not all block definitions
        // at this point we could decide to get the missing blocks from the remote server
        console.warn('Page ' + pageId + ' was fetched from cache but contains missing blocks ')
      }
      this.currentPage = pageDefinition.currentPage
      this.blocksForCurrentPage = pageDefinition.blocksForCurrentPage
    }       
   }
  setCurrentDraggedElementPayloadTo = (obj) => {
    this.currentDraggedElementPayload = { ...obj }
  }
  setCurrentDropTargetIdTo = (id) => {
    this.currentDropTargetId = id
  }
}    

const store = new rootStore()

export default store
export {createNewEmptyBlock}