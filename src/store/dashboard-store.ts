// Svelte
import { writable } from "svelte/store";

// utils
import Logger from "../utils/log/log";

// Vendors
import Storage from "../modules/storage/storage";

import config from "../../config/global";
import Location from "../modules/locate/Location";
import distance from "../modules/locate/distance";
// import { IDashboardDate, DashboardDate } from "../containers/dashboard/block";
import { Dashboard } from "../modules/dashboard/dashboard";
import { Block } from "../modules/dashboard/block";

// Stores

const console = new Logger("📊 $DashboardStore");

interface IDashboardStore {
  dashboards: Array<any>;
  activeIndex: number;
}

const DashboardStoreInit = (): any => {
  const state: IDashboardStore = {
    dashboards: [],
    activeIndex: Storage.local.get("dashboard/lastIndex") || 0,
  };

  const { update, subscribe, set } = writable(state);

  const methods = {
    get(): IDashboardStore {
      let _state;
      update((state: any) => {
        _state = state;
        return state;
      });
      return _state;
    },
    saveIndex(index) {
      Storage.local.put("dashboard/lastIndex", index);
    },
    getIndex() {
      return Storage.local.get("dashboard/lastIndex") || 0;
    },
    next() {
      update((state: IDashboardStore) => {
        if (state.activeIndex == state.dashboards.length - 1) {
          state.activeIndex = 0;
        } else {
          state.activeIndex++;
        }
        methods.saveIndex(state.activeIndex);
        return state;
      });
    },
    previous() {
      update((state: IDashboardStore) => {
        if (state.activeIndex == 0) {
          state.activeIndex = state.dashboards.length - 1;
        } else {
          state.activeIndex--;
        }
        methods.saveIndex(state.activeIndex);
        return state;
      });
    },
    async save(): Promise<any> {
      let dashboards;
      update((state: any) => {
        dashboards = JSON.parse(JSON.stringify(state.dashboards));
        return state;
      });
      dashboards = dashboards.map((dashboard) => {
        dashboard.blocks = dashboard.blocks.map((block: any) => {
          delete block.stats;
          delete block.logs;
          if (block.element && block.element.obj) {
            delete block.element.obj;
          }
          return block;
        });
        return dashboard;
      });
      if (dashboards) {
        return Storage.put(`${config.data_root}/dashboards.json`, dashboards);
      } else {
        return false;
      }
    },
    async saveBlock(block: Block) {
      if (block) {
        let _state: IDashboardStore = methods.get();
        console.log("Saving block", block);
        let found = false;
        delete block._editing;
        _state.dashboards = _state.dashboards.map((dashboard: Dashboard) => {
          dashboard.blocks = dashboard.blocks.map((blk: Block) => {
            if (blk.id == block.id) {
              found = true;
              return block;
            } else {
              return blk;
            }
          });
          return dashboard;
        });
        if (!found) {
          console.log("BLock wasn't found, adding to active dashboard");
          _state.dashboards[_state.activeIndex].blocks.push(block);
        }
        // console.log("Hello?", _state);
        update((state: any) => {
          state.dashboards = _state.dashboards;
          console.log("State", state);
          return state;
        });
        return methods.save();
      }
    },
    newDashboard() {
      update((state: IDashboardStore) => {
        state.dashboards.push(new Dashboard());
        state.activeIndex = state.dashboards.length - 1;
        return state;
      });
    },
    async deleteBlock(block: Block) {
      block = block instanceof Block ? block : new Block(block);
      let _state: IDashboardStore = methods.get();
      _state.dashboards = _state.dashboards.map((dashboard: Dashboard) => {
        dashboard.blocks = dashboard.blocks.filter((blk: Block) => {
          return blk.id == block.id ? false : true;
        });
        return dashboard;
      });
      update((state: any) => {
        state.dashboards = _state.dashboards;
        return state;
      });
      return methods.save();
    },
    async init(): Promise<void> {
      let dashboards = await Storage.get(`${config.data_root}/dashboards.json`);
      update((state: any) => {
        state.dashboards = (dashboards || [[{ blocks: [] }]]).map((dashboard) => {
          return new Dashboard(dashboard);
        });
        dashboards = state.dashboards;
        return state;
      });
    },
  };

  return {
    update,
    subscribe,
    set,

    ...methods,
  };
};

export const DashboardStore = DashboardStoreInit();
