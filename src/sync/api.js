import { v4 as uuidv4 } from "uuid";
import cacheManager from "../store/cacheManager";
import store from "../store/rootStore";

const _secureCallAPI = async (cb) => {
  try {
    store.isBusy = true;
    const ret = cb ? await cb() : undefined;
    store.isBusy = false;
    return ret;
  } catch (error) {
    store.isBusy = false;
    console.error("Error while calling api: " + error);
  }
};

const login = async (name, pass) => {
  return await _secureCallAPI(async () => {
    let userId = "1as";
    let user = await cacheManager.fetchUser(userId);
    if (!user) {
      // default user
      user = {
        id: userId,
        lastName: "reyes",
        fistName: "Patrick",
        email: "reyes.patrick@gmail.com",
        lastLoginDate: Date.now(),
        lastPageId: undefined,
      };
    }
    return user;
  });
};

const fetchWorkspace = async (userId) => {
  return await _secureCallAPI(
    async () => await cacheManager.fetchWorkspace(userId)
  );
};

const saveWorkspace = async (workspace, userId) => {
  return await _secureCallAPI(async () =>
    cacheManager.saveWorkspace(workspace, userId)
  );
};

const saveUser = async (user) => {
  return await _secureCallAPI(async () => cacheManager.saveUser(user));
};

const fetchPage = async (pageId) => {
  return await _secureCallAPI(async () => cacheManager.fetchPage(pageId));
};

const savePage = async (page, blocks) => {
  return await _secureCallAPI(async () => cacheManager.savePage(page, blocks));
};

const saveBlock = async (page, block) => {
  return await _secureCallAPI(async () => cacheManager.saveBlock(page, block));
};

const deletelock = async (page, block) => {
  return await _secureCallAPI(async () =>
    cacheManager.deleteBlock(page, block)
  );
};

const fetchTableData = async (id) => {
  return await _secureCallAPI(async () => cacheManager.fetchTableData(id));
};

export default {
  fetchTableData,
  login,
  saveBlock,
  deletelock,
  savePage,
  fetchWorkspace,
  saveWorkspace,
  saveUser,
  fetchPage,
};
