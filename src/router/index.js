import { h } from 'vue'
import About from '../components/About.vue'
import Home from '../components/Home.vue'
import { createRouter, createWebHistory } from '../vue-router'


const router = createRouter({
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
    ],
      beforeEnter: (to, from, next) => {
        console.log('beforeEnter', to, from)
        next()
      },
    
  },
    { path: '/about', name: 'About', component: About },
  ],
})

router.beforeEach((to, from,next) => {
  console.log('beforeEach', to, from)
})

router.beforeResolve((to, from, next) => {
  console.log('beforeResolve', to, from)
})

router.afterEach((to, from) => {
  console.log('afterEach', to, from)
})

export default router