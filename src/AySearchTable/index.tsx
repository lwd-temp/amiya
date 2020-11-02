/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useRef, MutableRefObject, createContext, forwardRef, useImperativeHandle, Ref, ReactNode } from 'react'
import AySearch from '../AySearch'
import AyTable from '../AyTable'
import AyDialogForm from '../AyDialogForm'
import { FormRefProps, TableRefProps, AySearchTableField, AySearchTableProps } from './ay-search-table'
import useSelection from './use/useSelection'
import { isObj } from '../utils'
import { getDefaultValue } from '../AyForm'
import { AyTableField } from '../AyTable/ay-table'
import './ay-search-table.less'
import { AySearchField } from '../AySearch/ay-search'
import { AnyKeyProps } from '../types/AnyKeyProps'
import { Space } from 'antd'
import { getActionProps } from '../AyAction'

export const AySearchTableContext = createContext({})

/**
 * 转化并过滤成 ay-search 能用的 fields
 * @param fields 查询表格的 fields
 */
const getSearchFields = (fields: Array<AySearchTableField>): Array<AySearchField> => {
  return fields
    .filter((field: AySearchTableField) => {
      return isObj(field.search)
    })
    .map((field: AySearchTableField) => {
      const search = field.search
      if (!search) {
        return {
          title: '配置有误',
          key: 'xxx',
          type: 'input'
        }
      }
      let searchField: AySearchField = {
        title: field.title,
        key: search.key || field.key || '',
        type: field.type || 'input',
        options: field.options || [],
        ...search
      }
      return searchField
    })
}

/**
 * 过滤获得配置项
 *
 * 1、生成基础 table 需要的 fields
 * 2、添加 options (如果有的话)
 *
 * @param fields 配置项
 */
const getTableFields = (fields: Array<AySearchTableField>): Array<AyTableField> => {
  return fields.map((field: AySearchTableField) => {
    const table = field.table
    let tableField: AyTableField = {
      title: field.title,
      key: field.key,
      ...table
    }
    if (field.options) {
      tableField.options = field.options
    }
    return tableField
  })
}

/**
 * 判断该节点是否只出现在底部
 * @param node AyAction 按钮
 */
const isFooterActionOnly = (node: any) => {
  if (!node || !node.props) {
    return false
  }
  const props = getActionProps(node.props, {})
  return props.tableFooterExtraOnly === true
}

/**
 * 获取表格底部以及右侧 AyAction 按钮
 * @param node AyAction 按钮
 */
const getTableActionBtns = (children: ReactNode): { footerNodes: Array<ReactNode>; rightNodes: Array<ReactNode> } => {
  /** 右侧按钮 */
  const footerNodes: Array<ReactNode> = []
  /** 底部按钮 */
  const rightNodes: Array<ReactNode> = []
  if (Array.isArray(children)) {
    children.forEach((node: any) => {
      if (isFooterActionOnly(node)) {
        footerNodes.push(node)
      } else {
        rightNodes.push(node)
      }
    })
  } else {
    if (isFooterActionOnly(children)) {
      footerNodes.push(children)
    } else {
      rightNodes.push(children)
    }
  }
  return {
    rightNodes,
    footerNodes
  }
}

export default forwardRef(function AySearchTable(props: AySearchTableProps, ref: Ref<any>) {
  const {
    fields,
    api,
    deleteApi,
    children,
    data,
    title,
    ctrl,
    selectionType,
    onSelectionChange,
    rowKey,
    dialogFormExtend,
    scrollX,
    filterData,
    beforeSearch,
    selectShowKey,
    onExpand,
    center,
    onLoad,
    searchVisible,
    tableExtend,
    pagination,
    btnBefore,
    dataAnalysis,
    exportVisible
  } = props

  /** form 控制 */
  const formRef: MutableRefObject<FormRefProps> = useRef() as MutableRefObject<FormRefProps>
  /** table 控制 */
  const tableRef: MutableRefObject<TableRefProps> = useRef() as MutableRefObject<TableRefProps>
  /** search 控制 */
  const searchRef: MutableRefObject<TableRefProps> = useRef() as MutableRefObject<TableRefProps>
  /** 查询项 */
  const searchFields: Array<AySearchField> = getSearchFields(fields)
  /** 列表项 */
  const tableFields: Array<AyTableField> = getTableFields(fields)
  /** 使用勾选 */
  const { header, message, rowSelection, selection, clearSelection } = useSelection({
    rowKey: rowKey || 'id',
    selectionType,
    onSelectionChange,
    selectShowKey
  })
  const { footerNodes, rightNodes } = getTableActionBtns(children)
  /** 查询完成，刷新列表 */
  const onConfirm = (values: AnyKeyProps) => {
    tableRef.current.reset(values)
  }

  /** 暴露方法 */
  useImperativeHandle(ref, () => ({
    /**
     * 刷新页面
     */
    refresh() {
      tableRef.current.refresh()
    },
    /**
     * 回到第一页，刷新页面
     */
    reset(search: AnyKeyProps) {
      tableRef.current.reset({ search })
    },
    /**
     * 清空选项
     */
    clearSelection() {
      clearSelection()
    },
    /**
     * 获取 search 对象
     */
    getSearchRef() {
      return searchRef.current
    },
    /**
     * 获取已经选中的对象
     */
    getSelection() {
      return selection
    }
  }))

  const tableProps: AnyKeyProps = {
    ref: tableRef,
    rowSelection,
    api,
    data,
    title,
    ctrl,
    rowKey,
    scrollX,
    filterData,
    beforeSearch,
    onExpand,
    onLoad,
    tableExtend,
    pagination,
    defaultSearchValue: getDefaultValue(searchFields),
    btnBefore,
    dataAnalysis,
    exportVisible
  }

  return (
    <div className="ay-search-table">
      <AySearchTableContext.Provider value={{ formRef, tableRef, selection, deleteApi, rowKey, clearSelection }}>
        {searchVisible !== false ? <AySearch ref={searchRef} fields={searchFields} onConfirm={onConfirm} /> : null}
        {center}
        {dialogFormExtend ? <AyDialogForm ref={formRef} dialogOnly {...dialogFormExtend} /> : null}
        <AyTable {...tableProps} fields={tableFields} header={header}>
          {rightNodes}
        </AyTable>
        {selection.length && footerNodes.length ? (
          <div className="ay-search-table-footer-extra">
            {message}
            <Space>{footerNodes}</Space>
          </div>
        ) : null}
      </AySearchTableContext.Provider>
    </div>
  )
})
