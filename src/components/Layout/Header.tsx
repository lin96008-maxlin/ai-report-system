import React from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, addTab } = useAppStore();

  // 一级导航菜单项
  const primaryMenuItems = [
    {
      key: 'intelligent-report',
      label: '智能报告管理',
      icon: <UserOutlined />
    }
  ];

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <UserOutlined />
    },
    {
      key: 'settings',
      label: '系统设置',
      icon: <SettingOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />
    }
  ];

  const handlePrimaryMenuClick = ({ key }: { key: string }) => {
    if (key === 'intelligent-report') {
      navigate('/intelligent-report/dimension-management');
      addTab({
        key: 'dimension-management',
        label: '维度管理',
        closable: false,
        path: '/intelligent-report/dimension-management'
      });
    }
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'logout':
        // 处理退出登录
        console.log('退出登录');
        break;
      default:
        break;
    }
  };

  // 获取当前选中的一级菜单
  const getCurrentPrimaryMenu = () => {
    if (location.pathname.startsWith('/intelligent-report')) {
      return ['intelligent-report'];
    }
    return [];
  };

  return (
    <AntHeader className="flex items-center justify-between px-0 h-[60px]">
      {/* 左侧：系统标题和一级导航 */}
      <div className="flex items-center h-full">
        {/* 系统标题 */}
        <div className="text-white text-lg font-medium px-5">
          大数据运营分析平台
        </div>
        
        {/* 一级导航 */}
        <div className="flex items-center ml-5">
          <div 
            className="flex items-center space-x-2 px-4 h-[60px] text-white font-bold"
            style={{
              background: 'linear-gradient(to right, #2167D9, #3388FF)'
            }}
          >
            <UserOutlined className="text-lg text-white" />
            <span>智能报告管理</span>
          </div>
        </div>
      </div>

      {/* 右侧：用户信息 */}
      <div className="px-5">
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: handleUserMenuClick
          }}
          placement="bottomRight"
        >
          <div className="flex items-center cursor-pointer text-white hover:text-blue-100">
            <Avatar 
              size="small" 
              icon={<UserOutlined />} 
              src={currentUser.avatar}
              className="mr-2"
            />
            <span>{currentUser.name}</span>
          </div>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;