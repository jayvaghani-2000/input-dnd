const fetchFromCache = (key) => {
  let obj = undefined;

  try {
    obj = JSON.parse(window.localStorage.getItem(key));
  } catch (error) {
    console.warn("Could not get or parse object from local cache " + key);
    obj = undefined;
  }
  return obj;
};

// manages cache operations
const cacheManager = {
  fetchTableData: (id) => fetchFromCache("data_" + id),
  saveUser: (user) => {
    window.localStorage.setItem("user_" + user.id, JSON.stringify(user));
  },
  saveWorkspace: (workspace, userId) => {
    window.localStorage.setItem(
      "workspace_" + userId,
      JSON.stringify(workspace)
    );
  },
  saveBlock: (page, block) => {
    const { id: pageId } = page;
    //page.blocks.forEach(block => console.log(block))
    window.localStorage.setItem("currentPage_" + pageId, JSON.stringify(page));
    window.localStorage.setItem(
      `blocksForCurrentPage_${pageId}_${block.id}`,
      JSON.stringify(block)
    );
  },
  deleteBlock: (page, blockId) => {
    const { id: pageId } = page;
    window.localStorage.setItem("currentPage_" + pageId, JSON.stringify(page));
    window.localStorage.removeItem(`blocksForCurrentPage_${pageId}_${blockId}`);
  },
  savePage: (page, blocksMap = []) => {
    window.localStorage.setItem("currentPage_" + page.id, JSON.stringify(page));
    const blocksToSave = blocksMap.filter((block) =>
      page.blocks.includes(block.id)
    );
    blocksToSave.forEach((block) =>
      window.localStorage.setItem(
        `blocksForCurrentPage_${page.id}_${block.id}`,
        JSON.stringify(block)
      )
    );
  },
  fetchWorkspace: (id) => fetchFromCache("workspace_" + id),
  fetchUser: (id) => fetchFromCache("user_" + id),
  fetchPage: (pageId) => {
    // fetches the page from the localstorage
    let page = fetchFromCache("currentPage_" + pageId);
    if (!page || !page.blocks || !page.id) {
      console.warn(
        "page " + pageId + " is missing or could not be deserialised"
      );
      return;
    }

    const pageBlocks = [];
    let blocksInError = [];

    // for each block in the page, fetches the block definition from the localstorage
    page.blocks?.forEach((blockId) => {
      const blockstring = window.localStorage.getItem(
        `blocksForCurrentPage_${pageId}_${blockId}`
      );
      if (!blockstring) {
        blocksInError.push(blockId);
        console.warn(
          "block " + blockId + " is missing in cache for page " + pageId
        );
      } else {
        try {
          pageBlocks.push(JSON.parse(blockstring));
        } catch (e) {
          console.warn(
            `Could not deserialise block ${pageId}_${blockId} from cache`
          );
          blocksInError.push(blockId);
        }
      }
    });

    return {
      currentPage: {
        ...page,
        blocks: page.blocks.filter(
          (blockId) => !blocksInError.includes(blockId)
        ),
      },
      blocksForCurrentPage: pageBlocks,
      blocksInError,
    };
  },
};

export default cacheManager;
