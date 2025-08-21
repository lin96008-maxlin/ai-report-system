import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, Select, DatePicker, Button, message, Switch, Tag } from 'antd';
import { BarChartOutlined, FolderOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface ContentEditModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (data: any) => void;
  editData?: any;
  mode: 'add' | 'edit';
  parent_id?: string;
  level: 1 | 2 | 3;
  onInsertDimension?: (dimension: any) => void;
  onInsertMetric?: (metric: any) => void;
}

interface ContentFormData {
  id?: string;
  title: string;
  content: string;
  workOrderEnabled: boolean;
  workOrderFilters: {
    reportTimeStart?: string;
    reportTimeEnd?: string;
    appealSource: string[];
    region: string[];
    appealItem: string[];
    appealTags: string[];
  };
}

// 预设的数据指标列表（与系统中的DataIndicator类型保持一致）
const DATA_INDICATORS = [
  { key: '工单总量', label: '工单总量', category: '基础指标', description: '统计时间段内的工单总数量' },
  { key: '环比增长率', label: '环比增长率', category: '基础指标', description: '与上一周期相比的增长率' },
  { key: '同比增长率', label: '同比增长率', category: '基础指标', description: '与去年同期相比的增长率' },
  { key: '微信工单数', label: '微信工单数', category: '来源分析', description: '通过微信渠道提交的工单数量' },
  { key: '电话工单数', label: '电话工单数', category: '来源分析', description: '通过电话渠道提交的工单数量' },
  { key: '网络工单数', label: '网络工单数', category: '来源分析', description: '通过网络平台提交的工单数量' },
  { key: '平均处理时长', label: '平均处理时长', category: '效率指标', description: '工单从提交到处理完成的平均时间' },
  { key: '满意度评分', label: '满意度评分', category: '效率指标', description: '用户对工单处理结果的满意度评分' },
  { key: '及时处理率', label: '及时处理率', category: '效率指标', description: '在规定时间内处理完成的工单比例' },
  { key: '主要问题类型', label: '主要问题类型', category: '问题分析', description: '工单中出现频率最高的问题类型' },
  { key: '占比百分比', label: '占比百分比', category: '问题分析', description: '各类问题在总工单中的占比' },
  { key: '趋势描述', label: '趋势描述', category: '趋势分析', description: '工单数量或质量的变化趋势描述' },
  { key: '预测数据', label: '预测数据', category: '趋势分析', description: '基于历史数据预测的未来趋势' }
];

// 预设的报告维度列表（与DimensionManagement中的mockDimensions保持一致）


// 按分类分组指标（使用函数避免重复计算）
const getIndicatorCategories = () => {
  return DATA_INDICATORS.reduce((acc, indicator) => {
    if (!acc[indicator.category]) {
      acc[indicator.category] = [];
    }
    acc[indicator.category].push(indicator);
    return acc;
  }, {} as Record<string, typeof DATA_INDICATORS>);
};

// 按分类分组维度（使用函数避免重复计算）


const ContentEditModal: React.FC<ContentEditModalProps> = ({
  visible,
  onCancel,
  onSave,
  editData,
  mode,
  level,

  onInsertMetric
}) => {
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    content: '',
    workOrderEnabled: false,
    workOrderFilters: {
      reportTimeStart: '',
      reportTimeEnd: '',
      appealSource: [],
      region: [],
      appealItem: [],
      appealTags: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'indicators' | 'dimensions'>('indicators');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const textAreaRef = useRef<any>(null);

  // 监听开关状态变化，仅在开关切换时处理"查看关联工单"文字
  useEffect(() => {
    const workOrderText = '\n\n查看关联工单（点击后超链反查工单列表）';
    
    if (formData.workOrderEnabled) {
      // 开关开启时，如果内容末尾没有"查看关联工单"文字，则添加
      if (!formData.content.endsWith(workOrderText)) {
        setFormData(prev => ({
          ...prev,
          content: prev.content + workOrderText
        }));
      }
    } else {
      // 开关关闭时，如果内容末尾有"查看关联工单"文字，则移除
      if (formData.content.endsWith(workOrderText)) {
        setFormData(prev => ({
          ...prev,
          content: prev.content.slice(0, -workOrderText.length)
        }));
      }
    }
  }, [formData.workOrderEnabled]); // 仅监听开关状态变化

  // 使用useMemo缓存数据分组，避免重复计算和数据混乱
  const indicatorCategories = useMemo(() => getIndicatorCategories(), []);
  

  useEffect(() => {
    if (visible) {
      // 初始化所有分类为展开状态
      const initialExpanded: Record<string, boolean> = {};
      Object.keys(indicatorCategories).forEach(category => {
        initialExpanded[category] = true;
      });
      
      setExpandedCategories(initialExpanded);
      
      if (mode === 'edit' && editData) {
        setFormData({
          ...editData,
          workOrderFilters: {
            reportTimeStart: '',
            reportTimeEnd: '',
            appealSource: [],
            region: [],
            appealItem: [],
            appealTags: [],
            ...editData.workOrderFilters
          }
        });
      } else {
        // 重置表单
        setFormData({
          title: '',
          content: '',
          workOrderEnabled: false,
          workOrderFilters: {
            reportTimeStart: '',
            reportTimeEnd: '',
            appealSource: [],
            region: [],
            appealItem: [],
            appealTags: []
          }
        });
      }
    }
  }, [visible, mode, editData, indicatorCategories]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      message.error('请输入章节标题');
      return;
    }
    if (!formData.content.trim()) {
      message.error('请输入章节内容');
      return;
    }

    // 校验关联工单配置
    if (formData.workOrderEnabled) {
      const { reportTimeStart, reportTimeEnd, appealSource, region, appealItem, appealTags } = formData.workOrderFilters;
      const hasTimeFilter = reportTimeStart && reportTimeEnd;
      const hasSourceFilter = appealSource && appealSource.length > 0;
      const hasRegionFilter = region && region.length > 0;
      const hasItemFilter = appealItem && appealItem.length > 0;
      const hasTagsFilter = appealTags && appealTags.length > 0;
      
      if (!hasTimeFilter && !hasSourceFilter && !hasRegionFilter && !hasItemFilter && !hasTagsFilter) {
        message.error('开启关联工单配置时，必须设置至少一个过滤条件');
        return;
      }
    }

    setLoading(true);
    try {
      // 模拟保存操作
      await new Promise(resolve => setTimeout(resolve, 500));
      onSave(formData);
      message.success(mode === 'add' ? '新增成功' : '编辑成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInsertIndicator = (indicator: string) => {
    const placeholder = `{{${indicator}}}`;
    
    // 获取TextArea的DOM元素和光标位置
    if (textAreaRef.current && textAreaRef.current.resizableTextArea) {
      const textArea = textAreaRef.current.resizableTextArea.textArea;
      const cursorPosition = textArea.selectionStart;
      
      // 在光标位置插入指标
      const currentContent = formData.content;
      const newContent = currentContent.slice(0, cursorPosition) + placeholder + currentContent.slice(cursorPosition);
      
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
      
      // 设置新的光标位置（在插入的指标之后）
      setTimeout(() => {
        const newCursorPosition = cursorPosition + placeholder.length;
        textArea.setSelectionRange(newCursorPosition, newCursorPosition);
        textArea.focus();
      }, 0);
    } else {
      // 如果无法获取光标位置，则在末尾添加
      const newContent = formData.content + placeholder;
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
    }
    
    // 同时插入到报告正文中（如果提供了回调函数）
    if (onInsertMetric) {
      onInsertMetric({ title: indicator });
    }
    
    message.success(`已插入指标：${indicator}`);
  };

  // 处理报告维度插入
  

  

  // 处理分类展开收起
  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getLevelText = () => {
    const levelTexts = { 1: '一级', 2: '二级', 3: '三级' };
    return levelTexts[level];
  };

  const getLevelColor = () => {
    const levelColors = { 1: 'blue', 2: 'green', 3: 'orange' };
    return levelColors[level];
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-[#E9ECF2] px-4 py-0 h-14">
          <Tag color={getLevelColor()}>{getLevelText()}章节</Tag>
          <span>{mode === 'add' ? '新增' : '编辑'}章节</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={1600}
      centered
      style={{ padding: 20, margin: 0 }}
      styles={{
        body: { height: 'calc(80vh - 40px)', padding: 20, margin: 0 },
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' }
      }}
      wrapClassName="!p-0 !m-0"
      footer={
        <div className="border-t border-[#E9ECF2]">
          <div className="flex justify-end gap-2 px-4 py-3">
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" loading={loading} onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
      }
    >
      <div className="h-full flex" style={{ gap: '0px', margin: 0, padding: 0 }}>
        {/* 左侧 - 数据指标和章节标题 */}
        <div className="w-64">
          <div className="px-4 py-4 border-b border-[#E9ECF2]">
            <label className="block text-sm font-medium text-[#223355] mb-2">
              <span className="text-[#FF4433]">*</span> 章节标题
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入章节标题"
              className="h-10"
            />
          </div>
          <div className="px-4 py-4 border-b border-[#E9ECF2]">
            <div className="text-[14px] font-medium text-[#333333]">
              数据指标
            </div>
          </div>
          <div className="px-4 py-4 overflow-y-auto" style={{ height: 'calc(80vh - 200px)', maxHeight: 'calc(80vh - 200px)' }}>
            {activeTab === 'indicators' && (
              <>
                {/* 数据指标 */}
                {Object.entries(indicatorCategories).map(([category, indicators]) => (
                <div key={category} className="mb-6">
                  <div 
                    className="flex items-center justify-between mb-3 cursor-pointer"
                    onClick={() => toggleCategoryExpanded(category)}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOutlined 
                        style={{ 
                          color: '#3388FF', 
                          fontSize: '14px',
                          minWidth: '14px'
                        }} 
                      />
                      <span className="text-sm font-medium" style={{ color: '#1f2937', fontWeight: '500' }}>{category}</span>
                    </div>
                    {expandedCategories[category] ? (
                      <DownOutlined 
                        style={{ 
                          color: '#6b7280', 
                          fontSize: '10px',
                          transition: 'transform 0.2s'
                        }} 
                      />
                    ) : (
                      <RightOutlined 
                        style={{ 
                          color: '#6b7280', 
                          fontSize: '10px',
                          transition: 'transform 0.2s'
                        }} 
                      />
                    )}
                  </div>
                  {expandedCategories[category] && (
                    <div className="space-y-1">
                      {indicators.map(indicator => (
                        <div
                          key={indicator.key}
                          className="flex items-center py-1 px-2 rounded-md cursor-pointer transition-all duration-200 group"
                          style={{ 
                            minHeight: '32px',
                            lineHeight: '20px',
                            margin: '1px 0',
                            backgroundColor: 'transparent',
                            border: '1px solid transparent',
                            borderRadius: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F0F9FF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          onClick={() => handleInsertIndicator(indicator.key)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <BarChartOutlined 
                              style={{ 
                                color: '#3388FF', 
                                fontSize: '12px',
                                minWidth: '12px'
                              }} 
                            />
                            <span 
                              className="truncate text-sm" 
                              style={{ 
                                color: '#4b5563',
                                fontWeight: '400'
                              }}
                              title={indicator.label}
                            >
                              {indicator.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                ))}
              </>
            )}
            
            
          </div>
        </div>

        {/* 中间 - 正文内容 */}
        <div className="flex-1 border-l border-r border-[#E9ECF2]">
          <div className="px-0 py-0 border-b border-[#E9ECF2]">
            <h3 className="text-sm font-medium text-[#223355] px-4 py-4">模板编辑</h3>
          </div>
          <div className="px-4 py-4 flex flex-col" style={{ height: 'calc(100% - 60px)' }}>
            <Input.TextArea
              ref={textAreaRef}
              value={formData.content}
              onChange={(e) => {
                const newValue = e.target.value;
                setFormData(prev => ({ ...prev, content: newValue }));
              }}
              placeholder="onlyoffice一直没法接入，只能先放一个普通的文本编辑器了"
              className="flex-1 resize-none"
              style={{ height: '100%' }}
            />
          </div>
        </div>

        {/* 右侧 - 关联工单配置 */}
        <div className="w-64">
          <div className="px-0 py-0 border-b border-[#E9ECF2]">
            <div className="flex items-center justify-between px-4 py-4">
              <h3 className="text-sm font-medium text-[#223355] m-0">关联工单配置</h3>
              <Switch
                size="small"
                checked={formData.workOrderEnabled}
                onChange={(checked) => setFormData(prev => ({
                  ...prev,
                  workOrderEnabled: checked
                }))}
              />
            </div>
          </div>
          {formData.workOrderEnabled && (
            <div className="px-4 py-4 space-y-4 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
            <div>
              <label className="block text-sm font-medium text-[#223355] mb-2">上报时间</label>
              <RangePicker
                size="middle"
                className="w-full"
                format="YYYY-MM-DD"
                value={formData.workOrderFilters.reportTimeStart && formData.workOrderFilters.reportTimeEnd ? 
                  [dayjs(formData.workOrderFilters.reportTimeStart), dayjs(formData.workOrderFilters.reportTimeEnd)] : null}
                onChange={(dates) => {
                  if (dates && dates.length === 2) {
                    setFormData(prev => ({
                      ...prev,
                      workOrderFilters: {
                        ...prev.workOrderFilters,
                        reportTimeStart: dates[0]?.format('YYYY-MM-DD'),
                        reportTimeEnd: dates[1]?.format('YYYY-MM-DD')
                      }
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      workOrderFilters: {
                        ...prev.workOrderFilters,
                        reportTimeStart: undefined,
                        reportTimeEnd: undefined
                      }
                    }));
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#223355] mb-2">诉求来源</label>
              <Select
                mode="multiple"
                size="middle"
                className="w-full"
                placeholder="请选择诉求来源"
                value={formData.workOrderFilters.appealSource}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  workOrderFilters: { ...prev.workOrderFilters, appealSource: value }
                }))}
              >
                <Option value="微信">微信</Option>
                <Option value="电话">电话</Option>
                <Option value="网络">网络</Option>
                <Option value="现场">现场</Option>
                <Option value="邮件">邮件</Option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#223355] mb-2">所属区域</label>
              <Select
                mode="multiple"
                size="middle"
                className="w-full"
                placeholder="请选择所属区域"
                value={formData.workOrderFilters.region}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  workOrderFilters: { ...prev.workOrderFilters, region: value }
                }))}
              >
                <Option value="市辖区A">市辖区A</Option>
                <Option value="市辖区B">市辖区B</Option>
                <Option value="县城C">县城C</Option>
                <Option value="乡镇D">乡镇D</Option>
                <Option value="开发区E">开发区E</Option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#223355] mb-2">诉求事项</label>
              <Select
                mode="multiple"
                size="middle"
                className="w-full"
                placeholder="请选择诉求事项"
                value={formData.workOrderFilters.appealItem}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  workOrderFilters: { ...prev.workOrderFilters, appealItem: value }
                }))}
              >
                <Option value="环境污染">环境污染</Option>
                <Option value="交通拥堵">交通拥堵</Option>
                <Option value="噪音扰民">噪音扰民</Option>
                <Option value="垃圾处理">垃圾处理</Option>
                <Option value="道路维修">道路维修</Option>
                <Option value="水电问题">水电问题</Option>
                <Option value="治安问题">治安问题</Option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#223355] mb-2">诉求标签</label>
              <Select
                mode="tags"
                size="middle"
                className="w-full"
                placeholder="请选择或输入诉求标签"
                value={formData.workOrderFilters.appealTags}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  workOrderFilters: { ...prev.workOrderFilters, appealTags: value }
                }))}
              >
                <Option value="紧急">紧急</Option>
                <Option value="重复投诉">重复投诉</Option>
                <Option value="媒体关注">媒体关注</Option>
                <Option value="领导批示">领导批示</Option>
                <Option value="群众反映强烈">群众反映强烈</Option>
              </Select>
            </div>

            <div className="pt-4 border-t border-[#E9ECF2]">
              <div className="text-sm text-[#6B7A99] mb-2">配置说明</div>
              <div className="text-sm text-[#6B7A99] leading-relaxed">
                这些过滤条件将在生成报告时用于筛选相关工单数据，帮助用户快速定位到与当前内容相关的具体工单信息。
              </div>
            </div>
            </div>
          )}
          {!formData.workOrderEnabled && (
            <div className="px-4 py-4">
              <div className="text-sm text-[#6B7A99] leading-relaxed">
                关联工单配置已关闭。该内容在最终生成报告时，不可以反查关联工单。
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};



export default ContentEditModal;