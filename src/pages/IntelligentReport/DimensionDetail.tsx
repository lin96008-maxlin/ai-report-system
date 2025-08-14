import React, { useState, useEffect } from 'react';
import { Button, Input, Select, DatePicker, message, Modal, Empty, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DragOutlined, EyeOutlined, EyeInvisibleOutlined, PlayCircleOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  DropAnimation,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
// import { Level1Content, Level2Content, Level3Content } from '@/types';
import { cn } from '@/utils';
import ContentEditModal from '@/components/ContentEditModal';

const { RangePicker } = DatePicker;
const { Option } = Select;
// const { Panel } = Collapse;
// const { TextArea } = Input;

interface ContentItem {
  id: string;
  title: string;
  content: string;
  order: number;
  level: 1 | 2 | 3;
  parent_id?: string;
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
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<ContentItem | null>(null);
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add');
  const [editParentId, setEditParentId] = useState<string | undefined>();
  const [editLevel, setEditLevel] = useState<1 | 2 | 3>(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  // 获取页面标题
  const getPageTitle = () => {
    return id ? `编辑维度 - ${dimensionName}` : '新增维度';
  };

  // 保存维度
  const handleSaveDimension = () => {
    if (!dimensionName.trim()) {
      message.error('维度名称不能为空');
      return;
    }
    
    // 这里可以添加保存维度的API调用逻辑
    message.success('维度保存成功');
    navigate('/intelligent-report/dimension-management');
  };

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
          parent_id: '1',
          children: [
            {
              id: '1-1-1',
              title: '微信渠道详情',
              content: '微信渠道工单主要集中在{{主要问题类型}}，占比{{占比百分比}}。',
              order: 1,
              level: 3,
              parent_id: '1-1'
            }
          ]
        },
        {
          id: '1-2',
          title: '处理效率分析',
          content: '平均处理时长{{平均处理时长}}小时，满意度{{满意度评分}}分。',
          order: 2,
          level: 2,
          parent_id: '1'
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

  // 获取所有项目的扁平化列表，用于拖拽
  const getAllItems = (items: ContentItem[]): ContentItem[] => {
    const result: ContentItem[] = [];
    const traverse = (itemList: ContentItem[]) => {
      itemList.forEach(item => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    traverse(items);
    return result;
  };

  // 查找项目及其父项
  const findItemAndParent = (items: ContentItem[], id: string): { item: ContentItem | null, parent: ContentItem | null, parentArray: ContentItem[] } => {
    const search = (itemList: ContentItem[], parentItem: ContentItem | null = null): { item: ContentItem | null, parent: ContentItem | null, parentArray: ContentItem[] } => {
      for (const item of itemList) {
        if (item.id === id) {
          return { item, parent: parentItem, parentArray: itemList };
        }
        if (item.children && item.children.length > 0) {
          const result = search(item.children, item);
          if (result.item) return result;
        }
      }
      return { item: null, parent: null, parentArray: [] };
    };
    return search(items);
  };

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    console.log('拖拽开始:', event);
    const { active } = event;
    const { item: draggedItem } = findItemAndParent(contentItems, active.id as string);
    setActiveId(active.id as string);
    setActiveItem(draggedItem);
    setOverId(null);
    console.log('拖拽项目:', draggedItem);
    // 添加拖拽开始的视觉反馈
    document.body.style.cursor = 'grabbing';
  };

  // 拖拽悬停：仅显示悬停目标，不做任何占位符计算
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    const overId = over?.id as string | null;
    setOverId(overId);
    
    // 完全移除占位符计算，只记录悬停目标
    // 不再调用 setPlaceholderPositions
  };

  // 拖拽结束 - 精确拖拽逻辑
  const handleDragEnd = (event: DragEndEvent) => {
    console.log('拖拽结束:', event);
    const { active, over } = event;
    
    setActiveId(null);
    setActiveItem(null);
    setOverId(null);
    document.body.style.cursor = '';
    
    if (!over || active.id === over.id) {
      console.log('拖拽取消或同位置');
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // 查找拖拽项及其父项
    const { item: draggedItem } = findItemAndParent(contentItems, activeId);
    if (!draggedItem) return;

    // 防止循环引用
    const isDescendant = (parentItem: ContentItem, childId: string): boolean => {
      if (parentItem.id === childId) return true;
      if (parentItem.children) {
        return parentItem.children.some(child => isDescendant(child, childId));
      }
      return false;
    };

    if (isDescendant(draggedItem, overId)) {
      message.warning('不能将父项拖拽到其子项中');
      return;
    }

    // 从原位置移除项目
    const removeFromTree = (items: ContentItem[], targetId: string): ContentItem[] => {
      return items.filter(item => {
        if (item.id === targetId) return false;
        if (item.children) {
          item.children = removeFromTree(item.children, targetId);
        }
        return true;
      });
    };

    let newContentItems = removeFromTree([...contentItems], activeId);

    // 查找目标项及其父项
    const { item: targetItem } = findItemAndParent(newContentItems, overId);

    // 检查拖拽项是否有下级卡片
    const hasChildren = draggedItem.children && draggedItem.children.length > 0;
    
    // 检查拖拽项是否有下下级卡片（孙级卡片）
    const hasGrandchildren = (item: ContentItem): boolean => {
      if (!item.children || item.children.length === 0) return false;
      return item.children.some(child => child.children && child.children.length > 0);
    };
    const hasGrandchildrenFlag = hasGrandchildren(draggedItem);

    // 根据目标区域判断拖拽行为
    if (overId === 'root-drop-zone') {
      // 规则4：拖拽到非卡片区域，变成一级卡片
      // 规则3：如果有下下级卡片，不允许拖拽到一级或二级卡片区域，但根级区域允许
      const updatedItem = { ...draggedItem, level: 1 as const, parent_id: undefined };
      newContentItems = [...newContentItems, updatedItem];
    } else if (targetItem && targetItem.id !== draggedItem.id) {
      // 规则3：如果有下下级卡片，不允许拖拽到一级或二级卡片区域
      if (hasGrandchildrenFlag && targetItem.level < 3) {
        // 不提示位置，保持原位置
        const updatedItem = { ...draggedItem, level: draggedItem.level, parent_id: draggedItem.parent_id };
        newContentItems = [...newContentItems, updatedItem];
      }
      // 规则2：如果有下级卡片，不允许拖拽到二级卡片区域（会变成三级，可能产生四级）
      else if (hasChildren && targetItem.level === 2) {
        // 不提示位置，保持原位置
        const updatedItem = { ...draggedItem, level: draggedItem.level, parent_id: draggedItem.parent_id };
        newContentItems = [...newContentItems, updatedItem];
      }
      // 规则1：拖拽独立卡片至三级卡片区域，会变成三级卡片下的同级卡片
      else if (targetItem.level === 3 && !hasChildren) {
        // 拖拽到三级卡片区域，变成三级卡片下的同级卡片（但保持三级层级）
        const updatedItem = { ...draggedItem, level: 3 as const, parent_id: targetItem.parent_id };
        
        const addAsSibling = (items: ContentItem[]): ContentItem[] => {
          // 如果目标项的父级是顶级，添加到顶级数组
          if (!targetItem.parent_id) {
            return [...items, updatedItem];
          }
          
          // 递归查找目标项的父级并添加同级
          return items.map(item => {
            if (item.id === targetItem.parent_id) {
              return {
                ...item,
                children: [...(item.children || []), updatedItem]
              };
            }
            if (item.children) {
              return {
                ...item,
                children: addAsSibling(item.children)
              };
            }
            return item;
          });
        };
        newContentItems = addAsSibling(newContentItems);
      }
      // 正常拖拽规则：根据目标卡片层级决定新层级
      else if (targetItem.level < 3 && !hasGrandchildrenFlag && !(hasChildren && targetItem.level === 2)) {
        const newLevel = (targetItem.level + 1) as 1 | 2 | 3;
        const updatedItem = { ...draggedItem, level: newLevel, parent_id: targetItem.id };
        
        const addAsChild = (items: ContentItem[]): ContentItem[] => {
          return items.map(item => {
            if (item.id === targetItem.id) {
              return {
                ...item,
                children: [...(item.children || []), updatedItem]
              };
            }
            if (item.children) {
              return {
                ...item,
                children: addAsChild(item.children)
              };
            }
            return item;
          });
        };
        newContentItems = addAsChild(newContentItems);
      } else {
        // 不满足任何允许条件，保持原位置
        const updatedItem = { ...draggedItem, level: draggedItem.level, parent_id: draggedItem.parent_id };
        newContentItems = [...newContentItems, updatedItem];
      }
    } else {
      // 无法确定目标区域，保持原位置
      const updatedItem = { ...draggedItem, level: draggedItem.level, parent_id: draggedItem.parent_id };
      newContentItems = [...newContentItems, updatedItem];
    }

    setContentItems(newContentItems);
    message.success('拖拽成功');
  };

  const dropAnimation: DropAnimation = {
    duration: 0,
    easing: 'ease',
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
  const handleAddChildContent = (parent_id: string) => {
    const parentItem = findItemById(contentItems, parent_id);
    if (!parentItem) return;
    
    setEditMode('add');
    setEditParentId(parent_id);
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
        parent_id: editParentId,
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
      content: (
        <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 8, marginBottom: 8 }}>
          确定要删除这个内容及其所有子内容吗？删除后无法恢复。
        </div>
      ),
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

  // 可拖拽的内容项组件
  const SortableContentItem: React.FC<{ item: ContentItem; index?: number }> = ({ item }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id: item.id,
      data: {
        type: 'content-item',
        item: item
      }
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

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
      <div
        ref={setNodeRef}
        style={{
          ...style,
          touchAction: 'none',
          ...(isDragging || (activeId && overId === item.id) ? { '--tw-ring-color': '#3388FF' } : {})
        }}
        {...attributes} 
        {...listeners} 
        className={cn(
          "mb-3 p-4 border-2 rounded-lg transition-all cursor-grab active:cursor-grabbing",
          levelColors[item.level],
          isDragging ? "ring-2 shadow-lg" : "hover:shadow-md",
          activeId && overId === item.id ? "ring-2" : ""
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 select-none">
            <DragOutlined className="hover:opacity-80" style={{ color: '#3388FF' }} />
            {levelTags[item.level]}
            <h4 className="font-medium text-[#223355] m-0">{item.title}</h4>
          </div>
          <div className="flex gap-1 ml-2">
            {item.level < 3 && (
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChildContent(item.id);
                }}
                title="新增子内容"
              />
            )}
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEditContent(item);
              }}
              title="编辑"
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteContent(item.id);
              }}
              title="删除"
            />
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-2 line-clamp-2 select-none">
          {item.content}
        </p>
        
        {/* 渲染子内容 - 始终渲染子内容区域，即使没有子项，以便支持拖拽到此处 */}
        <div className="ml-6 mt-3 space-y-2 min-h-[20px]">
          {item.children && item.children.length > 0 ? (
            item.children.map((child) => (
              <SortableContentItem key={child.id} item={child} />
            ))
          ) : (
            // 空子内容区域，用于接收拖拽，但不显示提示文字
            <div className="min-h-[20px]"></div>
          )}
        </div>
      </div>
    );
  };

  // 渲染内容项
  const renderContentItem = (item: ContentItem) => {
    return (
      <div key={item.id} className="relative">
        <SortableContentItem item={item} />
      </div>
    );
  };



  return (
    <div className="h-full bg-white rounded flex mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
      <div className="flex-1 flex flex-col">
        {/* 页面标题栏 */}
        <div className="p-5 border-b border-[#E9ECF2]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-[#223355] m-0">{getPageTitle()}</h2>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/intelligent-report/dimension-management')}>
                返回
              </Button>
              <Button type="primary" onClick={handleSaveDimension}>
                {id ? '保存' : '创建'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 维度基本信息 */}
          <div className="p-5 border-b border-[#E9ECF2]">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#223355] whitespace-nowrap">
                  <span className="text-red-500 mr-1">*</span>维度名称
                </label>
                <Input
                  value={dimensionName}
                  onChange={(e) => setDimensionName(e.target.value)}
                  placeholder="请输入维度名称"
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#223355] whitespace-nowrap">维度描述</label>
                <Input
                  value={dimensionDescription}
                  onChange={(e) => setDimensionDescription(e.target.value)}
                  placeholder="请输入维度描述"
                />
              </div>
            </div>
          </div>

          {/* 内容编辑区域 */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* 左侧内容树形卡片 */}
            <div className="flex-1 flex flex-col border-r border-[#E9ECF2] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E9ECF2] flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#223355] m-0">内容结构</h3>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLevel1Content}>
                  新增一级内容
                </Button>
              </div>
              <div className="flex-1 p-5 overflow-auto">
                {contentItems.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <Empty description="暂无内容，请点击上方按钮新增一级内容" />
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    autoScroll={{ threshold: { x: 0.2, y: 0.2 } }}
                  >
                    <SortableContext items={getAllItems(contentItems).map(item => item.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3 min-h-[200px]">
                        {contentItems.map((item) => renderContentItem(item))}
                      </div>
                    </SortableContext>
                    
                    {/* 根级放置区域 - 紧凑的非卡片区域 */}
                    <div
                      id="root-drop-zone"
                      data-id="root-drop-zone"
                      className={cn(
                        "h-8 transition-all",
                        activeId && overId === 'root-drop-zone' 
                          ? "border-2 border-blue-400 bg-blue-50 rounded" 
                          : "border-2 border-transparent",
                        contentItems.length > 0 ? "mt-3" : ""
                      )}
                    >
                      {activeId && overId === 'root-drop-zone' ? (
                        <div className="h-full flex items-center justify-center text-sm font-medium" style={{ color: '#3388FF' }}>
                          拖拽到此处作为一级卡片
                        </div>
                      ) : null}
                    </div>
                    <DragOverlay dropAnimation={dropAnimation}>
                      {activeItem ? (
                        <div className={cn(
                            "p-4 border-2 rounded-lg shadow-lg bg-white",
                            (() => {
                              const targetItem = overId && overId !== 'root-drop-zone' ? findItemById(contentItems, overId) : null;
                              
                              // 检查拖拽项是否有下级卡片
                              const hasChildren = activeItem.children && activeItem.children.length > 0;
                              const hasGrandchildren = (item: ContentItem): boolean => {
                                if (!item.children || item.children.length === 0) return false;
                                return item.children.some(child => child.children && child.children.length > 0);
                              };
                              const hasGrandchildrenFlag = hasGrandchildren(activeItem);
                              
                              if (overId === 'root-drop-zone') {
                                return 'border-blue-400 bg-blue-50';
                              }
                              if (targetItem) {
                                // 规则限制检查
                                if (hasGrandchildrenFlag && targetItem.level < 3) {
                                  return 'border-gray-300 bg-gray-50';
                                }
                                if (hasChildren && targetItem.level === 2) {
                                  return 'border-gray-300 bg-gray-50';
                                }
                                if (targetItem.level < 3) {
                                  const newLevel = Math.min(targetItem.level + 1, 3);
                                  return newLevel === 1 ? 'border-blue-400 bg-blue-50' :
                                         newLevel === 2 ? 'border-green-400 bg-green-50' :
                                         'border-orange-400 bg-orange-50';
                                }
                                if (targetItem.level === 3 && !hasChildren) {
                                  return 'border-orange-400 bg-orange-50';
                                }
                              }
                              return activeItem.level === 1 ? 'border-blue-400 bg-blue-50' :
                                     activeItem.level === 2 ? 'border-green-400 bg-green-50' :
                                     'border-orange-400 bg-orange-50';
                            })()
                          )}>
                          <div className="flex items-center gap-2">
                            <DragOutlined className="text-gray-500" />
                            <Tag color={(() => {
                              const targetItem = overId && overId !== 'root-drop-zone' ? findItemById(contentItems, overId) : null;
                              
                              // 检查拖拽项是否有下级卡片
                              const hasChildren = activeItem.children && activeItem.children.length > 0;
                              const hasGrandchildren = (item: ContentItem): boolean => {
                                if (!item.children || item.children.length === 0) return false;
                                return item.children.some(child => child.children && child.children.length > 0);
                              };
                              const hasGrandchildrenFlag = hasGrandchildren(activeItem);
                              
                              if (overId === 'root-drop-zone') {
                                return 'blue';
                              }
                              if (targetItem) {
                                // 规则限制检查
                                if (hasGrandchildrenFlag && targetItem.level < 3) {
                                  return 'default';
                                }
                                if (hasChildren && targetItem.level === 2) {
                                  return 'default';
                                }
                                if (targetItem.level < 3) {
                                  const newLevel = Math.min(targetItem.level + 1, 3);
                                  return newLevel === 1 ? 'blue' : newLevel === 2 ? 'green' : 'orange';
                                }
                                if (targetItem.level === 3 && !hasChildren) {
                                  return 'orange';
                                }
                              }
                              return activeItem.level === 1 ? 'blue' : activeItem.level === 2 ? 'green' : 'orange';
                            })()}>
                              拖拽中 - {(() => {
                                const targetItem = overId && overId !== 'root-drop-zone' ? findItemById(contentItems, overId) : null;
                                
                                // 检查拖拽项是否有下级卡片
                                const hasChildren = activeItem.children && activeItem.children.length > 0;
                                const hasGrandchildren = (item: ContentItem): boolean => {
                                  if (!item.children || item.children.length === 0) return false;
                                  return item.children.some(child => child.children && child.children.length > 0);
                                };
                                const hasGrandchildrenFlag = hasGrandchildren(activeItem);
                                
                                if (overId === 'root-drop-zone') {
                                  return '一级';
                                }
                                if (targetItem) {
                                  // 规则限制检查
                                  if (hasGrandchildrenFlag && targetItem.level < 3) {
                                    return '不允许';
                                  }
                                  if (hasChildren && targetItem.level === 2) {
                                    return '不允许';
                                  }
                                  if (targetItem.level < 3) {
                                    const newLevel = Math.min(targetItem.level + 1, 3);
                                    return newLevel === 1 ? '一级' : newLevel === 2 ? '二级' : newLevel === 3 ? '三级' : '';
                                  }
                                  if (targetItem.level === 3 && !hasChildren) {
                                    return '三级同级';
                                  }
                                }
                                return activeItem.level === 1 ? '一级' : activeItem.level === 2 ? '二级' : activeItem.level === 3 ? '三级' : '';
                              })()}
                            </Tag>
                            <h4 className="font-medium text-[#223355] m-0">{activeItem.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {activeItem.content}
                          </p>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                )}
              </div>
            </div>

            {/* 右侧预览区 */}
            <div className={cn(
              "transition-all duration-300 overflow-hidden flex flex-col",
              previewVisible ? "w-96" : "w-12"
            )}>
              {previewVisible && (
                <div className="px-5 py-4 border-b border-[#E9ECF2] flex items-center justify-between">
                  <h3 className="text-lg font-medium text-[#223355] m-0">预览</h3>
                  <div className="flex gap-2">

                    <Button
                      type="text"
                      icon={<EyeInvisibleOutlined />}
                      onClick={() => setPreviewVisible(false)}
                    >
                      收起预览
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-auto" style={{ padding: previewVisible ? '20px' : '8px' }}>
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
              
                  {/* 预览条件 */}
                  {!filtersCollapsed && (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-3 mb-3">
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
                            <Option value="">全部</Option>
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
                            <Option value="">全部</Option>
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
                            <Option value="">全部</Option>
                            <Option value="环境污染">环境污染</Option>
                            <Option value="交通拥堵">交通拥堵</Option>
                            <Option value="噪音扰民">噪音扰民</Option>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={() => {
                        handleGeneratePreview();
                        setFiltersCollapsed(true);
                      }}
                    >
                      生成预览
                    </Button>
                    <Button
                      size="small"
                      icon={filtersCollapsed ? <DownOutlined /> : <UpOutlined />}
                      onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                    >
                      {filtersCollapsed ? '展开条件' : '收起条件'}
                    </Button>
                  </div>
                  
                  {/* 预览内容 */}
                  <div className="flex-1 overflow-auto mt-4">
                    {previewContent ? (
                      <div className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded border">
                        {previewContent}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        点击上方按钮生成预览
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* 内容编辑弹窗 */}
        <ContentEditModal
          visible={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onSave={handleSaveContent}
          editData={currentEditItem ? {
            id: currentEditItem.id,
            title: currentEditItem.title,
            // description: '',
            content: currentEditItem.content,
            workOrderFilters: {
              appealSource: [],
              region: [],
              appealItem: [],
              appealTags: []
            }
          } : null}
          mode={editMode}
          parent_id={editParentId}
          level={editLevel}
        />
      </div>
    </div>
  );
};

export default DimensionDetail;