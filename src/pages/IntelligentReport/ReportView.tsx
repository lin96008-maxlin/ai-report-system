import React, { useState, useEffect } from 'react';
import { Button, Tabs, Tag, Descriptions, message, Card, Empty } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { Report } from '@/types';

const { TabPane } = Tabs;

const ReportView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');
  const [report, setReport] = useState<Report | null>(null);

  // 模拟报告数据
  const mockReport: Report = {
    id: id || 'report_1',
    name: '2024年1月客户投诉分析报告',
    description: '本报告分析了2024年1月份的客户投诉情况，包括投诉来源、性质、处理情况等，为改进服务质量提供数据支撑。',
    type: '月报',
    category_id: 'monthly',
    category_name: '月度报告',
    template_id: 'template_1',
    template_name: '投诉分析模板',
    status: 'completed',
    content: `
      <div style="padding: 20px; font-family: 'Microsoft YaHei', sans-serif;">
        <h1 style="text-align: center; color: #223355; margin-bottom: 30px;">2024年1月客户投诉分析报告</h1>
        
        <h2 style="color: #223355; border-bottom: 2px solid #3388FF; padding-bottom: 5px;">一、报告概述</h2>
        <p style="line-height: 1.8; margin-bottom: 20px;">本报告基于2024年1月1日至1月31日期间收集的客户投诉数据，通过多维度分析，深入了解客户投诉的分布特征、处理效率和满意度情况。</p>
        
        <h2 style="color: #223355; border-bottom: 2px solid #3388FF; padding-bottom: 5px;">二、数据统计</h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #3388FF;">1,245</div>
            <div style="color: #666; margin-top: 5px;">总投诉量</div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #52c41a;">1,156</div>
            <div style="color: #666; margin-top: 5px;">已办结</div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #faad14;">89</div>
            <div style="color: #666; margin-top: 5px;">处理中</div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #3388FF;">92.8%</div>
            <div style="color: #666; margin-top: 5px;">办结率</div>
          </div>
        </div>
        
        <h2 style="color: #223355; border-bottom: 2px solid #3388FF; padding-bottom: 5px;">三、投诉来源分析</h2>
        <p style="line-height: 1.8; margin-bottom: 15px;">投诉主要来源渠道分布如下：</p>
        <ul style="line-height: 1.8; margin-bottom: 20px;">
          <li><strong>12345热线：</strong>685件（55.0%）</li>
          <li><strong>网上信访：</strong>312件（25.1%）</li>
          <li><strong>现场投诉：</strong>186件（14.9%）</li>
          <li><strong>媒体曝光：</strong>62件（5.0%）</li>
        </ul>
        
        <h2 style="color: #223355; border-bottom: 2px solid #3388FF; padding-bottom: 5px;">四、投诉性质分析</h2>
        <p style="line-height: 1.8; margin-bottom: 15px;">按投诉性质分类统计：</p>
        <ul style="line-height: 1.8; margin-bottom: 20px;">
          <li><strong>投诉类：</strong>856件（68.8%）</li>
          <li><strong>咨询类：</strong>245件（19.7%）</li>
          <li><strong>建议类：</strong>98件（7.9%）</li>
          <li><strong>求助类：</strong>46件（3.7%）</li>
        </ul>
        
        <h2 style="color: #223355; border-bottom: 2px solid #3388FF; padding-bottom: 5px;">五、区域分布情况</h2>
        <p style="line-height: 1.8; margin-bottom: 15px;">各区域投诉量分布：</p>
        <ul style="line-height: 1.8; margin-bottom: 20px;">
          <li><strong>朝阳区：</strong>398件（32.0%）</li>
          <li><strong>海淀区：</strong>287件（23.1%）</li>
          <li><strong>丰台区：</strong>234件（18.8%）</li>
          <li><strong>西城区：</strong>186件（14.9%）</li>
          <li><strong>东城区：</strong>140件（11.2%）</li>
        </ul>
        
        <h2 style="color: #223355; border-bottom: 2px solid #3388FF; padding-bottom: 5px;">六、满意度评价</h2>
        <p style="line-height: 1.8; margin-bottom: 15px;">客户满意度评价结果：</p>
        <ul style="line-height: 1.8; margin-bottom: 20px;">
          <li><strong>非常满意：</strong>623件（53.9%）</li>
          <li><strong>满意：</strong>398件（34.4%）</li>
          <li><strong>一般：</strong>98件（8.5%）</li>
          <li><strong>不满意：</strong>37件（3.2%）</li>
        </ul>
        
        <h2 style="color: #223355; border-bottom: 2px solid #3388FF; padding-bottom: 5px;">七、问题分析与建议</h2>
        <h3 style="color: #223355; margin-top: 20px;">7.1 主要问题</h3>
        <ul style="line-height: 1.8; margin-bottom: 15px;">
          <li>环境卫生类投诉占比较高，需要加强日常巡查</li>
          <li>部分区域投诉集中，存在管理薄弱环节</li>
          <li>处理时效有待提升，部分案件超期办结</li>
        </ul>
        
        <h3 style="color: #223355; margin-top: 20px;">7.2 改进建议</h3>
        <ul style="line-height: 1.8; margin-bottom: 20px;">
          <li>建立健全投诉预警机制，提前发现和解决问题</li>
          <li>加强部门协调配合，提高处置效率</li>
          <li>完善回访制度，确保问题得到彻底解决</li>
          <li>加大宣传力度，提高市民对政府工作的理解和支持</li>
        </ul>
        
        <div style="margin-top: 40px; text-align: right; color: #666;">
          <p>报告生成时间：2024年2月1日</p>
          <p>报告生成人：张三</p>
        </div>
      </div>
    `,
    filters: {
      report_time_start: '2024-01-01',
      report_time_end: '2024-01-31',
      region: ['朝阳区', '海淀区'],
      appeal_source: ['12345热线', '网上信访'],
      appeal_nature: ['投诉', '咨询'],
      appeal_status: ['已办结'],
      satisfaction_rating: ['满意', '非常满意'],
      appeal_title: '噪音,环境',
      appeal_title_match_type: 'partial',
      appeal_description: '投诉,问题',
      appeal_description_match_type: 'partial',
      handling_department: ['城管委', '环保局'],
      appeal_item: ['环境卫生'],
      appeal_tags: ['重复投诉']
    },
    associated_work_orders: [],
    created_at: '2024-01-15 10:30:00',
    created_by: '张三',
    updated_at: '2024-01-15 14:20:00',
    updated_by: '张三',
    progress: 100
   };

   useEffect(() => {
     loadReportData();
   }, [id]);

  const loadReportData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setReport(mockReport);
    } catch (error) {
      message.error('加载报告数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/report/edit/${id}`);
  };

  const handleDownload = () => {
    message.success('报告下载功能开发中...');
  };

  // const handlePrint = () => {
  //   if (report?.content) {
  //     const printWindow = window.open('', '_blank');
  //     if (printWindow) {
  //       printWindow.document.write(`
  //         <!DOCTYPE html>
  //         <html>
  //           <head>
  //             <title>打印报告</title>
  //             <style>
  //               body { font-family: 'Microsoft YaHei', sans-serif; margin: 20px; }
  //               @media print {
  //                 body { margin: 0; }
  //               }
  //             </style>
  //           </head>
  //           <body>
  //             ${report.content}
  //           </body>
  //         </html>
  //       `);
  //       printWindow.document.close();
  //       printWindow.print();
  //     }
  //   }
  // };

  const handleBack = () => {
    navigate('/report');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'generating': return 'blue';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'generating': return '生成中';
      default: return '草稿';
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-white rounded flex items-center justify-center mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
        <div className="text-center">
          <div className="text-[#666] mb-2">加载中...</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="h-full bg-white rounded flex items-center justify-center mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
        <Empty description="报告不存在" />
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded flex flex-col mx-5 mt-5" style={{ height: 'calc(100vh - 130px - 20px)', marginBottom: '20px' }}>
      {/* 页面标题栏 */}
      <div className="p-5 border-b border-[#E9ECF2]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowLeftOutlined 
              className="text-[#223355] cursor-pointer hover:text-[#3388FF] transition-colors" 
              style={{fontSize: '16px'}}
              onClick={handleBack}
            />
            <h2 className="font-medium text-[#223355] m-0" style={{fontSize: '18px'}}>查看报告详情</h2>
          </div>
          <div className="flex gap-2">
            <Button icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>导出</Button>
          </div>
        </div>
      </div>

      {/* Tab导航 */}
      <div className="px-5 pt-3">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="报告详情" key="preview" />
          <TabPane tab="基本信息" key="info" />
        </Tabs>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 px-5 pb-5 overflow-auto">
        {activeTab === 'preview' && (
          <div className="h-full">
            {report.status === 'completed' && report.content ? (
              <div 
                className="bg-white border border-[#E9ECF2] rounded p-4 h-full overflow-auto"
                dangerouslySetInnerHTML={{ __html: report.content }}
              />
            ) : report.status === 'generating' ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-[#3388FF] text-lg mb-2">报告生成中...</div>
                  <div className="text-[#666]">进度：{report.progress}%</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-[#666] text-lg mb-2">报告尚未生成</div>
                  <div className="text-[#666] mb-4">请先配置报告参数并生成报告</div>
                  <Button type="primary" onClick={handleEdit}>配置报告</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div>
            <Card title="报告基础信息" className="mb-4">
              <Descriptions column={2} labelStyle={{ width: '120px', color: '#666' }}>
                <Descriptions.Item label="报告标题">{report.name}</Descriptions.Item>
                <Descriptions.Item label="报告目录">
                  {report.category_id === 'daily' ? '日报' :
                   report.category_id === 'weekly' ? '周报' :
                   report.category_id === 'monthly' ? '月报' :
                   report.category_id === 'quarterly' ? '季报' :
                   report.category_id === 'semiannual' ? '半年报' :
                   report.category_id === 'annual' ? '年报' : report.category_id}
                </Descriptions.Item>
                <Descriptions.Item label="报告模板">投诉分析模板</Descriptions.Item>
                <Descriptions.Item label="报告状态">
                  <Tag color={getStatusColor(report.status)}>{getStatusText(report.status)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="生成进度">{report.progress}%</Descriptions.Item>
                <Descriptions.Item label="创建时间">{report.created_at}</Descriptions.Item>
                <Descriptions.Item label="创建人">{report.created_by}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{report.updated_at}</Descriptions.Item>
                <Descriptions.Item label="更新人">{report.updated_by}</Descriptions.Item>
                <Descriptions.Item label="报告描述" span={2}>
                  {report.description || '暂无描述'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            
            <Card title="过滤条件">
              <Descriptions column={2} labelStyle={{ width: '120px', color: '#666' }}>
                <Descriptions.Item label="上报时间">
                  {report.filters.report_time_start} 至 {report.filters.report_time_end}
                </Descriptions.Item>
                <Descriptions.Item label="所属区域">
                  {report.filters.region && report.filters.region.length > 0 ? report.filters.region.join('、') : '全部'}
                </Descriptions.Item>
                <Descriptions.Item label="诉求来源">
                  {report.filters.appeal_source && report.filters.appeal_source.length > 0 ? report.filters.appeal_source.join('、') : '全部'}
                </Descriptions.Item>
                <Descriptions.Item label="诉求性质">
                  {report.filters.appeal_nature && report.filters.appeal_nature.length > 0 ? report.filters.appeal_nature.join('、') : '全部'}
                </Descriptions.Item>
                <Descriptions.Item label="诉求状态">
                  {report.filters.appeal_status && report.filters.appeal_status.length > 0 ? report.filters.appeal_status.join('、') : '全部'}
                </Descriptions.Item>
                <Descriptions.Item label="满意评价">
                  {report.filters.satisfaction_rating && report.filters.satisfaction_rating.length > 0 ? report.filters.satisfaction_rating.join('、') : '全部'}
                </Descriptions.Item>
                <Descriptions.Item label="处置部门">
                  {report.filters.handling_department && report.filters.handling_department.length > 0 ? report.filters.handling_department.join('、') : '全部'}
                </Descriptions.Item>
                <Descriptions.Item label="诉求事项">
                  {report.filters.appeal_item && report.filters.appeal_item.length > 0 ? report.filters.appeal_item.join('、') : '全部'}
                </Descriptions.Item>
                <Descriptions.Item label="诉求标签">
                  {report.filters.appeal_tags && report.filters.appeal_tags.length > 0 ? report.filters.appeal_tags.join('、') : '全部'}
                </Descriptions.Item>
                <Descriptions.Item label="诉求标题">
                  {report.filters.appeal_title || '无'}
                  {report.filters.appeal_title && (
                    <span className="ml-2 text-[#666] text-xs">
                      ({report.filters.appeal_title_match_type === 'all' ? '全部匹配' : '部分匹配'})
                    </span>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="诉求描述">
                  {report.filters.appeal_description || '无'}
                  {report.filters.appeal_description && (
                    <span className="ml-2 text-[#666] text-xs">
                      ({report.filters.appeal_description_match_type === 'all' ? '全部匹配' : '部分匹配'})
                    </span>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}


      </div>
    </div>
  );
};

export default ReportView;