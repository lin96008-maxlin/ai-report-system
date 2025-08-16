import React, { useState } from 'react';
import { Modal, Card, Form, Select, DatePicker, Input, Button, Space, Row, Col, Spin, Tag } from 'antd';
import { EyeOutlined, DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import type { ReportTemplate, PreviewFilters } from '../../types';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ReportTemplatePreviewProps {
  template: ReportTemplate;
  visible: boolean;
  onClose: () => void;
}

interface PreviewData {
  title: string;
  content: string;
  generatedAt: string;
  filters: PreviewFilters;
  data: Record<string, any>;
}

const ReportTemplatePreview: React.FC<ReportTemplatePreviewProps> = ({
  template,
  visible,
  onClose
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 模拟数据指标值
  const mockIndicatorValues: Record<string, string> = {
    '今日工单总量': '1,234',
    '平均满意度': '92.5',
    '处理及时率': '87.3',
    '环境卫生工单数': '456',
    '交通工单总量': '789',
    '投诉工单数': '234',
    '表扬工单数': '567',
    '重复投诉率': '12.4',
    '平均处理时长': '2.5小时',
    '紧急工单数': '89'
  };

  // 模拟维度数据
  const mockDimensionData: Record<string, Record<string, any>> = {
    '城市运行综合维度': {
      '工单总量': '1,234',
      '满意度': '92.5%',
      '处理率': '87.3%',
      '热点区域': ['朝阳区', '海淀区', '西城区'],
      '主要问题': ['环境卫生', '交通管理', '市政设施']
    },
    '环境卫生分析维度': {
      '工单数量': '456',
      '占比': '36.9%',
      '满意度': '89.2%',
      '主要类别': ['垃圾清运', '公厕管理', '道路清扫'],
      '处理效率': '平均1.8小时'
    },
    '交通治理分析维度': {
      '工单数量': '789',
      '占比': '63.1%',
      '满意度': '94.1%',
      '主要类别': ['交通拥堵', '违章停车', '信号灯故障'],
      '处理效率': '平均3.2小时'
    }
  };

  // 模拟工单数据
  const mockWorkOrders = [
    {
      id: 'WO20240115001',
      title: '朝阳区某路段垃圾堆积',
      category: '环境卫生',
      status: '已处理',
      satisfaction: 5,
      createdAt: '2024-01-15 09:30:00',
      resolvedAt: '2024-01-15 11:15:00'
    },
    {
      id: 'WO20240115002',
      title: '海淀区交通信号灯故障',
      category: '交通管理',
      status: '处理中',
      satisfaction: 4,
      createdAt: '2024-01-15 10:15:00',
      resolvedAt: null
    },
    {
      id: 'WO20240115003',
      title: '西城区道路破损',
      category: '市政设施',
      status: '已处理',
      satisfaction: 5,
      createdAt: '2024-01-15 08:45:00',
      resolvedAt: '2024-01-15 14:20:00'
    }
  ];

  // 生成预览内容
  const generatePreviewContent = (filters: PreviewFilters): string => {
    let content = template.content_structure.rich_text_content;
    
    // 替换占位符
    Object.keys(mockIndicatorValues).forEach(key => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), mockIndicatorValues[key]);
    });

    // 替换维度数据
    Object.keys(mockDimensionData).forEach(dimension => {
      const placeholder = `{{${dimension}}}`;
      const data = mockDimensionData[dimension];
      const formattedData = `
### ${dimension}
- **工单数量**: ${data.工单数量 || data.工单总量}
- **满意度**: ${data.满意度}
- **主要类别**: ${data.主要类别?.join('、') || '暂无数据'}
- **处理效率**: ${data.处理效率 || '数据未提供'}
      `;
      content = content.replace(new RegExp(placeholder, 'g'), formattedData);
    });

    // 添加工单列表
    if (content.includes('{{工单列表}}')) {
      const workOrderList = `
### 工单详情列表
${mockWorkOrders.map(order => `
**工单编号**: ${order.id}  
**标题**: ${order.title}  
**分类**: ${order.category}  
**状态**: ${order.status}  
**满意度**: ${'★'.repeat(order.satisfaction)}  
**创建时间**: ${order.createdAt}  
${order.resolvedAt ? `**解决时间**: ${order.resolvedAt}` : ''}  
---
`).join('\n')}
      `;
      content = content.replace('{{工单列表}}', workOrderList);
    }

    // 添加时间范围信息
    const dateRange = filters.dateRange 
      ? `${filters.dateRange[0]} 至 ${filters.dateRange[1]}` 
      : '最近7天';
    
    content = content.replace('{{时间范围}}', dateRange);
    content = content.replace('{{生成时间}}', new Date().toLocaleString('zh-CN'));

    return content;
  };

  // 生成预览数据
  const generatePreview = async (filters: PreviewFilters) => {
    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      const data = {
        title: template.name,
        content: generatePreviewContent(filters),
        generatedAt: new Date().toLocaleString('zh-CN'),
        filters: filters,
        data: {
          totalWorkOrders: 1234,
          avgSatisfaction: 92.5,
          processingRate: 87.3,
          categoryDistribution: [
            { name: '环境卫生', value: 456 },
            { name: '交通管理', value: 789 },
            { name: '市政设施', value: 234 }
          ]
        }
      };

      setPreviewData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('生成预览失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交
  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      const filters: PreviewFilters = {
        dateRange: values.dateRange || [],
        category: values.category || 'all',
        status: values.status || 'all',
        keyword: values.keyword || '',
        district: values.district || 'all'
      };
      
      generatePreview(filters);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 下载报告
  const handleDownload = () => {
    if (!previewData) return;

    const blob = new Blob([previewData.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 重置预览
  const handleReset = () => {
    setPreviewData(null);
    setShowPreview(false);
    form.resetFields();
  };

  return (
    <Modal
      title={
        <Space>
          <EyeOutlined />
          报告预览 - {template.name}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {!showPreview ? (
          // 预览配置表单
          <Card title="预览配置" size="small">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                category: 'all',
                status: 'all',
                district: 'all'
              }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="时间范围" name="dateRange">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="工单分类" name="category">
                    <Select>
                      <Option value="all">全部</Option>
                      <Option value="环境卫生">环境卫生</Option>
                      <Option value="交通管理">交通管理</Option>
                      <Option value="市政设施">市政设施</Option>
                      <Option value="公共安全">公共安全</Option>
                      <Option value="其他">其他</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="处理状态" name="status">
                    <Select>
                      <Option value="all">全部</Option>
                      <Option value="待处理">待处理</Option>
                      <Option value="处理中">处理中</Option>
                      <Option value="已处理">已处理</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="所属区域" name="district">
                    <Select>
                      <Option value="all">全部</Option>
                      <Option value="朝阳区">朝阳区</Option>
                      <Option value="海淀区">海淀区</Option>
                      <Option value="西城区">西城区</Option>
                      <Option value="东城区">东城区</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="关键词" name="keyword">
                    <Input placeholder="搜索关键词" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Space>
                  <Button type="primary" onClick={handlePreview} icon={<EyeOutlined />}>
                    生成预览
                  </Button>
                  <Button onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        ) : (
          // 预览内容
          <>
            <Card size="small" className="mb-4">
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <Tag color="blue">{template.name}</Tag>
                    <Tag color="green">{previewData?.filters.dateRange?.join(' ~ ') || '最近7天'}</Tag>
                    <Tag color="orange">{previewData?.filters.category}</Tag>
                    <Tag color="purple">{previewData?.filters.status}</Tag>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button type="primary" onClick={handleDownload} icon={<DownloadOutlined />}>
                      下载报告
                    </Button>
                    <Button onClick={handleReset} icon={<CloseOutlined />}>
                      重新配置
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
            
            <Card title="报告内容" size="small" className="h-96 overflow-y-auto">
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: previewData?.content.replace(/\n/g, '<br/>') || '' }} />
              </div>
            </Card>

            <Card title="数据统计" size="small" className="mt-4">
              <Row gutter={16}>
                <Col span={6}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{previewData?.data.totalWorkOrders}</div>
                    <div className="text-sm text-gray-600">工单总数</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{previewData?.data.avgSatisfaction}%</div>
                    <div className="text-sm text-gray-600">平均满意度</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{previewData?.data.processingRate}%</div>
                    <div className="text-sm text-gray-600">处理及时率</div>
                  </div>
                </Col>
                <Col span={6}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{previewData?.data.categoryDistribution?.length}</div>
                    <div className="text-sm text-gray-600">分类数量</div>
                  </div>
                </Col>
              </Row>
            </Card>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default ReportTemplatePreview;