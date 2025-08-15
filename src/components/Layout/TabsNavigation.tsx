import React, { useEffect } from 'react';
import { Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';



const TabsNavigation: React.FC = () => {
  const navigate = useNavigate();
  const { tabs, activeTabKey, setActiveTab, removeTab, addTab } = useAppStore();

  // 监听添加新页签事件
  useEffect(() => {
    const handleAddTab = (event: CustomEvent) => {
      const newTab = event.detail;
      
      // 添加新页签（store会自动检查是否已存在）
      addTab(newTab);
      
      // 更新路由，传递state参数
      navigate(newTab.path, { state: newTab.state });
    };
    
    window.addEventListener('addTab', handleAddTab as EventListener);
    
    return () => {
      window.removeEventListener('addTab', handleAddTab as EventListener);
    };
  }, [navigate, addTab]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const tab = tabs.find(t => t.key === key);
    if (tab) {
      navigate(tab.path, { state: tab.state });
    }
  };

  const handleTabEdit = (targetKey: string | React.MouseEvent | React.KeyboardEvent, action: 'add' | 'remove') => {
    if (action === 'remove') {
      const tab = tabs.find(t => t.key === targetKey);
      if (tab && tab.closable) {
        removeTab(targetKey as string);
        
        // 如果删除的是当前激活的页签，需要导航到新的激活页签
        if (targetKey === activeTabKey) {
          const remainingTabs = tabs.filter(t => t.key !== targetKey);
          if (remainingTabs.length > 0) {
            const newActiveTab = remainingTabs[remainingTabs.length - 1];
            navigate(newActiveTab.path, { state: newActiveTab.state });
          }
        }
      }
    }
  };

  const items = tabs.map(tab => ({
    key: tab.key,
    label: tab.label,
    closable: tab.closable !== false // 默认允许关闭
  }));

  return (
    <>
      {/* 页签背景区 */}
      <div className="bg-gradient-to-b from-white to-gray-100 h-[50px]" />
      
      {/* 页签导航区 */}
      <div className="relative -mt-[35px] px-5 z-10">
        <Tabs
          type="editable-card"
          activeKey={activeTabKey}
          onChange={handleTabChange}
          onEdit={handleTabEdit}
          items={items}
          className="custom-tabs"
          size="small"
          hideAdd
          style={{
            '--tab-height': '35px',
            '--tab-border-radius': '8px 8px 0 0'
          } as React.CSSProperties}
        />
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-tabs .ant-tabs-nav {
            margin: 0;
          }
          .custom-tabs .ant-tabs-tab {
            height: 35px !important;
            line-height: 33px !important;
            border-radius: 8px 8px 0 0 !important;
            margin-right: 15px !important;
            background-color: #f0f2f5 !important;
            color: #223355 !important;
            border: 1px solid #E9ECF2 !important;
            border-bottom: none !important;
          }
          .custom-tabs .ant-tabs-tab-active {
            background-color: #ffffff !important;
            color: #3388FF !important;
            font-weight: bold !important;
          }
          .custom-tabs .ant-tabs-content-holder {
            display: none;
          }
          .custom-tabs .ant-tabs-nav-wrap {
            border-bottom: 1px solid #E9ECF2;
          }
          .custom-tabs .ant-tabs-tab-remove {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 16px !important;
            height: 16px !important;
            margin-left: 8px !important;
            color: #999 !important;
            font-size: 12px !important;
            opacity: 1 !important;
          }
          .custom-tabs .ant-tabs-tab-remove:hover {
            color: #ff4d4f !important;
            background-color: rgba(255, 77, 79, 0.1) !important;
            border-radius: 50% !important;
          }
        `
      }} />
    </>
  );
};

export default TabsNavigation;