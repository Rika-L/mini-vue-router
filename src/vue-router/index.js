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


