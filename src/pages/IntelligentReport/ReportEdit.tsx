import React, { useState, useEffect } from 'react';
import { Button, Input, Select, DatePicker, Radio, TreeSelect, message, Tabs } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { Report, ReportTemplate, ReportCategory, ReportFilters } from '@/types';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface ReportEditForm {
  category_id: string;
  name: string;
  template_id: string;
  description?: string;
  filters: ReportFilters;
}

const ReportEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // 获取报告生成状态管理
  const { startReportGeneration } = useAppStore();
  const [activeTab, setActiveTab] = useState('basic');
  const [report, setReport] = useState<Report | null>(null);
  const [form, setForm] = useState<ReportEditForm>({
    category_id: '',
    name: '',
    template_id: '',
    description: '',
    filters: {
      report_time_start: '',
      report_time_end: '',
      region: [],
      appeal_source: [],
      appeal_nature: [],
      appeal_status: [],
      satisfaction_rating: [],
      appeal_title: '',
      appeal_title_match_type: 'all',
      appeal_description: '',
      appeal_description_match_type: 'all',
      handling_department: [],
      appeal_item: [],
      appeal_tags: []
    }
  });
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);

  // 模拟数据
  const mockTemplates: ReportTemplate[] = [
    {
      id: 'template_1',
      name: '投诉分析模板',
      description: '用于分析客户投诉情况的标准模板',
      type: '季报',
      content_structure: {
        rich_text_content: '<p>投诉分析报告模板</p>',
        embedded_dimensions: []
      },
      is_published: true,
      created_at: '2024-01-01',
      created_by: '系统管理员'
    },
    {
      id: 'template_2',
      name: '满意度分析模板',
      description: '用于分析客户满意度的标准模板',
      type: '月报',
      content_structure: {
        rich_text_content: '<p>满意度分析报告模板</p>',
        embedded_dimensions: []
      },
      is_published: true,
      created_at: '2024-01-01',
      created_by: '系统管理员'
    }
  ];

  const mockCategories: ReportCategory[] = [
    { id: 'daily', name: '日报', created_at: '', created_by: '' },
    { id: 'weekly', name: '周报', created_at: '', created_by: '' },
    { id: 'monthly', name: '月报', created_at: '', created_by: '' },
    { id: 'quarterly', name: '季报', created_at: '', created_by: '' },
    { id: 'semiannual', name: '半年报', created_at: '', created_by: '' },
    { id: 'annual', name: '年报', created_at: '', created_by: '' }
  ];

  const mockReport: Report = {
    id: id || 'report_1',
    category_id: 'monthly',
    name: '2024年1月客户投诉分析报告',
    template_id: 'template_1',
    description: '本报告分析了2024年1月份的客户投诉情况，包括投诉来源、性质、处理情况等。',
    status: 'completed',
    progress: 100,
    generated_content: '<h1>2024年1月客户投诉分析报告</h1><p>报告内容...</p>',
    filters: {
      report_time_start: '2024-01-01',
      report_time_end: '2024-01-31',
      region: ['朝阳区', '海淀区'],
      appeal_source: ['12345热线', '网上信访'],
      appeal_nature: ['投诉', '咨询'],
      appeal_status: ['已办结'],
      satisfaction_rating: ['满意', '非常满意'],
      appeal_title: '噪音,环境',
      appeal_title_match_type: 'partial',
      appeal_description: '投诉,问题',
      appeal_description_match_type: 'partial',
      handling_department: ['城管委', '环保局'],
      appeal_item: ['环境卫生'],
      appeal_tags: ['重复投诉']
    },
    created_at: '2024-01-15 10:30:00',
    created_by: '张三',
    updated_at: '2024-01-15 14:20:00',
    updated_by: '张三'
  };

  useEffect(() => {
    loadReportData();
    loadTemplates();
    loadCategories();
  }, [id]);

  const loadReportData = async () => {
    if (!id) return;
    
    setDataLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setReport(mockReport);
      
      // 初始化表单数据
      setForm({
        category_id: mockReport.category_id,
        name: mockReport.name,
        template_id: mockReport.template_id,
        description: mockReport.description || '',
        filters: mockReport.filters
      });
    } catch (error) {
      message.error('加载报告数据失败');
    } finally {
      setDataLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      setTemplates(mockTemplates);
    } catch (error) {
      message.error('加载模板列表失败');
    }
  };

  const loadCategories = async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      setCategories(mockCategories);
    } catch (error) {
      message.error('加载目录列表失败');
    }
  };

  const handleFormChange = (field: keyof ReportEditForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFiltersChange = (field: keyof ReportFilters, value: any) => {
    setForm(prev => ({
      ...prev,
      filters: { ...prev.filters, [field]: value }
    }));
  };

  const handleSubmit = async () => {
    // 验证必填字段
    if (!form.category_id) {
      message.error('请选择报告目录');
      return;
    }
    if (!form.name.trim()) {
      message.error('请输入报告标题');
      return;
    }
    if (!form.template_id) {
      message.error('请选择报告模板');
      return;
    }
    if (!form.filters.report_time_start || !form.filters.report_time_end) {
      message.error('请选择上报时间范围');
      return;
    }

    setLoading(true);
    try {
      // 启动报告重新生成任务
      if (id) {
        startReportGeneration(id);
      }
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      message.success('报告已更新并重新生成');
      navigate('/report');
    } catch (error) {
      message.error('更新报告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/report');
  };

  const categoryTreeData = categories.map(cat => ({
    value: cat.id,
    title: cat.name,
    key: cat.id
  }));

  if (dataLoading) {
    return (
      <div className="h-full bg-white rounded flex items-center justify-center mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
        <div className="text-center">
          <div className="text-[#666] mb-2">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded flex flex-col mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
      {/* 页面标题栏 */}
      <div className="p-5 border-b border-[#E9ECF2]">
        <div className="flex items-center gap-3">
          <ArrowLeftOutlined 
            className="text-[#223355] cursor-pointer hover:text-[#3388FF] transition-colors" 
            style={{fontSize: '16px'}}
            onClick={handleCancel}
          />
          <h2 className="font-medium text-[#223355] m-0" style={{fontSize: '18px'}}>编辑报告</h2>
          {report && (
            <span className="text-[#666] text-sm">({report.name})</span>
          )}
        </div>
      </div>

      {/* Tab导航 */}
      <div className="px-5 pt-3">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基础信息" key="basic" />
          <TabPane tab="过滤条件" key="filters" />
        </Tabs>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 px-5 pb-5 overflow-auto">
        <div className="max-w-4xl">
          {activeTab === 'basic' && (
            <div>
              {/* 第一行 */}
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block text-[#223355] mb-2">报告目录 <span className="text-red-500">*</span></label>
                  <TreeSelect
                    placeholder="请选择报告目录"
                    value={form.category_id}
                    onChange={(value) => handleFormChange('category_id', value)}
                    treeData={categoryTreeData}
                    className="w-full"
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                  />
                </div>
                <div>
                  <label className="block text-[#223355] mb-2">报告标题 <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="请输入报告标题"
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-[#223355] mb-2">报告模板 <span className="text-red-500">*</span></label>
                  <Select
                    placeholder="请选择报告模板"
                    value={form.template_id}
                    onChange={(value) => handleFormChange('template_id', value)}
                    className="w-full"
                  >
                    {templates.map(template => (
                      <Option key={template.id} value={template.id}>
                        {template.name} ({template.type})
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
              
              {/* 第二行 */}
              <div>
                <label className="block text-[#223355] mb-2">报告描述</label>
                <TextArea
                  placeholder="请输入报告描述"
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={4}
                  maxLength={500}
                />
              </div>

              {/* 报告信息展示 */}
              {report && (
                <div className="mt-6 p-4 bg-[#F8F9FA] rounded">
                  <h4 className="text-[#223355] font-medium mb-3">报告信息</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#666]">创建时间：</span>
                      <span className="text-[#223355]">{report.created_at}</span>
                    </div>
                    <div>
                      <span className="text-[#666]">创建人：</span>
                      <span className="text-[#223355]">{report.created_by}</span>
                    </div>
                    <div>
                      <span className="text-[#666]">更新时间：</span>
                      <span className="text-[#223355]">{report.updated_at}</span>
                    </div>
                    <div>
                      <span className="text-[#666]">更新人：</span>
                      <span className="text-[#223355]">{report.updated_by}</span>
                    </div>
                    <div>
                      <span className="text-[#666]">报告状态：</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        report.status === 'completed' ? 'bg-green-100 text-green-600' :
                        report.status === 'generating' ? 'bg-blue-100 text-blue-600' :
                        report.status === 'failed' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {report.status === 'completed' ? '已完成' :
                         report.status === 'generating' ? '生成中' :
                         report.status === 'failed' ? '生成失败' : '草稿'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#666]">生成进度：</span>
                      <span className="text-[#223355]">{report.progress}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'filters' && (
            <div>
              {/* 第一行 */}
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block text-[#223355] mb-2">上报时间 <span className="text-red-500">*</span></label>
                  <RangePicker
                    value={form.filters.report_time_start && form.filters.report_time_end ? 
                      [dayjs(form.filters.report_time_start), dayjs(form.filters.report_time_end)] : null}
                    onChange={(dates) => {
                      if (dates) {
                        handleFiltersChange('report_time_start', dates[0]?.format('YYYY-MM-DD'));
                        handleFiltersChange('report_time_end', dates[1]?.format('YYYY-MM-DD'));
                      } else {
                        handleFiltersChange('report_time_start', '');
                        handleFiltersChange('report_time_end', '');
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-[#223355] mb-2">所属区域</label>
                  <Select
                    mode="multiple"
                    placeholder="请选择所属区域"
                    value={form.filters.region}
                    onChange={(value) => handleFiltersChange('region', value)}
                    className="w-full"
                  >
                    <Option value="东城区">东城区</Option>
                    <Option value="西城区">西城区</Option>
                    <Option value="朝阳区">朝阳区</Option>
                    <Option value="海淀区">海淀区</Option>
                    <Option value="丰台区">丰台区</Option>
                  </Select>
                </div>
                <div>
                  <label className="block text-[#223355] mb-2">诉求来源</label>
                  <Select
                    mode="multiple"
                    placeholder="请选择诉求来源"
                    value={form.filters.appeal_source}
                    onChange={(value) => handleFiltersChange('appeal_source', value)}
                    className="w-full"
                  >
                    <Option value="12345热线">12345热线</Option>
                    <Option value="网上信访">网上信访</Option>
                    <Option value="现场投诉">现场投诉</Option>
                    <Option value="媒体曝光">媒体曝光</Option>
                  </Select>
                </div>
              </div>

              {/* 第二行 */}
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block text-[#223355] mb-2">诉求性质</label>
                  <Select
                    mode="multiple"
                    placeholder="请选择诉求性质"
                    value={form.filters.appeal_nature}
                    onChange={(value) => handleFiltersChange('appeal_nature', value)}
                    className="w-full"
                  >
                    <Option value="投诉">投诉</Option>
                    <Option value="咨询">咨询</Option>
                    <Option value="建议">建议</Option>
                    <Option value="求助">求助</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                </div>
                <div>
                  <label className="block text-[#223355] mb-2">诉求状态</label>
                  <Select
                    mode="multiple"
                    placeholder="请选择诉求状态"
                    value={form.filters.appeal_status}
                    onChange={(value) => handleFiltersChange('appeal_status', value)}
                    className="w-full"
                  >
                    <Option value="待批转">待批转</Option>
                    <Option value="待签收">待签收</Option>
                    <Option value="待处置">待处置</Option>
                    <Option value="待评价">待评价</Option>
                    <Option value="已办结">已办结</Option>
                  </Select>
                </div>
                <div>
                  <label className="block text-[#223355] mb-2">满意评价</label>
                  <Select
                    mode="multiple"
                    placeholder="请选择满意评价"
                    value={form.filters.satisfaction_rating}
                    onChange={(value) => handleFiltersChange('satisfaction_rating', value)}
                    className="w-full"
                  >
                    <Option value="非常满意">非常满意</Option>
                    <Option value="满意">满意</Option>
                    <Option value="一般">一般</Option>
                    <Option value="不满意">不满意</Option>
                  </Select>
                </div>
              </div>

              {/* 第三行 */}
              <div className="mb-4">
                <label className="block text-[#223355] mb-2">诉求标题</label>
                <div className="flex gap-4">
                  <Input
                    placeholder="请输入关键词，多个关键词用逗号分隔"
                    value={form.filters.appeal_title}
                    onChange={(e) => handleFiltersChange('appeal_title', e.target.value)}
                    className="flex-1"
                  />
                  <Radio.Group
                    value={form.filters.appeal_title_match_type}
                    onChange={(e) => handleFiltersChange('appeal_title_match_type', e.target.value)}
                  >
                    <Radio value="all">全部匹配</Radio>
                    <Radio value="partial">部分匹配</Radio>
                  </Radio.Group>
                </div>
              </div>

              {/* 第四行 */}
              <div className="mb-4">
                <label className="block text-[#223355] mb-2">诉求描述</label>
                <div className="flex gap-4">
                  <Input
                    placeholder="请输入关键词，多个关键词用逗号分隔"
                    value={form.filters.appeal_description}
                    onChange={(e) => handleFiltersChange('appeal_description', e.target.value)}
                    className="flex-1"
                  />
                  <Radio.Group
                    value={form.filters.appeal_description_match_type}
                    onChange={(e) => handleFiltersChange('appeal_description_match_type', e.target.value)}
                  >
                    <Radio value="all">全部匹配</Radio>
                    <Radio value="partial">部分匹配</Radio>
                  </Radio.Group>
                </div>
              </div>

              {/* 第五行 */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-[#223355] mb-2">处置部门</label>
                  <Select
                    mode="multiple"
                    placeholder="请选择处置部门"
                    value={form.filters.handling_department}
                    onChange={(value) => handleFiltersChange('handling_department', value)}
                    className="w-full"
                  >
                    <Option value="城管委">城管委</Option>
                    <Option value="住建委">住建委</Option>
                    <Option value="交通委">交通委</Option>
                    <Option value="环保局">环保局</Option>
                    <Option value="市场监管局">市场监管局</Option>
                  </Select>
                </div>
                <div>
                  <label className="block text-[#223355] mb-2">诉求事项</label>
                  <Select
                    mode="multiple"
                    placeholder="请选择诉求事项"
                    value={form.filters.appeal_item}
                    onChange={(value) => handleFiltersChange('appeal_item', value)}
                    className="w-full"
                  >
                    <Option value="环境卫生">环境卫生</Option>
                    <Option value="交通出行">交通出行</Option>
                    <Option value="房屋建筑">房屋建筑</Option>
                    <Option value="市场监管">市场监管</Option>
                    <Option value="公共设施">公共设施</Option>
                  </Select>
                </div>
                <div>
                  <label className="block text-[#223355] mb-2">诉求标签</label>
                  <Select
                    mode="multiple"
                    placeholder="请选择诉求标签"
                    value={form.filters.appeal_tags}
                    onChange={(value) => handleFiltersChange('appeal_tags', value)}
                    className="w-full"
                  >
                    <Option value="紧急">紧急</Option>
                    <Option value="重复投诉">重复投诉</Option>
                    <Option value="媒体关注">媒体关注</Option>
                    <Option value="领导批示">领导批示</Option>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="p-5 border-t border-[#E9ECF2] flex justify-end gap-3">
        <Button onClick={handleCancel}>取消</Button>
        <Button type="primary" loading={loading} onClick={handleSubmit}>
          保存修改
        </Button>
      </div>
    </div>
  );
};

export default ReportEdit;