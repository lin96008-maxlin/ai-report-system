import { create } from 'zustand';
import { TabItem } from '@/types';

// 报告模板接口
interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  content_structure: {
    rich_text_content: string;
    embedded_dimensions?: any[];
    template_content?: any[];
  };
  is_published?: boolean;
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
}

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
  
  // 报告模板管理
  reportTemplates: ReportTemplate[];
  reportDimensions: any[];
  addReportTemplate: (template: ReportTemplate) => void;
  updateReportTemplate: (template: ReportTemplate) => void;
  deleteReportTemplate: (id: string) => void;
  setReportDimensions: (dimensions: any[]) => void;
  
  // 报告生成状态管理
  reportGenerationTasks: Map<string, {
    reportId: string;
    progress: number;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    errorMessage?: string;
  }>;
  startReportGeneration: (reportId: string) => void;
  updateReportProgress: (reportId: string, progress: number) => void;
  completeReportGeneration: (reportId: string) => void;
  failReportGeneration: (reportId: string, errorMessage: string) => void;
  removeReportTask: (reportId: string) => void;
  getReportTask: (reportId: string) => any;
}

// 从localStorage加载报告模板
const loadReportTemplates = (): ReportTemplate[] => {
  try {
    const saved = localStorage.getItem('reportTemplates');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('加载报告模板失败:', error);
    return [];
  }
};

// 保存报告模板到localStorage
const saveReportTemplates = (templates: ReportTemplate[]) => {
  try {
    localStorage.setItem('reportTemplates', JSON.stringify(templates));
  } catch (error) {
    console.error('保存报告模板失败:', error);
  }
};

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
  setCurrentUser: (user) => set({ currentUser: user }),
  
  // 报告模板状态
  reportTemplates: loadReportTemplates(),
  reportDimensions: [],
  
  addReportTemplate: (template) => {
    const { reportTemplates } = get();
    const newTemplates = [...reportTemplates, template];
    saveReportTemplates(newTemplates);
    set({ reportTemplates: newTemplates });
  },
  
  updateReportTemplate: (template) => {
    const { reportTemplates } = get();
    const newTemplates = reportTemplates.map(t => t.id === template.id ? template : t);
    saveReportTemplates(newTemplates);
    set({ reportTemplates: newTemplates });
  },
  
  deleteReportTemplate: (id) => {
    const { reportTemplates } = get();
    const newTemplates = reportTemplates.filter(t => t.id !== id);
    saveReportTemplates(newTemplates);
    set({ reportTemplates: newTemplates });
  },
  
  setReportDimensions: (dimensions) => set({ reportDimensions: dimensions || [] }),
  
  // 报告生成状态管理
  reportGenerationTasks: new Map(),
  
  startReportGeneration: (reportId) => {
    const { reportGenerationTasks } = get();
    const newTasks = new Map(reportGenerationTasks);
    newTasks.set(reportId, {
      reportId,
      progress: 0,
      status: 'generating',
      startTime: new Date()
    });
    set({ reportGenerationTasks: newTasks });
  },
  
  updateReportProgress: (reportId, progress) => {
    const { reportGenerationTasks } = get();
    const task = reportGenerationTasks.get(reportId);
    if (task) {
      const newTasks = new Map(reportGenerationTasks);
      newTasks.set(reportId, { ...task, progress });
      set({ reportGenerationTasks: newTasks });
    }
  },
  
  completeReportGeneration: (reportId) => {
    const { reportGenerationTasks } = get();
    const task = reportGenerationTasks.get(reportId);
    if (task) {
      const newTasks = new Map(reportGenerationTasks);
      newTasks.set(reportId, {
        ...task,
        progress: 100,
        status: 'completed',
        endTime: new Date()
      });
      set({ reportGenerationTasks: newTasks });
    }
  },
  
  failReportGeneration: (reportId, errorMessage) => {
    const { reportGenerationTasks } = get();
    const task = reportGenerationTasks.get(reportId);
    if (task) {
      const newTasks = new Map(reportGenerationTasks);
      newTasks.set(reportId, {
        ...task,
        status: 'failed',
        endTime: new Date(),
        errorMessage
      });
      set({ reportGenerationTasks: newTasks });
    }
  },
  
  removeReportTask: (reportId) => {
    const { reportGenerationTasks } = get();
    const newTasks = new Map(reportGenerationTasks);
    newTasks.delete(reportId);
    set({ reportGenerationTasks: newTasks });
  },
  
  getReportTask: (reportId) => {
    const { reportGenerationTasks } = get();
    return reportGenerationTasks.get(reportId);
  }
}));