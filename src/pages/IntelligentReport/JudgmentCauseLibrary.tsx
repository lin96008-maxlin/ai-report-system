import React, { useState, useEffect } from 'react';
import { Card, Input, Button, DatePicker, Checkbox, message, Modal, Tree, Empty, Pagination, Tabs, Select, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TreeDataNode } from 'antd';
import { cn } from '@/utils';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;
// const { TextArea } = Input;

// 定义数据类型
interface Problem {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  content: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

interface ProblemCategory {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
  created_at: string;
  created_by: string;
}

interface Case {
  id: string;
  title: string;
  description?: string;
  category: string;
  content: string;
  tags: string[];
  status: 'active' | 'inactive';
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

const JudgmentCauseLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('basic-info');
  
  // Tab1 基本信息相关状态
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchForm, setSearchForm] = useState({
    name: '',
    description: '',
    dateRange: null as any,
    creator: ''
  });
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [categories, setCategories] = useState<ProblemCategory[]>([]);
  // const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['all']);
  
  // 分类管理相关状态
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'add' | 'edit' | 'addChild'>('add');
  const [currentCategory, setCurrentCategory] = useState<ProblemCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    parent_id: undefined as string | undefined
  });
  const [searchCategory, setSearchCategory] = useState('');
  
  // 问题编辑弹窗相关状态
  const [problemModalVisible, setProblemModalVisible] = useState(false);
  const [problemModalMode, setProblemModalMode] = useState<'add' | 'edit'>('add');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [problemForm, setProblemForm] = useState({
    name: '',
    description: '',
    category_id: '',
    content: ''
  });
  
  // Tab2 项目案例相关状态
  const [cases, setCases] = useState<Case[]>([]);
  // const [selectedCases, setSelectedCases] = useState<string[]>([]);
  // const [caseSearchForm, setCaseSearchForm] = useState({
  //   title: '',
  //   tags: '',
  //   dateRange: null as any,
  //   creator: ''
  // });
  // const [casePagination, setCasePagination] = useState({
  //   current: 1,
  //   pageSize: 12,
  //   total: 0
  // });
  
  // 案例编辑弹窗相关状态
  const [caseModalVisible, setCaseModalVisible] = useState(false);
  const [caseModalMode, setCaseModalMode] = useState<'add' | 'edit'>('add');
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [caseForm, setCaseForm] = useState({
    title: '',
    description: '',
    category: '',
    content: '',
    tags: [] as string[],
    status: 'active' as 'active' | 'inactive'
  });
  
  // 案例搜索和筛选状态
  const [caseSearchText, setCaseSearchText] = useState('');
  const [selectedCaseCategory, setSelectedCaseCategory] = useState<string | undefined>(undefined);
  const [selectedCaseStatus, setSelectedCaseStatus] = useState<string | undefined>(undefined);
  const [currentCasePage, setCurrentCasePage] = useState(1);
  const casesPerPage = 9;

  // 模拟数据
  const mockCategories: ProblemCategory[] = [
    { id: '1', name: '技术问题', parent_id: undefined, description: '技术相关问题分类', created_at: '2024-01-01', created_by: '系统管理员' },
    { id: '2', name: '业务问题', parent_id: undefined, description: '业务相关问题分类', created_at: '2024-01-01', created_by: '系统管理员' },
    { id: '3', name: '流程问题', parent_id: undefined, description: '流程相关问题分类', created_at: '2024-01-01', created_by: '系统管理员' },
    { id: '4', name: '系统故障', parent_id: '1', description: '系统技术故障', created_at: '2024-01-01', created_by: '系统管理员' },
    { id: '5', name: '网络问题', parent_id: '1', description: '网络技术问题', created_at: '2024-01-01', created_by: '系统管理员' }
  ];

  const mockProblems: Problem[] = [
    {
      id: '1',
      name: '系统响应缓慢问题分析',
      description: '分析系统响应缓慢的原因和解决方案',
      category_id: '1',
      content: '系统响应缓慢通常由以下几个方面引起：1. 数据库查询效率低下 2. 服务器资源不足 3. 网络延迟问题 4. 代码逻辑复杂度过高',
      created_at: '2024-01-15 10:30:00',
      created_by: '张三',
      updated_at: '2024-01-20 14:20:00',
      updated_by: '李四'
    },
    {
      id: '2',
      name: '用户权限管理问题',
      description: '用户权限分配和管理相关问题',
      category_id: '2',
      content: '用户权限管理问题主要包括：1. 权限分配不当 2. 角色定义不清晰 3. 权限继承关系复杂 4. 权限变更流程不规范',
      created_at: '2024-01-16 09:15:00',
      created_by: '王五',
      updated_at: '2024-01-18 16:45:00',
      updated_by: '赵六'
    }
  ];

  const mockCases: Case[] = [
    {
      id: '1',
      title: '某银行核心系统性能优化案例',
      description: '通过数据库优化和缓存策略提升系统性能',
      category: '技术问题',
      content: '项目背景：某银行核心系统在高峰期出现响应缓慢问题...\n解决方案：1. 优化数据库索引 2. 引入Redis缓存 3. 调整服务器配置...\n效果：系统响应时间从3秒降低到0.5秒，用户满意度提升30%',
      tags: ['性能优化', '数据库', '缓存'],
      status: 'active',
      created_at: '2024-01-15 10:30:00',
      created_by: '张三',
      updated_at: '2024-01-20 14:20:00',
      updated_by: '李四'
    },
    {
      id: '2',
      title: '企业级权限管理系统重构案例',
      description: '重新设计权限管理架构，提升系统安全性',
      category: '业务问题',
      content: '项目背景：原有权限系统架构老旧，存在安全隐患...\n解决方案：1. 采用RBAC模型 2. 实现细粒度权限控制 3. 增加审计日志...\n效果：权限管理效率提升50%，安全事件减少80%',
      tags: ['权限管理', 'RBAC', '安全'],
      status: 'active',
      created_at: '2024-01-16 09:15:00',
      created_by: '王五',
      updated_at: '2024-01-18 16:45:00',
      updated_by: '赵六'
    },
    {
      id: '3',
      title: '电商平台订单处理流程优化',
      description: '优化订单处理流程，提升用户体验',
      category: '流程问题',
      content: '项目背景：电商平台订单处理流程复杂，用户体验差...\n解决方案：1. 简化订单流程 2. 自动化处理 3. 实时状态更新...\n效果：订单处理时间缩短60%，用户投诉减少40%',
      tags: ['流程优化', '自动化', '用户体验'],
      status: 'active',
      created_at: '2024-01-17 14:20:00',
      created_by: '李明',
      updated_at: '2024-01-19 10:15:00',
      updated_by: '王强'
    }
  ];

  // 构建树形数据 - 完全照搬维度管理的实现
  const buildChildren = (parentId: string | null): TreeDataNode[] => {
    const childCategories = categories.filter(cat => cat.parent_id === parentId || (parentId === null && cat.parent_id === undefined));
    
    return childCategories
      .map(cat => {
        const children = buildChildren(cat.id);
        
        // 简化搜索过滤逻辑：只在有搜索条件时过滤
        const matchesSearch = !searchCategory.trim() || 
          cat.name.toLowerCase().includes(searchCategory.toLowerCase()) ||
          (cat.description && cat.description.toLowerCase().includes(searchCategory.toLowerCase()));
        
        // 如果有子节点，始终显示
        if (children && children.length > 0) {
          return {
            title: (
              <div className="relative group" style={{ width: '240px', marginLeft: '0px' }}>
                <span>{cat.name}</span>
                <div className="absolute top-0 left-0 right-0 bottom-0 hidden group-hover:flex items-center justify-center bg-white bg-opacity-0 rounded space-x-1">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<EditOutlined style={{ color: '#3388FF' }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(cat);
                    }}
                    className="text-xs p-1 h-6 w-6"
                  />
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddChildCategory(cat);
                    }}
                    className="text-xs p-1 h-6 w-6"
                  />
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<DeleteOutlined style={{ color: '#FF4433' }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat.id);
                    }}
                    className="text-xs p-1 h-6 w-6"
                  />
                </div>
              </div>
            ),
            key: cat.id,
            icon: (
               <img 
                 src="/folder-icon.svg" 
                 alt="folder" 
                 style={{ width: '16px', height: '16px' }}
               />
             ),
            children: children,
            isLeaf: false
          };
        }
        
        // 没有子节点时，根据搜索条件决定是否显示
        if (matchesSearch) {
          return {
            title: (
              <div className="relative group" style={{ width: '240px', marginLeft: '0px' }}>
                <span>{cat.name}</span>
                <div className="absolute top-0 left-0 right-0 bottom-0 hidden group-hover:flex items-center justify-center bg-white bg-opacity-0 rounded space-x-1">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<EditOutlined style={{ color: '#3388FF' }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(cat);
                    }}
                    className="text-xs p-1 h-6 w-6"
                  />
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddChildCategory(cat);
                    }}
                    className="text-xs p-1 h-6 w-6"
                  />
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<DeleteOutlined style={{ color: '#FF4433' }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat.id);
                    }}
                    className="text-xs p-1 h-6 w-6"
                  />
                </div>
              </div>
            ),
            key: cat.id,
            icon: (
               <img 
                 src="/folder-icon.svg" 
                 alt="folder" 
                 style={{ width: '16px', height: '16px' }}
               />
             ),
            children: [],
            isLeaf: true
          };
        }
        
        return null;
      })
      .filter(Boolean) as TreeDataNode[];
  };

  const buildTreeData = (): TreeDataNode[] => {
    const folderIcon = (
       <img 
         src="/folder-icon.svg" 
         alt="folder" 
         style={{ width: '16px', height: '16px' }}
       />
     );
    
    const rootNodes: TreeDataNode[] = [
      {
        title: '所有问题',
        key: 'all',
        icon: folderIcon,
        children: buildChildren(null),
        isLeaf: false
      }
    ];
    return rootNodes;
  };

  // 获取分类名称
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '未分类';
  };

  // 过滤问题数据
  const filteredProblems = problems.filter(problem => {
    // 分类过滤
    if (selectedCategory !== 'all' && problem.category_id !== selectedCategory) {
      return false;
    }
    
    // 名称过滤
    if (searchForm.name && !problem.name.includes(searchForm.name)) {
      return false;
    }
    
    // 描述过滤
    if (searchForm.description && !problem.description?.includes(searchForm.description)) {
      return false;
    }
    
    // 创建人过滤
    if (searchForm.creator && !problem.created_by.includes(searchForm.creator)) {
      return false;
    }
    
    // 日期范围过滤
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const [start, end] = searchForm.dateRange;
      const createdDate = new Date(problem.created_at);
      if (createdDate < start || createdDate > end) {
        return false;
      }
    }
    
    return true;
  });

  // 分页后的问题数据
  const paginatedProblems = filteredProblems.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  // 更新总数
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total: filteredProblems.length
    }));
  }, [filteredProblems.length]);

  // 处理搜索
  const handleSearch = () => {
    // setLoading(true);
    setTimeout(() => {
      // setLoading(false);
      message.success('查询完成');
    }, 500);
  };

  // 分类管理函数
  const handleAddCategory = () => {
    setCategoryModalMode('add');
    setCurrentCategory(null);
    setCategoryForm({ name: '', description: '', parent_id: undefined });
    setCategoryModalVisible(true);
  };

  const handleEditCategory = (category: ProblemCategory) => {
    setCategoryModalMode('edit');
    setCurrentCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id
    });
    setCategoryModalVisible(true);
  };

  const handleAddChildCategory = (parentCategory: ProblemCategory) => {
    setCategoryModalMode('addChild');
    setCurrentCategory(parentCategory);
    setCategoryForm({ name: '', description: '', parent_id: parentCategory.id });
    setCategoryModalVisible(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个分类吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        const updatedCategories = categories.filter(cat => cat.id !== categoryId);
        setCategories(updatedCategories);
        localStorage.setItem('problemCategories', JSON.stringify(updatedCategories));
        message.success('删除成功');
      }
    });
  };

  // 问题管理函数
  const handleAddProblem = () => {
    setProblemModalMode('add');
    setCurrentProblem(null);
    setProblemForm({
      name: '',
      description: '',
      category_id: selectedCategory !== 'all' ? selectedCategory : '',
      content: ''
    });
    setProblemModalVisible(true);
  };

  const handleEditProblem = (problem: Problem) => {
    setProblemModalMode('edit');
    setCurrentProblem(problem);
    setProblemForm({
      name: problem.name,
      description: problem.description || '',
      category_id: problem.category_id,
      content: problem.content
    });
    setProblemModalVisible(true);
  };

  const handleDeleteProblem = (problemId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个问题吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        const updatedProblems = problems.filter(p => p.id !== problemId);
        setProblems(updatedProblems);
        localStorage.setItem('problems', JSON.stringify(updatedProblems));
        message.success('删除成功');
      }
    });
  };

  useEffect(() => {
    // 初始化分类数据
    const savedCategories = localStorage.getItem('problemCategories');
    if (savedCategories) {
      try {
        const parsedCategories = JSON.parse(savedCategories);
        setCategories(parsedCategories);
        const allCategoryIds = parsedCategories.map((cat: ProblemCategory) => cat.id);
        setExpandedKeys(['all', ...allCategoryIds]);
      } catch (error) {
        console.error('Failed to parse categories from localStorage:', error);
        setCategories(mockCategories);
        localStorage.setItem('problemCategories', JSON.stringify(mockCategories));
        const allCategoryIds = mockCategories.map(cat => cat.id);
        setExpandedKeys(['all', ...allCategoryIds]);
      }
    } else {
      setCategories(mockCategories);
      localStorage.setItem('problemCategories', JSON.stringify(mockCategories));
      const allCategoryIds = mockCategories.map(cat => cat.id);
      setExpandedKeys(['all', ...allCategoryIds]);
    }
    
    // 初始化问题数据
    const savedProblems = localStorage.getItem('problems');
    if (savedProblems) {
      try {
        const parsedProblems = JSON.parse(savedProblems);
        setProblems(parsedProblems);
      } catch (error) {
        console.error('Failed to parse problems from localStorage:', error);
        setProblems(mockProblems);
        localStorage.setItem('problems', JSON.stringify(mockProblems));
      }
    } else {
      setProblems(mockProblems);
      localStorage.setItem('problems', JSON.stringify(mockProblems));
    }
    
    // 初始化案例数据
    const savedCases = localStorage.getItem('projectCases');
    if (savedCases) {
      try {
        const parsedCases = JSON.parse(savedCases);
        setCases(parsedCases);
      } catch (error) {
        console.error('Failed to parse cases from localStorage:', error);
        setCases(mockCases);
        localStorage.setItem('projectCases', JSON.stringify(mockCases));
      }
    } else {
      setCases(mockCases);
      localStorage.setItem('projectCases', JSON.stringify(mockCases));
    }
  }, []);

  // 案例相关函数
  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = !caseSearchText || 
      caseItem.title.toLowerCase().includes(caseSearchText.toLowerCase()) ||
      caseItem.description?.toLowerCase().includes(caseSearchText.toLowerCase()) ||
      caseItem.tags.some(tag => tag.toLowerCase().includes(caseSearchText.toLowerCase()));
    
    const matchesCategory = !selectedCaseCategory || caseItem.category === selectedCaseCategory;
    const matchesStatus = !selectedCaseStatus || caseItem.status === selectedCaseStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCurrentCases = () => {
    const startIndex = (currentCasePage - 1) * casesPerPage;
    const endIndex = startIndex + casesPerPage;
    return filteredCases.slice(startIndex, endIndex);
  };

  const setCasePage = (page: number) => {
    setCurrentCasePage(page);
  };

  const handleCaseSearch = () => {
    setCurrentCasePage(1);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">研判归因库</h1>
        </div>
      </div>

      {/* Tab导航 */}
      <div className="flex-1 flex flex-col">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="flex-1 flex flex-col"
          tabBarStyle={{ marginBottom: 0 }}
        >
          <TabPane tab="基本信息" key="basic-info">
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex">
                {/* 左侧分类树 */}
                <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
                  {/* 分类管理头部 */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">问题分类</h3>
                      <Button 
                        type="primary" 
                        size="small" 
                        icon={<PlusOutlined />}
                        onClick={() => handleAddCategory()}
                      >
                        新增分类
                      </Button>
                    </div>
                    <Input
                      placeholder="搜索分类"
                      prefix={<SearchOutlined />}
                      value={searchCategory}
                      onChange={(e) => setSearchCategory(e.target.value)}
                      allowClear
                      size="small"
                    />
                  </div>
                  
                  {/* 分类树 */}
                  <div className="flex-1 overflow-auto p-2">
                    <Tree
                      treeData={buildTreeData()}
                      selectedKeys={[selectedCategory]}
                      expandedKeys={expandedKeys}
                      onSelect={(keys) => {
                        if (keys.length > 0) {
                          setSelectedCategory(keys[0] as string);
                        }
                      }}
                      onExpand={(keys) => {
                        setExpandedKeys(keys as string[]);
                      }}
                      showIcon
                      blockNode
                      className="custom-tree"
                    />
                  </div>
                </div>

                {/* 右侧内容区域 */}
                <div className="flex-1 flex flex-col">
                  {/* 搜索和操作栏 */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <Input
                          placeholder="搜索问题名称"
                          prefix={<SearchOutlined />}
                          value={searchForm.name}
                          onChange={(e) => setSearchForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-64"
                          allowClear
                        />
                        <Button 
                          type="text" 
                          icon={expanded ? <span>收起</span> : <span>展开</span>}
                          onClick={() => setExpanded(!expanded)}
                          className="text-blue-600"
                        >
                          {expanded ? '收起' : '展开'}
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button icon={<ReloadOutlined />} onClick={() => handleSearch()}>
                          刷新
                        </Button>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => handleAddProblem()}
                        >
                          新增问题
                        </Button>
                      </div>
                    </div>
                    
                    {/* 展开的搜索条件 */}
                    {expanded && (
                      <div className="grid grid-cols-3 gap-4">
                        <Input
                          placeholder="问题描述"
                          value={searchForm.description}
                          onChange={(e) => setSearchForm(prev => ({ ...prev, description: e.target.value }))}
                          allowClear
                        />
                        <RangePicker
                          placeholder={['开始日期', '结束日期']}
                          value={searchForm.dateRange}
                          onChange={(dates) => setSearchForm(prev => ({ ...prev, dateRange: dates }))}
                          className="w-full"
                        />
                        <Input
                          placeholder="创建人"
                          value={searchForm.creator}
                          onChange={(e) => setSearchForm(prev => ({ ...prev, creator: e.target.value }))}
                          allowClear
                        />
                      </div>
                    )}
                  </div>

                  {/* 问题列表 */}
                  <div className="flex-1 p-4 overflow-auto">
                    {filteredProblems.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {paginatedProblems.map((problem) => (
                            <Card
                              key={problem.id}
                              className={cn(
                                "cursor-pointer transition-all duration-200 hover:shadow-md",
                                selectedProblems.includes(problem.id) ? "ring-2 ring-blue-500" : ""
                              )}
                              size="small"
                              title={
                                <div className="flex items-center justify-between">
                                  <Checkbox
                                    checked={selectedProblems.includes(problem.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedProblems(prev => [...prev, problem.id]);
                                      } else {
                                        setSelectedProblems(prev => prev.filter(id => id !== problem.id));
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex items-center space-x-1">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditProblem(problem);
                                      }}
                                    />
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProblem(problem.id);
                                      }}
                                      danger
                                    />
                                  </div>
                                </div>
                              }
                              onClick={() => {
                                if (selectedProblems.includes(problem.id)) {
                                  setSelectedProblems(prev => prev.filter(id => id !== problem.id));
                                } else {
                                  setSelectedProblems(prev => [...prev, problem.id]);
                                }
                              }}
                            >
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-900 truncate" title={problem.name}>
                                  {problem.name}
                                </h4>
                                {problem.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2" title={problem.description}>
                                    {problem.description}
                                  </p>
                                )}
                                <div className="text-xs text-gray-500 space-y-1">
                                  <div>分类: {getCategoryName(problem.category_id)}</div>
                                  <div>创建: {problem.created_by} · {problem.created_at}</div>
                                  {problem.updated_at !== problem.created_at && (
                                    <div>更新: {problem.updated_by} · {problem.updated_at}</div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {/* 分页 */}
                        <div className="flex justify-center">
                          <Pagination
                            current={pagination.current}
                            pageSize={pagination.pageSize}
                            total={pagination.total}
                            onChange={(page, pageSize) => {
                              setPagination(prev => ({
                                ...prev,
                                current: page,
                                pageSize: pageSize || prev.pageSize
                              }));
                            }}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-20">
                        <Empty description="暂无问题数据" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabPane>
          
          <TabPane tab="项目案例" key="project-cases">
            <div className="p-6">
              {/* 案例管理头部 */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">项目案例管理</h3>
                  <p className="text-sm text-gray-600 mt-1">管理研判归因相关的项目案例</p>
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setCaseForm({
                      title: '',
                      description: '',
                      category: '',
                      content: '',
                      tags: [],
                      status: 'active'
                    });
                    setCaseModalMode('add');
                    setCurrentCase(null);
                    setCaseModalVisible(true);
                  }}
                >
                  新增案例
                </Button>
              </div>

              {/* 搜索和筛选 */}
              <div className="mb-6">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Input.Search
                      placeholder="搜索案例标题、描述或标签"
                      value={caseSearchText}
                      onChange={(e) => setCaseSearchText(e.target.value)}
                      onSearch={handleCaseSearch}
                      allowClear
                      style={{ maxWidth: 400 }}
                    />
                  </div>
                  <Select
                    placeholder="选择分类"
                    value={selectedCaseCategory}
                    onChange={setSelectedCaseCategory}
                    allowClear
                    style={{ width: 150 }}
                  >
                    <Option value="技术问题">技术问题</Option>
                    <Option value="业务问题">业务问题</Option>
                    <Option value="流程问题">流程问题</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                  <Select
                    placeholder="选择状态"
                    value={selectedCaseStatus}
                    onChange={setSelectedCaseStatus}
                    allowClear
                    style={{ width: 120 }}
                  >
                    <Option value="active">启用</Option>
                    <Option value="inactive">禁用</Option>
                  </Select>
                </div>
              </div>

              {/* 案例列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCurrentCases().map(caseItem => (
                  <Card
                    key={caseItem.id}
                    className="hover:shadow-lg transition-shadow duration-200"
                    actions={[
                      <EditOutlined 
                        key="edit" 
                        onClick={() => {
                          setCaseForm({
                            title: caseItem.title,
                            description: caseItem.description || '',
                            category: caseItem.category,
                            content: caseItem.content,
                            tags: caseItem.tags,
                            status: caseItem.status
                          });
                          setCaseModalMode('edit');
                          setCurrentCase(caseItem);
                          setCaseModalVisible(true);
                        }}
                      />,
                      <DeleteOutlined 
                        key="delete" 
                        onClick={() => {
                          Modal.confirm({
                            title: '确认删除',
                            content: `确定要删除案例"${caseItem.title}"吗？`,
                            okText: '确定',
                            cancelText: '取消',
                            onOk: () => {
                              const updatedCases = cases.filter(c => c.id !== caseItem.id);
                              setCases(updatedCases);
                              localStorage.setItem('projectCases', JSON.stringify(updatedCases));
                              message.success('案例删除成功');
                            }
                          });
                        }}
                      />
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div className="flex items-center justify-between">
                          <span className="truncate">{caseItem.title}</span>
                          <Tag color={caseItem.status === 'active' ? 'green' : 'red'}>
                            {caseItem.status === 'active' ? '启用' : '禁用'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <p className="text-gray-600 mb-2 line-clamp-2">{caseItem.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>分类: {caseItem.category}</span>
                            <span>{caseItem.created_at}</span>
                          </div>
                          {caseItem.tags.length > 0 && (
                            <div className="mt-2">
                              {caseItem.tags.map(tag => (
                                <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-1 mr-1">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </Card>
                ))}
              </div>

              {/* 分页 */}
              {filteredCases.length > casesPerPage && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    current={currentCasePage}
                    total={filteredCases.length}
                    pageSize={casesPerPage}
                    onChange={setCasePage}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                  />
                </div>
              )}

              {/* 空状态 */}
              {filteredCases.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">暂无案例数据</div>
                  <p className="text-gray-500 text-sm">点击"新增案例"按钮创建第一个案例</p>
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* 分类编辑弹窗 */}
      <Modal
        title={
          categoryModalMode === 'add' ? '新增分类' :
          categoryModalMode === 'edit' ? '编辑分类' : '新增子分类'
        }
        open={categoryModalVisible}
        onOk={() => {
          if (!categoryForm.name.trim()) {
            message.error('请输入分类名称');
            return;
          }
          
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          
          if (categoryModalMode === 'add' || categoryModalMode === 'addChild') {
            const newCategory: ProblemCategory = {
              id: Date.now().toString(),
              name: categoryForm.name,
              description: categoryForm.description,
              parent_id: categoryForm.parent_id,
              created_at: now,
              created_by: '当前用户'
            };
            
            const updatedCategories = [...categories, newCategory];
            setCategories(updatedCategories);
            localStorage.setItem('problemCategories', JSON.stringify(updatedCategories));
            
            // 展开新增的分类
            setExpandedKeys(prev => [...prev, newCategory.id]);
            
            message.success('分类创建成功');
          } else {
            const updatedCategories = categories.map(cat => 
              cat.id === currentCategory?.id 
                ? { ...cat, name: categoryForm.name, description: categoryForm.description }
                : cat
            );
            setCategories(updatedCategories);
            localStorage.setItem('problemCategories', JSON.stringify(updatedCategories));
            message.success('分类更新成功');
          }
          
          setCategoryModalVisible(false);
        }}
        onCancel={() => setCategoryModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类名称 *</label>
            <Input
              value={categoryForm.name}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入分类名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类描述</label>
            <Input.TextArea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入分类描述"
              rows={3}
            />
          </div>
          {categoryModalMode === 'addChild' && currentCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">父分类</label>
              <Input value={currentCategory.name} disabled />
            </div>
          )}
        </div>
      </Modal>

      {/* 问题编辑弹窗 */}
      <Modal
        title={problemModalMode === 'add' ? '新增问题' : '编辑问题'}
        open={problemModalVisible}
        onOk={() => {
          if (!problemForm.name.trim()) {
            message.error('请输入问题名称');
            return;
          }
          if (!problemForm.category_id) {
            message.error('请选择问题分类');
            return;
          }
          if (!problemForm.content.trim()) {
            message.error('请输入问题内容');
            return;
          }
          
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          
          if (problemModalMode === 'add') {
            const newProblem: Problem = {
              id: Date.now().toString(),
              name: problemForm.name,
              description: problemForm.description,
              category_id: problemForm.category_id,
              content: problemForm.content,
              created_at: now,
              created_by: '当前用户',
              updated_at: now,
              updated_by: '当前用户'
            };
            
            const updatedProblems = [...problems, newProblem];
            setProblems(updatedProblems);
            localStorage.setItem('problems', JSON.stringify(updatedProblems));
            message.success('问题创建成功');
          } else {
            const updatedProblems = problems.map(problem => 
              problem.id === currentProblem?.id 
                ? { 
                    ...problem, 
                    name: problemForm.name,
                    description: problemForm.description,
                    category_id: problemForm.category_id,
                    content: problemForm.content,
                    updated_at: now,
                    updated_by: '当前用户'
                  }
                : problem
            );
            setProblems(updatedProblems);
            localStorage.setItem('problems', JSON.stringify(updatedProblems));
            message.success('问题更新成功');
          }
          
          setProblemModalVisible(false);
        }}
        onCancel={() => setProblemModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={800}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">问题名称 *</label>
            <Input
              value={problemForm.name}
              onChange={(e) => setProblemForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入问题名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">问题分类 *</label>
            <select
              value={problemForm.category_id}
              onChange={(e) => setProblemForm(prev => ({ ...prev, category_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择分类</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">问题描述</label>
            <Input.TextArea
              value={problemForm.description}
              onChange={(e) => setProblemForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入问题描述"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">问题内容 *</label>
            <Input.TextArea
              value={problemForm.content}
              onChange={(e) => setProblemForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="请输入详细的问题分析内容"
              rows={8}
            />
          </div>
        </div>
      </Modal>

      {/* 案例编辑弹窗 */}
      <Modal
        title={caseModalMode === 'add' ? '新增案例' : '编辑案例'}
        open={caseModalVisible}
        onOk={() => {
          if (!caseForm.title.trim()) {
            message.error('请输入案例标题');
            return;
          }
          if (!caseForm.category) {
            message.error('请选择案例分类');
            return;
          }
          if (!caseForm.content.trim()) {
            message.error('请输入案例内容');
            return;
          }
          
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          
          if (caseModalMode === 'add') {
            const newCase: Case = {
              id: Date.now().toString(),
              title: caseForm.title,
              description: caseForm.description,
              category: caseForm.category,
              content: caseForm.content,
              tags: caseForm.tags,
              status: caseForm.status,
              created_at: now,
              created_by: '当前用户',
              updated_at: now,
              updated_by: '当前用户'
            };
            
            const updatedCases = [...cases, newCase];
            setCases(updatedCases);
            localStorage.setItem('projectCases', JSON.stringify(updatedCases));
            message.success('案例创建成功');
          } else {
            const updatedCases = cases.map(caseItem => 
              caseItem.id === currentCase?.id 
                ? { 
                    ...caseItem, 
                    title: caseForm.title,
                    description: caseForm.description,
                    category: caseForm.category,
                    content: caseForm.content,
                    tags: caseForm.tags,
                    status: caseForm.status,
                    updated_at: now,
                    updated_by: '当前用户'
                  }
                : caseItem
            );
            setCases(updatedCases);
            localStorage.setItem('projectCases', JSON.stringify(updatedCases));
            message.success('案例更新成功');
          }
          
          setCaseModalVisible(false);
        }}
        onCancel={() => setCaseModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={800}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">案例标题 *</label>
            <Input
              value={caseForm.title}
              onChange={(e) => setCaseForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入案例标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">案例分类 *</label>
            <Select
              value={caseForm.category}
              onChange={(value) => setCaseForm(prev => ({ ...prev, category: value }))}
              placeholder="请选择分类"
              className="w-full"
            >
              <Option value="技术问题">技术问题</Option>
              <Option value="业务问题">业务问题</Option>
              <Option value="流程问题">流程问题</Option>
              <Option value="其他">其他</Option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">案例状态</label>
            <Select
              value={caseForm.status}
              onChange={(value) => setCaseForm(prev => ({ ...prev, status: value }))}
              className="w-full"
            >
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">案例描述</label>
            <Input.TextArea
              value={caseForm.description}
              onChange={(e) => setCaseForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入案例描述"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
            <Select
              mode="tags"
              value={caseForm.tags}
              onChange={(value) => setCaseForm(prev => ({ ...prev, tags: value }))}
              placeholder="请输入标签，按回车添加"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">案例内容 *</label>
            <Input.TextArea
              value={caseForm.content}
              onChange={(e) => setCaseForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="请输入详细的案例内容，包括项目背景、解决方案、效果等"
              rows={8}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JudgmentCauseLibrary;