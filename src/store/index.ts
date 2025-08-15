import { create } from 'zustand';
import { TabItem } from '@/types';

interface AppState {
  // 侧边栏折叠状态
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  
  // 当前选中的菜单项
  selectedMenuKey: string;
  setSelectedMenuKey: (key: string) => void;
  
  // 页签管理
  tabs: TabItem[];
  activeTabKey: string;
  addTab: (tab: TabItem) => void;
  removeTab: (key: string) => void;
  updateTab: (key: string, updates: Partial<TabItem>) => void;
  setActiveTab: (key: string) => void;
  
  // 当前用户
  currentUser: {
    name: string;
    avatar?: string;
  };
  setCurrentUser: (user: { name: string; avatar?: string }) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 侧边栏状态
  collapsed: false,
  setCollapsed: (collapsed) => set({ collapsed }),
  
  // 菜单状态
  selectedMenuKey: '',
  setSelectedMenuKey: (key) => set({ selectedMenuKey: key }),
  
  // 页签状态
  tabs: [],
  activeTabKey: '',
  
  addTab: (tab) => {
    const { tabs } = get();
    const existingTab = tabs.find(t => t.key === tab.key);
    if (!existingTab) {
      set({ tabs: [...tabs, tab], activeTabKey: tab.key });
    } else {
      set({ activeTabKey: tab.key });
    }
  },
  
  removeTab: (key) => {
    const { tabs, activeTabKey } = get();
    const newTabs = tabs.filter(tab => tab.key !== key);
    let newActiveKey = activeTabKey;
    
    if (activeTabKey === key && newTabs.length > 0) {
      newActiveKey = newTabs[newTabs.length - 1].key;
    }
    
    set({ tabs: newTabs, activeTabKey: newActiveKey });
  },
  
  updateTab: (key, updates) => {
    const { tabs } = get();
    const updatedTabs = tabs.map(tab => 
      tab.key === key ? { ...tab, ...updates } : tab
    );
    set({ tabs: updatedTabs });
  },
  
  setActiveTab: (key) => set({ activeTabKey: key }),
  
  // 用户状态
  currentUser: {
    name: '管理员'
  },
  setCurrentUser: (user) => set({ currentUser: user })
}));