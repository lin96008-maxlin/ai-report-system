import type { Dayjs } from 'dayjs';

// 维度分类类型
export interface DimensionCategory {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  children?: DimensionCategory[];
}

// 维度内容结构类型
export interface Level3Content {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Level2Content {
  id: string;
  title: string;
  content: string;
  order: number;
  children?: Level3Content[];
}

export interface Level1Content {
  id: string;
  title: string;
  content: string;
  order: number;
  children?: Level2Content[];
}

export interface DimensionContentStructure {
  level1Contents: Level1Content[];
}

// 维度类型
export interface Dimension {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  category_name?: string;
  content_structure: DimensionContentStructure;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
}

// 章节内容类型
export interface ChapterContent {
  title: string;
  description?: string;
  rich_text_content: string;
  associated_work_order_filters?: {
    report_time_start?: string;
    report_time_end?: string;
    appeal_source?: string[];
    region?: string[];
    appeal_item?: string[];
    appeal_tags?: string[];
  };
}

// 菜单项类型
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  path?: string;
}

// 页签类型
export interface TabItem {
  key: string;
  label: string;
  closable: boolean;
  path: string;
  state?: any;
}

// 数据指标类型
export interface DataIndicator {
  id: string;
  name: string;
  placeholder: string;
  category: string;
  description?: string;
}

// 报告模板相关类型
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: '日报' | '周报' | '月报' | '季报' | '半年报' | '年报' | '专题报告';
  content_structure: ReportTemplateContentStructure;
  is_published: boolean;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
}

export interface ReportTemplateContentStructure {
  rich_text_content: string;
  embedded_dimensions: EmbeddedDimension[];
}

export interface EmbeddedDimension {
  dimension_id: string;
  position: number;
  associated_work_order_configs: AssociatedWorkOrderConfig[];
}

export interface AssociatedWorkOrderConfig {
  content_name: string;
  content_text_preview?: string;
  filters: WorkOrderFilters;
}

export interface WorkOrderFilters {
  report_time_start?: string;
  report_time_end?: string;
  appeal_source?: string[];
  region?: string[];
  appeal_item?: string[];
  appeal_tags?: string[];
}

export interface ReportTemplateQuery {
  name?: string;
  description?: string;
  type?: string[];
  created_by?: string;
  is_published?: boolean;
  dateRange?: [Dayjs | null, Dayjs | null] | null;
}

export interface PreviewFilters {
  report_time_start?: string;
  report_time_end?: string;
  appeal_source?: string[];
  region?: string[];
  appeal_item?: string[];
  dateRange?: string[];
  category?: string;
  status?: string;
  keyword?: string;
  district?: string;
}