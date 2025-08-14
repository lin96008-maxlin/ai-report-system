import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, DatePicker, message, Modal, Empty, Collapse, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DragOutlined, EyeOutlined, EyeInvisibleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import { Level1Content, Level2Content, Level3Content } from '@/types';
import { cn } from '@/utils';
import ContentEditModal from '@/components/ContentEditModal';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;
const { TextArea } = Input;

interface ContentItem {
  id: string;
  title: string;
  content: string;
  order: number;
  level: 1 | 2 | 3;
  parentId?: string;
  children?: ContentItem[];
}

const DimensionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dimensionName, setDimensionName] = useState('工单总体概况分析');
  const [dimensionDescription, setDimensionDescription] = useState('对工单总体情况进行分析，包括数量、趋势等');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFilters, setPreviewFilters] = useState({
    reportTime: null as any,
    appealSource: '',
    region: '',
    appealItem: ''
  });
  const [previewContent, setPreviewContent] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<ContentItem | null>(null);
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add');
  const [editParentId, setEditParentId] = useState<string | undefined>();
  const [editLevel, setEditLevel] = useState<1 | 2 | 3>(1);

  // 模拟数据
  const mockContentItems: ContentItem[] = [
    {
      id: '1',
      title: '总体概况',
      content: '本月共接收工单{{工单总量}}件，较上月{{环比增长率}}。',
      order: 1,
      level: 1,
      children: [
        {
          id: '1-1',
          title: '工单数量统计',
          content: '按来源分类：微信{{微信工单数}}件，电话{{电话工单数}}件。',
          order: 1,
          level: 2,
          parentId: '1',
          children: [
            {
              id: '1-1-1',
              title: '微信渠道详情',
              content: '微信渠道工单主要集中在{{主要问题类型}}，占比{{占比百分比}}。',
              order: 1,
              level: 3,
              parentId: '1-1'
            }
          ]
        },
        {
          id: '1-2',
          title: '处理效率分析',
          content: '平均处理时长{{平均处理时长}}小时，满意度{{满意度评分}}分。',
          order: 2,
          level: 2,
          parentId: '1'
        }
      ]
    },
    {
      id: '2',
      title: '趋势分析',
      content: '工单数量呈现{{趋势描述}}趋势，预计下月{{预测数据}}。',
      order: 2,
      level: 1,
      children: []
    }
  ];

  useEffect(() => {
    if (id) {
      // 编辑模式，加载现有数据
      setContentItems(mockContentItems);
    } else {
      // 新增模式，初始化空数据
      setContentItems([]);
    }
  }, [id]);

  // 拖拽处理
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // 这里需要实现复杂的拖拽逻辑，包括同级移动和跨级移动
    // 为简化演示，这里只实现基本的顺序调整
    const newItems = Array.from(contentItems);
    const [reorderedItem] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, reorderedItem);
    
    // 更新order字段
    newItems.forEach((item, index) => {
      item.order = index + 1;
    });
    
    setContentItems(newItems);
    message.success('顺序调整成功');
  };

  // 新增一级内容
  const handleAddLevel1Content = () => {
    setEditMode('add');
    setEditParentId(undefined);
    setCurrentEditItem(null);
    setEditLevel(1);
    setEditModalVisible(true);
  };

  // 新增子内容
  const handleAddChildContent = (parentId: string) => {
    const parentItem = findItemById(contentItems, parentId);
    if (!parentItem) return;
    
    setEditMode('add');
    setEditParentId(parentId);
    setCurrentEditItem(null);
    setEditLevel((parentItem.level + 1) as 1 | 2 | 3);
    setEditModalVisible(true);
  };

  // 查找指定ID的内容项
  const findItemById = (items: ContentItem[], id: string): ContentItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 编辑内容
  const handleEditContent = (item: ContentItem) => {
    setEditMode('edit');
    setCurrentEditItem(item);
    setEditLevel(item.level);
    setEditModalVisible(true);
  };

  // 保存内容
  const handleSaveContent = (formData: any) => {
    if (editMode === 'add') {
      // 新增逻辑
      const newItem: ContentItem = {
        id: `${Date.now()}`,
        title: formData.title,
        content: formData.content,
        order: 1,
        level: editLevel,
        parentId: editParentId,
        children: []
      };

      if (editParentId) {
        // 添加到父项的children中
        const addToParent = (items: ContentItem[]): ContentItem[] => {
          return items.map(item => {
            if (item.id === editParentId) {
              return {
                ...item,
                children: [...(item.children || []), newItem]
              };
            }
            if (item.children) {
              return {
                ...item,
                children: addToParent(item.children)
              };
            }
            return item;
          });
        };
        setContentItems(prev => addToParent(prev));
      } else {
        // 添加为顶级项
        setContentItems(prev => [...prev, newItem]);
      }
    } else {
      // 编辑逻辑
      const updateItem = (items: ContentItem[]): ContentItem[] => {
        return items.map(item => {
          if (item.id === currentEditItem?.id) {
            return {
              ...item,
              title: formData.title,
              content: formData.content
            };
          }
          if (item.children) {
            return {
              ...item,
              children: updateItem(item.children)
            };
          }
          return item;
        });
      };
      setContentItems(prev => updateItem(prev));
    }
    
    setEditModalVisible(false);
  };

  // 删除内容
  const handleDeleteContent = (itemId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个内容及其所有子内容吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        // 递归删除函数
        const deleteRecursive = (items: ContentItem[], targetId: string): ContentItem[] => {
          return items.filter(item => {
            if (item.id === targetId) {
              return false;
            }
            if (item.children) {
              item.children = deleteRecursive(item.children, targetId);
            }
            return true;
          });
        };
        
        setContentItems(prev => deleteRecursive(prev, itemId));
        message.success('删除成功');
      }
    });
  };

  // 生成预览
  const handleGeneratePreview = () => {
    if (!previewFilters.reportTime || !previewFilters.appealSource || !previewFilters.region || !previewFilters.appealItem) {
      message.warning('请完善预览条件');
      return;
    }
    
    // 模拟生成预览内容
    const mockPreview = `
# ${dimensionName}

${dimensionDescription}

## 总体概况

本月共接收工单1,234件，较上月增长15.2%。

### 工单数量统计

按来源分类：微信856件，电话378件。

#### 微信渠道详情

微信渠道工单主要集中在环境污染，占比69.3%。

### 处理效率分析

平均处理时长24.5小时，满意度4.2分。

## 趋势分析

工单数量呈现上升趋势，预计下月1,400件。
    `;
    
    setPreviewContent(mockPreview);
    message.success('预览生成成功');
  };

  // 渲染内容项
  const renderContentItem = (item: ContentItem, index: number) => {
    const levelColors = {
      1: 'bg-blue-50 border-blue-200',
      2: 'bg-green-50 border-green-200', 
      3: 'bg-orange-50 border-orange-200'
    };
    
    const levelTags = {
      1: <Tag color="blue">一级</Tag>,
      2: <Tag color="green">二级</Tag>,
      3: <Tag color="orange">三级</Tag>
    };

    return (
      <Draggable key={item.id} draggableId={item.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              "mb-3 p-4 border-2 rounded-lg transition-all",
              levelColors[item.level],
              snapshot.isDragging && "shadow-lg"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div {...provided.dragHandleProps} className="cursor-move">
                  <DragOutlined className="text-gray-400" />
                </div>
                {levelTags[item.level]}
                <h4 className="font-medium text-[#223355] m-0">{item.title}</h4>
              </div>
              <div className="flex gap-1">
                {item.level < 3 && (
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddChildContent(item.id)}
                    title="新增子内容"
                  />
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditContent(item)}
                  title="编辑"
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteContent(item.id)}
                  title="删除"
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {item.content}
            </p>
            
            {/* 渲染子内容 */}
            {item.children && item.children.length > 0 && (
              <div className="ml-6 mt-3 space-y-2">
                {item.children.map((child, childIndex) => renderContentItem(child, childIndex))}
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="h-full bg-white rounded flex gap-4 mx-5 mt-5 mb-5" style={{ height: 'calc(100vh - 130px)' }}>
      {/* 左侧内容编辑区 */}
      <div className="flex-1 flex flex-col gap-4">
        {/* 维度基本信息 */}
        <Card className="shadow-sm" bodyStyle={{ padding: '20px' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#223355] mb-1">维度名称</label>
              <Input
                value={dimensionName}
                onChange={(e) => setDimensionName(e.target.value)}
                placeholder="请输入维度名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#223355] mb-1">维度描述</label>
              <Input
                value={dimensionDescription}
                onChange={(e) => setDimensionDescription(e.target.value)}
                placeholder="请输入维度描述"
              />
            </div>
          </div>
        </Card>

        {/* 操作栏 */}
        <Card className="shadow-sm" bodyStyle={{ padding: '16px' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-[#223355] m-0">内容结构</h3>
            <div className="flex gap-2">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLevel1Content}>
                新增一级内容
              </Button>
              <Button onClick={() => navigate(-1)}>
                返回
              </Button>
            </div>
          </div>
        </Card>

        {/* 内容树形卡片 */}
        <div className="flex-1 overflow-auto">
          <Card className="h-full shadow-sm" bodyStyle={{ padding: '20px', height: '100%' }}>
            {contentItems.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Empty description="暂无内容，请点击上方按钮新增一级内容" />
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="content-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {contentItems.map((item, index) => renderContentItem(item, index))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </Card>
        </div>
      </div>

      {/* 右侧预览区 */}
      <div className={cn(
        "transition-all duration-300 overflow-hidden",
        previewVisible ? "w-96" : "w-12"
      )}>
        <Card className="h-full shadow-sm" bodyStyle={{ padding: previewVisible ? '20px' : '8px', height: '100%' }}>
          {!previewVisible ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => setPreviewVisible(true)}
                className="rotate-90 text-gray-500"
              >
                展开预览
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-[#223355] m-0">预览</h3>
                <Button
                  type="text"
                  icon={<EyeInvisibleOutlined />}
                  onClick={() => setPreviewVisible(false)}
                />
              </div>
              
              {/* 预览条件 */}
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#223355] mb-1">上报时间</label>
                  <RangePicker
                    size="small"
                    className="w-full"
                    value={previewFilters.reportTime}
                    onChange={(dates) => setPreviewFilters(prev => ({ ...prev, reportTime: dates }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#223355] mb-1">诉求来源</label>
                  <Select
                    size="small"
                    className="w-full"
                    placeholder="请选择"
                    value={previewFilters.appealSource}
                    onChange={(value) => setPreviewFilters(prev => ({ ...prev, appealSource: value }))}
                  >
                    <Option value="微信">微信</Option>
                    <Option value="电话">电话</Option>
                    <Option value="网络">网络</Option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#223355] mb-1">所属区域</label>
                  <Select
                    size="small"
                    className="w-full"
                    placeholder="请选择"
                    value={previewFilters.region}
                    onChange={(value) => setPreviewFilters(prev => ({ ...prev, region: value }))}
                  >
                    <Option value="市辖区A">市辖区A</Option>
                    <Option value="市辖区B">市辖区B</Option>
                    <Option value="县城C">县城C</Option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#223355] mb-1">诉求事项</label>
                  <Select
                    size="small"
                    className="w-full"
                    placeholder="请选择"
                    value={previewFilters.appealItem}
                    onChange={(value) => setPreviewFilters(prev => ({ ...prev, appealItem: value }))}
                  >
                    <Option value="环境污染">环境污染</Option>
                    <Option value="交通拥堵">交通拥堵</Option>
                    <Option value="噪音扰民">噪音扰民</Option>
                  </Select>
                </div>
                <Button
                  type="primary"
                  size="small"
                  block
                  icon={<PlayCircleOutlined />}
                  onClick={handleGeneratePreview}
                >
                  生成预览
                </Button>
              </div>
              
              {/* 预览内容 */}
              <div className="flex-1 overflow-auto">
                {previewContent ? (
                  <div className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded border">
                    {previewContent}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    请设置预览条件并生成预览
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 内容编辑弹窗 */}
      <ContentEditModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSave={handleSaveContent}
        editData={currentEditItem ? {
          id: currentEditItem.id,
          title: currentEditItem.title,
          description: '',
          content: currentEditItem.content,
          workOrderFilters: {
            appealSource: [],
            region: [],
            appealItem: [],
            appealTags: []
          }
        } : null}
        mode={editMode}
        parentId={editParentId}
        level={editLevel}
      />
    </div>
  );
};

export default DimensionDetail;