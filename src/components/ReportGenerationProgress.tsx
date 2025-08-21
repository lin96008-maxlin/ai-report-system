import React, { useEffect, useState } from 'react';
import { Progress, Tag, Tooltip } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';

interface ReportGenerationProgressProps {
  reportId: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  progress?: number;
}

const ReportGenerationProgress: React.FC<ReportGenerationProgressProps> = ({
  reportId,
  status,
  progress = 0
}) => {
  const { getReportTask } = useAppStore();
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [currentStatus, setCurrentStatus] = useState(status);

  useEffect(() => {
    // 从store中获取最新的任务状态
    const task = getReportTask(reportId);
    if (task) {
      setCurrentProgress(task.progress);
      setCurrentStatus(task.status);
    }
  }, [reportId, getReportTask]);

  // 定期更新进度
  useEffect(() => {
    if (currentStatus === 'generating') {
      const interval = setInterval(() => {
        const task = getReportTask(reportId);
        if (task) {
          setCurrentProgress(task.progress);
          setCurrentStatus(task.status);
          
          // 如果任务完成或失败，停止轮询
          if (task.status === 'completed' || task.status === 'failed') {
            clearInterval(interval);
          }
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [currentStatus, reportId, getReportTask]);

  const renderStatusTag = () => {
    switch (currentStatus) {
      case 'draft':
        return <Tag color="default">草稿</Tag>;
      case 'generating':
        return (
          <Tag color="processing" icon={<LoadingOutlined />}>
            生成中
          </Tag>
        );
      case 'completed':
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            已完成
          </Tag>
        );
      case 'failed':
        return (
          <Tag color="error" icon={<ExclamationCircleOutlined />}>
            生成失败
          </Tag>
        );
      default:
        return <Tag color="default">未知状态</Tag>;
    }
  };

  const renderProgress = () => {
    if (currentStatus === 'generating') {
      return (
        <Tooltip title={`生成进度: ${currentProgress}%`}>
          <Progress 
            percent={currentProgress} 
            size="small" 
            status="active"
            showInfo={false}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </Tooltip>
      );
    }
    
    if (currentStatus === 'completed') {
      return (
        <Progress 
          percent={100} 
          size="small" 
          status="success"
          showInfo={false}
        />
      );
    }
    
    if (currentStatus === 'failed') {
      return (
        <Progress 
          percent={currentProgress} 
          size="small" 
          status="exception"
          showInfo={false}
        />
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {renderStatusTag()}
        {currentStatus === 'generating' && (
          <span className="text-xs text-gray-500">
            {currentProgress}%
          </span>
        )}
      </div>
      {renderProgress()}
    </div>
  );
};

export default ReportGenerationProgress;