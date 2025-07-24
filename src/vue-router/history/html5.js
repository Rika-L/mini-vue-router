function buildState(
  back,
  current,
  forward,
  replace = false,
  computedScroll = false,
) {
  return {
    back,
    current,
    forward,
    replace,
    scroll: computedScroll
      ? { left: window.scrollX, top: window.scrollY }
      : null,
    position: window.history.length - 1,
  }
}

function createCurrentLocation(base) {
  const { pathname, search, hash } = window.location
  const hasPos = base.indexOf('#') // 就是hash
  if (hasPos > -1) {
    return base.slice(1) || '/'
  }
  return pathname + search + hash
}

function useHistoryStateNavigation(base) {
  const currentLocation = {
    value: createCurrentLocation(base),
  }

  const historyState = {
    value: window.history.state,
  }

  if (!historyState.value) {
    // 第一次刷新页面 此时没有任何状态
    changeLocation(
      currentLocation.value,
      buildState(null, currentLocation.value, null, true),
      true,
    )
  }

  function changeLocation(to, state, replace) {
    const hasPos = base.indexOf('#')
    const url = hasPos > -1 ? base + to : to
    window.history[replace ? 'replaceState' : 'pushState'](
      state,
      null,
      url,
    )
    historyState.value = state
  }

  function push(to, data) {
    const currentState = Object.assign({}, historyState.value, {
      forward: to,
      scroll: { left: window.scrollX, top: window.scrollY },
    })

    changeLocation(currentState.current, currentState, true)

    const state = Object.assign(
      {},
      buildState(currentLocation.value, to, null),
      { position: currentState.position + 1 },
      data,
    )

    changeLocation(to, state, false)
    currentLocation.value = to // 跳转后需要将路径修改为新的路径

    // 做两个状态
    // 跳转前： 从哪到哪
    // 跳转后： 从哪到哪
  }

  function replace(to, data) {
    const state = Object.assign(
      {},
      buildState(historyState.value.back, to, historyState.value.forward, true),
      data,
    )
    changeLocation(to, state, true)
    currentLocation.value = to // 替换后需要将路径修改为新的路径
  }
  return {
    location: currentLocation,
    state: historyState,
    push,
    replace,
  }
}

// 前进后退的时候要更新historyState和currentLocation
function useHistoryListeners(base, historyState, currentLocation) {
  let listeners = []
  const popStateHandler = ({ state }) => {
    const to = createCurrentLocation(base) // 去哪
    const from = currentLocation.value // 从哪来
    const fromState = historyState.value // 从哪来时的状态

    currentLocation.value = to // 更新当前路径
    historyState.value = state // 更新当前状态

    let isBack = state.position - fromState.position < 0

    listeners.forEach((listener) => {
      listener(to, from, { isBack })
    })
  }
  window.addEventListener('popstate', popStateHandler) // 监听浏览器的前进后退按钮

  function listen(cb) {
    listeners.push(cb)
  }
  return {
    listen,
  }
}

export function createWebHistory(base = '') {
  // 历史路由
  const historyNavigation = useHistoryStateNavigation(base)

  const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location)

  const routerHistory = Object.assign({}, historyNavigation, historyListeners)

  Object.defineProperty(routerHistory, 'location', {
    get() {
      return historyNavigation.location.value
    },
  })

  Object.defineProperty(routerHistory, 'state', {
    get() {
      return historyNavigation.state.value
    },
  })

  return routerHistory
  // routerHistory.location 代表当前的路径
  // routerHistory.state 代表当前的状态
  // push replace 切换路径和状态
  // listen 可以接受用户的一个回调 当用户前进后退时可以触发此方法
}
