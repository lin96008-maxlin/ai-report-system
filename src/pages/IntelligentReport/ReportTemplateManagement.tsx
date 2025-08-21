import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Tag, message, Modal, DatePicker, Popconfirm, Pagination, Empty, Checkbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ReportTemplate, ReportTemplateQuery } from '../../types';
import ReportTemplatePreview from './ReportTemplatePreview';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ReportTemplateManagement: React.FC = () => {

  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  const [queryParams, setQueryParams] = useState<ReportTemplateQuery>({
    name: '',
    type: undefined,
    is_published: undefined,
    dateRange: null
  });

  // 模拟数据
  const mockTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: '城市运行日报模板',
      description: '每日城市运行情况的综合分析报告模板',
      type: '日报',
      content_structure: {
        rich_text_content: '<h1>城市运行日报</h1><p>{{今日工单总量}}个工单已处理</p>',
        embedded_dimensions: []
      },
      is_published: true,
      created_at: '2024-01-15 09:00:00',
      created_by: 'admin',
      updated_at: '2024-01-15 14:30:00',
      updated_by: 'admin'
    },
    {
      id: '2',
      name: '环境卫生周报模板',
      description: '环境卫生相关工单统计分析周报',
      type: '周报',
      content_structure: {
        rich_text_content: '<h1>环境卫生周报</h1><p>本周共处理{{环境卫生工单数}}个工单</p>',
        embedded_dimensions: []
      },
      is_published: false,
      created_at: '2024-01-14 10:00:00',
      created_by: 'user1',
      updated_at: '2024-01-14 16:20:00',
      updated_by: 'user1'
    },
    {
      id: '3',
      name: '交通治理月报模板',
      description: '交通治理工单月度统计分析报告',
      type: '月报',
      content_structure: {
        rich_text_content: '<h1>交通治理月报</h1><p>本月交通工单{{交通工单总量}}个</p>',
        embedded_dimensions: []
      },
      is_published: true,
      created_at: '2024-01-10 08:30:00',
      created_by: 'admin',
      updated_at: '2024-01-12 11:15:00',
      updated_by: 'admin'
    }
  ];

  // 获取模板列表
  const fetchTemplates = async (query?: ReportTemplateQuery) => {
    setLoading(true);
    try {
      // 从localStorage获取保存的模板数据
      const savedTemplates = localStorage.getItem('reportTemplates');
      let allTemplates = savedTemplates ? JSON.parse(savedTemplates) : mockTemplates;
      
      let filteredTemplates = [...allTemplates];
      
      if (query?.name) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.name.toLowerCase().includes(query.name!.toLowerCase())
        );
      }
      
      if (query?.description) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.description?.toLowerCase().includes(query.description!.toLowerCase())
        );
      }
      
      if (query?.type && query.type.length > 0) {
        filteredTemplates = filteredTemplates.filter(t => 
          query.type!.includes(t.type)
        );
      }

      setTemplates(filteredTemplates);
      setPagination(prev => ({
        ...prev,
        total: filteredTemplates.length
      }));
    } catch (error) {
      message.error('获取模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    
    // 监听模板更新事件
    const handleTemplatesUpdated = () => {
      fetchTemplates();
    };
    
    window.addEventListener('templatesUpdated', handleTemplatesUpdated);
    
    // 清理事件监听器
    return () => {
      window.removeEventListener('templatesUpdated', handleTemplatesUpdated);
    };
  }, []);

  // 搜索
  const handleSearch = () => {
    fetchTemplates(queryParams);
  };

  // 重置
  const handleReset = () => {
    setQueryParams({
      name: '',
      type: undefined,
      is_published: undefined,
      dateRange: null
    });
    fetchTemplates();
  };

  // 批量操作
 
   const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的模板');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个模板吗？删除后不可恢复。`,
      onOk: async () => {
        try {
          // 获取当前模板数据
          const savedTemplates = localStorage.getItem('reportTemplates');
          let allTemplates = savedTemplates ? JSON.parse(savedTemplates) : mockTemplates;
          
          // 删除选中的模板
          allTemplates = allTemplates.filter((template: ReportTemplate) => !selectedRowKeys.includes(template.id));
          
          // 保存到localStorage
          localStorage.setItem('reportTemplates', JSON.stringify(allTemplates));
          
          // 模拟API延迟
          await new Promise(resolve => setTimeout(resolve, 500));
          message.success(`已删除 ${selectedRowKeys.length} 个模板`);
          setSelectedRowKeys([]);
          fetchTemplates(); // 重新获取数据以更新列表
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 新建模板
  const handleAdd = () => {
    const addTabEvent = new CustomEvent('addTab', {
      detail: {
        key: 'report-template-add',
        label: '新增模板',
        path: '/intelligent-report/report-template-edit-simple/new',
        closable: true
      }
    });
    window.dispatchEvent(addTabEvent);
  };

  // 编辑模板
  const handleEdit = (record: ReportTemplate) => {
    // 检查模板是否有内容（使用rich_text_content字段）
    const hasRichTextContent = record.content_structure?.rich_text_content && 
                              record.content_structure.rich_text_content.trim().length > 0;
    
    // 检查是否有章节内容
    const hasTemplateContentItems = record.templateContentItems && 
                                   Array.isArray(record.templateContentItems) && 
                                   record.templateContentItems.length > 0;
    
    // 根据是否有内容决定跳转到哪个编辑页面
    const editPath = (hasRichTextContent || hasTemplateContentItems)
      ? `/intelligent-report/report-template-edit-simple/${record.id}`
      : `/intelligent-report/report-template-edit/${record.id}`;
    
    const addTabEvent = new CustomEvent('addTab', {
      detail: {
        key: `report-template-edit-${record.id}`,
        label: `编辑模板 - ${record.name}`,
        path: editPath,
        closable: true
      }
    });
    window.dispatchEvent(addTabEvent);
  };



  // 关闭预览
  const handleClosePreview = () => {
    setPreviewModalVisible(false);
    setSelectedTemplate(null);
  };

  // 删除模板
  const handleDelete = async (record: ReportTemplate) => {
    try {
      // 获取当前模板数据
      const savedTemplates = localStorage.getItem('reportTemplates');
      let allTemplates = savedTemplates ? JSON.parse(savedTemplates) : mockTemplates;
      
      // 删除指定模板
      allTemplates = allTemplates.filter((template: ReportTemplate) => template.id !== record.id);
      
      // 保存到localStorage
      localStorage.setItem('reportTemplates', JSON.stringify(allTemplates));
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success('删除成功');
      fetchTemplates();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 发布模板
  const handlePublish = async (record: ReportTemplate) => {
    try {
      // 模拟发布API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 获取当前localStorage中的模板数据
      const savedTemplates = localStorage.getItem('reportTemplates');
      let allTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];
      
      // 更新localStorage中的模板发布状态
      allTemplates = allTemplates.map((template: ReportTemplate) => 
        template.id === record.id 
          ? { ...template, is_published: true }
          : template
      );
      
      // 保存到localStorage
      localStorage.setItem('reportTemplates', JSON.stringify(allTemplates));
      
      // 更新本地状态
      setTemplates(prev => prev.map(template => 
        template.id === record.id 
          ? { ...template, is_published: true }
          : template
      ));
      
      message.success('发布成功');
    } catch (error) {
      message.error('发布失败');
    }
  };

  // 取消发布模板
  const handleUnpublish = async (record: ReportTemplate) => {
    try {
      // 模拟取消发布API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 获取当前localStorage中的模板数据
      const savedTemplates = localStorage.getItem('reportTemplates');
      let allTemplates = savedTemplates ? JSON.parse(savedTemplates) : [];
      
      // 更新localStorage中的模板发布状态
      allTemplates = allTemplates.map((template: ReportTemplate) => 
        template.id === record.id 
          ? { ...template, is_published: false }
          : template
      );
      
      // 保存到localStorage
      localStorage.setItem('reportTemplates', JSON.stringify(allTemplates));
      
      // 更新本地状态
      setTemplates(prev => prev.map(template => 
        template.id === record.id 
          ? { ...template, is_published: false }
          : template
      ));
      
      message.success('取消发布成功');
    } catch (error) {
      message.error('取消发布失败');
    }
  };

  // 批量操作

  const handleBatchTogglePublish = async (publish: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的模板');
      return;
    }
    
    Modal.confirm({
      title: `确认${publish ? '发布' : '取消发布'}`,
      content: `确定要${publish ? '发布' : '取消发布'}选中的 ${selectedRowKeys.length} 个模板吗？`,
      onOk: async () => {
        try {
          // 获取当前模板数据
          const savedTemplates = localStorage.getItem('reportTemplates');
          let allTemplates = savedTemplates ? JSON.parse(savedTemplates) : mockTemplates;
          
          // 更新选中模板的发布状态
          allTemplates = allTemplates.map((template: ReportTemplate) => {
            if (selectedRowKeys.includes(template.id)) {
              return { ...template, is_published: publish };
            }
            return template;
          });
          
          // 保存到localStorage
          localStorage.setItem('reportTemplates', JSON.stringify(allTemplates));
          
          // 模拟API延迟
          await new Promise(resolve => setTimeout(resolve, 500));
          message.success(`${publish ? '发布' : '取消发布'}成功`);
          setSelectedRowKeys([]);
          fetchTemplates();
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };





  return (
    <div className="h-full bg-white rounded flex flex-col mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
      {/* 页面标题栏 */}
      <div className="p-5 border-b border-[#E9ECF2]">
        <h2 className="font-medium text-[#223355] m-0" style={{fontSize: '18px'}}>模板管理</h2>
      </div>

      {/* 查询条件 */}
      <div className="pt-5 pb-4 px-5 border-b border-[#E9ECF2] flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* 查询条件 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-[#223355] whitespace-nowrap">模板名称:</span>
              <Input
                placeholder="请输入模板名称"
                value={queryParams.name}
                onChange={(e) => setQueryParams(prev => ({ ...prev, name: e.target.value }))}
                style={{ width: '260px' }}
                allowClear
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[#223355] whitespace-nowrap">模板类型:</span>
              <Select
                placeholder="请选择模板类型"
                value={queryParams.type}
                onChange={(value) => setQueryParams(prev => ({ ...prev, type: value }))}
                style={{ width: '260px' }}
                allowClear
              >
                <Option value="日报">日报</Option>
                <Option value="周报">周报</Option>
                <Option value="月报">月报</Option>
                <Option value="季报">季报</Option>
                <Option value="半年报">半年报</Option>
                <Option value="年报">年报</Option>
                <Option value="专题报告">专题报告</Option>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[#223355] whitespace-nowrap">发布状态:</span>
              <Select
                placeholder="请选择发布状态"
                value={queryParams.is_published}
                onChange={(value) => setQueryParams(prev => ({ ...prev, is_published: value }))}
                style={{ width: '260px' }}
                allowClear
              >
                <Option value={true}>已发布</Option>
                <Option value={false}>未发布</Option>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[#223355] whitespace-nowrap">创建时间:</span>
              <RangePicker
                value={queryParams.dateRange}
                onChange={(dates) => setQueryParams(prev => ({ ...prev, dateRange: dates }))}
                style={{ width: '260px' }}
              />
            </div>
          </div>
          
          {/* 按钮组 */}
          <div className="flex items-center space-x-2">
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
              查询
            </Button>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
        <div className="px-5 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={templates.length > 0 && selectedRowKeys.length === templates.length}
                indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < templates.length}
                onChange={(e: CheckboxChangeEvent) => {
                  if (e.target.checked) {
                    setSelectedRowKeys(templates.map(t => t.id));
                  } else {
                    setSelectedRowKeys([]);
                  }
                }}
              >
                全选
              </Checkbox>
              <span className="text-sm text-gray-500">
                已选择 {selectedRowKeys.length} 项，共 {pagination.total} 项
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增模板
              </Button>
              <Button 
                disabled={selectedRowKeys.length === 0}
                onClick={() => handleBatchTogglePublish(true)}
              >
                批量发布
              </Button>
              <Button 
                disabled={selectedRowKeys.length === 0}
                onClick={() => handleBatchTogglePublish(false)}
              >
                批量取消发布
              </Button>
              <Button 
                danger
                disabled={selectedRowKeys.length === 0}
                onClick={() => handleBatchDelete()}
              >
                批量删除
              </Button>
            </div>
          </div>
        </div>

      {/* 模板列表 */}
      <div className="flex-1 px-5 pb-5 flex flex-col min-h-0">
        {templates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Empty description="暂无模板数据" />
          </div>
        ) : (
          <>
            <div className="flex-1 mb-4 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {templates.slice(
                  (pagination.current - 1) * pagination.pageSize,
                  pagination.current * pagination.pageSize
                ).map((template, index) => (
                  <Card
                    key={template.id}
                    className={`template-card cursor-pointer hover:shadow-md transition-shadow ${
                      selectedRowKeys.includes(template.id) ? 'border-2' : 'border border-gray-200'
                    }`}
                    style={selectedRowKeys.includes(template.id) ? { borderColor: '#3388FF' } : {}}
                    onClick={() => handleEdit(template)}
                    actions={[
                      <EditOutlined key="edit" style={{ color: '#3388FF' }} onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleEdit(template);
                      }} />,
                      template.is_published ? (
                        <div
                          key="unpublish"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnpublish(template);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <FileTextOutlined style={{ color: '#ff4d4f' }} />
                        </div>
                      ) : (
                        <div
                          key="publish"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(template);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <FileTextOutlined style={{ color: '#52c41a' }} />
                        </div>
                      ),
                      <Popconfirm
                        key="delete"
                        title="确定要删除这个模板吗？"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          handleDelete(template);
                        }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <DeleteOutlined style={{ color: '#FF4433' }} onClick={(e: React.MouseEvent) => e.stopPropagation()} />
                      </Popconfirm>
                    ]}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedRowKeys.includes(template.id)}
                          onChange={(e: CheckboxChangeEvent) => {
                            if (e.target.checked) {
                              setSelectedRowKeys(prev => [...prev, template.id]);
                            } else {
                              setSelectedRowKeys(prev => prev.filter(id => id !== template.id));
                            }
                          }}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-2">
                          {/* 圆形序号 */}
                          <div 
                            className="flex items-center justify-center rounded-full text-white font-medium"
                            style={{ 
                              backgroundColor: '#3388FF', 
                              color: '#FFFFFF',
                              width: '24px',
                              height: '24px',
                              fontSize: '12px'
                            }}
                          >
                            {(pagination.current - 1) * pagination.pageSize + index + 1}
                          </div>
                          {/* 模板类型图标 */}
                          <div 
                            className="text-xs font-medium" 
                            style={{ 
                              color: '#3388FF', 
                              minWidth: '40px', 
                              height: '20px',
                              border: '1px solid #3388FF',
                              borderRadius: '4px',
                              display: 'flex', 
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 4px'
                            }}
                          >
                            {template.type || '模板'}
                          </div>
                          {/* 模板名称 */}
                          <span className="font-medium text-gray-900">{template.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Card.Meta
                      title={null}
                      description={
                        <div>
                          <p className="text-gray-600 mb-2">{template.description || '暂无描述'}</p>
                          <div className="space-y-1 text-xs text-gray-500">
                            {/* 第一行：创建时间、创建人 */}
                            <div className="flex">
                              <div className="flex-1">
                                <span>创建时间: </span>
                                <span>{new Date(template.created_at).toLocaleString('zh-CN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }).replace(/\//g, '-')}</span>
                              </div>
                              <div className="flex-1">
                                <span>创建人: </span>
                                <span>{template.created_by}</span>
                              </div>
                            </div>
                            {/* 第二行：更新时间、发布状态 */}
                            <div className="flex">
                              <div className="flex-1">
                                <span>更新时间: </span>
                                <span>
                                  {template.updated_at ? 
                                    new Date(template.updated_at).toLocaleString('zh-CN', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }).replace(/\//g, '-') : 
                                    '-'
                                  }
                                </span>
                              </div>
                              <div className="flex-1">
                                <span>发布状态: </span>
                                <Tag color={template.is_published ? 'success' : 'default'}>
                                  {template.is_published ? '已发布' : '未发布'}
                                </Tag>
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                ))}
              </div>
            </div>
            
            {/* 翻页器 */}
            <div className="flex justify-end flex-shrink-0">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                pageSizeOptions={['10', '20', '50', '100']}
                onChange={(page, pageSize) => {
                  setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize || prev.pageSize
                  }));
                  setSelectedRowKeys([]);
                }}
                onShowSizeChange={(_, size) => {
                  setPagination(prev => ({
                    ...prev,
                    current: 1,
                    pageSize: size
                  }));
                  setSelectedRowKeys([]);
                }}
              />
            </div>
          </>
        )}
      </div>
      {selectedTemplate && (
        <ReportTemplatePreview
          visible={previewModalVisible}
          template={selectedTemplate}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
};

export default ReportTemplateManagement;