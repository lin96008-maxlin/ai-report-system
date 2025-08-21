/**
 * 报告模板编辑组件
 * 
 * 数据隔离策略说明：
 * 1. 模板关联工单配置与维度管理原始数据完全物理隔离
 * 2. 通过dataSource字段标识数据来源（template_config vs dimension_original）
 * 3. 使用templateId关联到具体模板，originalDimensionId记录原始维度但不直接引用
 * 4. 深拷贝过滤条件数组，确保修改不影响原始数据
 * 5. 版本控制和时间戳确保数据变更可追踪和同步
 * 6. 所有CRUD操作都更新隔离相关字段，保证数据一致性
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Select, Form, message, Tabs, Row, Col, DatePicker, Tree, Table, Modal, Card, Space, Typography, TreeSelect, Tag, Empty } from 'antd';
import type { TreeDataNode } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, EyeOutlined, EyeInvisibleOutlined, PlayCircleOutlined, DownOutlined, UpOutlined, BarChartOutlined, FolderOutlined, DeleteOutlined, HolderOutlined, EditOutlined, PlusOutlined, DragOutlined } from '@ant-design/icons';
import ContentEditModal from '@/components/ContentEditModal';
import {
  DndContext,
  closestCorners,
  closestCenter,
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
import { CSS } from '@dnd-kit/utilities';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/utils';
import { useAppStore } from '@/store';
import type { ReportTemplate } from '../../types';
import dayjs from 'dayjs';
import './ReportTemplateEdit.css';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Column } = Table;
const { Text } = Typography;

// 内容项接口定义
interface ContentItem {
  id: string;
  title: string;
  content: string;
  order: number;
  level: 1 | 2 | 3;
  parent_id?: string;
  children?: ContentItem[];
  workOrderEnabled?: boolean;
  workOrderFilters?: {
    reportTimeStart?: string;
    reportTimeEnd?: string;
    appealSource: string[];
    region: string[];
    appealItem: string[];
    appealTags: string[];
  };
}

// 可拖拽的表格行组件
const DraggableRow = ({ index, moveRow, className, style, ...restProps }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: restProps['data-row-key'],
  });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <tr
      ref={setNodeRef}
      style={{ ...style, ...dragStyle }}
      className={className}
      {...restProps}
      {...attributes}
    >
      {React.Children.map(restProps.children, (child, childIndex) => {
        if (childIndex === 1) {
          // 第二列为拖拽列，显示拖拽图标
          return React.cloneElement(child, {
            children: (
              <HolderOutlined
                style={{ cursor: 'grab', color: '#999' }}
                {...listeners}
              />
            ),
          });
        }
        // 其他列保持原样，包括第一列的复选框
        return child;
      })}
    </tr>
  );
};

const ReportTemplateEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // const _location = useLocation();
  const { addTab: _addTab, removeTab, setSelectedMenuKey } = useAppStore();
  const [form] = Form.useForm();
  const [ticketSearchForm] = Form.useForm();
  const [appealsSearchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('edit');
  const [dimensionMetricTab, setDimensionMetricTab] = useState('dimensions');
  
  // 预览过滤条件状态
  const [previewFilters, setPreviewFilters] = useState({
    reportTime: null,
    appealSource: '',
    region: '',
    appealItem: ''
  });
  
  // 预览结果状态
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  
  // 文本选择相关状态
  const [selectedText, setSelectedText] = useState('');
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  
  // 编辑器引用
  const editorRef = useRef<any>(null);
  const [editorContent, setEditorContent] = useState('');
  
  // 表单数据
  const [_templateData, setTemplateData] = useState<ReportTemplate>({
    id: '',
    name: '',
    description: '',
    type: '月报' as const,
    content_structure: {
      rich_text_content: '',
      embedded_dimensions: []
    },
    is_published: false,
    created_at: '',
    created_by: '',
    updated_at: '',
    updated_by: ''
  });

  // 数据指标状态
  const [dataMetrics, setDataMetrics] = useState([]);

  // 报告维度状态
  const [reportDimensions, setReportDimensions] = useState<any[]>([]);
  
  // 关联工单相关状态
  const [relatedTickets, setRelatedTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [_ticketQueryParams, _setTicketQueryParams] = useState({
    sectionName: '',
    sectionContent: '',
    sectionLevel: ''
  });
  
  // 编辑过滤条件弹窗相关状态
  const [editFilterVisible, setEditFilterVisible] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [editFilterForm] = Form.useForm();
  
  // 查看关联诉求弹窗相关状态
  const [viewAppealsVisible, setViewAppealsVisible] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [appealsData, setAppealsData] = useState<any[]>([]);
  const [appealsLoading, setAppealsLoading] = useState(false);
  
  // 模板编辑相关状态
  const [templateContentItems, setTemplateContentItems] = useState<ContentItem[]>([]);
  const [templateEditModalVisible, setTemplateEditModalVisible] = useState(false);
  const [currentTemplateEditItem, setCurrentTemplateEditItem] = useState<any>(null);
  const [templateEditMode, setTemplateEditMode] = useState<'add' | 'edit'>('add');
  const [templateEditParentId, setTemplateEditParentId] = useState<string | undefined>(undefined);
  const [templateEditLevel, setTemplateEditLevel] = useState<1 | 2 | 3>(1);

  // 拖拽传感器配置
  const templateSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // 新增章节编辑相关状态
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  
  // 维度选择相关状态
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [dimensionCategories, setDimensionCategories] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState<any[]>([]);
  
  // 将分类数据转换为TreeSelect格式
  const buildTreeData = (categories: Array<{
    id: string;
    name: string;
    parent_id?: string;
    description?: string;
    created_at?: string;
    created_by?: string;
  }>) => {
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // 创建所有节点
    categories.forEach((category: any) => {
      categoryMap.set(category.id, {
        value: category.id,
        title: category.name,
        key: category.id,
        children: []
      });
    });

    // 构建树结构
    categories.forEach((category: any) => {
      const node = categoryMap.get(category.id);
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    });

    return rootCategories;
  };
  
  // 模板编辑相关函数
  
  const handleEditTemplateContent = (item: ContentItem) => {
    setTemplateEditMode('edit');
    setCurrentTemplateEditItem(item);
    setTemplateEditModalVisible(true);
  };
  
  const handleDeleteTemplateContent = (itemId: string) => {
    const deleteItem = (items: ContentItem[]): ContentItem[] => {
      return items.filter(item => {
        if (item.id === itemId) {
          return false;
        }
        if (item.children) {
          item.children = deleteItem(item.children);
        }
        return true;
      });
    };
    setTemplateContentItems(prev => deleteItem(prev));
    message.success('删除成功');
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const item = findTemplateItem(templateContentItems, active.id as string);
    setActiveItem(item);
    setOverId(null);
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? over.id as string : null);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveItem(null);
    setOverId(null);
    
    if (!over || active.id === over.id) {
      return;
    }
    
    // 这里可以添加拖拽排序逻辑
    console.log('拖拽结束:', { activeId: active.id, overId: over.id });
  };
  
  // 获取所有项目ID的辅助函数
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
  

  
  const findTemplateItem = (items: ContentItem[], id: string): ContentItem | null => {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.children) {
        const found = findTemplateItem(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  // 渲染模板内容项
  const renderTemplateContentItem = (item: ContentItem) => {
    const isActive = templateActiveId === item.id;
    const isOver = templateOverId === item.id;
    
    return (
      <DraggableContentCard
        key={item.id}
        item={item}
        isActive={isActive}
        isOver={isOver}
      />
    );
  };
  
  const handleTemplateEditSave = (values: any) => {
    if (templateEditMode === 'add') {
      const newItem: ContentItem = {
        id: Date.now().toString(),
        title: values.title,
        content: values.content,
        level: templateEditLevel!,
        order: templateContentItems.length,
        parent_id: templateEditParentId,
        children: [],
      };
      
      if (templateEditParentId) {
        // 添加到父级的children中
        const addToParent = (items: ContentItem[]): ContentItem[] => {
          return items.map(item => {
            if (item.id === templateEditParentId) {
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
        setTemplateContentItems(prev => addToParent(prev));
      } else {
        setTemplateContentItems(prev => [...prev, newItem]);
      }
      message.success('添加成功');
    } else {
      // 编辑模式
      const updateItem = (items: ContentItem[]): ContentItem[] => {
        return items.map(item => {
          if (item.id === currentTemplateEditItem?.id) {
            return {
              ...item,
              title: values.title,
              content: values.content
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
      setTemplateContentItems(prev => updateItem(prev));
      message.success('修改成功');
    }
    setTemplateEditModalVisible(false);
  };
  
  const handleTemplateEditCancel = () => {
    setTemplateEditModalVisible(false);
    setCurrentTemplateEditItem(null);
  };
  
  // 可拖拽的内容卡片组件
  const DraggableContentCard = ({ item, isActive, isOver }: { item: ContentItem; isActive: boolean; isOver: boolean }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: item.id });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isActive ? 0.5 : 1,
      touchAction: 'none',
      ...(isActive || isOver ? { '--tw-ring-color': '#3388FF' } : {})
    };
    
    const levelColors = {
      1: 'bg-blue-50 border-blue-200',
      2: 'bg-green-50 border-green-200', 
      3: 'bg-orange-50 border-orange-200'
    };
    
    const levelTags = {
      1: <Tag color="blue">一级章节</Tag>,
      2: <Tag color="green">二级章节</Tag>,
      3: <Tag color="orange">三级章节</Tag>
    };
    
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "mb-3 p-4 border-2 rounded-lg transition-all cursor-grab active:cursor-grabbing",
          levelColors[item.level],
          isActive ? "ring-2 shadow-lg" : "hover:shadow-md",
          isActive && isOver ? "ring-2" : ""
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
                handleEditTemplateContent(item);
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
                handleDeleteTemplateContent(item.id);
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
              <DraggableContentCard key={child.id} item={child} isActive={templateActiveId === child.id} isOver={templateOverId === child.id} />
            ))
          ) : (
            // 空子内容区域，用于接收拖拽，但不显示提示文字
            <div className="min-h-[20px]"></div>
          )}
        </div>
      </div>
    );
  };
  


  // 获取页面标题
  const getPageTitle = () => {
    return id ? '编辑模板' : '新增模板';
  };
  
  // 关联工单查询
  const handleTicketSearch = () => {
    const values = ticketSearchForm.getFieldsValue();
    _setTicketQueryParams(values);
    
    // 实现实际查询逻辑
    let filteredTickets = [...relatedTickets];
    
    // 按章节名称筛选
    if (values.sectionName && values.sectionName.trim()) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.sectionName && ticket.sectionName.toLowerCase().includes(values.sectionName.toLowerCase().trim())
      );
    }
    
    // 按章节内容筛选
    if (values.sectionContent && values.sectionContent.trim()) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.sectionContent && ticket.sectionContent.toLowerCase().includes(values.sectionContent.toLowerCase().trim())
      );
    }
    
    // 按章节级别筛选
    if (values.sectionLevel) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.sectionLevel === values.sectionLevel
      );
    }
    
    // 更新显示的数据
    setFilteredTickets(filteredTickets);
    console.log('查询关联工单:', values, '筛选结果:', filteredTickets);
  };
  
  // 关联工单重置
  const handleTicketReset = () => {
    ticketSearchForm.resetFields();
    _setTicketQueryParams({
      sectionName: '',
      sectionContent: '',
      sectionLevel: ''
    });
    setFilteredTickets(relatedTickets); // 重置为显示所有数据
  };
  
  // 批量删除关联工单
  const handleBatchDeleteTickets = () => {
    if (selectedTicketIds.length === 0) {
      message.warning('请选择要删除的记录');
      return;
    }
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedTicketIds.length} 条关联章节记录吗？删除后不可恢复。`,
      okText: '确定删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        // 删除选中的记录
        const newRelatedTickets = relatedTickets.filter(ticket => !selectedTicketIds.includes(ticket.id));
        setRelatedTickets(newRelatedTickets);
        setSelectedTicketIds([]);
        message.success(`已删除 ${selectedTicketIds.length} 条记录`);
      }
    });
  };
  
  // 编辑关联工单
  const handleEditTicket = (record: any) => {
    setEditingTicket(record);
    
    // 处理维度过滤条件
    const workOrderFilters = record.workOrderFilters || {};
    
    editFilterForm.setFieldsValue({
      sectionName: record.sectionName,
      sectionContent: record.sectionContent,
      sectionLevel: record.sectionLevel,
      filterConditions: record.filterConditions || '',
      remark: record.remark || '',
      // 带入维度内容设置的过滤条件
      reportTime: workOrderFilters.reportTimeStart && workOrderFilters.reportTimeEnd ? 
        [dayjs(workOrderFilters.reportTimeStart), dayjs(workOrderFilters.reportTimeEnd)] : undefined,
      appealSource: workOrderFilters.appealSource && workOrderFilters.appealSource.length > 0 ? 
        workOrderFilters.appealSource[0] : undefined,
      belongArea: workOrderFilters.region && workOrderFilters.region.length > 0 ? 
        workOrderFilters.region[0] : undefined,
      appealMatter: workOrderFilters.appealItem && workOrderFilters.appealItem.length > 0 ? 
        workOrderFilters.appealItem[0] : undefined,
      appealTags: workOrderFilters.appealTags || []
    });
    setEditFilterVisible(true);
  };
  
  // 保存编辑过滤条件
  const handleSaveEditFilter = async () => {
    try {
      const values = await editFilterForm.validateFields();
      const updatedTickets = relatedTickets.map(ticket => 
        ticket.id === editingTicket.id 
          ? { 
              ...ticket,
              sectionName: values.sectionName,
              sectionContent: values.sectionContent,
              sectionLevel: values.sectionLevel,
              filterConditions: values.filterConditions || '',
              remark: values.remark || '',
              // 更新workOrderFilters结构
              workOrderFilters: {
                ...ticket.workOrderFilters,
                reportTimeStart: values.reportTime && values.reportTime[0] ? values.reportTime[0].format('YYYY-MM-DD') : '',
                reportTimeEnd: values.reportTime && values.reportTime[1] ? values.reportTime[1].format('YYYY-MM-DD') : '',
                appealSource: values.appealSource ? [values.appealSource] : [],
                region: values.belongArea ? [values.belongArea] : [],
                appealItem: values.appealMatter ? [values.appealMatter] : [],
                appealTags: values.appealTags || []
              },
              // 数据隔离：更新版本和时间戳，确保数据变更可追踪
              updatedAt: new Date().toISOString(),
              version: (ticket.version || 1) + 1
            }
          : ticket
      );
      setRelatedTickets(updatedTickets);
      setEditFilterVisible(false);
      setEditingTicket(null);
      editFilterForm.resetFields();
      message.success('过滤条件更新成功');
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };
  
  // 取消编辑过滤条件
  const handleCancelEditFilter = () => {
    setEditFilterVisible(false);
    setEditingTicket(null);
    editFilterForm.resetFields();
  };
  
  // 查看关联诉求
  const handleViewRelatedAppeals = (record: any) => {
    // 检查是否已设置预览条件并生成预览
    if (!previewContent) {
      message.warning('请在设置预览条件，生成预览后查看关联诉求');
      return;
    }
    
    setCurrentTicket(record);
    setViewAppealsVisible(true);
    // 模拟加载关联诉求数据
    loadAppealsData(record);
  };
  
  // 加载关联诉求数据
  const loadAppealsData = async (_ticket: any) => {
    setAppealsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      const mockData = [
        {
          id: '1',
          appealId: 'SQ202401001',
          appealSource: '微信',
          region: '市辖区A',
          appealItem: '环境污染',
          appealContent: '小区附近工厂排放废气，影响居民生活',
          reportTime: '2024-01-15 09:30:00',
          status: '已处理'
        },
        {
          id: '2',
          appealId: 'SQ202401002',
          appealSource: '电话',
          region: '市辖区A',
          appealItem: '噪音扰民',
          appealContent: '夜间施工噪音过大，影响休息',
          reportTime: '2024-01-16 22:15:00',
          status: '处理中'
        }
      ];
      
      setAppealsData(mockData);
    } catch (error) {
      message.error('加载关联诉求数据失败');
    } finally {
      setAppealsLoading(false);
    }
  };
  
  // 关闭查看关联诉求弹窗
  const handleCloseViewAppeals = () => {
    setViewAppealsVisible(false);
    setCurrentTicket(null);
    setAppealsData([]);
    appealsSearchForm.resetFields();
  };
  
  // 查询关联诉求
  // const _handleSearchAppeals = () => {
  //   const values = appealsSearchForm.getFieldsValue();
  //   console.log('查询关联诉求:', values);
  //   // 这里可以根据查询条件重新加载数据
  //   loadAppealsData(currentTicket);
  // };
  
  // 重置关联诉求查询条件
  const handleResetAppealsSearch = () => {
    appealsSearchForm.resetFields();
    loadAppealsData(currentTicket);
  };
  
  // 删除单个关联工单
  const handleDeleteTicket = (record: any) => {
    // TODO: 实际删除逻辑
    console.log('删除关联工单:', record);
    message.success('删除成功');
  };

  // 从localStorage构建层级数据结构
  const buildHierarchicalData = (items: any[], type: 'dimensions' | 'metrics') => {
    if (type === 'dimensions') {
      // 维度数据：根据分类构建层级
      // const result: any[] = [];
      const categoryMap = new Map();
      
      // 首先获取所有分类
      const categories = JSON.parse(localStorage.getItem('dimensionCategories') || '[]');
      
      // 构建分类层级
      categories.forEach((cat: any) => {
        categoryMap.set(cat.id, {
          ...cat,
          key: `category-${cat.id}`,
          title: cat.name,
          children: [],
          isCategory: true
        });
      });
      
      // 构建分类树
      const rootCategories: any[] = [];
      categories.forEach((cat: any) => {
        const categoryNode = categoryMap.get(cat.id);
        if (!cat.parent_id) {
          rootCategories.push(categoryNode);
        } else {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children.push(categoryNode);
          }
        }
      });
      
      // 将维度添加到对应分类下
      items.forEach((item: any) => {
        if (item.category_id) {
          const category = categoryMap.get(item.category_id);
          if (category) {
            category.children.push({
              ...item,
              key: `dimension-${item.id}`,
              title: item.name,
              isLeaf: true,
              isDimension: true
            });
          }
        }
      });
      
      // 递归排序和过滤分类（维度在前，子分类在后）
      const sortAndFilterCategories = (categories: any[]): any[] => {
        return categories.filter(category => {
          if (category.isCategory) {
            // 递归处理子分类
            category.children = sortAndFilterCategories(category.children);
            
            // 对children进行排序：维度在前，子分类在后
            category.children.sort((a: any, b: any) => {
              // 如果a是维度，b是分类，a排在前面
              if (a.isDimension && b.isCategory) return -1;
              // 如果a是分类，b是维度，b排在前面
              if (a.isCategory && b.isDimension) return 1;
              // 同类型按名称排序
              return (a.title || a.name || '').localeCompare(b.title || b.name || '');
            });
            
            // 检查是否有维度或有效的子分类
            const hasDimensions = category.children.some((child: any) => child.isDimension);
            const hasValidSubCategories = category.children.some((child: any) => child.isCategory);
            return hasDimensions || hasValidSubCategories;
          }
          return true; // 保留维度项
        });
      };
      
      return sortAndFilterCategories(rootCategories);
    } else {
      // 对于指标数据，使用原有的parent_id逻辑
      const itemMap = new Map();
      const rootItems: any[] = [];

      // 创建所有节点的映射
      items.forEach(item => {
        const nodeData = {
          ...item,
          key: `metric-${item.id}`,
          title: item.name,
          children: [],
          isMetric: true
        };
        itemMap.set(item.id, nodeData);
      });

      // 构建层级结构
      items.forEach(item => {
        const node = itemMap.get(item.id);
        if (item.parent_id) {
          const parent = itemMap.get(item.parent_id);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          rootItems.push(node);
        }
      });

      return rootItems;
    }
  };

  // 加载维度数据的函数
  const loadDimensionsData = () => {
    try {
      const savedDimensions = localStorage.getItem('dimensions');
      if (savedDimensions) {
        const dimensionsData = JSON.parse(savedDimensions);
        const hierarchicalDimensions = buildHierarchicalData(dimensionsData, 'dimensions');
        setReportDimensions(hierarchicalDimensions);
      }
    } catch (error) {
      console.error('加载维度数据失败:', error);
    }
  };

  // 加载模板数据和维度指标数据
  useEffect(() => {
    console.group('🔍 [模板数据加载] useEffect开始执行');
    console.log('⏰ 执行时间:', new Date().toISOString());
    console.log('📋 模板ID:', id);
    
    try {
      // 设置当前选中的菜单项为报告模板管理
      setSelectedMenuKey('report-template-management');
      
      // 页签已由ReportTemplateManagement创建，这里不需要重复创建
      
      // 如果是编辑模式，根据模板ID加载模板数据
      if (id) {
        console.log('✅ 进入编辑模式，模板ID:', id);
        
        // 验证模板ID的有效性
        if (typeof id !== 'string' || id.trim() === '') {
          console.error('❌ 模板ID无效:', id);
          message.error('模板ID无效，请检查URL参数');
          return;
        }
        console.log('✅ 模板ID验证通过');
        
        // 读取localStorage中的模板数据
        const templatesRaw = localStorage.getItem('reportTemplates');
        console.log('📦 localStorage原始数据:', templatesRaw);
        
        // 验证localStorage数据的存在性
        if (!templatesRaw) {
          console.warn('⚠️ localStorage中没有模板数据');
          message.warning('暂无模板数据，请先创建模板');
          return;
        }
        console.log('✅ localStorage数据存在性验证通过');
        
        // 验证JSON格式
        let existingTemplates;
        try {
          existingTemplates = JSON.parse(templatesRaw);
        } catch (parseError) {
          console.error('❌ 模板数据JSON解析失败:', parseError);
          message.error('模板数据格式错误，请重新创建模板');
          return;
        }
        console.log('✅ JSON解析验证通过');
        
        // 验证数据类型
        if (!Array.isArray(existingTemplates)) {
          console.error('❌ 模板数据不是数组格式:', typeof existingTemplates);
          message.error('模板数据结构异常，请重新创建模板');
          return;
        }
        console.log('✅ 数据类型验证通过');
      
      console.log('📊 解析后的模板列表:', existingTemplates);
      console.log('📊 模板列表长度:', existingTemplates.length);
      
      // 查找目标模板
      const currentTemplate = existingTemplates.find((t: any) => t.id === id);
      console.log('🎯 查找目标模板结果:', currentTemplate);
      
      if (currentTemplate) {
        console.log('✅ 找到目标模板，开始验证模板数据结构');
        
        // 验证模板数据结构的完整性
        const templateValidation = {
          hasId: typeof currentTemplate.id === 'string' && currentTemplate.id.trim() !== '',
          hasName: typeof currentTemplate.name === 'string' && currentTemplate.name.trim() !== '',
          hasDescription: typeof currentTemplate.description === 'string',
          hasType: typeof currentTemplate.type === 'string' && currentTemplate.type.trim() !== '',
          hasContentStructure: !!currentTemplate.content_structure,
          hasRichTextContent: !!currentTemplate.content_structure?.rich_text_content
        };
        
        console.log('🔍 模板数据结构验证结果:', templateValidation);
        
        // 检查必需字段 - 如果缺少字段，使用默认值而不是报错
        if (!templateValidation.hasId) {
          console.error('❌ 模板数据缺少ID字段');
          message.error('模板ID无效，请重新创建模板');
          return;
        }
        
        // 为缺失的字段设置默认值
        let needsUpdate = false;
        if (!templateValidation.hasName) {
          console.warn('⚠️ 模板缺少name字段，使用默认值');
          currentTemplate.name = '未命名模板';
          needsUpdate = true;
        }
        
        if (!templateValidation.hasType) {
          console.warn('⚠️ 模板缺少type字段，使用默认值');
          currentTemplate.type = '月报';
          needsUpdate = true;
        }
        
        if (!templateValidation.hasDescription) {
          console.warn('⚠️ 模板缺少description字段，使用默认值');
          currentTemplate.description = '';
          needsUpdate = true;
        }
        
        // 如果补充了默认值，更新localStorage中的数据
        if (needsUpdate) {
          console.log('💾 补充默认值后，更新localStorage中的模板数据');
          const templateIndex = existingTemplates.findIndex((t: any) => t.id === id);
          if (templateIndex !== -1) {
            existingTemplates[templateIndex] = currentTemplate;
            localStorage.setItem('reportTemplates', JSON.stringify(existingTemplates));
            console.log('✅ localStorage中的模板数据已更新');
          }
        }
        
        console.log('✅ 模板数据结构验证通过（已补充缺失字段）');
        
        console.log('📝 模板详细信息:', {
          id: currentTemplate.id,
          name: currentTemplate.name,
          description: currentTemplate.description,
          type: currentTemplate.type,
          hasContentStructure: templateValidation.hasContentStructure,
          hasRichTextContent: templateValidation.hasRichTextContent
        });
        
        // 设置模板数据
        setTemplateData(currentTemplate);
        console.log('✅ 模板数据已设置到state');
        
        // 填充表单字段
        const formData = {
          name: currentTemplate.name,
          description: currentTemplate.description,
          type: currentTemplate.type,
          content_structure: {
            rich_text_content: currentTemplate.content_structure?.rich_text_content || ''
          }
        };
        console.log('📝 准备填充表单数据:', formData);
        form.setFieldsValue(formData);
        console.log('✅ 表单字段已填充');
        
        // 设置编辑器内容
        if (currentTemplate.content_structure?.rich_text_content) {
          const editorContentToSet = currentTemplate.content_structure.rich_text_content;
          console.log('📝 准备设置编辑器内容长度:', editorContentToSet.length);
          console.log('📝 编辑器内容预览:', editorContentToSet.substring(0, 100) + '...');
          setEditorContent(editorContentToSet);
          console.log('✅ 编辑器内容已设置');
        } else {
          console.log('⚠️ 模板没有富文本内容');
        }
        
        // 设置模板章节内容
        if (currentTemplate.templateContentItems && Array.isArray(currentTemplate.templateContentItems)) {
          console.log('📋 准备设置模板章节内容:', currentTemplate.templateContentItems);
          setTemplateContentItems(currentTemplate.templateContentItems);
          console.log('✅ 模板章节内容已设置');
        } else {
          console.log('⚠️ 模板没有章节内容数据，使用空数组');
          setTemplateContentItems([]);
        }
        
        // 加载关联工单数据
         try {
           const relatedTicketsKey = `relatedTickets_${id}`;
           console.log('🎫 关联工单存储键:', relatedTicketsKey);
           
           const savedRelatedTickets = localStorage.getItem(relatedTicketsKey);
           console.log('🎫 localStorage中的关联工单原始数据:', savedRelatedTickets);
           
           if (savedRelatedTickets) {
             const ticketsData = JSON.parse(savedRelatedTickets);
             
             // 验证关联工单数据格式
             if (!Array.isArray(ticketsData)) {
               console.error('❌ 关联工单数据不是数组格式:', typeof ticketsData);
               message.warning('关联工单数据格式异常，已重置为空');
               setRelatedTickets([]);
               setFilteredTickets([]);
             } else {
               console.log('🎫 解析后的关联工单数据:', ticketsData);
               console.log('🎫 关联工单数量:', ticketsData.length);
               
               setRelatedTickets(ticketsData);
               setFilteredTickets(ticketsData);
               console.log('✅ 关联工单数据已设置到state');
             }
           } else {
             console.log('⚠️ 没有找到关联工单数据');
             setRelatedTickets([]);
             setFilteredTickets([]);
           }
         } catch (ticketError) {
           console.error('❌ 关联工单数据处理失败:', ticketError);
           message.warning('关联工单数据加载失败，已重置为空');
           setRelatedTickets([]);
           setFilteredTickets([]);
         }
         
         console.log('🎉 模板数据加载完成');
       } else {
         console.log('❌ 未找到对应的模板数据');
         console.log('🔍 可用的模板ID列表:', existingTemplates.map((t: any) => t.id));
         message.warning(`未找到ID为 ${id} 的模板，请检查模板是否存在`);
       }
     } else {
       console.log('📝 新增模式，跳过数据加载');
     }
     
    } catch (globalError) {
      console.error('❌ 模板数据加载过程中发生未预期的错误:', globalError);
      message.error('模板数据加载失败，请刷新页面重试');
    } finally {
      console.groupEnd();
    }
    
    // 从localStorage加载维度数据
    loadDimensionsData();

    // 从localStorage加载指标数据
    try {
      const savedMetrics = localStorage.getItem('dataMetrics');
      let metricsData;
      
      if (savedMetrics) {
        metricsData = JSON.parse(savedMetrics);
      } else {
        // 如果localStorage中没有指标数据，使用模拟数据
        // 数据指标数据（与ContentEditModal保持一致）
        metricsData = [
          { id: 'metric_1', key: '工单总量', label: '工单总量', category: '基础指标', description: '统计时间段内的工单总数量' },
          { id: 'metric_2', key: '环比增长率', label: '环比增长率', category: '基础指标', description: '与上一周期相比的增长率' },
          { id: 'metric_3', key: '同比增长率', label: '同比增长率', category: '基础指标', description: '与去年同期相比的增长率' },
          { id: 'metric_4', key: '微信工单数', label: '微信工单数', category: '来源分析', description: '通过微信渠道提交的工单数量' },
          { id: 'metric_5', key: '电话工单数', label: '电话工单数', category: '来源分析', description: '通过电话渠道提交的工单数量' },
          { id: 'metric_6', key: '网络工单数', label: '网络工单数', category: '来源分析', description: '通过网络平台提交的工单数量' },
          { id: 'metric_7', key: '平均处理时长', label: '平均处理时长', category: '效率指标', description: '工单从提交到处理完成的平均时间' },
          { id: 'metric_8', key: '满意度评分', label: '满意度评分', category: '效率指标', description: '用户对工单处理结果的满意度评分' },
          { id: 'metric_9', key: '及时处理率', label: '及时处理率', category: '效率指标', description: '在规定时间内处理完成的工单比例' },
          { id: 'metric_10', key: '主要问题类型', label: '主要问题类型', category: '问题分析', description: '工单中出现频率最高的问题类型' },
          { id: 'metric_11', key: '占比百分比', label: '占比百分比', category: '问题分析', description: '各类问题在总工单中的占比' },
          { id: 'metric_12', key: '趋势描述', label: '趋势描述', category: '趋势分析', description: '工单数量或质量的变化趋势描述' },
          { id: 'metric_13', key: '预测数据', label: '预测数据', category: '趋势分析', description: '基于历史数据预测的未来趋势' }
        ];
        localStorage.setItem('dataMetrics', JSON.stringify(metricsData));
      }
      
      // 统一使用groupMetricsByCategory处理指标数据，确保数据结构一致
      const groupedMetrics = groupMetricsByCategory(metricsData);
      setDataMetrics(groupedMetrics);
    } catch (error) {
      console.error('加载指标数据失败:', error);
    }
    
    // 新增模式：初始化表单
    if (!id) {
      setEditorContent('');
      console.log('🔄 新增模式：重置表单字段');
      form.setFieldsValue({
        name: '',
        description: '',
        type: '月报',
        content_structure: {
          rich_text_content: ''
        }
      });
      console.log('✅ 表单字段已重置为默认值');
    }
  }, [id, form, setSelectedMenuKey]);

  // 监听维度更新事件
  useEffect(() => {
    const handleDimensionsUpdated = () => {
      // 重新加载维度数据
      loadDimensionsData();
    };

    window.addEventListener('dimensionsUpdated', handleDimensionsUpdated);
    
    return () => {
      window.removeEventListener('dimensionsUpdated', handleDimensionsUpdated);
    };
  }, []);

  // 监听 relatedTickets 变化，同步更新 filteredTickets
  useEffect(() => {
    setFilteredTickets(relatedTickets);
  }, [relatedTickets]);

  // 保存模板
  const handleSave = async () => {
    try {
      console.log('🚀 开始保存模板...');
      console.log('📝 当前编辑器内容:', editorContent);
      console.log('📋 当前表单所有字段值:', form.getFieldsValue());
      
      const values = await form.validateFields();
      console.log('💾 表单验证通过，获取到的values:', values);
      console.log('🔍 values中的content_structure:', values.content_structure);
      
      setLoading(true);
      
      // 模拟API调用，实际保存到localStorage
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 获取现有模板数据
      const existingTemplates = JSON.parse(localStorage.getItem('reportTemplates') || '[]');
      
      let templateId = id;
      
      if (id) {
        // 编辑模式：更新现有模板
        const templateIndex = existingTemplates.findIndex((t: any) => t.id === id);
        if (templateIndex !== -1) {
          existingTemplates[templateIndex] = {
            ...existingTemplates[templateIndex],
            ...values,
            templateContentItems: templateContentItems, // 保存章节内容
            updated_at: new Date().toISOString(),
            updated_by: '管理员'
          };
        }
      } else {
        // 新增模式：创建新模板
        templateId = Date.now().toString();
        const newTemplate = {
          id: templateId,
          ...values,
          templateContentItems: templateContentItems, // 保存章节内容
          is_published: false,
          created_at: new Date().toISOString(),
          created_by: '管理员'
        };
        console.log('🆕 创建的新模板对象:', newTemplate);
        existingTemplates.push(newTemplate);
      }
      
      // 保存到localStorage
      localStorage.setItem('reportTemplates', JSON.stringify(existingTemplates));
      
      // 保存关联工单数据
      const relatedTicketsKey = `relatedTickets_${templateId}`;
      localStorage.setItem(relatedTicketsKey, JSON.stringify(relatedTickets));
      
      // 触发模板列表更新事件
      window.dispatchEvent(new CustomEvent('templatesUpdated'));
      
      message.success(id ? '模板更新成功' : '模板创建成功');
      navigate('/intelligent-report/report-template-management');
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 返回列表
  const handleBack = () => {
    // 获取当前页签的key，与ReportTemplateManagement中创建的key保持一致
    const currentTabKey = id ? `report-template-edit-${id}` : 'report-template-add';
    
    // 关闭当前页签
    removeTab(currentTabKey);
    
    // 设置选中的菜单项为报告模板管理
    setSelectedMenuKey('report-template-management');
    
    // 检查是否存在模板管理页签，如果存在则更新其名称
    const templateManagementTabKey = 'report-template-management';
    const { tabs, updateTab } = useAppStore.getState();
    const existingTab = tabs.find(t => t.key === templateManagementTabKey);
    
    if (existingTab) {
      // 更新页签名称为"模板管理"
      updateTab(templateManagementTabKey, { label: '模板管理' });
    }
    
    // 导航到模板管理页面
     navigate('/intelligent-report/report-template-management');
  };

  // 生成预览
  const handleGeneratePreview = async () => {
    setPreviewLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟预览内容
      const startDate = previewFilters.reportTime?.[0] ? (previewFilters.reportTime[0] as any).format('YYYY-MM-DD') : '2024-01-01';
      const endDate = previewFilters.reportTime?.[1] ? (previewFilters.reportTime[1] as any).format('YYYY-MM-DD') : '2024-01-31';
      const appealSource = previewFilters.appealSource || '全部';
      const region = previewFilters.region || '全部';
      const appealItem = previewFilters.appealItem || '全部';
      
      const mockPreviewContent = `月度工单分析报告

报告期间：${startDate} 至 ${endDate}
筛选条件：诉求来源(${appealSource})，所属区域(${region})，诉求事项(${appealItem})

一、城市运行概况
本月共接收工单 1,234 件，较上月增长 8.5%。

二、工单分类统计
• 环境污染：456件 (37%)
• 交通拥堵：321件 (26%)
• 噪音扰民：234件 (19%)
• 其他：223件 (18%)

三、区域分布
市辖区A：45%，市辖区B：32%，县城C：23%

四、处理效率
平均处理时长：2.3天，按时完成率：92.5%

五、趋势分析
环境污染类工单呈上升趋势，建议加强环保监管力度。`;
      
      setPreviewContent(mockPreviewContent);
      message.success('预览生成成功');
    } catch (error) {
      console.error('生成预览失败:', error);
      message.error('生成预览失败，请重试');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 处理时间范围变化
  const handleDateRangeChange = (dates: any) => {
    setPreviewFilters(prev => ({
      ...prev,
      reportTime: dates
    }));
  };

  // 处理文本选择
  const handleTextSelect = (e: React.MouseEvent) => {
    const textarea = e.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);
    
    if (text.trim()) {
      setSelectedText(text.trim());
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuVisible(true);
    } else {
      setContextMenuVisible(false);
    }
  };

  // 生成维度
  const handleGenerateDimension = () => {
    setContextMenuVisible(false);
    // 在新页签中打开维度新增页，并传递选中的文字和返回路径
    const newTab = {
      key: 'dimension-detail-new-from-template',
      label: '新增维度',
      closable: true,
      path: '/intelligent-report/dimension-detail',
      state: { 
        selectedText,
        returnPath: '/intelligent-report/report-template-management',
        fromTemplate: true,
        activeMenuKey: 'report-template-management' // 确保定位到报告模板管理栏目
      }
    };
    
    // 通过全局状态管理添加新页签
    window.dispatchEvent(new CustomEvent('addTab', { detail: newTab }));
  };

  // 点击其他地方隐藏菜单
  const handleClickOutside = () => {
    setContextMenuVisible(false);
  };



  // Tab项配置
  const tabItems = [
    {
      key: 'edit',
      label: '模板编辑',
    },
    {
      key: 'workorder',
      label: '关联章节',
    }
  ];

  // 数据指标和报告维度Tab项
  const dimensionMetricItems = [
    {
      key: 'dimensions',
      label: '报告维度',
    },
    {
      key: 'metrics', 
      label: '数据指标',
    }
  ];

  // 在光标位置插入维度内容
  const insertDimensionContent = (dimension: any) => {
    // 获取维度的章节结构，支持多种数据格式
    const contentItems = dimension.content_items || dimension.content || [];
    
    if (contentItems.length === 0) {
      message.warning('该维度暂无章节内容');
      return;
    }
    
    // 生成唯一ID的计数器，避免时间戳冲突
    let idCounter = 0;
    const generateUniqueId = () => {
      return `template_${Date.now()}_${++idCounter}_${Math.random().toString(36).substr(2, 9)}`;
    };
    
    // 全局去重检查：收集所有现有标题（包括嵌套的子章节）
    const getAllExistingTitles = (items: ContentItem[]): Set<string> => {
      const titles = new Set<string>();
      const collectTitles = (itemList: ContentItem[]) => {
        itemList.forEach(item => {
          titles.add(item.title.trim().toLowerCase()); // 统一转换为小写进行比较
          if (item.children && item.children.length > 0) {
            collectTitles(item.children);
          }
        });
      };
      collectTitles(items);
      return titles;
    };
    
    const existingTitles = getAllExistingTitles(templateContentItems);
    
    // 预处理维度数据：智能去重并保持层级结构
    const preprocessDimensionData = (items: any[]): any[] => {
      // 全局去重检查：收集所有要插入的标题（包括所有层级）
      const allDimensionTitles = new Set<string>();
      
      // 递归收集所有标题
      const collectAllTitles = (itemList: any[], depth: number = 0) => {
        itemList.forEach((item, index) => {
          if (item.title) {
            const normalizedTitle = item.title.trim().toLowerCase();
            allDimensionTitles.add(normalizedTitle);
            console.log(`收集标题[深度${depth}][索引${index}]: "${item.title}" -> "${normalizedTitle}"`);
          }
          if (item.children && Array.isArray(item.children) && item.children.length > 0) {
            console.log(`处理 "${item.title}" 的 ${item.children.length} 个子项`);
            collectAllTitles(item.children, depth + 1);
          }
        });
      };
      
      collectAllTitles(items);
      
      // 智能去重：保持层级结构的完整性
      const globalProcessedTitles = new Set<string>();
      
      const deduplicateItems = (itemList: any[], parentContext: string = '', depth: number = 0): any[] => {
        const result: any[] = [];
        console.log(`\n=== 开始处理层级 ${depth}，上下文: ${parentContext || '根级别'} ===`);
        console.log(`待处理项目数量: ${itemList.length}`);
        
        itemList.forEach((item, index) => {
          const normalizedTitle = item.title?.trim().toLowerCase();
          console.log(`\n[${depth}-${index}] 处理项目: "${item.title}"`);
          
          // 检查标题是否有效
          if (!normalizedTitle) {
            console.log(`[${depth}-${index}] ❌ 跳过无效标题: ${item.title}`);
            return;
          }
          
          // 跳过已存在的标题（与现有模板重复）
          if (existingTitles.has(normalizedTitle)) {
            console.log(`[${depth}-${index}] ❌ 跳过重复标题（与现有模板重复）: "${item.title}"`);
            // 当父项重复时，跳过整个分支以保持层级结构完整性
            // 不再提升子项，避免破坏层级关系和造成重复插入
            return;
          }
          
          // 跳过在当前维度中已处理的标题（全局去重）
          if (globalProcessedTitles.has(normalizedTitle)) {
            console.log(`[${depth}-${index}] ❌ 跳过重复标题（维度内重复）: "${item.title}"`);
            return;
          }
          
          console.log(`[${depth}-${index}] ✅ 标题通过检查: "${item.title}"`);
          globalProcessedTitles.add(normalizedTitle);
          
          // 处理子项去重，保持层级结构
          const deduplicatedItem = { ...item };
          if (item.children && Array.isArray(item.children) && item.children.length > 0) {
            console.log(`[${depth}-${index}] 🔄 处理 "${item.title}" 的 ${item.children.length} 个子项`);
            deduplicatedItem.children = deduplicateItems(item.children, parentContext + '/' + item.title, depth + 1);
            // 如果所有子项都被去重了，但父项是新的，仍然保留父项
            if (deduplicatedItem.children.length === 0) {
              console.log(`[${depth}-${index}] ⚠️ 保留父项但移除所有重复子项: "${item.title}"`);
            } else {
              console.log(`[${depth}-${index}] ✅ "${item.title}" 保留了 ${deduplicatedItem.children.length} 个子项`);
            }
          }
          
          console.log(`[${depth}-${index}] ➕ 添加到结果: "${item.title}"`);
          result.push(deduplicatedItem);
        });
        
        console.log(`=== 层级 ${depth} 处理完成，返回 ${result.length} 个项目 ===\n`);
        return result;
      };
      
      return deduplicateItems(items);
    };
    
    // 智能构建层级关系：保持现有结构或构建新结构
    const buildHierarchy = (items: any[]): any[] => {
      // 更严格地检查是否已经有完整的层级结构
      const hasCompleteHierarchy = items.some(item => {
        // 必须有children且children不为空
        if (item.children && Array.isArray(item.children) && item.children.length > 0) {
          // 检查是否有多层级嵌套（至少有二级和三级）
          const hasSecondLevel = item.children.length > 0;
          const hasThirdLevel = item.children.some(child => 
            child.children && Array.isArray(child.children) && child.children.length > 0
          );
          // 只有当存在至少二级层级时才认为是完整结构
          return hasSecondLevel;
        }
        return false;
      });
      
      if (hasCompleteHierarchy) {
        // 已经是完整的层级结构，保持原有结构
        console.log('检测到完整层级结构，保持原有结构');
        return items.map(item => ({
          ...item,
          children: item.children || []
        }));
      }
      
      // 检查是否有parent_id信息，如果有则构建层级关系
      const hasParentIdInfo = items.some(item => 
        item.parent_id && 
        item.parent_id !== null && 
        item.parent_id !== '' && 
        item.parent_id !== 'null' && 
        item.parent_id !== 'undefined'
      );
      
      if (!hasParentIdInfo) {
        // 没有parent_id信息，按level分组构建层级
        console.log('按level信息构建层级结构');
        return buildHierarchyByLevel(items);
      }
      
      // 使用parent_id构建层级关系
      console.log('使用parent_id构建层级结构');
      const itemMap = new Map<string, any>();
      const rootItems: any[] = [];
      
      // 创建映射，使用唯一键避免冲突
      items.forEach((item, index) => {
        const clonedItem = { ...item, children: [] };
        // 使用组合键确保唯一性
        const uniqueKey = item.id ? `id_${item.id}` : `title_${item.title}_${index}`;
        itemMap.set(uniqueKey, clonedItem);
        
        // 同时保持原有的映射方式作为备用
        if (item.id) {
          itemMap.set(item.id.toString(), clonedItem);
        }
        if (item.title) {
          itemMap.set(item.title, clonedItem);
        }
      });
      
      // 构建父子关系
      items.forEach((item, index) => {
        const uniqueKey = item.id ? `id_${item.id}` : `title_${item.title}_${index}`;
        const clonedItem = itemMap.get(uniqueKey) || itemMap.get(item.id?.toString()) || itemMap.get(item.title);
        if (!clonedItem) return;
        
        const hasValidParentId = item.parent_id && 
          item.parent_id !== null && 
          item.parent_id !== '' && 
          item.parent_id !== 'null' && 
          item.parent_id !== 'undefined';
        
        if (hasValidParentId) {
          const parentItem = itemMap.get(item.parent_id.toString()) || 
                           itemMap.get(`id_${item.parent_id}`) ||
                           Array.from(itemMap.values()).find(p => p.title === item.parent_id);
          
          if (parentItem && parentItem !== clonedItem) {
            parentItem.children.push(clonedItem);
          } else {
            rootItems.push(clonedItem);
          }
        } else {
          rootItems.push(clonedItem);
        }
      });
      
      return rootItems;
    };
    
    // 按level构建层级结构的辅助函数
    const buildHierarchyByLevel = (items: any[]): any[] => {
      const levelGroups: { [key: number]: any[] } = {};
      
      // 按level分组
      items.forEach(item => {
        const level = item.level || 1;
        if (!levelGroups[level]) {
          levelGroups[level] = [];
        }
        levelGroups[level].push({ ...item, children: [] });
      });
      
      // 构建层级关系：1级作为根，2级作为1级的子项，3级作为2级的子项
      const level1Items = levelGroups[1] || [];
      const level2Items = levelGroups[2] || [];
      const level3Items = levelGroups[3] || [];
      
      // 将3级项分配给2级项
      level2Items.forEach((level2Item, index) => {
        const startIndex = Math.floor(index * level3Items.length / level2Items.length);
        const endIndex = Math.floor((index + 1) * level3Items.length / level2Items.length);
        level2Item.children = level3Items.slice(startIndex, endIndex);
      });
      
      // 将2级项分配给1级项
      level1Items.forEach((level1Item, index) => {
        const startIndex = Math.floor(index * level2Items.length / level1Items.length);
        const endIndex = Math.floor((index + 1) * level2Items.length / level1Items.length);
        level1Item.children = level2Items.slice(startIndex, endIndex);
      });
      
      return level1Items;
    };
    
    // 转换为模板格式
    const convertToTemplateFormat = (items: any[]): ContentItem[] => {
      const result: ContentItem[] = [];
      let autoTitleCounter = 1;
      
      // 收集所有已存在的标题（包括模板中的和当前结果中的）
      const getAllExistingTitles = (): Set<string> => {
        const allTitles = new Set<string>();
        
        // 添加模板中已有的标题
        existingTitles.forEach(title => allTitles.add(title));
        
        // 添加当前结果中的标题
        const addResultTitles = (items: ContentItem[]) => {
          items.forEach(item => {
            allTitles.add(item.title.toLowerCase());
            if (item.children && item.children.length > 0) {
              addResultTitles(item.children);
            }
          });
        };
        addResultTitles(result);
        
        console.log('所有已存在标题:', Array.from(allTitles));
        return allTitles;
      };
      
      // 生成不重复的自动标题
      const generateUniqueTitle = (baseTitle?: string): string => {
        if (baseTitle && baseTitle.trim()) {
          const trimmedTitle = baseTitle.trim();
          const allTitles = getAllExistingTitles();
          
          // 检查原标题是否重复
          if (!allTitles.has(trimmedTitle.toLowerCase())) {
            console.log(`使用原标题: ${trimmedTitle}`);
            return trimmedTitle;
          }
          
          // 如果重复，生成带编号的标题
          let counter = 1;
          let uniqueTitle: string;
          do {
            uniqueTitle = `${trimmedTitle}_${counter++}`;
          } while (allTitles.has(uniqueTitle.toLowerCase()));
          
          console.log(`标题重复，生成新标题: ${uniqueTitle}`);
          return uniqueTitle;
        }
        
        // 生成自动标题
        const allTitles = getAllExistingTitles();
        let autoTitle: string;
        do {
          autoTitle = `章节${autoTitleCounter++}`;
        } while (allTitles.has(autoTitle.toLowerCase()));
        
        console.log(`生成自动标题: ${autoTitle}`);
        return autoTitle;
      };
      
      const processItem = (item: any, parentId?: string, currentLevel: number = 1, processedPath: string[] = []): ContentItem => {
        // 防止循环引用和重复处理
        const itemKey = `${item.title || 'untitled'}_${currentLevel}`;
        if (processedPath.includes(itemKey)) {
          console.warn(`检测到循环引用或重复处理: ${itemKey}，跳过处理`);
          return {
            id: generateUniqueId(),
            title: `跳过_${item.title || 'untitled'}`,
            content: '',
            order: templateContentItems.length + result.length + 1,
            level: Math.min(currentLevel, 3) as 1 | 2 | 3,
            parent_id: parentId,
            children: []
          };
        }
        
        const newPath = [...processedPath, itemKey];
        console.log(`处理项目: ${item.title}, 层级: ${currentLevel}, 路径: ${newPath.join(' -> ')}`);
        
        // 智能确定层级：优先使用原有level，其次使用currentLevel
        let itemLevel: 1 | 2 | 3;
        if (item.level && [1, 2, 3].includes(Number(item.level))) {
          itemLevel = Number(item.level) as 1 | 2 | 3;
          console.log(`使用原有层级 ${itemLevel} for ${item.title}`);
        } else {
          itemLevel = Math.min(currentLevel, 3) as 1 | 2 | 3;
          console.log(`使用计算层级 ${itemLevel} for ${item.title} (currentLevel: ${currentLevel})`);
        }
        
        const templateItem: ContentItem = {
          id: generateUniqueId(),
          title: generateUniqueTitle(item.title),
          content: item.content || '',
          order: templateContentItems.length + result.length + 1,
          level: itemLevel,
          parent_id: parentId,
          children: [],
          workOrderEnabled: item.workOrderEnabled || false,
          workOrderFilters: item.workOrderFilters || {
            reportTimeStart: '',
            reportTimeEnd: '',
            appealSource: [],
            region: [],
            appealItem: [],
            appealTags: []
          }
        };
        
        // 递归处理子项，确保层级递增
        if (item.children && Array.isArray(item.children) && item.children.length > 0) {
          console.log(`处理 ${item.title} 的 ${item.children.length} 个子项`);
          templateItem.children = item.children.map((child: any, index: number) => {
            // 确保子项的层级比父项高1级，但不超过3级
            const childLevel = Math.min(itemLevel + 1, 3);
            console.log(`处理子项 ${index + 1}/${item.children.length}: ${child.title}, 父级: ${item.title}`);
            return processItem(child, templateItem.id, childLevel, newPath);
          });
          console.log(`${item.title} 处理完成，包含 ${templateItem.children.length} 个子项`);
        }
        
        return templateItem;
      };
      
      // 处理所有根级别项
      items.forEach(item => {
        const processedItem = processItem(item);
        result.push(processedItem);
      });
      
      return result;
    };
    
    // 执行数据处理流程
    const deduplicatedItems = preprocessDimensionData(contentItems);
    
    if (deduplicatedItems.length === 0) {
      message.warning('该维度的章节内容已存在或无有效章节');
      return;
    }
    
    const hierarchicalItems = buildHierarchy(deduplicatedItems);
    const finalItems = convertToTemplateFormat(hierarchicalItems);
    
    // 计算总章节数（包括所有层级）
    const countAllItems = (items: ContentItem[]): number => {
      let count = 0;
      items.forEach(item => {
        count += 1;
        if (item.children && item.children.length > 0) {
          count += countAllItems(item.children);
        }
      });
      return count;
    };
    
    const totalNewItems = countAllItems(finalItems);
    
    // 添加到模板内容项（只添加根级别项，子项通过children嵌套）
    setTemplateContentItems(prev => [...prev, ...finalItems]);
    
    // 显示成功消息
    message.success(`成功插入 ${finalItems.length} 个根级章节，共 ${totalNewItems} 个章节（包含所有层级）`);
  };

  // 根据key查找完整的维度数据
  const findDimensionByKey = (dimensions: any[], targetKey: string): any => {
    for (const dimension of dimensions) {
      if (dimension.key === targetKey) {
        return dimension;
      }
      if (dimension.children && dimension.children.length > 0) {
        const found = findDimensionByKey(dimension.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };

  // 转换维度数据为Tree组件格式
  const convertDimensionsToTreeData = (items: any[]): TreeDataNode[] => {
    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      const isCategory = item.isCategory || item.type === 'category' || hasChildren;
      
      // 移除自定义onClick处理，使用Tree组件的onSelect事件
      
      return {
        key: item.key,
        title: (
          <div 
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
              if (!isCategory) {
                e.currentTarget.style.backgroundColor = '#F0F9FF';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCategory) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}

          >
            <div className="flex items-center gap-2 w-full">
              {isCategory ? (
                <FolderOutlined 
                  style={{ 
                    color: '#3388FF', 
                    fontSize: '14px',
                    minWidth: '14px'
                  }} 
                />
              ) : (
                <div 
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#3388FF',
                    minWidth: '6px',
                    marginLeft: '4px',
                    marginRight: '4px'
                  }}
                />
              )}
              <span 
                className="truncate text-sm" 
                style={{ 
                  color: isCategory ? '#1f2937' : '#4b5563',
                  fontWeight: isCategory ? '500' : '400'
                }}
                title={item.title}
              >
                {item.title}
              </span>
            </div>
          </div>
        ),
        icon: null,
        children: hasChildren ? convertDimensionsToTreeData(item.children) : undefined,
        isLeaf: item.isLeaf || !hasChildren,
        data: item,
        selectable: !isCategory
      };
    });
  };

  // 处理维度树节点点击


  // 渲染维度列表
  const renderDimensionList = () => {
    const treeData = convertDimensionsToTreeData(reportDimensions);
    return (
      <Tree
        showIcon
        defaultExpandAll
        treeData={treeData}
        className="dimension-tree"
        selectable={true}
        onSelect={(selectedKeys, info) => {
          console.log('维度树点击事件触发', selectedKeys, info.node);
          if (selectedKeys.length > 0 && info.node && !(info.node as any).isCategory) {
            // 根据选中的key从原始维度数据中找到完整的维度对象
            const selectedKey = selectedKeys[0] as string;
            const fullDimensionData = findDimensionByKey(reportDimensions, selectedKey);
            console.log('插入维度内容:', fullDimensionData || info.node);
            insertDimensionContent(fullDimensionData || info.node);
          }
        }}
        style={{
          '--tree-node-height': '40px'
        } as React.CSSProperties}
      />
    );
  };

  // 获取所有章节的ID（包括嵌套的子章节）
  const getAllTemplateItemIds = (items: ContentItem[]): string[] => {
    const ids: string[] = [];
    
    const collectIds = (itemList: ContentItem[]) => {
      itemList.forEach(item => {
        ids.push(item.id);
        if (item.children && item.children.length > 0) {
          collectIds(item.children);
        }
      });
    };
    
    collectIds(items);
    return ids;
  };

  // 渲染模板内容项（只渲染根级别项，子项由TemplateContentCard内部递归处理）
  const renderTemplateContentItems = (items: ContentItem[]): React.ReactNode => {
    console.log('渲染模板内容项，根级别项数量:', items.length);
    return items.map((item) => {
      console.log('渲染根级别项:', item.title, '子项数量:', item.children?.length || 0);
      return (
        <div key={item.id} style={{ marginBottom: '8px' }}>
          <TemplateContentCard 
            item={item} 
            level={item.level}
            onEdit={() => handleEditTemplateContent(item)}
            onDelete={() => handleDeleteTemplateContent(item.id)}
            onAddChild={() => handleAddChildContent(item.id)}
          />
        </div>
      );
    });
  };

  // 可拖拽的模板内容项组件
  const TemplateContentCard: React.FC<{ 
    item: ContentItem; 
    level: number;
    onEdit: () => void;
    onDelete: () => void;
    onAddChild: () => void;
    index?: number;
  }> = ({ item, level, onEdit, onDelete, onAddChild }) => {
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
        type: 'template-content-item',
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
      1: <Tag color="blue">一级章节</Tag>,
      2: <Tag color="green">二级章节</Tag>,
      3: <Tag color="orange">三级章节</Tag>
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
                handleEditTemplateContent(item);
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
                handleDeleteTemplateContent(item.id);
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
              <TemplateContentCard 
                key={child.id} 
                item={child} 
                level={child.level}
                onEdit={() => handleEditTemplateContent(child)}
                onDelete={() => handleDeleteTemplateContent(child.id)}
                onAddChild={() => handleAddChildContent(child.id)}
              />
            ))
          ) : (
            // 空子内容区域，用于接收拖拽，但不显示提示文字
            <div className="min-h-[20px]"></div>
          )}
        </div>
      </div>
    );
  };

  // 处理模板内容的相关函数
  const handleAddContent = (level: number, parentId?: string) => {
    const newItem: ContentItem = {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `新${level === 1 ? '一' : level === 2 ? '二' : '三'}级章节`,
      content: '',
      level,
      parentId,
      workOrderEnabled: false,
      children: [],
      order: templateContentItems.length + 1
    };

    // 设置为新增模式，不立即添加到列表中
    setEditingContent({ ...newItem, isNew: true, parentId });
    setContentModalVisible(true);
  };

  // 添加子内容
  const handleAddChildContent = (parentId: string) => {
    // 找到父级项目，确定子级的level
    const findParentLevel = (items: ContentItem[], id: string): number | null => {
      for (const item of items) {
        if (item.id === id) {
          return item.level;
        }
        if (item.children) {
          const found = findParentLevel(item.children, id);
          if (found !== null) return found;
        }
      }
      return null;
    };

    const parentLevel = findParentLevel(templateContentItems, parentId);
    if (parentLevel && parentLevel < 3) {
      const childLevel = (parentLevel + 1) as 1 | 2 | 3;
      handleAddContent(childLevel, parentId);
    }
  };

  const handleEditContent = (item: ContentItem) => {
    setEditingContent(item);
    setContentModalVisible(true);
  };

  const handleDeleteContent = (itemId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个章节吗？删除后不可恢复。',
      onOk: () => {
        const removeFromItems = (items: ContentItem[]): ContentItem[] => {
          return items.filter(item => {
            if (item.id === itemId) {
              return false;
            }
            if (item.children && item.children.length > 0) {
              item.children = removeFromItems(item.children);
            }
            return true;
          });
        };
        setTemplateContentItems(removeFromItems(templateContentItems));
      }
    });
  };

  const handleContentSave = (values: any) => {
    const updateItems = (items: ContentItem[]): ContentItem[] => {
      return items.map(item => {
        if (item.id === editingContent?.id) {
          return {
            ...item,
            title: values.title,
            content: values.content,
            workOrderEnabled: values.workOrderEnabled || false,
            workOrderFilters: values.workOrderFilters || {
              reportTimeStart: '',
              reportTimeEnd: '',
              appealSource: [],
              region: [],
              appealItem: [],
              appealTags: []
            }
          };
        }
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: updateItems(item.children)
          };
        }
        return item;
      });
    };

    setTemplateContentItems(updateItems(templateContentItems));
    setContentModalVisible(false);
    setEditingContent(null);
  };

  // 在光标位置插入指标占位符
  const insertMetricPlaceholder = (metric: any) => {
    console.log('insertMetricPlaceholder被调用', metric);
    // 生成指标占位符
    const placeholder = `{{${metric.title || metric.label || metric.name}}}`;
    console.log('要插入的占位符:', placeholder);
    
    // 获取当前内容和光标位置
    const currentContent = editorContent || form.getFieldValue('content') || '';
    let insertPosition = currentContent.length;
    
    if (editorRef.current) {
      const textAreaElement = editorRef.current.resizableTextArea?.textArea;
      if (textAreaElement) {
        insertPosition = textAreaElement.selectionStart;
        console.log('光标位置:', insertPosition);
      }
    }
    
    // 构建新内容
    const newContent = currentContent.substring(0, insertPosition) + placeholder + currentContent.substring(insertPosition);
    console.log('新内容:', newContent);
    
    // 更新状态和表单
    setEditorContent(newContent);
    form.setFieldsValue({ content: newContent });
    console.log('内容已更新');
    
    // 设置光标位置
    setTimeout(() => {
      if (editorRef.current) {
        const textAreaElement = editorRef.current.resizableTextArea?.textArea;
        if (textAreaElement) {
          textAreaElement.focus();
          textAreaElement.setSelectionRange(insertPosition + placeholder.length, insertPosition + placeholder.length);
          console.log('光标位置已设置');
        }
      }
    }, 50);
    
    message.success(`已插入指标占位符：${metric.title || metric.label || metric.name}`);
  };

  // 将平面指标数据转换为分类树结构
  const groupMetricsByCategory = (metrics: any[]) => {
    const categoryMap = new Map();
    
    metrics.forEach(metric => {
      const category = metric.category || '未分类';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          key: category,
          label: category,
          title: category,
          type: 'category',
          children: []
        });
      }
      categoryMap.get(category).children.push(metric);
    });
    
    const categories = Array.from(categoryMap.values());
    
    // 如果存在"未分类"分类，直接返回其下的指标，不显示"未分类"这个分类层级
    const uncategorized = categories.find(category => category.key === '未分类');
    if (uncategorized && uncategorized.children.length > 0) {
      // 直接返回"未分类"下的指标，不显示"未分类"这个分类层级
      return uncategorized.children.map((child: any) => ({
        ...child,
        key: child.id || child.key,
        title: child.label || child.title,
        type: 'metric'
      }));
    }
    
    // 返回所有有明确分类的指标分类
    return categories.filter(category => category.key !== '未分类');
  };

  // 转换指标数据为Tree组件格式
  const convertMetricsToTreeData = (items: any[]): any[] => {
    return items.map((item, index) => {
      const hasChildren = item.children && item.children.length > 0;
      const isCategory = item.type === 'category' || hasChildren;
      
      // 确保每个节点都有唯一的key
      let nodeKey;
      if (isCategory) {
        nodeKey = `category-${item.key || item.label || item.title || index}`;
      } else {
        // 优先使用id，然后key，最后使用label+index确保唯一性
        nodeKey = item.id || item.key || `metric-${(item.label || item.title || 'unknown')}-${index}`;
      }
      
      // 移除自定义onClick处理，使用Tree组件的onSelect事件
      
      return {
        title: (
          <div 
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
              if (!isCategory) {
                e.currentTarget.style.backgroundColor = '#F0F9FF';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCategory) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}

          >
            <div className="flex items-center gap-2 w-full">
              {isCategory ? (
                <FolderOutlined 
                  style={{ 
                    color: '#3388FF', 
                    fontSize: '14px',
                    minWidth: '14px'
                  }} 
                />
              ) : (
                <BarChartOutlined 
                  style={{ 
                    color: '#3388FF', 
                    fontSize: '12px',
                    minWidth: '12px'
                  }} 
                />
              )}
              <span 
                className="truncate text-sm" 
                style={{ 
                  color: isCategory ? '#1f2937' : '#4b5563',
                  fontWeight: isCategory ? '500' : '400'
                }}
                title={item.label || item.title}
              >
                {item.label || item.title}
              </span>
            </div>
          </div>
        ),
        key: nodeKey,
        icon: null,
        children: hasChildren ? convertMetricsToTreeData(item.children) : undefined,
        isLeaf: !hasChildren,
        data: item,
        selectable: !isCategory
      };
    });
  };



  // 渲染指标列表
  const renderMetricList = () => {
    const groupedMetrics = groupMetricsByCategory(dataMetrics);
    const treeData = convertMetricsToTreeData(groupedMetrics);
    return (
      <Tree
        showIcon
        defaultExpandAll
        treeData={treeData}
        className="metric-tree"
        selectable={true}
        onSelect={(selectedKeys, info) => {
          console.log('指标树点击事件触发', selectedKeys, info.node.data);
          if (selectedKeys.length > 0 && info.node.data && !info.node.data.isCategory) {
            console.log('调用insertMetricPlaceholder');
            insertMetricPlaceholder(info.node.data);
          }
        }}
        style={{
          '--tree-node-height': '40px'
        } as React.CSSProperties}
      />
    );
  };

  return (
    <div className="h-full bg-white rounded flex mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
      <div className="flex-1 flex flex-col">
        {/* 页面标题栏 */}
        <div className="pl-5 pr-5" style={{ height: '48px', display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <ArrowLeftOutlined 
                className="text-[#223355] cursor-pointer hover:text-[#3388FF] transition-colors" 
                style={{fontSize: '16px'}}
                onClick={handleBack}
              />
              <h1 className="text-lg font-medium text-[#223355] m-0" style={{fontSize: '18px', marginTop: '0px'}}>{getPageTitle()}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="default" 
                icon={<ArrowLeftOutlined />} 
                onClick={handleBack}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={handleSave}
                loading={loading}
              >
                保存
              </Button>
            </div>
          </div>
        </div>

        {/* 报告编辑与关联工单Tab */}
        <div>
          <div className="px-5 py-2" style={{ paddingBottom: '0px', paddingLeft: '20px' }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              size="small"
              tabBarGutter={24}
              tabBarStyle={{ marginBottom: 0, borderBottom: 'none', paddingLeft: '0px', paddingRight: '0px' }}
              className="report-edit-tabs"
            />
          </div>
          <div className="w-full border-b border-[#E9ECF2]"></div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 基本信息 - 仅在报告编辑tab显示 */}
          {activeTab === 'edit' && (
            <div className="bg-white border-b border-[#E9ECF2]" style={{ paddingLeft: 0, paddingRight: 0, paddingTop: '12px', paddingBottom: '12px' }}>
              <Form form={form} layout="inline" className="mb-0" style={{ width: '100%', margin: 0 }}>
                <div className="flex items-center w-full" style={{ paddingLeft: '20px', paddingRight: '20px', gap: '16px' }}>
                  <Form.Item
                    label="模板名称"
                    name="name"
                    rules={[{ required: true, message: '请输入模板名称' }]}
                    className="mb-0"
                    style={{ marginBottom: 0, marginRight: 0, flex: 1, minWidth: 0 }}
                  >
                    <Input placeholder="请输入模板名称" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    label="模板类型"
                    name="type"
                    rules={[{ required: true, message: '请选择模板类型' }]}
                    className="mb-0"
                    style={{ marginBottom: 0, marginRight: 0, flex: 1, minWidth: 0 }}
                  >
                    <Select placeholder="请选择模板类型" style={{ width: '100%' }}>
                      <Option value="日报">日报</Option>
                      <Option value="周报">周报</Option>
                      <Option value="月报">月报</Option>
                      <Option value="季报">季报</Option>
                      <Option value="半年报">半年报</Option>
                      <Option value="年报">年报</Option>
                      <Option value="专题报告">专题报告</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label="模板描述"
                    name="description"
                    className="mb-0"
                    style={{ marginBottom: 0, marginRight: 0, flex: 1, minWidth: 0 }}
                  >
                    <Input placeholder="请输入模板描述" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                
                {/* 富文本编辑器字段 - 隐藏的表单项 */}
                <Form.Item name={["content_structure", "rich_text_content"]} style={{ display: 'none' }}>
                  <Input />
                </Form.Item>
              </Form>
            </div>
          )}

          {/* 下方内容区 */}
          <div className="flex-1 flex overflow-hidden">
            {activeTab === 'edit' ? (
              <>
                {/* 左下：数据指标及报告维度 */}
                <div className="flex flex-col border-r border-[#E9ECF2] bg-white" style={{ width: '260px', marginRight: '0px', paddingRight: '0px' }}>
                   <div className="px-5 py-2 border-b border-[#E9ECF2] flex items-center" style={{ paddingBottom: '8px', paddingLeft: '20px', height: '57px' }}>
                     <h3 style={{ fontSize: '14px', fontWeight: 500, margin: 0, color: '#223355' }}>报告维度</h3>
                   </div>
                  <div className="flex-1 py-5 pr-5 pl-0 overflow-y-auto overflow-x-hidden" style={{ paddingTop: '20px', paddingBottom: '20px', paddingLeft: '20px' }}>
                    <div key="dimensions-content">
                      {reportDimensions.length > 0 ? renderDimensionList() : (
                        <div className="text-gray-500 text-center py-8">
                          暂无报告维度
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右下：模板编辑 - 模板内容区域 */}
                <div className="flex-1 flex bg-white">
                  {/* 模板内容区域 */}
                  <div className="flex-1 flex flex-col">
                    <div className="px-5 border-b border-[#E9ECF2] flex items-center justify-between" style={{ height: '57px' }}>
                      <h3 className="text-sm font-medium text-[#223355] m-0">模板内容</h3>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        size="small"
                        onClick={() => handleAddContent(1)}
                      >
                        新增一级章节
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
                      {/* 章节结构区域 */}
                      <DndContext
                        sensors={templateSensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext items={getAllTemplateItemIds(templateContentItems)} strategy={verticalListSortingStrategy}>
                          <div style={{ minHeight: '200px' }}>
                            {templateContentItems.length > 0 ? (
                              renderTemplateContentItems(templateContentItems)
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <Empty description="暂无内容，请点击上方按钮新增一级内容" />
                              </div>
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* 关联工单页签内容 */
              <div className="flex-1 flex flex-col bg-white">
                {/* 自适应宽度的容器，高度拉伸至白色背景底部 */}
                <div className="flex-1 w-full bg-white flex flex-col">
                  {/* 查询条件栏 */}
                  <div className="px-5 py-4 border-b border-[#E9ECF2] flex items-center" style={{ height: '57px' }}>
                    <Form form={ticketSearchForm} layout="inline" className="mb-0 flex items-center w-full">
                      <Form.Item name="sectionName" label="章节名称" className="mb-2">
                        <Input placeholder="请输入章节名称" style={{ width: 220 }} />
                      </Form.Item>
                      <Form.Item name="sectionContent" label="章节内容" className="mb-2">
                        <Input placeholder="请输入章节内容" style={{ width: 220 }} />
                      </Form.Item>
                      <Form.Item name="sectionLevel" label="章节级别" className="mb-2">
                        <Select placeholder="请选择章节级别" style={{ width: 220 }} allowClear>
                          <Option value="一级">一级章节</Option>
                          <Option value="二级">二级章节</Option>
                          <Option value="三级">三级章节</Option>
                        </Select>
                      </Form.Item>
                      <div className="flex-1"></div>
                      <Form.Item className="mb-2" style={{ marginRight: '10px' }}>
                        <Button onClick={handleTicketReset}>重置</Button>
                      </Form.Item>
                      <Form.Item className="mb-2" style={{ marginRight: '0px' }}>
                        <Button type="primary" onClick={handleTicketSearch}>查询</Button>
                      </Form.Item>
                    </Form>
                  </div>

                  {/* 操作栏 */}
                  <div className="px-5 py-3 flex justify-between items-center">
                    <div>
                      <Button 
                        danger 
                        icon={<DeleteOutlined />}
                        disabled={selectedTicketIds.length === 0}
                        onClick={handleBatchDeleteTickets}
                      >
                        删除
                      </Button>
                    </div>
                    <div className="text-gray-500">
                      共{filteredTickets.length > 0 ? filteredTickets.length : relatedTickets.length}条数据
                    </div>
                  </div>

                  {/* 列表区域 */}
                  <div className="flex-1 p-5" style={{ paddingTop: '0px', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                    {relatedTickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: '300px' }}>
                        <div className="mb-4">
                          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="64" height="64" rx="32" fill="#F5F7FA"/>
                            <path d="M32 20C25.3726 20 20 25.3726 20 32C20 38.6274 25.3726 44 32 44C38.6274 44 44 38.6274 44 32C44 25.3726 38.6274 20 32 20ZM32 22C37.5228 22 42 26.4772 42 32C42 37.5228 37.5228 42 32 42C26.4772 42 22 37.5228 22 32C22 26.4772 26.4772 22 32 22Z" fill="#D1D5DB"/>
                            <path d="M28 28H36V30H28V28ZM28 32H36V34H28V32ZM28 36H32V38H28V36Z" fill="#D1D5DB"/>
                          </svg>
                        </div>
                        <div className="text-gray-500 text-center">
                          <div className="text-base mb-1">暂无已配置工单过滤的关联章节</div>
                          <div className="text-sm text-gray-400">请先添加关联章节数据</div>
                        </div>
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={relatedTickets.map(item => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <Table
                            dataSource={filteredTickets.length > 0 ? filteredTickets : relatedTickets}
                            pagination={false}
                            scroll={{ y: 'calc(100vh - 400px)' }}
                            rowSelection={{
                              selectedRowKeys: selectedTicketIds,
                              onChange: (selectedRowKeys) => {
                                setSelectedTicketIds(selectedRowKeys as string[]);
                              },
                              columnWidth: '5%',
                            }}
                        rowKey="id"
                        locale={{
                          emptyText: '暂无关联章节数据'
                        }}
                        style={{
                          borderTop: '1px solid #E9ECF2',
                          borderRadius: '0'
                        }}
                        components={{
                          header: {
                            cell: (props: any) => (
                              <th 
                                {...props} 
                                style={{ 
                                  ...props.style, 
                                  height: '40px', 
                                  backgroundColor: '#F5F7FA', 
                                  color: '#223355',
                                  fontWeight: 'medium'
                                }} 
                              />
                            ),
                          },
                          body: {
                            row: DraggableRow,
                            cell: (props: any) => (
                              <td 
                                {...props} 
                                style={{ 
                                  ...props.style, 
                                  color: '#223355'
                                }} 
                              />
                            ),
                          },
                        }}
                      >
                          <Column
                             title="拖拽"
                             key="drag"
                             width="5%"
                             render={() => null}
                           />
                           <Column
                             title="序号"
                             dataIndex="index"
                             key="index"
                             width="5%"
                             render={(_, __, index) => index + 1}
                           />
                        <Column
                            title="章节名称"
                            dataIndex="sectionName"
                            key="sectionName"
                            width="18%"
                            ellipsis
                          />

                          <Column
                            title="章节级别"
                            dataIndex="sectionLevel"
                            key="sectionLevel"
                            width="10%"
                            render={(value) => {
                              const levelMap: Record<string, string> = {
                                '一级': '一级章节',
                                '二级': '二级章节',
                                '三级': '三级章节'
                              };
                              return levelMap[value as string] || value;
                            }}
                          />
                          <Column
                             title="备注"
                             dataIndex="remark"
                             key="remark"
                             width="20%"
                             ellipsis
                           />
                        <Column
                          title="操作"
                          key="action"
                          width="17%"
                          render={(_, record: any) => (
                            <div style={{ display: 'flex', gap: '0px' }}>
                              <Button 
                                type="link" 
                                size="small"
                                style={{ color: '#3388FF', padding: '0 4px' }}
                                onClick={() => handleEditTicket(record)}
                              >
                                编辑
                              </Button>
                              <Button 
                                type="link" 
                                size="small"
                                style={{ color: '#3388FF', padding: '0 4px' }}
                                onClick={() => handleViewRelatedAppeals(record)}
                              >
                                查看诉求
                              </Button>
                              <Button 
                                type="link" 
                                size="small" 
                                style={{ color: '#FF4433', padding: '0 4px' }}
                                onClick={() => handleDeleteTicket(record)}
                              >
                                删除
                              </Button>
                            </div>
                          )}
                        />
                      </Table>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧预览区域 */}
        <div className={cn(
          "bg-white border-l border-[#E9ECF2] transition-all duration-300 flex flex-col",
          previewVisible ? "w-96" : "w-12"
        )}>
          {previewVisible && (
            <div className="px-5 py-4 border-b border-[#E9ECF2] flex items-center justify-between" style={{ height: '57px' }}>
              <h3 className="text-sm font-medium text-[#223355] m-0">预览</h3>
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
                        format="YYYY-MM-DD"
                        size="small"
                        className="w-full"
                        value={previewFilters.reportTime}
                        onChange={handleDateRangeChange}
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
                
                <div className="flex gap-2 mb-5">
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => {
                      handleGeneratePreview();
                      setFiltersCollapsed(true);
                    }}
                    loading={previewLoading}
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
                <div className="flex-1 overflow-auto">
                  {previewContent ? (
                    <div className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded border" dangerouslySetInnerHTML={{ __html: previewContent }} />
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
      
      {/* 编辑过滤条件弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-2 border-b border-[#E9ECF2] px-4 py-0 h-14">
            <span>编辑</span>
          </div>
        }
        open={editFilterVisible}
        onOk={handleSaveEditFilter}
        onCancel={handleCancelEditFilter}
        okText="保存"
        cancelText="取消"
        width={800}
        centered
        style={{ padding: 20, margin: 0 }}
        styles={{
          body: { padding: '20px 0 0 0', margin: 0 },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' }
        }}
        wrapClassName="!p-0 !m-0"
        footer={
          <div className="border-t border-[#E9ECF2]" style={{ marginTop: '20px' }}>
            <div className="flex justify-end gap-2 px-4 py-3">
              <Button onClick={handleCancelEditFilter}>取消</Button>
              <Button type="primary" onClick={handleSaveEditFilter}>
                保存
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ padding: '0 20px' }}>
          <Form
            form={editFilterForm}
            layout="vertical"
            style={{ marginTop: 16 }}
          >
            {/* 第一行：章节名称，章节级别 */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="章节名称"
                  name="sectionName"
                  rules={[{ required: true, message: '请输入章节名称' }]}
                >
                  <Input placeholder="请输入章节名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="章节级别"
                  name="sectionLevel"
                  rules={[{ required: true, message: '请选择章节级别' }]}
                >
                  <Select placeholder="请选择章节级别">
                    <Option value="一级">一级章节</Option>
                    <Option value="二级">二级章节</Option>
                    <Option value="三级">三级章节</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            

            
            {/* 第三行：备注 */}
            <Row>
              <Col span={24}>
                <Form.Item
                  label="备注"
                  name="remark"
                >
                  <Input placeholder="请输入备注" />
                </Form.Item>
              </Col>
            </Row>
            
            {/* 第四行：上报时间，诉求来源 */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="上报时间"
                  name="reportTime"
                >
                  <RangePicker 
                    placeholder={['开始时间', '结束时间']}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="诉求来源"
                  name="appealSource"
                >
                  <Select placeholder="请选择诉求来源" allowClear>
                    <Option value="微信">微信</Option>
                    <Option value="电话">电话</Option>
                    <Option value="网络">网络</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            {/* 第五行：所属区域，诉求事项 */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="所属区域"
                  name="belongArea"
                >
                  <Select placeholder="请选择所属区域" allowClear>
                    <Option value="市辖区A">市辖区A</Option>
                    <Option value="市辖区B">市辖区B</Option>
                    <Option value="县城C">县城C</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="诉求事项"
                  name="appealMatter"
                >
                  <Select placeholder="请选择诉求事项" allowClear>
                    <Option value="环境污染">环境污染</Option>
                    <Option value="交通拥堵">交通拥堵</Option>
                    <Option value="噪音扰民">噪音扰民</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            {/* 第六行：诉求标签 */}
            <Row>
              <Col span={12}>
                <Form.Item
                  label="诉求标签"
                  name="appealTags"
                >
                  <Select 
                    mode="multiple" 
                    placeholder="请选择诉求标签" 
                    allowClear
                  >
                    <Option value="紧急">紧急</Option>
                    <Option value="重要">重要</Option>
                    <Option value="投诉">投诉</Option>
                    <Option value="建议">建议</Option>
                    <Option value="咨询">咨询</Option>
                    <Option value="举报">举报</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
           </Form>
         </div>
       </Modal>
      
      {/* 查看关联诉求弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-2 border-b border-[#E9ECF2] px-4 py-0 h-14">
            <span>查看诉求</span>
          </div>
        }
        open={viewAppealsVisible}
        onCancel={handleCloseViewAppeals}
        width={1600}
        centered
        style={{ padding: 20, margin: 0 }}
        styles={{
          body: { height: 'calc(80vh - 40px)', padding: 20, margin: 0 },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' }
        }}
        wrapClassName="!p-0 !m-0"
        footer={null}
      >
        <div className="pt-5 pb-4 px-5 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap">
            {/* 过滤条件 */}
            <Form form={appealsSearchForm} layout="inline" className="flex-1">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 whitespace-nowrap">诉求编号:</span>
                  <Form.Item name="appealId" className="mb-0">
                    <Input
                      placeholder="请输入诉求编号"
                      className="w-48"
                      allowClear
                    />
                  </Form.Item>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 whitespace-nowrap">诉求来源:</span>
                  <Form.Item name="appealSource" className="mb-0">
                    <Select 
                      placeholder="请选择诉求来源" 
                      className="w-48" 
                      allowClear
                    >
                      <Option value="微信">微信</Option>
                      <Option value="电话">电话</Option>
                      <Option value="网站">网站</Option>
                      <Option value="现场">现场</Option>
                    </Select>
                  </Form.Item>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 whitespace-nowrap">所属区域:</span>
                  <Form.Item name="region" className="mb-0">
                    <Select 
                      placeholder="请选择区域" 
                      className="w-48" 
                      allowClear
                    >
                      <Option value="市辖区A">市辖区A</Option>
                      <Option value="市辖区B">市辖区B</Option>
                      <Option value="市辖区C">市辖区C</Option>
                    </Select>
                  </Form.Item>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 whitespace-nowrap">诉求事项:</span>
                  <Form.Item name="appealItem" className="mb-0">
                    <Select 
                      placeholder="请选择诉求事项" 
                      className="w-48" 
                      allowClear
                    >
                      <Option value="环境污染">环境污染</Option>
                      <Option value="噪音扰民">噪音扰民</Option>
                      <Option value="交通问题">交通问题</Option>
                      <Option value="其他">其他</Option>
                    </Select>
                  </Form.Item>
              </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 whitespace-nowrap">处理状态:</span>
                  <Form.Item name="status" className="mb-0">
                    <Select 
                      placeholder="请选择状态" 
                      className="w-48" 
                      allowClear
                    >
                      <Option value="待处理">待处理</Option>
                      <Option value="处理中">处理中</Option>
                      <Option value="已处理">已处理</Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            </Form>
            
            {/* 按钮组 */}
             <div className="flex items-center space-x-2 ml-4">
               <Button onClick={handleResetAppealsSearch}>
                 重置
               </Button>
               <Button type="primary" loading={appealsLoading}>
                 查询
               </Button>
             </div>
          </div>
        </div>
        
        <div style={{ padding: '0 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Table
            dataSource={appealsData}
            loading={appealsLoading}
            rowKey="id"
            pagination={false}
            scroll={{ y: 'calc(100vh - 500px)' }}
            locale={{
              emptyText: '暂无关联诉求数据'
            }}
            style={{
              borderTop: '1px solid #E9ECF2',
              borderRadius: '0',
              flex: 1
            }}
            components={{
              header: {
                cell: (props: any) => (
                  <th 
                    {...props} 
                    style={{
                      ...props.style,
                      height: '40px',
                      backgroundColor: '#F5F7FA',
                      color: '#223355',
                      whiteSpace: 'nowrap',
                      padding: '8px 16px',
                      borderRadius: '0'
                    }}
                  />
                )
              },
              body: {
                row: (props: any) => (
                  <tr 
                    {...props} 
                    style={{
                      ...props.style,
                      height: '50px'
                    }}
                  />
                ),
                cell: (props: any) => (
                  <td 
                    {...props} 
                    style={{
                      ...props.style,
                      color: '#223355',
                      whiteSpace: 'nowrap',
                      padding: '8px 16px'
                    }}
                  />
                )
              }
            }}
          >
          <Column
            title="诉求编号"
            dataIndex="appealId"
            key="appealId"
            width={120}
            render={(text) => (
              <span style={{ color: '#3388FF' }}>{text}</span>
            )}
          />
          <Column
            title="诉求来源"
            dataIndex="appealSource"
            key="appealSource"
            width={80}
          />
          <Column
            title="所属区域"
            dataIndex="region"
            key="region"
            width={100}
          />
          <Column
            title="诉求事项"
            dataIndex="appealItem"
            key="appealItem"
            width={100}
          />
          <Column
            title="诉求内容"
            dataIndex="appealContent"
            key="appealContent"
            ellipsis={{ showTitle: false }}
            render={(text) => (
              <span title={text}>{text}</span>
            )}
          />
          <Column
            title="上报时间"
            dataIndex="reportTime"
            key="reportTime"
            width={150}
          />
          <Column
            title="处理状态"
            dataIndex="status"
            key="status"
            width={80}
            render={(status) => (
              <span
                style={{
                  color: status === '已处理' ? '#52c41a' : status === '处理中' ? '#1890ff' : '#faad14'
                }}
              >
                {status}
              </span>
            )}
          />
          </Table>
        </div>
        {/* 翻页器 - 移到弹窗底部边缘 */}
         <div style={{ 
           position: 'absolute',
           bottom: '0',
           left: '0',
           right: '0',
           width: '100%',
           borderTop: '1px solid #E9ECF2',
           backgroundColor: '#fff',
           padding: '16px 20px 16px 0',
           display: 'flex',
           justifyContent: 'flex-end'
         }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#666' }}>共 {appealsData?.length || 0} 条记录</span>
            <select 
              style={{
                padding: '4px 8px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px'
              }}
              defaultValue="10"
            >
              <option value="10">10 条/页</option>
              <option value="20">20 条/页</option>
              <option value="50">50 条/页</option>
            </select>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <button 
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                上一页
              </button>
              <span style={{
                 padding: '4px 8px',
                 border: '1px solid #3388FF',
                 borderRadius: '4px',
                 background: '#3388FF',
                 color: '#fff'
               }}>
                1
              </span>
              <button 
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                下一页
              </button>
            </div>
            <span style={{ color: '#666' }}>跳至</span>
            <input 
              type="number" 
              style={{
                width: '50px',
                padding: '4px 8px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px'
              }}
              defaultValue="1"
            />
            <span style={{ color: '#666' }}>页</span>
          </div>
        </div>
      </Modal>
      
      {/* 模板编辑弹窗 */}
      <ContentEditModal
        visible={templateEditModalVisible}
        onCancel={handleTemplateEditCancel}
        onSave={handleTemplateEditSave}
        editData={currentTemplateEditItem}
        mode={templateEditMode}
        parent_id={templateEditParentId}
        level={templateEditLevel}
      />
      
      {/* 新的章节编辑弹窗 */}
      <ContentEditModal
        visible={contentModalVisible}
        onCancel={() => {
          setContentModalVisible(false);
          setEditingContent(null);
        }}
        onSave={handleContentSave}
        editData={editingContent}
        mode={editingContent?.id?.startsWith('content_') ? 'edit' : 'add'}
        parent_id={editingContent?.parentId}
        level={editingContent?.level || 1}
      />
    </div>
    </div>
  );
};

export default ReportTemplateEdit;