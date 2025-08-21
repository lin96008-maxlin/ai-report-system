import React, { useState, useEffect } from 'react';
import { Card, Input, Button, DatePicker, Checkbox, message, Modal, Tree, Empty, Pagination, Select, Progress } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, ExportOutlined, FolderOutlined, FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { TreeDataNode } from 'antd';
import { Report, ReportQuery } from '@/types';

// 扩展Report接口
interface ExtendedReport extends Report {
  report_status: 'generating' | 'generated';
}

// 添加卡片样式
const cardStyles = `
  .report-card {
    border: 1px solid #E9ECF2;
    border-radius: 8px;
    transition: all 0.2s ease;
    background: #fff;
    position: relative;
  }
  
  .report-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .report-card .ant-card-body {
    padding: 16px;
  }
  
  .report-card .ant-card-actions {
    background: transparent;
    border-top: 1px solid #f0f0f0;
    text-align: center;
    padding: 8px 0;
  }
  
  .report-card .ant-card-actions > li {
    margin: 0 8px;
  }
  
  .report-card .ant-card-actions .anticon {
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .report-card .ant-card-actions .anticon:hover {
    transform: scale(1.1);
  }
`;

interface ReportCategory {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
  created_at: string;
  created_by: string;
}
import { cn } from '@/utils';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import ReportGenerationProgress from '@/components/ReportGenerationProgress';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<ExtendedReport[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [reportCategories, setReportCategories] = useState<ReportCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [queryParams, setQueryParams] = useState<ReportQuery>({});
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchCategory, setSearchCategory] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });
  
  // 获取报告生成状态管理
  const {
    reportGenerationTasks,
    startReportGeneration,
    updateReportProgress,
    completeReportGeneration,
    failReportGeneration,
    getReportTask
  } = useAppStore();

  // 模拟多层级分类数据（完全照搬维度管理）
  const mockCategories: ReportCategory[] = [
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

  // 获取分类名称的辅助函数
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || '未知分类';
  };

  const mockReports: ExtendedReport[] = [
    {
      id: '1',
      name: '2024年第一季度客户投诉分析报告',
      title: '2024年第一季度客户投诉分析报告',
      description: '针对第一季度客户投诉情况的详细分析',
      type: '季报',
      category_id: '9',
      category_name: '投诉分析',
      template_id: 'template_1',
      template_name: '投诉分析模板',
      status: 'generating',
      content: '',
      filters: {
        report_time_start: '2024-01-01',
        report_time_end: '2024-03-31',
        appeal_nature: ['投诉']
      },
      associated_work_orders: [],
      created_at: '2024-01-15 10:30:00',
      created_by: '张三',
      updated_at: '2024-01-16 14:20:00',
      progress: 65,
      report_status: 'generating' as const
    },
    {
      id: '2',
      name: '2024年1月客户满意度报告',
      title: '2024年1月客户满意度报告',
      description: '1月份客户满意度调查结果分析',
      type: '月报',
      category_id: '8',
      category_name: '月报',
      template_id: 'template_2',
      template_name: '满意度分析模板',
      status: 'completed',
      content: '<p>报告内容...</p>',
      filters: {
        report_time_start: '2024-01-01',
        report_time_end: '2024-01-31',
        satisfaction_rating: ['非常满意', '满意']
      },
      associated_work_orders: [],
      created_at: '2024-01-10 14:20:00',
      created_by: '李四',
      updated_at: '2024-01-12 16:45:00',
      report_status: 'generated' as const
    },
    {
      id: '3',
      name: '2024年度服务质量专题报告',
      title: '2024年度服务质量专题报告',
      description: '全年服务质量综合分析报告',
      type: '专题报告',
      category_id: '10',
      category_name: '建议分析',
      template_id: 'template_3',
      template_name: '服务质量模板',
      status: 'completed',
      content: '<p>专题报告内容...</p>',
      filters: {
        report_time_start: '2024-01-01',
        report_time_end: '2024-12-31',
        appeal_status: ['已办结']
      },
      associated_work_orders: [],
      created_at: '2024-01-05 09:15:00',
      created_by: '王五',
      updated_at: '2024-01-08 11:30:00',
      report_status: 'generated' as const
    }
  ];

  useEffect(() => {
    // 从localStorage加载分类数据，如果没有则使用默认数据
    const savedCategories = localStorage.getItem('reportCategories');
    if (savedCategories) {
      const parsedCategories = JSON.parse(savedCategories);
      setReportCategories(parsedCategories);
      setCategories(parsedCategories);
    } else {
      setReportCategories(mockCategories);
      setCategories(mockCategories);
      localStorage.setItem('reportCategories', JSON.stringify(mockCategories));
    }
    loadReports();
  }, [selectedCategoryId, queryParams, pagination.current]);

  // 监听reportCategories变化，同步到categories
  useEffect(() => {
    setCategories(reportCategories);
  }, [reportCategories]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredReports = mockReports;
      
      // 按目录过滤
      if (selectedCategoryId !== 'all') {
        filteredReports = filteredReports.filter(report => report.category_id === selectedCategoryId);
      }
      
      // 按查询条件过滤
      if (queryParams.name) {
        filteredReports = filteredReports.filter(report => 
          report.name.toLowerCase().includes(queryParams.name!.toLowerCase())
        );
      }
      
      if (queryParams.description) {
        filteredReports = filteredReports.filter(report => 
          report.description?.toLowerCase().includes(queryParams.description!.toLowerCase())
        );
      }
      
      if (queryParams.template_name) {
        filteredReports = filteredReports.filter(report => 
          report.template_name.toLowerCase().includes(queryParams.template_name!.toLowerCase())
        );
      }
      
      if (queryParams.created_date_start && queryParams.created_date_end) {
        filteredReports = filteredReports.filter(report => {
          const reportDate = dayjs(report.created_at).format('YYYY-MM-DD');
          return reportDate >= queryParams.created_date_start! && reportDate <= queryParams.created_date_end!;
        });
      }
      
      // 排序：生成中的报告置顶，其余按创建时间倒序
      filteredReports.sort((a, b) => {
        if (a.status === 'generating' && b.status !== 'generating') return -1;
        if (a.status !== 'generating' && b.status === 'generating') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setReports(filteredReports);
      setPagination(prev => ({ ...prev, total: filteredReports.length }));
    } catch (error) {
      message.error('加载报告列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadReports();
  };

  const handleReset = () => {
    setQueryParams({});
    setSelectedCategoryId('all');
    setSelectedCategory('all');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(reports.map(report => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleBatchDelete = () => {
    if (selectedReports.length === 0) {
      message.warning('请选择要删除的报告');
      return;
    }
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedReports.length} 个报告吗？`,
      onOk: async () => {
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          message.success('删除成功');
          setSelectedReports([]);
          loadReports();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleBatchExport = () => {
    if (selectedReports.length === 0) {
      message.warning('请选择要导出的报告');
      return;
    }
    
    message.success(`正在导出 ${selectedReports.length} 个报告...`);
  };

  // 模拟生成报告
  const handleGenerateReport = async (reportId: string) => {
    try {
      setLoading(true);
      
      // 启动报告生成任务
      startReportGeneration(reportId);
      
      // 更新报告状态为生成中
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'generating', progress: 0 }
          : report
      ));
      
      message.success('报告生成任务已启动');
      
      // 模拟生成进度
      simulateProgress(reportId);
    } catch (error) {
      message.error('启动报告生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 模拟生成报告提交后的状态管理
  const handleReportSubmit = (reportData: any) => {
    // 创建新的生成中报告记录
    const newReport: ExtendedReport = {
      id: Date.now().toString(),
      name: reportData.title || '新生成报告',
      title: reportData.title || '新生成报告',
      description: reportData.description || '新生成的报告',
      type: reportData.type || '自定义报告',
      category_id: reportData.category_id || '1',
      category_name: reportData.category_name || '默认分类',
      template_id: reportData.template_id || 'template_1',
      template_name: reportData.template_name || '默认模板',
      status: 'generating',
      content: '',
      filters: reportData.filters || {},
      associated_work_orders: [],
      created_at: new Date().toISOString().replace('T', ' ').split('.')[0],
      created_by: '当前用户',
      updated_at: new Date().toISOString().replace('T', ' ').split('.')[0],
      progress: 0,
      report_status: 'generating' as const
    };

    // 添加到报告列表
    setReports(prev => [newReport, ...prev]);

    // 模拟进度条加载
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 20;
      setReports(prev => prev.map(report => 
        report.id === newReport.id 
          ? { ...report, progress }
          : report
      ));

      if (progress >= 100) {
        clearInterval(progressInterval);
        // 5秒后状态变更为已生成
        setTimeout(() => {
          setReports(prev => prev.map(report => 
            report.id === newReport.id 
              ? { ...report, status: 'completed', report_status: 'generated' as const, progress: undefined }
              : report
          ));
          message.success('报告生成完成');
        }, 1000); // 进度条完成后1秒变更状态
      }
    }, 1000); // 每秒增加20%进度
  };

  // 模拟进度更新
  const simulateProgress = (reportId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // 完成生成
        completeReportGeneration(reportId);
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, status: 'completed', progress: 100 }
            : report
        ));
        
        message.success('报告生成完成');
      } else {
        // 更新进度
        const currentProgress = Math.floor(progress);
        updateReportProgress(reportId, currentProgress);
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, progress: currentProgress }
            : report
        ));
      }
    }, 500);
  };

  // 批量生成报告
  const handleBatchGenerate = async () => {
    if (selectedReports.length === 0) {
      message.warning('请选择要生成的报告');
      return;
    }
    
    Modal.confirm({
      title: '批量生成报告',
      content: `确定要生成选中的 ${selectedReports.length} 个报告吗？`,
      onOk: async () => {
        try {
          setLoading(true);
          
          // 批量启动生成任务
          for (const reportId of selectedReports) {
            startReportGeneration(reportId);
            setReports(prev => prev.map(report => 
              report.id === reportId 
                ? { ...report, status: 'generating', progress: 0 }
                : report
            ));
            
            // 延迟启动下一个任务，避免同时启动太多
            setTimeout(() => simulateProgress(reportId), Math.random() * 1000);
          }
          
          setSelectedReports([]);
          message.success('批量生成任务已启动');
        } catch (error) {
          message.error('批量生成失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };



  const handleDeleteReport = (reportId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个报告吗？',
      onOk: async () => {
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          message.success('删除成功');
          loadReports();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleEditReport = (report: ExtendedReport) => {
    if (report.report_status === 'generating') {
      message.warning('报告生成中，请稍等');
      return;
    }
    navigate(`/intelligent-report/report/edit/${report.id}`);
  };

  const handleViewReport = (report: ExtendedReport) => {
    if (report.report_status === 'generating') {
      message.warning('报告生成中，请稍等');
      return;
    }
    navigate(`/intelligent-report/report/view/${report.id}`);
  };

  // 构建树形数据（完全照搬维度管理）
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
            icon: folderIcon,
            children: children,
            isLeaf: false
          };
        }
        
        // 叶子节点：应用搜索过滤
        if (!matchesSearch) {
          return null;
        }
        
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
          icon: folderIcon,
          isLeaf: true
        };
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
        title: '所有报告',
        key: 'all',
        icon: folderIcon,
        children: buildChildren(null),
        isLeaf: false
      }
    ];
    return rootNodes;
  };

  const folderIcon = (
    <img 
      src="/folder-icon.svg" 
      alt="folder" 
      style={{ width: '16px', height: '16px' }}
    />
  );

  // 分类管理状态
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'add' | 'edit' | 'addChild'>('add');
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parent_id: undefined as string | undefined });

  // 处理新增分类
  const handleAddCategory = () => {
    setCategoryModalMode('add');
    setCurrentCategory(null);
    setCategoryForm({ name: '', description: '', parent_id: undefined });
    setCategoryModalVisible(true);
  };

  // 处理编辑分类
  const handleEditCategory = (category: ReportCategory) => {
    setCategoryModalMode('edit');
    setCurrentCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id
    });
    setCategoryModalVisible(true);
  };

  // 处理新增子分类
  const handleAddChildCategory = (parentCategory: ReportCategory) => {
    setCategoryModalMode('addChild');
    setCurrentCategory(parentCategory);
    setCategoryForm({ name: '', description: '', parent_id: parentCategory.id });
    setCategoryModalVisible(true);
  };

  // 处理删除分类
  const handleDeleteCategory = (categoryId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: (
        <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 8, marginBottom: 8 }}>
          删除分类将同时删除其下所有子分类和报告，此操作不可恢复，确定要删除吗？
        </div>
      ),
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        // 删除分类及其子分类
        const deleteRecursive = (id: string, categoriesList: any[]) => {
          const children = categoriesList.filter(cat => cat.parent_id === id);
          children.forEach(child => deleteRecursive(child.id, categoriesList));
          return categoriesList.filter(cat => cat.id !== id);
        };
        const updatedCategories = deleteRecursive(categoryId, reportCategories);
        setReportCategories(updatedCategories);
        
        // 保存到localStorage
        localStorage.setItem('reportCategories', JSON.stringify(updatedCategories));
        
        // 删除该分类下的所有报告
        const updatedReports = reports.filter(report => report.category_id !== categoryId);
        setReports(updatedReports);
        localStorage.setItem('reports', JSON.stringify(updatedReports));
        
        // 如果删除的是当前选中的分类，重置为全部
        if (selectedCategory === categoryId) {
          setSelectedCategory('all');
        }
        
        message.success('分类删除成功');
      }
    });
  };

  // 处理分类Modal确认
  const handleCategoryModalOk = () => {
    if (!categoryForm.name.trim()) {
      message.error('请输入分类名称');
      return;
    }

    if (categoryModalMode === 'edit' && currentCategory) {
      // 编辑分类
      const updatedCategories = reportCategories.map(cat => 
        cat.id === currentCategory.id 
          ? { ...cat, name: categoryForm.name, description: categoryForm.description }
          : cat
      );
      setReportCategories(updatedCategories);
      
      // 保存到localStorage
      localStorage.setItem('reportCategories', JSON.stringify(updatedCategories));
      
      message.success('分类编辑成功');
    } else {
      // 新增分类
      const newCategory = {
        id: Date.now().toString(),
        name: categoryForm.name,
        description: categoryForm.description,
        parent_id: categoryForm.parent_id ?? undefined,
        created_at: new Date().toISOString().split('T')[0],
        created_by: '当前用户'
      };
      const updatedCategories = [...reportCategories, newCategory];
      setReportCategories(updatedCategories);
      
      // 保存到localStorage
      localStorage.setItem('reportCategories', JSON.stringify(updatedCategories));
      
      // 自动展开父分类节点和新分类节点
      const keysToExpand = ['all', newCategory.id];
      if (categoryForm.parent_id) {
        keysToExpand.push(categoryForm.parent_id);
      }
      setExpandedKeys(prev => [...new Set([...prev, ...keysToExpand])]);
      
      message.success('分类新增成功');
    }

    setCategoryModalVisible(false);
  };

  // 处理分类Modal取消
  const handleCategoryModalCancel = () => {
    setCategoryModalVisible(false);
  };

  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
  };

  return (
    <>
      {/* 注入卡片样式 */}
      <style dangerouslySetInnerHTML={{ __html: cardStyles }} />
      
      <div className="h-full bg-white rounded flex mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
      {/* 左侧目录树 */}
      <div className="w-[280px] flex-shrink-0 px-5 pb-5">
        <div className="h-full flex flex-col">
          <h3 className="text-lg font-medium text-gray-800 mb-3 pt-5">报告分类</h3>
          {/* 树查询框 */}
          <Input
            placeholder="搜索分类"
            className="mb-3"
            allowClear
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          />
          <Button type="dashed" icon={<PlusOutlined />} size="small" block className="mb-0" style={{ marginBottom: '-16px' }} onClick={handleAddCategory}>
            新增分类
          </Button>
          <div className="flex-1 overflow-auto overflow-x-hidden" style={{ marginTop: '-16px' }}>
            <Tree
              showIcon
              expandedKeys={expandedKeys}
              selectedKeys={[selectedCategory]}
              treeData={buildTreeData()}
              onSelect={(keys) => {
                if (keys.length > 0) {
                  setSelectedCategory(keys[0] as string);
                  setSelectedCategoryId(keys[0] as string);
                }
              }}
              onExpand={(keys) => {
                setExpandedKeys(keys as string[]);
              }}
              className="custom-tree text-sm tree-compact-spacing"
              style={{ marginTop: 0, paddingTop: 0, marginBottom: 0 }}
              showLine={false}
              blockNode={true}
              switcherIcon={({ expanded }) => 
                expanded ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14l5-5 5 5z"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                )
              }
            />
            
            {/* 树组件自定义样式 */}
            <style dangerouslySetInnerHTML={{
              __html: `
                .custom-tree .ant-tree-treenode {
                  height: 40px !important;
                  display: flex !important;
                  align-items: center !important;
                  font-size: 14px !important;
                  color: #223355 !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  position: relative !important;
                  width: 240px !important;
                  margin-left: 0px !important;
                  margin-bottom: 0px !important;
                  margin-top: 0px !important;
                }
                .custom-tree .ant-tree-treenode:hover {
                  background-color: #F8FAFC !important;
                  width: 240px !important;
                  margin-left: 0px !important;
                }
                .custom-tree .ant-tree-treenode.ant-tree-treenode-selected {
                  background-color: #F0F9FF !important;
                  width: 240px !important;
                  margin-left: 0px !important;
                }
                .custom-tree .ant-tree-node-content-wrapper {
                  height: 40px !important;
                  line-height: 40px !important;
                  display: flex !important;
                  align-items: center !important;
                  padding: 0 8px !important;
                  border-radius: 0 !important;
                  flex: 1 !important;
                  margin-left: 0px !important;
                  padding-left: 0px !important;
                  background: transparent !important;
                  margin-bottom: 0px !important;
                  margin-top: 0px !important;
                  gap: 4px !important;
                }
                .custom-tree .ant-tree-node-selected .ant-tree-node-content-wrapper {
                  color: #3388FF !important;
                  height: 40px !important;
                  margin-left: 0px !important;
                  padding-left: 0px !important;
                  background: transparent !important;
                  margin-bottom: 0px !important;
                  margin-top: 0px !important;
                }
                .custom-tree .ant-tree-list-holder {
                  margin: 0 !important;
                  padding: 0 !important;
                  line-height: 40px !important;
                }
                .custom-tree .ant-tree-switcher {
                  margin: 0 !important;
                  padding: 0 4px !important;
                }
                .custom-tree .ant-tree-node-selected .ant-tree-title {
                  color: #3388FF !important;
                  font-weight: 500 !important;
                }
                .custom-tree .ant-tree-title {
                  color: inherit !important;
                  font-size: 14px !important;
                  font-weight: 400 !important;
                }
                .custom-tree .ant-tree-switcher {
                  color: #6B7A99 !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  margin: 0 !important;
                  padding: 0 4px !important;
                  height: 40px !important;
                  line-height: 40px !important;
                }
                .custom-tree .ant-tree-iconEle {
                  color: #6B7A99 !important;
                  display: flex !important;
                  align-items: center !important;
                  margin-right: 4px !important;
                }
                .custom-tree .ant-tree-list-holder-inner {
                  padding: 0 !important;
                  margin: 0 !important;
                  line-height: 40px !important;
                }
                .custom-tree .ant-tree-indent {
                  margin: 0 !important;
                  padding: 0 !important;
                  height: 40px !important;
                  line-height: 40px !important;
                }
                .custom-tree.ant-tree {
                  margin: 0 !important;
                  padding: 0 !important;
                  line-height: 40px !important;
                }
                .custom-tree .ant-tree-list {
                  margin: 0 !important;
                  padding: 0 !important;
                  line-height: 40px !important;
                }
                .custom-tree.ant-tree-show-line {
                  margin: 0 !important;
                  padding: 0 !important;
                  line-height: 40px !important;
                }
                .custom-tree .ant-tree-show-line {
                  margin: 0 !important;
                  padding: 0 !important;
                  line-height: 40px !important;
                }
                .custom-tree .ant-tree-node-content-wrapper:hover {
                  background-color: #F5F7FA !important;
                  color: #3388FF !important;
                  width: 240px !important;
                  height: 40px !important;
                  margin-left: 0px !important;
                  padding-left: 8px !important;
                  margin-bottom: 0px !important;
                  margin-top: 0px !important;
                }
              `
            }} />
          </div>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="w-px bg-[#E9ECF2] flex-shrink-0" />

      {/* 右侧主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 查询条件 */}
        <div className="pt-5 pb-4 px-5 border-b border-[#E9ECF2] flex-shrink-0 pr-0" style={{marginTop: '0px'}}>
          <div className="flex items-center justify-between flex-wrap">
            {/* 第一行：默认显示的查询条件 */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 whitespace-nowrap">报告名称:</span>
                <Input
                  placeholder="请输入报告名称"
                  value={queryParams.name}
                  onChange={(e) => setQueryParams(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: '200px' }}
                  allowClear
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 whitespace-nowrap">报告描述:</span>
                <Input
                  placeholder="请输入报告描述"
                  value={queryParams.description}
                  onChange={(e) => setQueryParams(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '200px' }}
                  allowClear
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 whitespace-nowrap">报告模板:</span>
                <Input
                  placeholder="请输入报告模板"
                  value={queryParams.template_name}
                  onChange={(e) => setQueryParams(prev => ({ ...prev, template_name: e.target.value }))}
                  style={{ width: '200px' }}
                  allowClear
                />
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center space-x-2" style={{ marginLeft: '16px', marginRight: '20px' }}>
              <Button 
                type="text" 
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="text-[#3388FF]"
              >
                {showAdvancedSearch ? '收起' : '展开'}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button icon={<SearchOutlined />} type="primary" onClick={handleSearch}>
                查询
              </Button>
            </div>
          </div>

          {/* 第二行：高级查询条件 */}
          {showAdvancedSearch && (
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 whitespace-nowrap">创建时间:</span>
                <RangePicker
                  value={queryParams.created_date_start && queryParams.created_date_end ? 
                    [dayjs(queryParams.created_date_start), dayjs(queryParams.created_date_end)] : null}
                  onChange={(dates) => {
                    if (dates) {
                      setQueryParams(prev => ({
                        ...prev,
                        created_date_start: dates[0]?.format('YYYY-MM-DD'),
                        created_date_end: dates[1]?.format('YYYY-MM-DD')
                      }));
                    } else {
                      setQueryParams(prev => ({
                        ...prev,
                        created_date_start: undefined,
                        created_date_end: undefined
                      }));
                    }
                  }}
                  style={{ width: '280px' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 操作栏 */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={reports.length > 0 && selectedReports.length === reports.length}
              indeterminate={selectedReports.length > 0 && selectedReports.length < reports.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              全选
            </Checkbox>
            <span className="text-gray-500">已选择 {selectedReports.length} 项</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/intelligent-report/generate')}
              >
                生成报告
              </Button>
            <Button 
              icon={<ExportOutlined />}
              onClick={handleBatchExport}
              disabled={selectedReports.length === 0}
            >
              批量导出
            </Button>
            <Button 
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
              disabled={selectedReports.length === 0}
            >
              批量删除
            </Button>
          </div>
        </div>

        {/* 报告卡片列表 */}
        <div className="flex-1 px-5 pb-5 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div>加载中...</div>
            </div>
          ) : reports.length === 0 ? (
            <Empty description="暂无报告数据" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report, index) => (
                <Card
                  key={report.id}
                  className={cn(
                    "report-card cursor-pointer hover:shadow-md transition-shadow relative",
                    selectedReports.includes(report.id) && "border-2"
                  )}
                  style={selectedReports.includes(report.id) ? { borderColor: '#3388FF' } : {}}
                  onClick={() => handleViewReport(report)}
                  actions={[
                    <EditOutlined 
                      key="edit" 
                      style={{ 
                        color: report.report_status === 'generating' ? '#d9d9d9' : '#3388FF',
                        cursor: report.report_status === 'generating' ? 'not-allowed' : 'pointer'
                      }} 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (report.report_status !== 'generating') {
                          handleEditReport(report);
                        }
                      }} 
                    />,
                    <ExportOutlined 
                      key="export" 
                      style={{ 
                        color: report.report_status === 'generating' ? '#d9d9d9' : '#52C41A',
                        cursor: report.report_status === 'generating' ? 'not-allowed' : 'pointer'
                      }} 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (report.report_status !== 'generating') {
                          message.success('正在导出报告...');
                        }
                      }} 
                    />,
                    <DeleteOutlined key="delete" style={{ color: '#FF4D4F' }} onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReport(report.id);
                    }} />
                  ]}
                >

                  
                  {/* 第一行：复选框、序号、报告标题 - 垂直居中 */}
                  <div className="flex items-center gap-3 mb-3">
                    {/* 选择框 */}
                    <Checkbox
                      checked={selectedReports.includes(report.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectReport(report.id, e.target.checked);
                      }}
                    />
                    
                    {/* 序号 */}
                    <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium flex-shrink-0">
                      {(pagination.current - 1) * pagination.pageSize + index + 1}
                    </div>
                    
                    {/* 报告标题 */}
                     <h3 className="text-base font-medium text-[#24292F] flex-1">
                       {report.title || report.name}
                     </h3>
                  </div>
                  
                  <Card.Meta
                    title={null}
                    description={
                      <div>
                        {/* 描述单独一行 */}
                        <p className="text-gray-600 mb-2">{report.description || '暂无描述'}</p>
                        
                        {/* 字段布局：一行两个字段 */}
                        <div className="space-y-2 text-sm">
                          {/* 第一行：报告模板，报告状态 */}
                          <div className="grid grid-cols-2 gap-x-4">
                            <div>
                              <span className="text-[#8B949E]">报告模板：</span>
                              <span className="text-[#24292F]">{report.template_name}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-[#8B949E]">报告状态：</span>
                              <span className="text-[#24292F] flex items-center gap-1">
                                {report.report_status === 'generating' ? (
                                  <>
                                    <LoadingOutlined className="text-blue-500" spin />
                                    生成中
                                  </>
                                ) : (
                                  '已生成'
                                )}
                              </span>
                            </div>
                          </div>
                          
                          {/* 第二行：报告目录，创建人 */}
                          <div className="grid grid-cols-2 gap-x-4">
                            <div>
                              <span className="text-[#8B949E]">报告目录：</span>
                              <span className="text-[#24292F]">{getCategoryName(report.category_id)}</span>
                            </div>
                            <div>
                              <span className="text-[#8B949E]">创建人：</span>
                              <span className="text-[#24292F]">{report.created_by}</span>
                            </div>
                          </div>
                          
                          {/* 第三行：创建时间，更新时间 */}
                          <div className="grid grid-cols-2 gap-x-4">
                            <div>
                              <span className="text-[#8B949E]">创建时间：</span>
                              <span className="text-[#24292F]">{formatDate(report.created_at)}</span>
                            </div>
                            <div>
                              <span className="text-[#8B949E]">更新时间：</span>
                              <span className="text-[#24292F]">{report.updated_at ? formatDate(report.updated_at) : '-'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 进度条 - 绝对定位贴近卡片下边缘，不占用高度 */}
                        {report.report_status === 'generating' && (
                          <Progress 
                            percent={report.progress || 0}
                            showInfo={false}
                            strokeColor="#3388FF"
                            size="small"
                            className="absolute bottom-0 left-0 right-0"
                            style={{ 
                              margin: 0, 
                              padding: 0,
                              height: '2px',
                              borderRadius: '0 0 8px 8px'
                            }}
                          />
                        )}
                      </div>
                    }
                  />
                  

                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* 分页 */}
        {reports.length > 0 && (
          <div className="bg-white px-5 py-3 flex justify-end items-center" style={{ paddingBottom: '20px', height: '32px' }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={(page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize }));
              }}
              onShowSizeChange={(current, size) => {
                setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
              }}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
              pageSizeOptions={['10', '20', '50', '100']}
              size="small"
              className="custom-pagination"
            />
          </div>
        )}
      </div>
    </div>

    {/* 分类管理Modal */}
    <Modal
      title={
        categoryModalMode === 'add' ? '新增分类' :
        categoryModalMode === 'edit' ? '编辑分类' : '新增子分类'
      }
      open={categoryModalVisible}
      onOk={handleCategoryModalOk}
      onCancel={handleCategoryModalCancel}
      okText="确定"
      cancelText="取消"
      width={500}
    >
      <div className="space-y-4 pt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">分类名称 *</label>
          <Input
            placeholder="请输入分类名称"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
            maxLength={50}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">分类描述</label>
          <Input.TextArea
            placeholder="请输入分类描述"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            maxLength={200}
          />
        </div>
        {categoryModalMode === 'addChild' && currentCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">父分类</label>
            <Input value={currentCategory.name} disabled />
          </div>
        )}
      </div>
    </Modal>
    </>
  );
};

export default ReportManagement;