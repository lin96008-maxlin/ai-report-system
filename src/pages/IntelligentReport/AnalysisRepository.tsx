import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Tree, Tabs, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TreeDataNode } from 'antd';

interface ProblemCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

interface ProjectCase {
  id: string;
  name: string;
  description: string;
  category_id: string;
  created_at: string;
}

const AnalysisRepository: React.FC = () => {
  const [searchCategory, setSearchCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1-5-1');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['all', '1', '1-5']);
  const [categories, setCategories] = useState<ProblemCategory[]>([
    { id: '1', name: '公共安全', description: '公共安全相关问题分类' },
    { id: '2', name: '城市管理', description: '城市管理相关问题分类' },
    { id: '3', name: '规土住建', description: '规土住建相关问题分类' },
    { id: '4', name: '食药市监', description: '食药市监相关问题分类' },
    { id: '5', name: '环保水务', description: '环保水务相关问题分类' },
    { id: '6', name: '妇女权益保障', description: '妇女权益保障相关问题分类' },
    { id: '7', name: '党纪政务', description: '党纪政务相关问题分类' },
    { id: '8', name: '经济管理', description: '经济管理相关问题分类' },
    { id: '9', name: '社会服务', description: '社会服务相关问题分类' },
    { id: '1-1', name: '消防安全', parent_id: '1', description: '消防安全相关问题' },
    { id: '1-2', name: '施工安全', parent_id: '1', description: '施工安全相关问题' },
    { id: '1-3', name: '生产安全', parent_id: '1', description: '生产安全相关问题' },
    { id: '1-4', name: '燃气安全', parent_id: '1', description: '燃气安全相关问题' },
    { id: '1-5', name: '交通安全', parent_id: '1', description: '交通安全相关问题' },
    { id: '1-5-1', name: '非法营运', parent_id: '1-5', description: '非法营运相关问题' },
    { id: '1-5-2', name: '交通边坡隐患', parent_id: '1-5', description: '交通边坡隐患相关问题' },
    { id: '1-5-3', name: '无证驾驶', parent_id: '1-5', description: '无证驾驶相关问题' },
    { id: '1-5-4', name: '报废车上路行驶', parent_id: '1-5', description: '报废车上路行驶相关问题' },
  ]);
  
  const [projectCases, setProjectCases] = useState<ProjectCase[]>([
    { id: '1', name: '某区域非法营运专项整治', description: '针对某区域非法营运车辆的专项整治行动', category_id: '1-5-1', created_at: '2024-01-15' },
    { id: '2', name: '交通边坡安全隐患排查', description: '对重点路段交通边坡进行安全隐患排查', category_id: '1-5-2', created_at: '2024-01-20' },
    { id: '3', name: '无证驾驶专项治理', description: '开展无证驾驶专项治理行动', category_id: '1-5-3', created_at: '2024-01-25' },
  ]);

  // 构建树形数据
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
                      // handleEditCategory(cat);
                    }}
                    className="text-xs p-1 h-6 w-6"
                  />
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      // handleAddChildCategory(cat);
                    }}
                    className="text-xs p-1 h-6 w-6"
                  />
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<DeleteOutlined style={{ color: '#FF4433' }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      // handleDeleteCategory(cat.id);
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
                      // handleEditCategory(cat);
                    }}
                    className="text-xs p-1 h-6 w-6"
                  />
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      // handleAddChildCategory(cat);
                    }}
                    className="text-xs p-1 h-6 w-6"
                  />
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<DeleteOutlined style={{ color: '#FF4433' }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      // handleDeleteCategory(cat.id);
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
        title: '所有问题分类',
        key: 'all',
        icon: folderIcon,
        children: buildChildren(null),
        isLeaf: false
      }
    ];
    return rootNodes;
  };

  // 获取当前选中分类的信息
  const getCurrentCategory = () => {
    if (selectedCategory === 'all') {
      return {
        name: '所有问题分类',
        description: '研判归因库中的所有问题分类'
      };
    }
    return categories.find(cat => cat.id === selectedCategory);
  };

  // 获取当前分类的项目案例
  const getCurrentCases = () => {
    if (selectedCategory === 'all') {
      return projectCases;
    }
    return projectCases.filter(case_ => case_.category_id === selectedCategory);
  };

  const currentCategory = getCurrentCategory();
  const currentCases = getCurrentCases();

  return (
    <div className="h-full bg-white rounded flex mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
      {/* 左侧问题分类树 */}
      <div className="w-[280px] flex-shrink-0 px-5 pb-5">
        <div className="h-full flex flex-col">
          <h3 className="text-lg font-medium text-gray-800 mb-3 pt-5">问题分类</h3>
          {/* 树查询框 */}
          <Input
            placeholder="搜索分类"
            className="mb-3"
            allowClear
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          />
          <Button type="dashed" icon={<PlusOutlined />} size="small" block className="mb-0" style={{ marginBottom: '-16px' }}>
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
                }
              }}
              onExpand={(keys) => {
                setExpandedKeys(keys as string[]);
              }}
              className="custom-tree text-sm tree-compact-spacing"
              style={{ marginTop: 0, paddingTop: 0, marginBottom: 0 }}
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
          </div>
          
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

      {/* 分隔线 */}
      <div className="w-px bg-[#E9ECF2] flex-shrink-0" />

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 标题栏 */}
        <div className="pt-5 pb-4 px-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-[#223355] m-0">
              {currentCategory?.name || '研判归因库'}
            </h2>

          </div>
        </div>
        
        {/* Tab导航和内容 */}
        <div className="flex-1 overflow-hidden">
          <Tabs
            defaultActiveKey="basic"
            className="h-full pl-5"
            style={{ height: '100%' }}
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <div className="pt-5 pr-5 pb-5 h-full overflow-auto">
                      {/* 第一行：问题名称，所属分类 */}
                      <div className="border border-[#DDE1EB] rounded-none">
                        <div className="flex">
                          <div className="bg-[#F5F7FA] px-4 py-3 border-r border-[#DDE1EB] w-32 flex-shrink-0 flex items-center">
                            <span className="text-sm font-medium text-gray-700" style={{fontSize: '14px'}}>问题名称</span>
                          </div>
                          <div className="bg-white px-4 py-3 flex-1 border-r border-[#DDE1EB] flex items-center">
                            <span className="text-gray-900" style={{fontSize: '14px'}}>{currentCategory?.name}</span>
                          </div>
                          <div className="bg-[#F5F7FA] px-4 py-3 border-r border-[#DDE1EB] w-32 flex-shrink-0 flex items-center">
                            <span className="text-sm font-medium text-gray-700" style={{fontSize: '14px'}}>所属分类</span>
                          </div>
                          <div className="bg-white px-4 py-3 flex-1 flex items-center">
                            <span className="text-gray-900" style={{fontSize: '14px'}}>
                              {selectedCategory === 'all' ? '所有问题分类' : 
                               selectedCategory.includes('-') ? 
                                 categories.find(cat => cat.id === selectedCategory.split('-')[0])?.name + ' > ' + currentCategory?.name :
                                 currentCategory?.name
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 第二行：创建时间，创建人 */}
                      <div className="border border-[#DDE1EB] rounded-none border-t-0">
                        <div className="flex">
                          <div className="bg-[#F5F7FA] px-4 py-3 border-r border-[#DDE1EB] w-32 flex-shrink-0 flex items-center">
                            <span className="text-sm font-medium text-gray-700" style={{fontSize: '14px'}}>创建时间</span>
                          </div>
                          <div className="bg-white px-4 py-3 flex-1 border-r border-[#DDE1EB] flex items-center">
                            <span className="text-gray-900" style={{fontSize: '14px'}}>2025-06-23 12:12:30</span>
                          </div>
                          <div className="bg-[#F5F7FA] px-4 py-3 border-r border-[#DDE1EB] w-32 flex-shrink-0 flex items-center">
                            <span className="text-sm font-medium text-gray-700" style={{fontSize: '14px'}}>创建人</span>
                          </div>
                          <div className="bg-white px-4 py-3 flex-1 flex items-center">
                            <span className="text-gray-900" style={{fontSize: '14px'}}>林朝阳</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 第三行：背景描述 */}
                      <div className="border border-[#DDE1EB] rounded-none border-t-0">
                        <div className="flex">
                          <div className="bg-[#F5F7FA] px-4 py-3 border-r border-[#DDE1EB] w-32 flex-shrink-0 flex items-center">
                            <span className="text-sm font-medium text-gray-700" style={{fontSize: '14px'}}>背景描述</span>
                          </div>
                          <div className="bg-white px-4 py-3 flex-1 flex items-center">
                            <span className="text-gray-900 leading-relaxed" style={{fontSize: '14px'}}>
                              在城市交通管理中，非法营运车辆（俗称"黑车"）一直是一个顽疾，其非法经营活动不仅扰乱了正常的交通运输秩序，还存在安全隐患。这些车辆往往缺乏必要的安全检测和保险保障，给乘客的人身安全带来风险。同时，非法营运还冲击了合法运营企业的经营环境，影响了整个行业的健康发展。
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 第四行：相关部门 */}
                      <div className="border border-[#DDE1EB] rounded-none border-t-0">
                        <div className="flex">
                          <div className="bg-[#F5F7FA] px-4 py-3 border-r border-[#DDE1EB] w-32 flex-shrink-0 flex items-center">
                            <span className="text-sm font-medium text-gray-700" style={{fontSize: '14px'}}>相关部门</span>
                          </div>
                          <div className="bg-white px-4 py-3 flex-1 flex items-center">
                            <span className="text-gray-900" style={{fontSize: '14px'}}>
                              交通运输部门：承担道路运输行业的监管责任，负责查处非法营运；公安交警：负责道路交通安全管理，对非法营运车辆进行查处；城市管理部门：对在城市道路上从事非法营运的车辆进行管理；市场监管部门：对涉及非法营运的相关市场行为进行监管。
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 第五行：深层次原因 */}
                      <div className="border border-[#DDE1EB] rounded-none border-t-0">
                        <div className="flex">
                          <div className="bg-[#F5F7FA] px-4 py-3 border-r border-[#DDE1EB] w-32 flex-shrink-0 flex items-center">
                            <span className="text-sm font-medium text-gray-700" style={{fontSize: '14px'}}>深层次原因</span>
                          </div>
                          <div className="bg-white px-4 py-3 flex-1 flex items-center">
                            <span className="text-gray-900 leading-relaxed" style={{fontSize: '14px'}}>
                              利益驱动：非法营运成本低，收益相对较高，一些人员为了经济利益铤而走险；监管难度大：非法营运具有隐蔽性、流动性强的特点，监管部门难以全面覆盖；法律意识淡薄：部分从业人员和乘客对非法营运的危害性认识不足，法律意识薄弱；市场需求：在一些偏远地区或特殊时段，正规运力不足，为非法营运提供了市场空间。
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 第六行：研判建议 */}
                      <div className="border border-[#DDE1EB] rounded-none border-t-0">
                        <div className="flex">
                          <div className="bg-[#F5F7FA] px-4 py-3 border-r border-[#DDE1EB] w-32 flex-shrink-0 flex items-center">
                            <span className="text-sm font-medium text-gray-700" style={{fontSize: '14px'}}>研判建议</span>
                          </div>
                          <div className="bg-white px-4 py-3 flex-1 flex items-center">
                            <span className="text-gray-900 leading-relaxed" style={{fontSize: '14px'}}>
                              加强联合执法：建立交通、公安、城管等多部门联合执法机制，形成监管合力；完善法律法规：进一步完善相关法律法规，加大对非法营运的处罚力度；提升服务水平：增加正规运力投放，提高服务质量，满足市场需求；宣传教育：加强对从业人员和公众的法律宣传教育，提高法律意识；技术手段：利用现代信息技术，建立非法营运监控和举报平台，提高监管效率。
                            </span>
                          </div>
                        </div>
                      </div>
                  </div>
                )
              },
              {
                key: 'cases',
                label: '项目案例',
                children: (
                  <div className="p-5 h-full overflow-auto">
                    <div className="space-y-4">
                      {/* 案例列表 */}
                      <div className="bg-white border border-gray-200 rounded-lg">
                        <div className="border-b border-gray-200 p-4">
                          <h3 className="text-lg font-medium text-gray-900">相关案例</h3>
                          <p className="text-sm text-gray-500 mt-1">共找到 {currentCases.length} 个相关案例</p>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {currentCases.map((case_, index) => (
                            <div key={case_.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="text-base font-medium text-gray-900 mb-2">
                                    {case_.name}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                    <div>
                                      <span className="font-medium">创建时间：</span>
                                      {case_.created_at}
                                    </div>
                                    <div>
                                      <span className="font-medium">分类：</span>
                                      {categories.find(cat => cat.id === case_.category_id)?.name || '未知分类'}
                                    </div>
                                    <div>
                                      <span className="font-medium">状态：</span>
                                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                        已完成
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">责任部门：</span>
                                      交通运输局
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {case_.description}
                                  </p>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  <Button type="link" size="small" className="text-blue-600 hover:text-blue-800">
                                    查看详情
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {currentCases.length === 0 && (
                            <div className="p-8 text-center">
                              <Empty 
                                description="该分类下暂无项目案例"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisRepository;