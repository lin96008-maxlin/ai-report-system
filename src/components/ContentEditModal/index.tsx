import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, DatePicker, Button, Tag, message } from 'antd';
import { InsertRowBelowOutlined } from '@ant-design/icons';

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
}

interface ContentFormData {
  id?: string;
  title: string;
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
  level
}) => {
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
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
        <div className="flex items-center gap-2 border-b border-[#E9ECF2] px-4 py-0 h-14">
          <Tag color={getLevelColor()}>{getLevelText()}内容</Tag>
          <span>{mode === 'add' ? '新增' : '编辑'}内容</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={1600}
      centered
      style={{ padding: 20, margin: 0 }}
      bodyStyle={{ height: 'calc(80vh - 40px)', padding: 20, margin: 0 }}
      wrapClassName="!p-0 !m-0"
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
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
          <div className="px-0 py-0 border-b border-[#E9ECF2]">
            <h3 className="text-base font-medium text-[#223355] px-4 py-4">数据指标</h3>
          </div>
          <div className="px-4 py-4 overflow-y-auto" style={{ height: 'calc(100vh - 300px)', maxHeight: '500px' }}>
            {Object.entries(INDICATOR_CATEGORIES).map(([category, indicators]) => (
              <div key={category} className="mb-6">
                <div className="text-sm font-medium text-[#223355] mb-3">{category}</div>
                <div className="space-y-2">
                  {indicators.map(indicator => (
                    <Button
                      key={indicator.key}
                      size="small"
                      type="text"
                      className="text-xs h-8 w-full justify-start text-left border border-[#E9ECF2] hover:border-[#3388FF] hover:text-[#3388FF] rounded"
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

        {/* 中间 - 正文内容 */}
        <div className="flex-1 border-l border-r border-[#E9ECF2]">
          <div className="px-0 py-0 border-b border-[#E9ECF2]">
            <h3 className="text-base font-medium text-[#223355] px-4 py-4">正文编辑</h3>
          </div>
          <div className="px-4 py-4 flex flex-col" style={{ height: 'calc(100% - 60px)' }}>
            <Input.TextArea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="onlyoffice一直没法接入，只能先放一个普通的文本编辑器了"
              className="flex-1 resize-none"
              style={{ height: '100%' }}
            />
          </div>
        </div>

        {/* 右侧 - 关联工单配置 */}
        <div className="w-64">
          <div className="px-0 py-0 border-b border-[#E9ECF2]">
            <h3 className="text-base font-medium text-[#223355] px-4 py-4">关联工单配置</h3>
          </div>
          <div className="px-4 py-4 space-y-4 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
            <div>
              <label className="block text-sm font-medium text-[#223355] mb-2">上报时间</label>
              <RangePicker
                size="middle"
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
        </div>
      </div>
    </Modal>
  );
};



export default ContentEditModal;