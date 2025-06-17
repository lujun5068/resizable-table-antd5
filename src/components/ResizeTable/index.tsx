import type { TableProps } from 'antd';
import { Table } from 'antd';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import './index.less';

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

interface ResizeTableProps<T> extends Omit<TableProps<T>, 'columns'> {
  columns: any[];
  storageKey?: string;
}

export type { ResizeTableProps };

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
      ...restProps
    } = props;
    const [columns, setColumns] = useState(defaultColumns);
    const tblRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        tblRef.current?.scrollTo({ index: 0 });
      },
    }));

    // 从本地存储加载列宽
    useEffect(() => {
      const savedWidths = localStorage.getItem(storageKey);
      if (savedWidths) {
        const parsedWidths = JSON.parse(savedWidths);
        const newColumns = defaultColumns.map((col) => ({
          ...col,
          width: parsedWidths[col.dataIndex] || col.width,
        }));
        setColumns(newColumns);
      }
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
          localStorage.setItem(storageKey, JSON.stringify(widths));
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

    return (
      <Table
        {...restProps}
        columns={finalColumns}
        components={components}
        ref={tblRef}
      />
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
