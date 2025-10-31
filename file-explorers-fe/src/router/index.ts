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
          redirect: { name: 'home' }
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
        }
      ]
    }
  ]
})

export default router
