import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, DatePicker, Button, Card, List, Tag, message } from 'antd';
import { PlusOutlined, InsertRowBelowOutlined } from '@ant-design/icons';
import OnlyOfficeEditor from '@/components/OnlyOfficeEditor';
import { cn } from '@/utils';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

interface ContentEditModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (data: ContentFormData) => void;
  editData?: ContentFormData | null;
  mode: 'add' | 'edit';
  parentId?: string;
  level: 1 | 2 | 3;
}

interface ContentFormData {
  id?: string;
  title: string;
  description: string;
  content: string;
  workOrderFilters: {
    reportTimeStart?: string;
    reportTimeEnd?: string;
    appealSource: string[];
    region: string[];
    appealItem: string[];
    appealTags: string[];
  };
}

// 预设的数据指标列表
const DATA_INDICATORS = [
  { key: '工单总量', label: '工单总量', category: '基础指标' },
  { key: '环比增长率', label: '环比增长率', category: '基础指标' },
  { key: '同比增长率', label: '同比增长率', category: '基础指标' },
  { key: '微信工单数', label: '微信工单数', category: '来源分析' },
  { key: '电话工单数', label: '电话工单数', category: '来源分析' },
  { key: '网络工单数', label: '网络工单数', category: '来源分析' },
  { key: '平均处理时长', label: '平均处理时长', category: '效率指标' },
  { key: '满意度评分', label: '满意度评分', category: '效率指标' },
  { key: '及时处理率', label: '及时处理率', category: '效率指标' },
  { key: '主要问题类型', label: '主要问题类型', category: '问题分析' },
  { key: '占比百分比', label: '占比百分比', category: '问题分析' },
  { key: '趋势描述', label: '趋势描述', category: '趋势分析' },
  { key: '预测数据', label: '预测数据', category: '趋势分析' }
];

// 按分类分组指标
const INDICATOR_CATEGORIES = DATA_INDICATORS.reduce((acc, indicator) => {
  if (!acc[indicator.category]) {
    acc[indicator.category] = [];
  }
  acc[indicator.category].push(indicator);
  return acc;
}, {} as Record<string, typeof DATA_INDICATORS>);

const ContentEditModal: React.FC<ContentEditModalProps> = ({
  visible,
  onCancel,
  onSave,
  editData,
  mode,
  parentId,
  level
}) => {
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    content: '',
    workOrderFilters: {
      appealSource: [],
      region: [],
      appealItem: [],
      appealTags: []
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && editData) {
        setFormData(editData);
      } else {
        // 重置表单
        setFormData({
          title: '',
          description: '',
          content: '',
          workOrderFilters: {
            appealSource: [],
            region: [],
            appealItem: [],
            appealTags: []
          }
        });
      }
    }
  }, [visible, mode, editData]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      message.error('请输入章节标题');
      return;
    }
    if (!formData.content.trim()) {
      message.error('请输入章节内容');
      return;
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
    const newContent = formData.content + placeholder;
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
    message.success(`已插入指标：${indicator}`);
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
        <div className="flex items-center gap-2">
          <Tag color={getLevelColor()}>{getLevelText()}内容</Tag>
          <span>{mode === 'add' ? '新增' : '编辑'}内容</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={1200}
      style={{ top: 20 }}
      bodyStyle={{ height: '80vh', padding: 0 }}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSave}>
            保存
          </Button>
        </div>
      }
    >
      <div className="h-full flex">
        {/* 左侧内容编辑区域 */}
        <div className="flex-1 flex flex-col p-5 border-r border-gray-200">
          {/* 基本信息 */}
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#223355] mb-1">章节标题 *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入章节标题"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#223355] mb-1">内容描述</label>
              <TextArea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入内容描述"
                rows={2}
              />
            </div>
          </div>

          {/* 数据指标列表 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-[#223355] mb-2">数据指标</h4>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
              {Object.entries(INDICATOR_CATEGORIES).map(([category, indicators]) => (
                <div key={category} className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">{category}</div>
                  <div className="flex flex-wrap gap-1">
                    {indicators.map(indicator => (
                      <Button
                        key={indicator.key}
                        size="small"
                        type="text"
                        className="text-xs h-6 px-2 border border-gray-300 hover:border-blue-500 hover:text-blue-500"
                        onClick={() => handleInsertIndicator(indicator.key)}
                        icon={<InsertRowBelowOutlined />}
                      >
                        {indicator.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OnlyOffice编辑器 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#223355] mb-2">章节内容 *</label>
            <div className="h-full">
              <OnlyOfficeEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                height={400}
                placeholder="请输入章节内容，可以插入数据指标占位符..."
              />
            </div>
          </div>
        </div>

        {/* 右侧关联工单配置区域 */}
        <div className="w-80 p-5">
          <h4 className="text-sm font-medium text-[#223355] mb-3">关联工单配置</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#223355] mb-1">上报时间</label>
              <RangePicker
                size="small"
                className="w-full"
                value={formData.workOrderFilters.reportTimeStart && formData.workOrderFilters.reportTimeEnd ? 
                  [formData.workOrderFilters.reportTimeStart, formData.workOrderFilters.reportTimeEnd] as any : null}
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
              <label className="block text-xs font-medium text-[#223355] mb-1">诉求来源</label>
              <Select
                mode="multiple"
                size="small"
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
              <label className="block text-xs font-medium text-[#223355] mb-1">所属区域</label>
              <Select
                mode="multiple"
                size="small"
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
              <label className="block text-xs font-medium text-[#223355] mb-1">诉求事项</label>
              <Select
                mode="multiple"
                size="small"
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
              <label className="block text-xs font-medium text-[#223355] mb-1">诉求标签</label>
              <Select
                mode="tags"
                size="small"
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

            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">配置说明</div>
              <div className="text-xs text-gray-400 leading-relaxed">
                这些过滤条件将在生成报告时用于筛选相关工单数据，帮助用户快速定位到与当前内容相关的具体工单信息。
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ContentEditModal;