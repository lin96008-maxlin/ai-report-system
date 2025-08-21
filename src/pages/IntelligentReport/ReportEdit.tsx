import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Select, TreeSelect, Tabs, Table, Modal, Form, DatePicker, Space, Radio, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { Report, ReportCategory, ReportFilters } from '@/types';
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
  // const [report, setReport] = useState<Report | null>(null);
  const [reportContent, setReportContent] = useState('');
  
  // 关联工单相关状态
  const [relatedTickets, setRelatedTickets] = useState<any[]>([]);
  const [editFilterVisible, setEditFilterVisible] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [editFilterForm] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const textAreaRef = useRef<any>(null);
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
  // const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);

  // 模拟数据
  /*
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
  */

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
    type: '专题报告',
    content: '',
    associated_work_orders: [],
    status: 'completed',
    progress: 100,
    // generated_content: `
      // <div style="padding: 20px; font-family: 'Microsoft YaHei', sans-serif;">
        // <h1 style="text-align: center; color: #223355; margin-bottom: 30px;">2024年1月客户投诉分析报告</h1>
        
        // <h2 style="color: #223355; border-bottom: 2px solid #3388FF; padding-bottom: 5px;">一、报告概述</h2>
        // <p style="line-height: 1.8; margin-bottom: 20px;">本报告基于2024年1月1日至1月31日期间收集的客户投诉数据，通过多维度分析，深入了解客户投诉的分布特征、处理效率和满意度情况。</p>
        
        // <h2 style="color: #223355; border-bottom: 2px solid #3388FF; padding-bottom: 5px;">二、数据统计</h2>
        // <p style="line-height: 1.8; margin-bottom: 20px;">本月共收到投诉1,245件，已办结1,156件，办结率达92.8%。</p>
      // </div>
    // `,
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
      // setReport(mockReport);
      
      // 初始化表单数据
      setForm({
        category_id: mockReport.category_id,
        name: mockReport.name,
        template_id: mockReport.template_id,
        description: mockReport.description || '',
        filters: mockReport.filters
      });
      
      // 设置报告内容
      setReportContent(`2024年1月民生诉求处理情况分析报告

一、报告概述
本报告基于2024年1月1日至1月31日期间收集的民生诉求数据，通过多维度分析，深入了解民生诉求的分布特征、处理效率和群众满意度情况，为改善民生服务质量提供数据支撑。

二、诉求总体情况
本月共收到民生诉求3,856件，已办结3,642件，办结率达94.5%。其中：
- 环境卫生类诉求1,245件，占32.3%
- 交通出行类诉求892件，占23.1%
- 社区服务类诉求756件，占19.6%
- 市政设施类诉求623件，占16.2%
- 其他类诉求340件，占8.8%

三、区域分布分析
从区域分布来看，朝阳区诉求量最高，达到1,156件，占总量的30.0%；海淀区次之，为892件，占23.1%；丰台区678件，占17.6%；其他区域合计1,130件，占29.3%。

四、处理时效分析
平均处理时长为3.2个工作日，较上月缩短0.5天。其中：
- 24小时内处理完成：2,145件，占55.6%
- 3个工作日内处理完成：3,234件，占83.9%
- 超过7个工作日处理：156件，占4.0%

五、群众满意度
通过电话回访和在线评价，群众满意度达到91.2%，较上月提升2.3个百分点。其中非常满意占67.8%，满意占23.4%，基本满意占8.8%。

六、存在问题及建议
1. 部分老旧小区基础设施维护不及时，建议加强日常巡查
2. 噪音扰民类诉求处理周期较长，建议优化处理流程
3. 群众对处理结果反馈机制需要进一步完善`);
      
      // 模拟关联工单数据
      setRelatedTickets([
        {
          id: '1',
          sectionName: '投诉统计分析',
          sectionContent: '分析投诉数量、来源分布等统计数据',
          sectionLevel: 1,
          filterConditions: '投诉类型：服务质量',
          remark: '重点关注服务质量相关投诉',
          workOrderFilters: {
            reportTimeStart: '2024-01-01',
            reportTimeEnd: '2024-01-31',
            appealSource: ['12345热线'],
            region: ['朝阳区'],
            appealItem: ['服务质量'],
            appealTags: ['重复投诉']
          }
        },
        {
          id: '2',
          sectionName: '区域分布分析',
          sectionContent: '分析各区域投诉分布情况',
          sectionLevel: 2,
          filterConditions: '区域：全市',
          remark: '按区域统计投诉数量',
          workOrderFilters: {
            reportTimeStart: '2024-01-01',
            reportTimeEnd: '2024-01-31',
            appealSource: [],
            region: [],
            appealItem: [],
            appealTags: []
          }
        }
      ]);
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
      // setTemplates(mockTemplates);
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

  const handleBatchDelete = () => {
    setRelatedTickets(prev => prev.filter(item => !selectedRowKeys.includes(item.id)));
    setSelectedRowKeys([]);
    message.success('批量删除成功');
  };

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuVisible(true);
  };

  // 新增关联工单
  const handleAddRelatedTicket = () => {
    setContextMenuVisible(false);
    editFilterForm.resetFields();
    setEditingTicket(null);
    setEditFilterVisible(true);
  };

  // 在光标位置插入文字
  const insertTextAtCursor = (text: string) => {
    if (textAreaRef.current) {
      const textarea = textAreaRef.current.resizableTextArea.textArea;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = reportContent;
      const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
      setReportContent(newValue);
      
      // 设置光标位置到插入文字的末尾
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    }
  };

  // 点击其他地方关闭右键菜单
  const handleClickOutside = () => {
    setContextMenuVisible(false);
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
    <div className="h-full bg-white rounded flex flex-col mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px', overflow: 'hidden' }}>
      {/* 页面标题栏 */}
      <div className="p-5 border-b border-[#E9ECF2]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowLeftOutlined 
              className="text-[#223355] cursor-pointer hover:text-[#3388FF] transition-colors" 
              style={{fontSize: '16px'}}
              onClick={handleCancel}
            />
            <h2 className="font-medium text-[#223355] m-0" style={{fontSize: '18px'}}>报告编辑</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleCancel}
              className="border-[#E9ECF2] text-[#223355]"
            >
              取消
            </Button>
            <Button 
               type="primary"
               onClick={handleSubmit}
               loading={loading}
               className="bg-[#3388FF] border-[#3388FF]"
             >
               保存
             </Button>
          </div>
        </div>
      </div>

      {/* Tab导航 */}
      <div className="px-5 pt-3">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="报告编辑" key="basic" />
          <TabPane tab="关联工单" key="workorder" />
        </Tabs>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 px-5 pb-5 overflow-auto">
          <div className="w-full">
          {activeTab === 'basic' && (
            <div>
              {/* 第一行 */}
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div className="flex items-center gap-3">
                  <label className="text-[#223355] whitespace-nowrap">报告目录 <span className="text-red-500">*</span></label>
                  <TreeSelect
                    placeholder="请选择报告目录"
                    value={form.category_id}
                    onChange={(value) => handleFormChange('category_id', value)}
                    treeData={categoryTreeData}
                    className="flex-1"
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[#223355] whitespace-nowrap">报告标题 <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="请输入报告标题"
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    maxLength={100}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[#223355] whitespace-nowrap">报告描述</label>
                  <Input
                    placeholder="请输入报告描述"
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    maxLength={500}
                    className="flex-1"
                  />
                </div>
              </div>
              
              {/* 报告内容编辑区域 */}
              <div className="mb-4 -mx-5">
                <div className="px-5">
                  <label className="block text-[#223355] mb-2">报告内容</label>
                </div>
                <div className="px-5">
                  <div className="border border-[#E9ECF2] rounded">
                    <div onContextMenu={handleContextMenu} onClick={handleClickOutside}>
                      <TextArea
                        ref={textAreaRef}
                        placeholder="请输入或编辑报告内容..."
                        value={reportContent}
                        onChange={(e) => setReportContent(e.target.value)}
                        className="border-0"
                        style={{ 
                          height: 'calc(100vh - 400px)',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          resize: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>


            </div>
          )}

          {activeTab === 'workorder' && (
            <div className="-mx-5">
              <div className="px-5 mb-4 flex justify-start items-center">
                <Button 
                  danger
                  disabled={selectedRowKeys.length === 0}
                  onClick={handleBatchDelete}
                >
                  批量删除
                </Button>
              </div>
              
              <div className="px-5">
                <Table
                  dataSource={relatedTickets}
                  rowKey="id"
                  pagination={false}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: (selectedRowKeys: React.Key[]) => setSelectedRowKeys(selectedRowKeys as string[])
                  }}
                  columns={[
                      {
                        title: '序号',
                        dataIndex: 'index',
                        key: 'index',
                        width: 60,
                        render: (_, __, index) => index + 1,
                      },
                      {
                        title: '章节名称',
                        dataIndex: 'sectionName',
                        key: 'sectionName',
                        width: 200,
                      },

                    {
                      title: '筛选条件',
                      dataIndex: 'filterConditions',
                      key: 'filterConditions',
                      width: 200
                    },
                    {
                      title: '备注',
                      dataIndex: 'remark',
                      key: 'remark',
                      width: 150
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 120,
                      render: (_, record) => (
                        <Space>
                          <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingTicket(record);
                              setEditFilterVisible(true);
                            }}
                          >
                            编辑
                          </Button>
                          <Button
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              setRelatedTickets(prev => prev.filter(item => item.id !== record.id));
                            }}
                          >
                            删除
                          </Button>
                        </Space>
                      )
                    }
                  ]}
                />
              </div>
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



      {/* 编辑工单筛选弹窗 */}
      <Modal
        title={
            <div style={{ paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
              编辑
            </div>
          }
        open={editFilterVisible}
        onCancel={() => {
          setEditFilterVisible(false);
          setEditingTicket(null);
          editFilterForm.resetFields();
        }}
        width={800}
        centered
        styles={{
          body: { padding: '20px', minHeight: '400px' },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' }
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditFilterVisible(false);
            setEditingTicket(null);
            editFilterForm.resetFields();
          }}>取消</Button>,
          <Button key="submit" type="primary" onClick={() => {
            editFilterForm.validateFields().then(values => {
              if (editingTicket) {
                // 编辑模式
                setRelatedTickets(prev => prev.map(item => 
                  item.id === editingTicket.id ? { ...item, ...values } : item
                ));
                message.success('关联工单编辑成功！');
              } else {
                 // 新增模式
                 const newTicket = {
                   id: Date.now().toString(),
                   ...values
                 };
                 setRelatedTickets(prev => [...prev, newTicket]);
                 message.success('关联工单添加成功！');
                 
                 // 在光标位置插入文字
                 insertTextAtCursor('查看关联工单（点击超链反查工单列表）');
               }
              setEditFilterVisible(false);
              setEditingTicket(null);
              editFilterForm.resetFields();
            });
          }}>确定</Button>,
        ]}
      >
        <Form form={editFilterForm} layout="vertical">
          <Form.Item
            name="sectionName"
            label="章节名称"
            rules={[{ required: true, message: '请输入章节名称' }]}
          >
            <Input placeholder="请输入章节名称" />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="reportTime"
              label="报告时间"
            >
              <RangePicker className="w-full" />
            </Form.Item>
            
            <Form.Item
              name="appealSource"
              label="诉求来源"
            >
              <Select placeholder="请选择诉求来源" allowClear>
                <Option value="12345热线">12345热线</Option>
                <Option value="网上信访">网上信访</Option>
                <Option value="现场投诉">现场投诉</Option>
                <Option value="媒体曝光">媒体曝光</Option>
                <Option value="微信">微信</Option>
                <Option value="电话">电话</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="belongArea"
              label="所属区域"
            >
              <Select placeholder="请选择所属区域" allowClear>
                <Option value="朝阳区">朝阳区</Option>
                <Option value="海淀区">海淀区</Option>
                <Option value="丰台区">丰台区</Option>
                <Option value="西城区">西城区</Option>
                <Option value="东城区">东城区</Option>
                <Option value="石景山区">石景山区</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="appealMatter"
              label="诉求事项"
            >
              <Select placeholder="请选择诉求事项" allowClear>
                <Option value="环境卫生">环境卫生</Option>
                <Option value="噪音扰民">噪音扰民</Option>
                <Option value="服务质量">服务质量</Option>
                <Option value="环境污染">环境污染</Option>
                <Option value="交通管理">交通管理</Option>
                <Option value="市政设施">市政设施</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="appealTags"
              label="诉求标签"
            >
              <Select 
                mode="multiple" 
                placeholder="请选择诉求标签" 
                allowClear
              >
                <Option value="重复投诉">重复投诉</Option>
                <Option value="紧急处理">紧急处理</Option>
                <Option value="媒体关注">媒体关注</Option>
                <Option value="群众反映">群众反映</Option>
                <Option value="重点关注">重点关注</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="filterConditions"
              label="其他筛选条件"
            >
              <Input placeholder="请输入其他筛选条件" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 右键菜单 */}
      {contextMenuVisible && (
        <div
          style={{
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '4px 0',
            minWidth: '120px'
          }}
        >
          <div
            onClick={handleAddRelatedTicket}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#262626'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            新增关联工单
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportEdit;