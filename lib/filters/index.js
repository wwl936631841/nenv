// 格式化时间
import { parseTime } from '../../client/utils'
// 首页时间格式化
export function DateFilter (stringDate) {
  return stringDate.substr(0, stringDate.length - 3)
}

// 时间日期格式化
// 提供如下形式
// 0  xxxx年xx月xx日
// 1  xxxx年xx月
// 2  xx月xx日
// 3  xxxx年xx月xx日 xx:xx
// 4  xx月xx日 xx:xx:xx

export function DateTimeFilter (time, type = 3, cFormat = '') {
  const map = {
    0: '{y}年{m}月{d}日',
    1: '{y}年{m}月',
    2: '{m}月{d}日',
    3: '{y}年{m}月{d}日 {h}:{i}',
    4: '{m}月{d}日 {h}:{i}',
    5: '{y}-{m}-{d}',
    7: '{y}-{m}-{d} {h}:{i}' 
  }
  const typeFormat = map[type]
  const format = typeFormat || cFormat
  const result = parseTime(time, format)
  return result
}

// 过滤器，用于处理文件大小的显示方式
export function FileSizeFormat (value) {
  if (value != null && value !== '') {
    if (value < 1024 * 1024) {
      return (value / 1024).toFixed(2) + ' KB'
    } else {
      return (value / (1024 * 1024)).toFixed(2) + ' MB'
    }
  } else {
    return '-'
  }
}

// 过滤器，用于处理文件管理模块根据不同类型的文件格式显示不同的图标
export function FileIconFilter (value) {
  const map = {
    '.xls': 'file-xls',
    '.xlsx': 'file-xls',
    '.doc': 'file-doc',
    '.docx': 'file-doc',
    '.ppt': 'file-ppt',
    '.pptx': 'file-ppt',
    '.rar': 'file-rar',
    '.zip': 'file-zip',
    '.txt': 'file-txt',
    '.pdf': 'file-pdf'
  }
  let fileClass = map[value]
  if (fileClass == null) {
    fileClass = 'file-other'
  }
  return fileClass
}
