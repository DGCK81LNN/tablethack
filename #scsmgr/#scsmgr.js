/** @file TabletHack File Explorer */
/*
 * 变量命名规则
 * HTMLElement - `El`
 * Entry - `Ent`
 * DirectoryEntry - `DirEnt`
 */

/**
 * 创建按钮
 * @param {ParentNode} parent
 * @param {string} text
 * @param {(ev: MouseEvent) => any} onClick
 * @returns {HTMLButtonElement}
 */
function btn(parent, text, onClick) {
  var el = document.createElement("button")
  if (parent) parent.appendChild(el)
  if (text) el.textContent = text
  if (onClick) el.onclick = onClick
  return el
}

/**
 * 格式化文件大小
 * 
 * 单位最高只能到GB
 * @param {number} bytes
 * @returns {string}
 */
 function formatSize(bytes) {
  if (bytes < 1e+3) return bytes + "B"
  if (bytes < 1e+6) return (bytes / 0x400).toFixed(2) + "KB"
  if (bytes < 1e+9) return (bytes / 0x100000).toFixed(2) + "MB"
  return (bytes / 0x40000000).toFixed(2) + "GB"
}

/**
 * 总容器
 * @type {HTMLDivElement}
 */
var containerEl = window.containerEl = window.containerEl || document.body.appendChild(document.createElement("div"))
containerEl.id = "tbhk-scsmgr"
containerEl.innerHTML = "<style>#tbhk-scsmgr { position: absolute; left: 0; top: 0; z-index: 101; height: 100%; width: 100%; box-sizing: border-box; overflow-y: auto; background: #cfe; font-size: 16px; padding: 16px } #tbhk-scsmgr img { max-height: 100px } #tbhk-scsmgr button, #tbhk-scsmgr input { font-size: inherit; padding: 8px } .tbhk-scsmgr-big { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 102; background: black; display: table } .tbhk-scsmgr-big img { position: absolute; max-width: 100%; max-height: 100%; top: 0; right: 0; bottom: 0; left: 0; margin: auto }</style>"

/** 界面标题 */
var headingEl = containerEl.appendChild(document.createElement("h1"))

/**
 * 通用出错回调
 * @constant
 */
var onError = function (err) {
  if (err instanceof Error) {
    tableEl.textContent = err.toString()
  }
  else if (err instanceof FileError) {
    tableEl.textContent = "FileError: " + [
      null,
      "找不到文件",
      "操作不安全，被系统阻止",
      "请求被中断",
      "不可读取",
      "编码错误",
      "不可修改",
      "非法状态",
      "非法字符",
      "非法修改",
      "超出限额",
      "类型错误",
      "同名文件已存在"
    ][err.code] || "未知错误"
  }
  tableEl.textContent = String(err)
}

/**
 * 当前目录对象
 * @type {DirectoryEntry}
 */
var dirEnt = null

(function () {
  // 菜单第一行
  var menuMainEl = containerEl.appendChild(document.createElement("div"))
  btn(menuMainEl, "退回上级", function () { path.pop(), load() })
  btn(menuMainEl, "刷新", load)
  btn(menuMainEl, "编辑...", function () { isEditMode = !isEditMode, load() })
  btn(menuMainEl, "退出", function () { containerEl.remove(), containerEl = undefined })
  // 菜单第二行
  var menuCreateEl = containerEl.appendChild(document.createElement("div"))
  var menuCreateFilenameEl = menuCreateEl.appendChild(document.createElement("input"))
  menuCreateFilenameEl.placeholder = "文件名"
  btn(menuCreateEl, "创建文件", function () {
    if (!menuCreateFilenameEl.value) return
    dirEnt.getFile(menuCreateFilenameEl.value, { create: true }, load, onError)
    menuCreateFilenameEl.value = ""
  })
  btn(menuCreateEl, "创建目录", function () {
    if (!menuCreateFilenameEl.value) return
    dirEnt.getDirectory(menuCreateFilenameEl.value, { create: true }, load, onError)
    menuCreateFilenameEl.value = ""
  })
})()
/** 
 * 菜单第三行
 * 
 * 复制和移动/重命名文件时才使用，其他时候留空
 */
var menuCopyMoveEl = containerEl.appendChild(document.createElement("div"))
/** 当前目录文件列表 */
var tableEl = containerEl.appendChild(document.createElement("table"))

/**
 * 当前路径
 * @type {string[]}
 */
var path = []
/** 是否处于“编辑...”模式 */
var isEditMode = false

/** 加载文件列表 */
function load() {
  var pathStr = "file:///sdcard/" + path.join("/")
  headingEl.textContent = path.length ? path.join("/") + "/" : "内部存储"
  tableEl.textContent = "One moment.."
  // 获取当前目录对象
  window.resolveLocalFileSystemURI(pathStr, loadResolveCallback, onError)
}
/**
 * 获取当前目录对象回调
 * @param {Entry} _dirEnt 目录对象
 */
function loadResolveCallback(_dirEnt) {
  dirEnt = _dirEnt
  // 读取当前目录内容
  dirEnt.createReader().readEntries(loadReadCallback, onError)
}
/**
 * 读取当前目录内容回调
 * @param {Entry[]} entries 当前目录中的文件和目录列表
 */
function loadReadCallback(entries) {
  tableEl.textContent = ""

  if (entries.length === 0) {
    tableEl.textContent = "空文件夹，"
    btn(tableEl, "删除", function () { dirEnt.remove(function () { path.pop(), load() }, onError) })
    return
  }

  // 目录排在文件前，分别按文件名排序
  entries.sort(function (a, b) {
    if (a.isDirectory && b.isFile) return -1
    if (b.isDirectory && a.isFile) return 1
    return a.name < b.name ? -1 : 1
  })

  entries.forEach(function (itemEnt) {
    var itemEl = tableEl.appendChild(document.createElement("tr"))
    /** 文件名列 */
    var itemNameEl = itemEl.appendChild(document.createElement("td"))
    itemNameEl.textContent = itemEnt.name + (itemEnt.isDirectory ? "/" : "")
    /** 操作列 */
    var itemOperEl = itemEl.appendChild(document.createElement("td"))

    // 使用十分笨拙的方法判断文件是否是图片……
    // 如果是就在文件名列显示缩略图
    if (itemEnt.isFile) {
      var img = document.createElement("img")
      img.src = itemEnt.nativeURL
      img.onload = function () {
        itemNameEl.appendChild(img)
        // 点击缩略图查看大图
        img.onclick = function () {
          /** @type {HTMLElement} */ var big
          if (big = document.querySelector(".tbhk-scsmgr-big")) big.remove()
          big = document.body.appendChild(document.createElement("div"))
          big.className = "tbhk-scsmgr-big"
          big.onclick = function () { big.remove() }
          big.appendChild(img.cloneNode())
        }
      }
      img.onerror = function () { img = null }
    }

    if (isEditMode) {
      btn(itemOperEl, "复制", function () {
        menuCopyMoveEl.textContent = ""
        var filenameEl = menuCopyMoveEl.appendChild(document.createElement("input"))
        filenameEl.placeholder = "文件名"
        filenameEl.value = itemEnt.name
        btn(menuCopyMoveEl, "复制至此", function () {
          itemEnt.moveTo(dirEnt, filenameEl.value, load, onError)
          menuCopyMoveEl.textContent = ""
        })
        btn(menuCopyMoveEl, "取消", function () { menuCopyMoveEl.textContent = "" })
        isEditMode = false, load()
      })

      btn(itemOperEl, "移动/重命名", function () {
        menuCopyMoveEl.textContent = ""
        var filenameEl = menuCopyMoveEl.appendChild(document.createElement("input"))
        filenameEl.placeholder = "文件名"
        filenameEl.value = itemEnt.name
        btn(menuCopyMoveEl, "移动至此", function () {
          itemEnt.moveTo(dirEnt, filenameEl.value, load, onError)
          menuCopyMoveEl.textContent = ""
        })
        btn(menuCopyMoveEl, "取消", function () { menuCopyMoveEl.textContent = "" })
        isEditMode = false, load()
      })

      if (itemEnt.isFile) btn(itemOperEl, "删除", function () {
        itemEnt.remove(load, onError)
        isEditMode = false
      })
    } else {
      if (itemEnt.isFile) {
        itemEnt.file(function (file) {
          btn(itemOperEl, "导出", function () {
            var r = new FileReader()
            r.onload = function () {
              if (typeof r.result !== "string") throw new Error()
              window.open("https://dgck81lnn.github.io/sandbox/swissknife.html#" + encodeURIComponent(r.result))
            }
            r.onerror = onError
            r.readAsDataURL(file)
          })
          itemOperEl.appendChild(document.createTextNode("(" + formatSize(file.size) + ")"))
        }, onError)
      } else if (itemEnt.isDirectory) {
        btn(itemOperEl, "打开", function () { path.push(itemEnt.name), load() })
      }
    }
  }) // END OF entries.forEach
}
load()
