import React from 'react';
import { Button, Empty } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const ReportManagement: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="h-full bg-white rounded flex mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
      <div className="flex-1 flex flex-col">
        {/* 页面标题栏 */}
        <div className="p-5 border-b border-[#E9ECF2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowLeftOutlined 
                className="text-[#223355] cursor-pointer hover:text-[#3388FF] transition-colors" 
                style={{fontSize: '16px'}}
                onClick={() => navigate('/')}
              />
              <h2 className="text-xl font-medium text-[#223355] m-0">报告管理</h2>
            </div>
            <Button type="primary" icon={<PlusOutlined />}>
              新建报告
            </Button>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="p-5 flex-1 flex items-center justify-center overflow-auto" style={{ height: 'calc(100vh - 130px - 20px - 60px - 1px)' }}>
          <Empty 
            description="报告管理功能开发中..."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportManagement;