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
import { h } from 'vue'
import { createWebHashHistory } from './history/hash'
import { createWebHistory } from './history/html5'

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

  return {
    addRoute, // 动态添加路由
  }
}

function createRouter(options) {
  const routerHistory = options.history

  // 数据处理 格式化路由配置 拍平
  const matcher = createRouterMatcher(options.routes)
  const router = {
    install(app) {
      console.log('install router')

      // 路由的核心是 页面切换 重新渲染

      app.component('RouterLink', {
        setup: (props, { slot }) => {
          return () => h('a', props, slot.default && slot.default())
        },
      })

      app.component('RouterView', {
        setup: (_props, { _slots }) => {
          return () => {
            return h('div')
          }
        },
      })

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
