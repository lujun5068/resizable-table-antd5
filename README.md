# resizable-table-antd5
- 支持自定义拖拽调整表格列宽的 `Table` 组件，基于 `antd5.+`
- 本地持久化保存列宽配置
- 自定义列配置

[![NPM version](https://img.shields.io/npm/v/resizable-table-antd5.svg?style=flat)](https://npmjs.com/package/resizable-table-antd5)
[![NPM downloads](http://img.shields.io/npm/dm/resizable-table-antd5.svg?style=flat)](https://npmjs.com/package/resizable-table-antd5)

 ![表格示例](https://images-1343185556.cos.ap-shanghai.myqcloud.com/project/test.png)

## Install

```bash
$ pnpm install
```

## Usage

``` jsx
import ResizableTable from "resizable-table-antd5"

<ResizeTable
  virtual
  showColumnConfig
  rowKey="id"
  columns={columns}
  dataSource={dataSource}
  scroll={{ y: 400 }}
  pagination={false}
/>
```

## Options

- `storageKey` 可选 `string`，默认 `table-columns-width`，用于存储列表列宽配置
- `showColumnConfig` 可选 `boolean` 
- 其他详见 `antd Table` 组件文档


## LICENSE

MIT
