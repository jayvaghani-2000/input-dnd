import React, { useEffect, useState } from 'react'
import { observer } from "mobx-react"
import store, { createNewEmptyBlock } from './store/rootStore'
import { Page } from './components/page'
import './App.css'

const App = observer(_ => {
  useEffect(() => {
    (async () => {
      if(store.currentUser === undefined)
        await store.login()
    })();

    return () => { };
  }, [store.currentUser === undefined])

  return (
    <div className="App">
    <div className='content e-sidebar-context'>
      <div className="main-sidebar-content">
        <div>
          <Page/>
        </div>
      </div>
    </div>
  </div>
  );
})

export default App