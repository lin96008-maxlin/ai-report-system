import React, { useEffect, useRef, useState } from 'react';
import { message } from 'antd';

interface OnlyOfficeEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  height?: number;
  placeholder?: string;
}

const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({
  content = '',
  onChange,
  height = 400,
  placeholder = '请输入内容...'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

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

  // 插入数据指标占位符
  const insertDataIndicator = (indicator: string) => {
    if (editorInstance) {
      try {
        // 实际实现需要调用OnlyOffice的API来插入文本
        const placeholder = `{{${indicator}}}`;
        console.log('Inserting indicator:', placeholder);
        
        // 模拟插入操作
        if (onChange) {
          const newContent = content + placeholder;
          onChange(newContent);
        }
      } catch (error) {
        console.warn('Error inserting indicator:', error);
      }
    }
  };

  // 如果OnlyOffice未加载或加载失败，显示简单的文本编辑器
  if (!isReady || !(window as any).DocsAPI) {
    return (
      <div className="border border-gray-300 rounded">
        <div className="bg-gray-50 p-2 border-b border-gray-300 text-sm text-gray-600">
          OnlyOffice编辑器加载中... (当前显示简化版本)
        </div>
        <textarea
          className="w-full p-3 border-0 resize-none focus:outline-none"
          style={{ height: `${height - 40}px` }}
          value={content}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className="onlyoffice-editor-container">
      <div ref={editorRef} style={{ height: `${height}px` }} />
    </div>
  );
};

// 导出插入指标的方法，供外部组件使用
export const insertIndicatorToEditor = (indicator: string) => {
  // 这个方法可以被外部组件调用来插入数据指标
  console.log('Insert indicator:', indicator);
};

export default OnlyOfficeEditor;