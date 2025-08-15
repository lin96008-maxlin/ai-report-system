import React from 'react';
import { Layout, Menu, Button } from 'antd';
import {
  FileTextOutlined,
  FileOutlined,
  PartitionOutlined,
  DatabaseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, setCollapsed, setSelectedMenuKey, addTab } = useAppStore();

  // 二级导航菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'report-management',
      label: '报告管理',
      icon: <FileTextOutlined />
    },
    {
      key: 'report-template-management',
      label: '报告模板管理',
      icon: <FileOutlined />
    },
    {
      key: 'dimension-management',
      label: '维度管理',
      icon: <PartitionOutlined />
    },
    {
      key: 'analysis-repository',
      label: '研判归因库',
      icon: <DatabaseOutlined />
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedMenuKey(key);
    
    // 根据菜单项导航到对应页面
    const routeMap: Record<string, { path: string; label: string }> = {
      'report-management': {
        path: '/intelligent-report/report-management',
        label: '报告管理'
      },
      'report-template-management': {
        path: '/intelligent-report/report-template-management',
        label: '模板管理'
      },
      'dimension-management': {
        path: '/intelligent-report/dimension-management',
        label: '维度管理'
      },
      'analysis-repository': {
        path: '/intelligent-report/analysis-repository',
        label: '研判归因库'
      }
    };

    const route = routeMap[key];
    if (route) {
      navigate(route.path);
      addTab({
        key,
        label: route.label,
        closable: true,
        path: route.path
      });
    }
  };

  // 获取当前选中的菜单项
  const getCurrentMenuKey = () => {
    // 优先使用location.state中的activeMenuKey
    if (location.state?.activeMenuKey) {
      return location.state.activeMenuKey;
    }
    
    const pathMap: Record<string, string> = {
      '/intelligent-report/report-management': 'report-management',
      '/intelligent-report/report-template-management': 'report-template-management',
      '/intelligent-report/dimension-management': 'dimension-management',
      '/intelligent-report/analysis-repository': 'analysis-repository'
    };
    
    // 检查路径是否匹配模板编辑页面
    if (location.pathname.includes('/intelligent-report/report-template-edit')) {
      return 'report-template-management';
    }
    
    // 检查路径是否匹配维度详情页面
    if (location.pathname.includes('/intelligent-report/dimension-detail')) {
      return 'dimension-management';
    }
    
    return pathMap[location.pathname] || '';
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={200}
      collapsedWidth={60}
      className="bg-white relative"
    >
      {/* 菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[getCurrentMenuKey()]}
        items={menuItems}
        onClick={handleMenuClick}
        className="border-none h-full pt-2"
        style={{
          backgroundColor: 'transparent'
        }}
      />
      
      {/* 折叠按钮 */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-4 left-2 w-8 h-8 flex items-center justify-center text-gray-600 hover:opacity-80"
        onMouseEnter={(e) => e.currentTarget.style.color = '#3388FF'}
        onMouseLeave={(e) => e.currentTarget.style.color = ''}
      />
    </Sider>
  );
};

export default Sidebar;