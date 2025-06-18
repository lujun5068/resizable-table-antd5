import { MenuOutlined, SettingOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { Button, Checkbox, Dropdown, Table } from 'antd';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DraggableArea } from 'react-draggable-tags';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import './index.less';
import {
  getTableColWidthConfig,
  getTableHeaderConfig,
  getTableHeaderSortConfig,
  setTableColWidthConfig,
  setTableHeaderConfig,
  setTableHeaderSortConfig,
} from './utils';

// Custom debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

export interface ResizeTableProps<T> extends Omit<TableProps<T>, 'columns'> {
  columns: any[];
  storageKey?: string;
  showColumnConfig?: boolean;
}

export interface ResizeTableRef {
  scrollToTop: () => void;
}

const ResizeTable = forwardRef(
  <T extends object>(
    props: ResizeTableProps<T>,
    ref: React.Ref<ResizeTableRef>
  ) => {
    const {
      columns: defaultColumns,
      storageKey = 'table-columns-width',
      showColumnConfig = false,
      ...restProps
    } = props;
    const [dropdownKey, setDropdownKey] = useState(0);
    const [columns, setColumns] = useState(defaultColumns);
    const tblRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [columnCheckList, setColumnCheckList] = useState<string[]>([]);
    const initKeys = defaultColumns.map((col) => col.dataIndex);

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        tblRef.current?.scrollTo({ index: 0 });
      },
    }));

    const getColumnsFormKeys = (cols: any[], sortKeys: any[]) => {
      if (!sortKeys || !sortKeys?.length) return cols;
      return sortKeys.reduce((p: any[], n: any) => {
        const t = cols.find((item: any) => item.dataIndex === n);
        if (t) {
          p.push(t);
        }
        return p;
      }, []);
    };

    const updateColumnWidthByStorageConfig = (sortColumns: any[]) => {
      const parsedWidths = getTableColWidthConfig(storageKey, defaultColumns);
      const newColumns = sortColumns.map((col) => ({
        ...col,
        width: parsedWidths[col.dataIndex] || col.width,
      }));
      return newColumns;
    };

    // 从本地存储加载列宽
    useEffect(() => {
      const headerConfig = getTableHeaderConfig(storageKey, initKeys);
      const sortKeys = getTableHeaderSortConfig(
        storageKey,
        defaultColumns.map((col) => col.dataIndex)
      ).filter((item: string) => headerConfig.includes(item));
      const sortColumns = getColumnsFormKeys(defaultColumns, sortKeys);
      setColumns(updateColumnWidthByStorageConfig(sortColumns));
      setColumnCheckList(headerConfig);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [defaultColumns, storageKey]);

    // 使用 useMemo 计算表格总宽度和最后一列的宽度
    const { tableWidth, lastColumnWidth } = useMemo(() => {
      const totalWidth = columns.reduce(
        (sum, col) => sum + (Number(col.width) || 0),
        0
      );
      const lastWidth = Math.max(
        0,
        totalWidth -
          columns.reduce((sum, col) => sum + (Number(col.width) || 0), 0)
      );
      return { tableWidth: totalWidth, lastColumnWidth: lastWidth };
    }, [columns]);

    // 防抖写入 localStorage
    const debouncedSaveWidths = useMemo(
      () =>
        debounce((cols: any[]) => {
          const widths = cols.reduce((acc, col) => {
            if (col.dataIndex) acc[col.dataIndex] = Number(col.width) || 0;
            return acc;
          }, {} as Record<string, number>);
          setTableColWidthConfig(storageKey, widths);
        }, 300),
      [storageKey]
    );

    // 处理列宽调整
    const handleResize = useCallback(
      (index: number) =>
        (e: any, { size }: { size: { width: number } }) => {
          setColumns((prevColumns: any[]) => {
            const next = [...prevColumns];
            next[index] = { ...next[index], width: size.width };
            debouncedSaveWidths(next);
            return next;
          });
        },
      [debouncedSaveWidths]
    );

    // 包装列配置，添加可调整宽度的功能
    const resizableColumns = columns.map((col, index) => ({
      ...col,
      width: Number(col.width) || 0,
      onHeaderCell: (column: any) => ({
        width: Number(column.width) || 0,
        onResize: handleResize(index),
      }),
    }));

    // 添加一个空列来处理多余的宽度
    const finalColumns = [
      ...resizableColumns,
      {
        title: '',
        dataIndex: 'empty',
        width: lastColumnWidth,
        onHeaderCell: () => ({
          width: lastColumnWidth,
          style: { padding: 0 },
        }),
      },
    ];

    // 自定义表头单元格组件
    const components = {
      header: {
        cell: ResizableTitle,
      },
    };

    const onCheckChange = (checked: boolean, id: string) => {
      if (checked) {
        setColumnCheckList([...columnCheckList, id]);
      } else {
        setColumnCheckList(columnCheckList.filter((item) => item !== id));
      }
    };

    const handleReset = () => {
      setTableHeaderSortConfig(storageKey, initKeys);
      setColumnCheckList(initKeys);
      setTableHeaderConfig(storageKey, initKeys);
      setColumns(updateColumnWidthByStorageConfig(defaultColumns));
    };

    const handleConfirm = () => {
      const sortKeys =
        getTableHeaderSortConfig(storageKey, initKeys) || initKeys;
      const headerKeys = sortKeys.filter((item: string) =>
        columnCheckList.includes(item)
      );
      setColumns(
        updateColumnWidthByStorageConfig(
          getColumnsFormKeys(defaultColumns, headerKeys)
        )
      );
      setTableHeaderConfig(storageKey, headerKeys);
      timerRef.current = setTimeout(() => {
        const dom = document.querySelector('.tableHeaderConfig');
        if (dom) {
          dom.classList.add('ant-dropdown-hidden');
          setDropdownKey(Math.random());
        }
      }, 100);
    };

    const dropdownRender = () => {
      const sortColumns = defaultColumns?.map((c) => ({
        ...c,
        id: c.dataIndex,
      }));

      const tags = getColumnsFormKeys(
        sortColumns,
        getTableHeaderSortConfig(storageKey, initKeys)
      );
      return (
        <div>
          <div className="configMain">
            <DraggableArea
              isList
              tags={tags}
              render={({ tag }: any) => (
                <div key={tag.id} className={'checkColItem'}>
                  <MenuOutlined
                    style={{ cursor: 'grab', marginRight: 4, color: '#666' }}
                  />
                  <Checkbox
                    style={{ width: '100', cursor: 'pointer' }}
                    checked={columnCheckList.includes(tag.id)}
                    onChange={(e: any) => {
                      onCheckChange(e.target.checked, tag.id);
                    }}
                  >
                    {tag.title}
                  </Checkbox>
                </div>
              )}
              onChange={(tags: any[]) => {
                const finalKeys = tags.map((t: any) => t.id);
                setTableHeaderSortConfig(storageKey, finalKeys);
                setColumns(
                  updateColumnWidthByStorageConfig(
                    getColumnsFormKeys(columns, finalKeys)
                  )
                );
              }}
            />
          </div>
          <div className="configFooter">
            <Button
              type="text"
              size="small"
              onClick={handleReset}
              style={{ color: '#2a54d1' }}
            >
              重置
            </Button>
            <Button type="primary" size="small" onClick={handleConfirm}>
              确定
            </Button>
          </div>
        </div>
      );
    };

    return (
      <div className="resizeTable">
        {showColumnConfig && (
          <Dropdown
            key={dropdownKey}
            trigger={['click']}
            overlayClassName="tableHeaderConfig"
            popupRender={() => dropdownRender()}
            arrow={false}
          >
            <Button icon={<SettingOutlined />}>栏目配置</Button>
          </Dropdown>
        )}
        <Table
          {...restProps}
          columns={finalColumns}
          components={components}
          ref={tblRef}
        />
      </div>
    );
  }
);

// 可调整宽度的表头单元格组件
const ResizableTitle = (props: any) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={Number(width) || 0}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

export default ResizeTable;
