import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { message, Button, Space, Card } from 'antd';

interface OnlyOfficeEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  height?: number;
  placeholder?: string;
  onInsertPlaceholder?: (placeholder: string) => void;
  mode?: 'edit' | 'view';
  toolbarHeight?: number;
}

export interface OnlyOfficeEditorRef {
  insertText: (text: string) => void;
  getContent: () => Promise<string>;
  setContent: (content: string) => void;
  focus: () => void;
}

const OnlyOfficeEditor = forwardRef<OnlyOfficeEditorRef, OnlyOfficeEditorProps>(({
  content = '',
  onChange,
  height = 500,
  placeholder = '请输入内容...',
  onInsertPlaceholder,
  mode = 'edit',
  toolbarHeight = 40
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [simpleContent, setSimpleContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (editorInstance && (window as any).DocsAPI) {
        // OnlyOffice 插入文本逻辑
        insertTextToEditor(text);
      } else {
        // 简化编辑器插入文本
        insertTextToTextarea(text);
      }
    },
    getContent: async () => {
      if (editorInstance && (window as any).DocsAPI) {
        return getEditorContent();
      } else {
        return simpleContent;
      }
    },
    setContent: (newContent: string) => {
      if (editorInstance && (window as any).DocsAPI) {
        updateEditorContent(newContent);
      } else {
        setSimpleContent(newContent);
        onChange?.(newContent);
      }
    },
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }));

  useEffect(() => {
    setSimpleContent(content);
  }, [content]);

  useEffect(() => {
    // 检查OnlyOffice是否已加载
    if (typeof window !== 'undefined' && (window as any).DocsAPI) {
      initializeEditor();
    } else {
      // 动态加载OnlyOffice脚本
      loadOnlyOfficeScript();
    }

    return () => {
      // 清理编辑器实例
      if (editorInstance) {
        try {
          editorInstance.destroyEditor();
        } catch (error) {
          console.warn('Error destroying OnlyOffice editor:', error);
        }
      }
    };
  }, []);

  useEffect(() => {
    // 当content变化时更新编辑器内容
    if (isReady && editorInstance && content !== undefined) {
      try {
        // 这里需要根据OnlyOffice API设置内容
        // 由于OnlyOffice API复杂，这里使用简化的模拟实现
        updateEditorContent(content);
      } catch (error) {
        console.warn('Error updating editor content:', error);
      }
    }
  }, [content, isReady, editorInstance]);

  const loadOnlyOfficeScript = () => {
    // 检查脚本是否已存在
    if (document.querySelector('script[src*="documentserver"]')) {
      initializeEditor();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://documentserver.onlyoffice.com/web-apps/apps/api/documents/api.js';
    script.async = true;
    script.onload = () => {
      initializeEditor();
    };
    script.onerror = () => {
      console.error('Failed to load OnlyOffice script');
      message.error('OnlyOffice编辑器加载失败，请检查网络连接');
      // 降级到简单的文本编辑器
      setIsReady(true);
    };
    document.head.appendChild(script);
  };

  const initializeEditor = () => {
    if (!editorRef.current || !(window as any).DocsAPI) {
      // 如果OnlyOffice未加载，使用简单编辑器
      setIsReady(true);
      return;
    }

    try {
      const docEditor = new (window as any).DocsAPI.DocEditor(editorRef.current, {
        width: '100%',
        height: `${height}px`,
        type: 'desktop',
        documentType: 'word',
        document: {
          fileType: 'docx',
          key: `editor_${Date.now()}`,
          title: '文档编辑',
          url: '', // 这里需要配置文档服务器URL
        },
        editorConfig: {
          mode: 'edit',
          lang: 'zh-CN',
          callbackUrl: '', // 保存回调URL
          user: {
            id: 'user1',
            name: '用户'
          },
          customization: {
            autosave: true,
            forcesave: false,
            compactToolbar: false,
            toolbar: true,
            statusBar: true,
            chat: false,
            comments: false,
            zoom: 100
          }
        },
        events: {
          onReady: () => {
            setIsReady(true);
            setEditorInstance(docEditor);
          },
          onDocumentStateChange: (event: any) => {
            // 文档内容变化时的回调
            if (onChange && event.data) {
              // 这里需要获取编辑器内容并调用onChange
              getEditorContent().then(content => {
                onChange(content);
              });
            }
          },
          onError: (event: any) => {
            console.error('OnlyOffice editor error:', event);
            message.error('编辑器出现错误');
          }
        }
      });
    } catch (error) {
      console.error('Error initializing OnlyOffice editor:', error);
      // 降级到简单编辑器
      setIsReady(true);
    }
  };

  const updateEditorContent = (newContent: string) => {
    // 这里需要实现内容更新逻辑
    // 由于OnlyOffice API复杂，这里使用简化实现
    if (editorInstance) {
      try {
        // 实际实现需要调用OnlyOffice的API来设置内容
        console.log('Updating editor content:', newContent);
      } catch (error) {
        console.warn('Error updating content:', error);
      }
    }
  };

  const getEditorContent = async (): Promise<string> => {
    // 这里需要实现获取编辑器内容的逻辑
    // 由于OnlyOffice API复杂，这里返回模拟内容
    return new Promise((resolve) => {
      if (editorInstance) {
        try {
          // 实际实现需要调用OnlyOffice的API来获取内容
          resolve(content || '');
        } catch (error) {
          console.warn('Error getting content:', error);
          resolve('');
        }
      } else {
        resolve('');
      }
    });
  };

  const insertTextToTextarea = (text: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = 
        simpleContent.substring(0, start) +
        text +
        simpleContent.substring(end);
      
      setSimpleContent(newContent);
      onChange?.(newContent);
      
      // 恢复光标位置
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    }
  };

  const insertTextToEditor = (text: string) => {
    if (editorInstance) {
      try {
        // 模拟OnlyOffice插入文本
        console.log('Inserting text to OnlyOffice:', text);
      } catch (error) {
        console.warn('Error inserting text:', error);
      }
    }
  };

  // 渲染占位符工具栏
  const renderPlaceholderToolbar = () => {
    const placeholders = [
      { key: 'indicator', label: '数据指标', placeholder: '{indicator_name}' },
      { key: 'dimension', label: '维度', placeholder: '{dimension_name}' },
      { key: 'date', label: '日期', placeholder: '{report_date}' },
      { key: 'workorder', label: '工单号', placeholder: '{work_order_no}' },
      { key: 'total', label: '总计', placeholder: '{total_value}' },
    ];

    return (
      <div className="bg-gray-50 p-2 border-b border-gray-300">
        <Space size="small">
          <span className="text-sm text-gray-600">插入占位符:</span>
          {placeholders.map(item => (
            <Button
              key={item.key}
              size="small"
              type="text"
              onClick={() => {
                if (onInsertPlaceholder) {
                  onInsertPlaceholder(item.placeholder);
                } else {
                  insertTextToTextarea(item.placeholder);
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Space>
      </div>
    );
  };

  // 如果OnlyOffice未加载或加载失败，显示功能完整的简化编辑器
  if (!isReady || !(window as any).DocsAPI) {
    return (
      <Card className="w-full" bodyStyle={{ padding: 0 }}>
        {renderPlaceholderToolbar()}
        <div className="border border-gray-300 rounded-b">
          <textarea
            ref={textareaRef}
            className="w-full p-3 border-0 resize-none focus:outline-none"
            style={{ height: `${height - 80}px` }}
            value={simpleContent}
            onChange={(e) => {
              setSimpleContent(e.target.value);
              onChange?.(e.target.value);
            }}
            placeholder={placeholder}
            readOnly={mode === 'view'}
          />
        </div>
      </Card>
    );
  }

  return (
    <div className="onlyoffice-editor-container">
      {renderPlaceholderToolbar()}
      <div ref={editorRef} style={{ height: `${height}px` }} />
    </div>
  );
});

OnlyOfficeEditor.displayName = 'OnlyOfficeEditor';

// 导出插入指标的方法，供外部组件使用
export const insertPlaceholder = (placeholder: string) => {
  // 这个方法可以被外部组件调用
  return placeholder;
};

export default OnlyOfficeEditor;
export const insertIndicatorToEditor = (indicator: string) => {
  // 这个方法可以被外部组件调用来插入数据指标
  console.log('Insert indicator:', indicator);
};