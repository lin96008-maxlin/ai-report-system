import React from 'react';
import { Button, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const ReportTemplateManagement: React.FC = () => {
  return (
    <div className="h-full bg-white rounded flex mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
      <div className="flex-1 flex flex-col">
        {/* 页面标题栏 */}
        <div className="p-5 border-b border-[#E9ECF2]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-[#223355] m-0">报告模板管理</h2>
            <Button type="primary" icon={<PlusOutlined />}>
              新建模板
            </Button>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="p-5 flex-1 flex items-center justify-center overflow-auto" style={{ height: 'calc(100vh - 130px - 20px - 60px - 1px)' }}>
          <Empty 
            description="报告模板管理功能开发中..."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportTemplateManagement;