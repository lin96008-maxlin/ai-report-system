import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './App.css';
import 'antd/dist/reset.css';
import Header from '@/components/Layout/Header';
import Sidebar from '@/components/Layout/Sidebar';
import TabsNavigation from '@/components/Layout/TabsNavigation';
import DimensionManagement from '@/pages/IntelligentReport/DimensionManagement';
import DimensionDetail from '@/pages/IntelligentReport/DimensionDetail';
import ReportManagement from '@/pages/IntelligentReport/ReportManagement';
import ReportGenerate from '@/pages/IntelligentReport/ReportGenerate';
import ReportEdit from '@/pages/IntelligentReport/ReportEdit';
import ReportView from '@/pages/IntelligentReport/ReportView';
import ReportTemplateManagement from '@/pages/IntelligentReport/ReportTemplateManagement';
import ReportTemplateEdit from '@/pages/IntelligentReport/ReportTemplateEdit';
import AnalysisRepository from '@/pages/IntelligentReport/AnalysisRepository';
import JudgmentCauseLibrary from '@/pages/IntelligentReport/JudgmentCauseLibrary';
import { useAppStore } from '@/store';

const { Content } = Layout;

// 内部组件处理路由初始化
const AppContent: React.FC = () => {
  const location = useLocation();
  const { setSelectedMenuKey, addTab, tabs } = useAppStore();

  useEffect(() => {
    // 根据当前路径设置导航状态
    const pathMap: Record<string, { key: string; label: string }> = {
      '/intelligent-report/report-management': { key: 'report-management', label: '报告管理' },
      '/intelligent-report/report-template-management': { key: 'report-template-management', label: '报告模板管理' },
      '/intelligent-report/dimension-management': { key: 'dimension-management', label: '维度管理' },
      '/intelligent-report/analysis-repository': { key: 'analysis-repository', label: '研判归因库' }
    };

    let currentRoute = pathMap[location.pathname];
    
    // 处理编辑页面的特殊路径
    if (location.pathname.includes('/intelligent-report/report-template-edit')) {
      currentRoute = { key: 'report-template-management', label: '报告模板管理' };
    } else if (location.pathname.includes('/intelligent-report/dimension-detail')) {
      currentRoute = { key: 'dimension-management', label: '维度管理' };
    } else if (location.pathname.includes('/intelligent-report/report/')) {
      currentRoute = { key: 'report-management', label: '报告管理' };
    }

    if (currentRoute) {
      // 设置选中的菜单项
      setSelectedMenuKey(currentRoute.key);
      
      // 如果页签不存在，则添加页签
      const tabExists = tabs.some(tab => tab.key === currentRoute.key);
      if (!tabExists) {
        addTab({
          key: currentRoute.key,
          label: currentRoute.label,
          closable: true,
          path: location.pathname
        });
      }
    }
  }, [location.pathname, setSelectedMenuKey, addTab, tabs]);

  return (
    <Layout className="h-screen">
      {/* 顶部标题栏 */}
      <Header />
      
      {/* 主体布局 */}
      <Layout className="flex-1">
        {/* 左侧边栏 */}
        <Sidebar />
        
        {/* 主内容区 */}
        <Layout className="flex-1 flex flex-col">
          {/* 页签导航 */}
          <TabsNavigation />
          
          {/* 页面内容 */}
          <Content className="flex-1 bg-[#f0f2f5] p-0 overflow-hidden" style={{ height: 'calc(100vh - 120px)', paddingBottom: '20px' }}>
            <Routes>
              
              {/* 智能报告管理模块 */}
              <Route path="/intelligent-report/report-management" element={<ReportManagement />} />
              <Route path="/intelligent-report/report/generate" element={<ReportGenerate />} />
              <Route path="/intelligent-report/report/edit/:id?" element={<ReportEdit />} />
              <Route path="/intelligent-report/report/view/:id" element={<ReportView />} />
              <Route path="/intelligent-report/report-template-management" element={<ReportTemplateManagement />} />
              <Route path="/intelligent-report/report-template-edit/:id?" element={<ReportTemplateEdit />} />
              <Route path="/intelligent-report/report-template-edit-simple/:id?" element={<ReportTemplateEdit />} />
              <Route path="/intelligent-report/report-generate" element={<ReportGenerate />} />
              <Route path="/intelligent-report/report/edit/:id" element={<ReportEdit />} />
              <Route path="/intelligent-report/report/view/:id" element={<ReportView />} />
              <Route path="/intelligent-report/dimension-management" element={<DimensionManagement />} />
              <Route path="/intelligent-report/dimension-detail/:id?" element={<DimensionDetail />} />
              <Route path="/intelligent-report/analysis-repository" element={<AnalysisRepository />} />
              <Route path="/intelligent-report/judgment-cause-library" element={<JudgmentCauseLibrary />} />
              
              {/* 默认重定向和404页面 */}
               <Route path="/" element={<Navigate to="/intelligent-report/report-management" replace />} />
               <Route path="*" element={<Navigate to="/intelligent-report/report-management" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <AppContent />
      </Router>
    </ConfigProvider>
  );
};

export default App;