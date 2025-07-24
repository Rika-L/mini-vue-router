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
import { computed, reactive, shallowRef, unref } from 'vue'
import { createWebHashHistory } from './history/hash'
import { createWebHistory } from './history/html5'
import { createRouterMatcher } from './matcher'
import { RouterLink } from './router-link'
import { RouterView } from './router-view'

const START_LOCATION_NORMALIZED = {
  // 初始化路由系统中的默认参数
  path: '/',
  // params: {},
  // query: {},
  matched: [], // 当前路径匹配到的记录
}

function useCallback() {
  const handlers = []
  function add(handler) {
    handlers.push(handler)
  }

  return {
    add,
    list: () => handlers,
  }
}

// 哪个组件是进入的 哪个组件是离开的 哪个组件是更新的
function extractChangeRecords(to, from) {
  const leavingRecords = []
  const updatingRecords = []
  const enteringRecords = []

  const len = Math.max(to.matched.length, from.matched.length)

  for (let i = 0; i < len; i++) {
    const recordFrom = from.matched[i] // 记录来的
    if (recordFrom) {
      // 如果to中有这个记录 就是更新的
      if (to.matched.find(record => record.path === recordFrom.path)) {
        updatingRecords.push(recordFrom)
      }
      else {
        leavingRecords.push(recordFrom) // 如果to中没有这个记录 就是离开的
      }
    }

    const recordTo = to.matched[i] // 记录去的
    if (recordTo) {
      // 如果from中有这个记录 就是更新的
      if (from.matched.find(record => record.path === recordTo.path)) {
        updatingRecords.push(recordTo)
      }
      else {
        enteringRecords.push(recordTo) // 如果from中没有这个记录 就是进入的
      }
    }
  }
  return [leavingRecords, updatingRecords, enteringRecords]
}

function guardToPromise(guard, to, from, record) {
  return () => new Promise((resolve) => {
    const next = () => resolve()
    const guardReturn = guard.call(record, to, from, next) // 调用钩子函数

    // 如果不调用next 最终也会调用next
    return Promise.resolve(guardReturn).then(next)
  })
}

function extractComponentGuards(matched, guardType, to, from) {
  const guards = []
  for (const record of matched) {
    const rawComponent = record.components.default // 获取组件
    const guard = rawComponent[guardType] // 获取组件上的钩子

    // 需要将钩子全部串联在一起
    guard && guards.push(guardToPromise(guard, to, from, record)) // 将钩子转换为promise
  }
  return guards
}

// promise的组合函数
function runGuardQueue(guards) {
  return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve())
}

function createRouter(options) {
  const routerHistory = options.history

  // 数据处理 格式化路由配置 拍平
  const matcher = createRouterMatcher(options.routes)

  // vue路由的核心 后续改变这个数据的value 就会触发页面的重新渲染
  const currentRoute = shallowRef(START_LOCATION_NORMALIZED)

  const beforeGuards = useCallback()
  const beforeResolveGuards = useCallback()
  const afterGuards = useCallback()

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

  async function navigate(to, from) {
    // 要知道哪个组件是进入的 哪个组件是离开的 哪个组件是更新的

    const [leavingRecords, updatingRecords, enteringRecords] = extractChangeRecords(to, from)

    // 抽离组件的钩子
    let guards = extractComponentGuards(
      leavingRecords.reverse(),
      'beforeRouteLeave',
      to,
      from,
    )

    return runGuardQueue(guards)
      .then(() => {
        guards = []
        for (const guard of beforeGuards.list()) {
          guards.push(guardToPromise(guard, to, from, guard))
        }
        return runGuardQueue(guards)
      })
      .then(() => {
        guards = extractChangeRecords(
          updatingRecords,
          'beforeRouteUpdate',
          to,
          from,
        )
      })
      .then(() => {
        guards = []
        for (const record of to.matched) {
          if (record.beforeEnter) {
            guards.push(guardToPromise(record.beforeEnter, to, from, record))
          }
        }
        return runGuardQueue(guards)
      })
      .then(() => {
        guards = extractComponentGuards(
          enteringRecords,
          'beforeRouteEnter',
          to,
          from,
        )
        return runGuardQueue(guards)
      })
      .then(() => {
        guards = []
        for (const guard of beforeResolveGuards.list()) {
          guards.push(guardToPromise(guard, to, from, guard))
        }
        return runGuardQueue(guards)
      })
  }

  function pushWithRedirect(to) {
    // 通过路径匹配到对应的路径
    const targetLocation = resolve(to)
    const from = currentRoute.value

    // 路由的导航首位
    // 全局守卫 路由守卫 组件守卫

    navigate(targetLocation, from).then(() => {
      return finalizeNavigation(targetLocation, from)
    }).then(() => {
      // 当导航切换完毕后执行afterEach
      for (const guard of afterGuards.list()) {
        guard(to, from.path)
      }
    })
    // console.log(targetLocation, from) // 根据是不是第一次来决定是push还是replace
  }

  function push(to) {
    return pushWithRedirect(to)
  }

  const router = {
    push,
    beforeEach: beforeGuards.add, // 可以注册多个 发布订阅模式
    afterEach: afterGuards.add,
    beforeResolve: beforeResolveGuards.add,
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

      app.component('RouterView', RouterView)

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
