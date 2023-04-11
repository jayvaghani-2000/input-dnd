import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import store, { createNewEmptyBlock } from "./store/rootStore";
import { Page } from "./components/page";
import "./App.css";

const App = observer((_) => {
  useEffect(() => {
    (async () => {
      if (store.currentUser === undefined) await store.login();
    })();

    return () => {};
  }, [store.currentUser === undefined]);

  const clientXRef = useRef();

  const handleGetDragOver = (e) => {
    clientXRef.current = e.clientX;
  };

  return (
    <div className="App" onDragOver={handleGetDragOver}>
      <div className="content e-sidebar-context">
        <div className="main-sidebar-content">
          <div>
            <Page clientXRef={clientXRef} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default App;
