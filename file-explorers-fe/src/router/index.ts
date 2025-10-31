import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../views/HomeView.vue'),
      children: [
        {
          path: '',
          name: 'landing',
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'game/:id?',
          name: 'game',
          props: true,
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'files/:id?',
          name: 'home',
          props: true,
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'leaderboard',
          name: 'leaderboard',
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/HomeView.vue')
        }
      ]
    }
  ]
})

export default router
