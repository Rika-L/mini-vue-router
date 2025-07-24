/*

前端路由两种模式 hash history

window.location.hash = '/' history.pushState(state, title, url) history.replaceState()

目前浏览器都支持了history.pushState和history.replaceState 所以不再考虑 window.location.hash 了

而是 history api同时兼容两种模式

hash模式的好处是 刷新页面时不会向服务器发送请求 但是 url带着# 很丑

history模式的好处是 url干净 但是刷新页面时会向服务器发送请求
*/

/*
路由基本需求： 包含当前的路径 当前路径下的状态是什么 提供两个切换路径的方法 push replace

实现路由监听 如果路径变化 需通知用户
*/
import { computed, h, reactive, shallowRef, unref } from 'vue'
import { createWebHashHistory } from './history/hash'
import { createWebHistory } from './history/html5'
import { RouterLink } from './router-link'

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

function createRouterMatcher(routes) {
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
      matched.unshift(matcher) // 将匹配到的路径放在前面
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

const START_LOCATION_NORMALIZED = {
  // 初始化路由系统中的默认参数
  path: '/',
  // params: {},
  // query: {},
  matched: [], // 当前路径匹配到的记录
}

function createRouter(options) {
  const routerHistory = options.history

  // 数据处理 格式化路由配置 拍平
  const matcher = createRouterMatcher(options.routes)

  // vue路由的核心 后续改变这个数据的value 就会触发页面的重新渲染
  const currentRoute = shallowRef(START_LOCATION_NORMALIZED)

  function resolve(to) {
    if (typeof to === 'string') {
      return matcher.resolve({ path: to })
    }
  }

  let ready
  function markAsReady() {
    if (ready)
      return //
    ready = true // 标记已经渲染完毕
    routerHistory.listen((to) => {
      const targetLocation = resolve(to)
      const from = currentRoute.value
      finalizeNavigation(targetLocation, from, true) // 通过路径匹配到对应的路径
    })
  }

  function finalizeNavigation(to, from, replaced) {
    if (from === START_LOCATION_NORMALIZED || replaced) {
      routerHistory.replace(to.path) // 如果是第一次来 就用replace
    }
    else {
      routerHistory.push(to.path) // 如果不是第一次来 就用push
    }
    currentRoute.value = to // 更新当前路由
    console.log('currentRote', currentRoute.value) // 打印当前路由

    markAsReady() // 标记为准备就绪
    // 如果是初始化 还需要注入一个listen去更新currentRoute的值, 数据变化后可以重新渲染
  }

  function pushWithRedirect(to) {
    // 通过路径匹配到对应的路径
    const targetLocation = resolve(to)
    const from = currentRoute.value

    finalizeNavigation(targetLocation, from)
    // console.log(targetLocation, from) // 根据是不是第一次来决定是push还是replace
  }

  function push(to) {
    return pushWithRedirect(to)
  }

  const router = {
    push,
    replace() {},
    install(app) {
      console.log('install router')

      // vue2 中有两个属性 $router $route

      const router = this
      app.config.globalProperties.$router = router // 方法
      Object.defineProperty(app.config.globalProperties, '$route', { // 属性
        enumerable: true,
        get() {
          return unref(currentRoute) //
        },
      })

      const reactiveRoute = {}

      // 将数据用计算属性再次包裹
      for (const key in START_LOCATION_NORMALIZED) {
        reactiveRoute[key] = computed(() => currentRoute.value[key])
      }

      app.provide('router', router) // 将路由实例挂载到全局
      app.provide('route location', reactive(reactiveRoute)) // 将当前路由状态挂载

      // 路由的核心是 页面切换 重新渲染

      app.component('RouterLink', RouterLink)

      app.component('RouterView', {
        setup: (_props, { _slots }) => {
          return () => {
            return h('div')
          }
        },
      })

      if (currentRoute.value === START_LOCATION_NORMALIZED) {
        // 默认就是初始化
        push(routerHistory.location) // 需要先通过路由进行一次跳转 发生匹配
      }

      console.log('解析路径')
    },
  }
  return router
}

export {
  createRouter,
  createWebHashHistory,
  createWebHistory,
}
