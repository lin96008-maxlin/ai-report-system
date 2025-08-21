import React, { useState, useEffect } from 'react';
import { Button, Input, Select, DatePicker, Radio, TreeSelect, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ReportTemplate, ReportCategory, ReportFilters } from '@/types';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

interface ReportGenerateForm {
  category_id: string;
  name: string;
  template_id: string;
  description?: string;
  filters: ReportFilters;
}

const ReportGenerate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // 获取报告生成状态管理
  const { startReportGeneration } = useAppStore();
  const [form, setForm] = useState<ReportGenerateForm>({
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

  // 从报告管理页面获取完整的分类数据
  const getReportCategories = (): ReportCategory[] => {
    // 从localStorage获取保存的分类数据，与报告管理页面保持同步
    const savedCategories = localStorage.getItem('reportCategories');
    if (savedCategories) {
      return JSON.parse(savedCategories);
    }
    
    // 如果localStorage中没有数据，返回默认分类
    return [
      { id: '1', name: '整体分析相关', parent_id: undefined, description: '整体分析相关报告', created_at: '2024-01-01', created_by: '系统管理员' },
      { id: '2', name: '处置单位分析相关', parent_id: undefined, description: '处置单位分析相关报告', created_at: '2024-01-01', created_by: '系统管理员' },
      { id: '3', name: '问题类型分析相关', parent_id: undefined, description: '问题类型分析相关报告', created_at: '2024-01-01', created_by: '系统管理员' },
      { id: '4', name: '概述', parent_id: '1', description: '整体分析概述', created_at: '2024-01-01', created_by: '系统管理员' },
      { id: '5', name: '详细分析', parent_id: '1', description: '整体详细分析', created_at: '2024-01-01', created_by: '系统管理员' },
      { id: '6', name: '日报', parent_id: '2', description: '日常报告', created_at: '2024-01-01', created_by: '系统管理员' },
      { id: '7', name: '周报', parent_id: '2', description: '周度报告', created_at: '2024-01-01', created_by: '系统管理员' },
      { id: '8', name: '月报', parent_id: '2', description: '月度报告', created_at: '2024-01-01', created_by: '系统管理员' },
      { id: '9', name: '投诉分析', parent_id: '3', description: '投诉问题分析', created_at: '2024-01-01', created_by: '系统管理员' },
      { id: '10', name: '建议分析', parent_id: '3', description: '建议问题分析', created_at: '2024-01-01', created_by: '系统管理员' }
    ];
  };

  // 从模板管理页面获取所有模板数据
  const getReportTemplates = (): ReportTemplate[] => {
    // 从localStorage获取保存的模板数据，与模板管理页面保持一致
    const savedTemplates = localStorage.getItem('reportTemplates');
    
    if (savedTemplates) {
      try {
        const templates = JSON.parse(savedTemplates);
        // 返回所有模板，不过滤发布状态
        return templates;
      } catch (error) {
        console.error('解析模板数据失败:', error);
        return [];
      }
    }
    
    // 如果localStorage中没有数据，返回默认模板
    return [
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
      },
      {
        id: 'template_3',
        name: '服务质量模板',
        description: '用于分析服务质量的专题模板',
        type: '专题报告',
        content_structure: {
          rich_text_content: '<p>服务质量报告模板</p>',
          embedded_dimensions: []
        },
        is_published: true,
        created_at: '2024-01-01',
        created_by: '系统管理员'
      },
      {
        id: 'template_4',
        name: '综合分析模板',
        description: '用于综合分析的通用模板',
        type: '年报',
        content_structure: {
          rich_text_content: '<p>综合分析报告模板</p>',
          embedded_dimensions: []
        },
        is_published: true,
        created_at: '2024-01-01',
        created_by: '系统管理员'
      }
    ];
  };

  useEffect(() => {
    loadTemplates();
    loadCategories();
    
    // 监听localStorage变化，实时更新数据
    const handleStorageChange = () => {
      loadTemplates();
      loadCategories();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadTemplates = async () => {
    try {
      // 从报告模板管理获取所有模板数据
      await new Promise(resolve => setTimeout(resolve, 300));
      const allTemplates = getReportTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('加载模板失败:', error);
      message.error('加载模板列表失败');
    }
  };

  const loadCategories = async () => {
    try {
      // 从报告管理页面左侧树获取分组数据
      await new Promise(resolve => setTimeout(resolve, 300));
      const allCategories = getReportCategories();
      setCategories(allCategories);
    } catch (error) {
      message.error('加载目录列表失败');
    }
  };

  const handleFormChange = (field: keyof ReportGenerateForm, value: any) => {
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
      // 生成报告ID
      const reportId = `report_${Date.now()}`;
      
      // 获取模板和分类名称
      const selectedTemplate = templates.find(t => t.id === form.template_id);
      const selectedCategory = categories.find(c => c.id === form.category_id);
      
      // 创建新的生成中报告记录
      const newReport = {
        id: reportId,
        name: form.name,
        title: form.name,
        description: form.description || '新生成的报告',
        type: '自定义报告',
        category_id: form.category_id,
        category_name: selectedCategory?.name || '默认分类',
        template_id: form.template_id,
        template_name: selectedTemplate?.name || '默认模板',
        status: 'generating',
        content: '',
        filters: form.filters,
        associated_work_orders: [],
        created_at: new Date().toISOString().replace('T', ' ').split('.')[0],
        created_by: '当前用户',
        updated_at: new Date().toISOString().replace('T', ' ').split('.')[0],
        progress: 0,
        report_status: 'generating'
      };
      
      // 保存到localStorage
      const existingReports = localStorage.getItem('reports');
      const reportsData = existingReports ? JSON.parse(existingReports) : [];
      reportsData.unshift(newReport); // 添加到数组开头
      localStorage.setItem('reports', JSON.stringify(reportsData));
      
      // 启动报告生成任务
      startReportGeneration(reportId);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('报告生成任务已提交，正在生成中...');
      
      // 立即跳转到报告管理页面
      navigate('/intelligent-report/report-management');
      
      // 延迟启动进度条更新逻辑，确保页面已跳转
      setTimeout(() => {
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          currentProgress += 20;
          if (currentProgress <= 100) {
            // 更新localStorage中的进度
            const existingReports = localStorage.getItem('reports');
            if (existingReports) {
              const reportsData = JSON.parse(existingReports);
              const reportIndex = reportsData.findIndex((r: any) => r.id === reportId);
              if (reportIndex !== -1) {
                reportsData[reportIndex].progress = currentProgress;
                if (currentProgress === 100) {
                  reportsData[reportIndex].report_status = 'generated';
                }
                localStorage.setItem('reports', JSON.stringify(reportsData));
                
                // 触发storage事件，通知其他页面更新
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'reports',
                  newValue: JSON.stringify(reportsData)
                }));
              }
            }
          }
          
          if (currentProgress >= 100) {
            clearInterval(progressInterval);
          }
        }, 400); // 每400ms增加20%，8秒完成
      }, 500); // 延迟500ms启动进度条更新
    } catch (error) {
      message.error('生成报告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/intelligent-report/report-management');
  };

  // 构建多层级树形数据
  const buildCategoryTree = (parentId?: string): any[] => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => {
        const children = buildCategoryTree(cat.id);
        return {
          value: cat.id,
          title: cat.name,
          key: cat.id,
          children: children.length > 0 ? children : undefined
        };
      });
  };

  const categoryTreeData = buildCategoryTree();

  return (
    <div className="h-full bg-white rounded flex flex-col mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
      {/* 页面标题栏 */}
      <div className="px-5 border-b border-[#E9ECF2] flex items-center justify-between" style={{height: '73px'}}>
        <div className="flex items-center gap-3">
          <ArrowLeftOutlined 
            className="text-[#223355] cursor-pointer hover:text-[#3388FF] transition-colors" 
            style={{fontSize: '16px'}}
            onClick={handleCancel}
          />
          <h2 className="font-medium text-[#223355] m-0" style={{fontSize: '18px'}}>生成报告</h2>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            生成报告
          </Button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 p-5 overflow-auto">
        <div className="w-full">
          {/* 基础信息 */}
          <div className="mb-8">
            <div className="relative -mx-5 px-5 pb-5 mb-5">
              <h3 className="text-[#223355] font-medium mb-0" style={{fontSize: '14px', marginBottom: 0}}>基础信息</h3>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#E9ECF2]"></div>
            </div>
            
            {/* 第一行 */}
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-6 mb-4">
              <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0"><span className="text-red-500">*</span>报告目录：</label>
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
                <label className="text-[#223355] w-20 flex-shrink-0"><span className="text-red-500">*</span>报告标题：</label>
                  <Input
                    placeholder="请输入报告标题"
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    maxLength={100}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0"><span className="text-red-500">*</span>报告模板：</label>
                  <Select
                    placeholder="请选择报告模板"
                    value={form.template_id}
                    onChange={(value) => handleFormChange('template_id', value)}
                    className="flex-1"
                  >
                    {templates.map(template => (
                      <Option key={template.id} value={template.id}>
                        {template.name} ({template.type})
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            
            {/* 第二行 */}
            <div className="flex items-start gap-3">
            <label className="text-[#223355] w-20 flex-shrink-0 pt-2">报告描述：</label>
              <TextArea
                placeholder="请输入报告描述"
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={3}
                maxLength={500}
                className="flex-1"
              />
            </div>
          </div>

          {/* 过滤条件配置 */}
          <div>
            <div className="relative -mx-5 px-5 pb-5 mb-5">
              <h3 className="text-[#223355] font-medium mb-0" style={{fontSize: '14px', marginBottom: 0}}>过滤条件配置</h3>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#E9ECF2]"></div>
            </div>
            
            {/* 第一行 */}
            <div className="grid grid-cols-3 gap-6 mb-4">
              <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0"><span className="text-red-500">*</span>上报时间：</label>
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
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0">所属区域：</label>
                <Select
                  mode="multiple"
                  placeholder="请选择所属区域"
                  value={form.filters.region}
                  onChange={(value) => handleFiltersChange('region', value)}
                  className="flex-1"
                >
                  <Option value="东城区">东城区</Option>
                  <Option value="西城区">西城区</Option>
                  <Option value="朝阳区">朝阳区</Option>
                  <Option value="海淀区">海淀区</Option>
                  <Option value="丰台区">丰台区</Option>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0">诉求来源：</label>
                <Select
                  mode="multiple"
                  placeholder="请选择诉求来源"
                  value={form.filters.appeal_source}
                  onChange={(value) => handleFiltersChange('appeal_source', value)}
                  className="flex-1"
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
              <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0">诉求性质：</label>
                <Select
                  mode="multiple"
                  placeholder="请选择诉求性质"
                  value={form.filters.appeal_nature}
                  onChange={(value) => handleFiltersChange('appeal_nature', value)}
                  className="flex-1"
                >
                  <Option value="投诉">投诉</Option>
                  <Option value="咨询">咨询</Option>
                  <Option value="建议">建议</Option>
                  <Option value="求助">求助</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0">诉求状态：</label>
                <Select
                  mode="multiple"
                  placeholder="请选择诉求状态"
                  value={form.filters.appeal_status}
                  onChange={(value) => handleFiltersChange('appeal_status', value)}
                  className="flex-1"
                >
                  <Option value="待批转">待批转</Option>
                  <Option value="待签收">待签收</Option>
                  <Option value="待处置">待处置</Option>
                  <Option value="待评价">待评价</Option>
                  <Option value="已办结">已办结</Option>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0">满意评价：</label>
                <Select
                  mode="multiple"
                  placeholder="请选择满意评价"
                  value={form.filters.satisfaction_rating}
                  onChange={(value) => handleFiltersChange('satisfaction_rating', value)}
                  className="flex-1"
                >
                  <Option value="非常满意">非常满意</Option>
                  <Option value="满意">满意</Option>
                  <Option value="一般">一般</Option>
                  <Option value="不满意">不满意</Option>
                </Select>
              </div>
            </div>

            {/* 第三行 */}
            <div className="flex items-center gap-3 mb-4">
            <label className="text-[#223355] w-20 flex-shrink-0">诉求标题：</label>
              <Input
                placeholder="请输入关键词，多个关键词用逗号分隔"
                value={form.filters.appeal_title}
                onChange={(e) => handleFiltersChange('appeal_title', e.target.value)}
                className="flex-1"
              />
              <Radio.Group
                value={form.filters.appeal_title_match_type}
                onChange={(e) => handleFiltersChange('appeal_title_match_type', e.target.value)}
                className="flex-shrink-0"
              >
                <Radio value="all">全部匹配</Radio>
                <Radio value="partial">部分匹配</Radio>
              </Radio.Group>
            </div>

            {/* 第四行 */}
            <div className="flex items-center gap-3 mb-4">
            <label className="text-[#223355] w-20 flex-shrink-0">诉求描述：</label>
              <Input
                placeholder="请输入关键词，多个关键词用逗号分隔"
                value={form.filters.appeal_description}
                onChange={(e) => handleFiltersChange('appeal_description', e.target.value)}
                className="flex-1"
              />
              <Radio.Group
                value={form.filters.appeal_description_match_type}
                onChange={(e) => handleFiltersChange('appeal_description_match_type', e.target.value)}
                className="flex-shrink-0"
              >
                <Radio value="all">全部匹配</Radio>
                <Radio value="partial">部分匹配</Radio>
              </Radio.Group>
            </div>

            {/* 第五行 */}
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0">处置部门：</label>
                <Select
                  mode="multiple"
                  placeholder="请选择处置部门"
                  value={form.filters.handling_department}
                  onChange={(value) => handleFiltersChange('handling_department', value)}
                  className="flex-1"
                >
                  <Option value="城管委">城管委</Option>
                  <Option value="住建委">住建委</Option>
                  <Option value="交通委">交通委</Option>
                  <Option value="环保局">环保局</Option>
                  <Option value="市场监管局">市场监管局</Option>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0">诉求事项：</label>
                <Select
                  mode="multiple"
                  placeholder="请选择诉求事项"
                  value={form.filters.appeal_item}
                  onChange={(value) => handleFiltersChange('appeal_item', value)}
                  className="flex-1"
                >
                  <Option value="环境卫生">环境卫生</Option>
                  <Option value="交通出行">交通出行</Option>
                  <Option value="房屋建筑">房屋建筑</Option>
                  <Option value="市场监管">市场监管</Option>
                  <Option value="公共设施">公共设施</Option>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[#223355] w-20 flex-shrink-0">诉求标签：</label>
                <Select
                  mode="multiple"
                  placeholder="请选择诉求标签"
                  value={form.filters.appeal_tags}
                  onChange={(value) => handleFiltersChange('appeal_tags', value)}
                  className="flex-1"
                >
                  <Option value="紧急">紧急</Option>
                  <Option value="重复投诉">重复投诉</Option>
                  <Option value="媒体关注">媒体关注</Option>
                  <Option value="领导批示">领导批示</Option>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default ReportGenerate;