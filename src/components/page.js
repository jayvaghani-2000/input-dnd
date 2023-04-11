import React from 'react'
import store from '../store/rootStore'
import rowColArray from './rowColArrayUtils'
import { observer } from "mobx-react"
import { Block } from './block'
import './page.css'

const Page = observer(props => {
    const getSortedBlockArray = _ => rowColArray.getRowOrderedColOrderedArray(store.blocksForCurrentPage)
    const onReturnKeyPressed = async block => {
        if (block) {
            // it's coming from a non dummy block we need to give the focus to the next block
            const nextBlock = rowColArray.getNextRowBlock(store.blocksForCurrentPage, block.row)
            if (nextBlock) store.setFocusedBlockId(nextBlock.id)
            else {
                // it was the last block, need to update it and add a new dummy one
                await store.updateBlock(block.id, block.content, 'none')
            }
        }
    }

    const onHandleMenuAction =  async ({ id, action, data }) => {
        let blockIdToFocus = id
        let block = store.findBlockInCurrentPage(id)

        if (block === undefined) {
            console.warn('tried to handle unknown block ' + id)
            return
        }

        switch (action) {
            case 'deleteBlock':
                store.blocksForCurrentPage = store.blocksForCurrentPage.filter(b => b.id !== id)
                
                let blockToFocus = store.blocksForCurrentPage.filter(b => b.row === block.row).sort((a, b) => a.col - b.col)
                if (blockToFocus.length === 0)
                    blockToFocus = store.blocksForCurrentPage.filter(b => b.row === block.row).sort((a, b) => a.col - b.col)
                
                if (blockToFocus.length >= 0)
                    store.focusedBlockId = blockToFocus[0].id
                break
            case 'moveBlockUp':
                await store.moveBlockUp(id)
                break
            case 'moveBlockDown':
                await store.moveBlockDown(id)
                break
            case 'insertBlockAbove':
                await store.insertBlockAbove(id)
                break
            case 'insertBlockBelow':
                await store.insertBlockBelow(id)
                break
            case 'insertBlockRight':
                await store.insertBlockRight(id)
                break
            case 'insertBlockLeft':
                await store.insertBlockLeft(id)
                break
            case 'moveBlockRight':
                await store.moveBlockRight(id)
                break
            case 'moveBlockLeft':
                await store.moveBlockLeft(id)
                break
            case 'copyBlock':
               /* const block = store.findBlockInCurrentPage(id)
                if (block) {
                    const newBlock = createNewEmptyBlock()
                    newBlock.type = block.type
                    newBlock.content = block.content
                    store.insertBelow(id, newBlock)
                    blockIdToFocus = newBlock.id
                }*/
                break
            default:
                console.error('Got unknown action from block menu ' + action)
        }
        if (blockIdToFocus !== id) {
            store.setFocusedBlockId(blockIdToFocus)
        }
    }

    const onChange = async title => {
        // TODO need to handle multiple trottle
        await store.updatePage({ title })
    }

    return <div className='page'>
        {getSortedBlockArray().map((cols, rowIndex) =>
        <div className='pagerow' key={'row_' + rowIndex} id={'row_' + rowIndex}>
            {cols?.map(block =>
                <Block key={block.id}
                    onHandleMenuAction={onHandleMenuAction}
                    blockId={block.id}
                    store={store}
                    onReturnKeyPressed={async _ => await onReturnKeyPressed(block)} />)}
        </div>)}
    </div>
})

export {Page}