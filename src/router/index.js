import { h } from 'vue'
import About from '../components/About.vue'
import Home from '../components/Home.vue'
import { createRouter, createWebHistory } from '../vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: Home, children: [
      {
        path: 'a',
        name: 'A',
        component: h('div', 'A'),
      },
      {
        path: 'b',
        name: 'B',
        component: h('div', 'B'),
      },
    ] },
    { path: '/about', name: 'About', component: About },
  ],
})
