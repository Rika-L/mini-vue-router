function normalizeRouteRecord(record) {
  return {
    path: record.path, // 状态机 解析路径的分数 算出匹配规则
    name: record.name,
    meta: record.meta || {},
    beforeEnter: record.beforeEnter,
    components: {
      default: record.component,
    },
    children: record.children || [],
  }
}

function createRouteRecordMatcher(record, parent) {
  // record 中的path做一些修改
  const matcher = {
    path: record.path,
    record,
    parent,
    children: [],
  }
  if (parent) {
    parent.children.push(matcher)
  }
  return matcher
}

export function createRouterMatcher(routes) {
  const matchers = []
  function addRoute(route, parent) {
    const normalizeRecord = normalizeRouteRecord(route)

    if (parent) {
      normalizeRecord.path = parent.path + normalizeRecord.path
    }

    const matcher = createRouteRecordMatcher(normalizeRecord, parent)

    if ('children' in normalizeRecord) {
      const children = normalizeRecord.children
      for (let i = 0; i < children.length; i++) {
        addRoute(children[i], matcher)
      }
    }

    matchers.push(matcher)
  }

  routes.forEach(route => addRoute(route))

  function resolve(location) {
    const matched = []

    const path = location.path
    let matcher = matchers.find(m => m.path === path)
    while (matcher) {
      matched.unshift(matcher.record) // 将匹配到的路径放在前面
      matcher = matcher.parent
    }

    return {
      path,
      matched,
    }
  }

  return {
    resolve,
    addRoute, // 动态添加路由
  }
}