import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import ReportTemplateManagement from '@/pages/IntelligentReport/ReportTemplateManagement';
import AnalysisRepository from '@/pages/IntelligentReport/AnalysisRepository';

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
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
                  {/* 默认重定向到维度管理 */}
                  <Route path="/" element={<Navigate to="/intelligent-report/dimension-management" replace />} />
                  
                  {/* 智能报告管理模块 */}
                  <Route path="/intelligent-report/report-management" element={<ReportManagement />} />
                  <Route path="/intelligent-report/report-template-management" element={<ReportTemplateManagement />} />
                  <Route path="/intelligent-report/dimension-management" element={<DimensionManagement />} />
                  <Route path="/intelligent-report/dimension-detail/:id?" element={<DimensionDetail />} />
                  <Route path="/intelligent-report/analysis-repository" element={<AnalysisRepository />} />
                  
                  {/* 404 页面 */}
                  <Route path="*" element={<Navigate to="/intelligent-report/dimension-management" replace />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;