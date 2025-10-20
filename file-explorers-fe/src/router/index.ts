import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'home' },
      children: [
        {
          path: 'files/:id?',
          name: 'home',
          props: true,
          component: () => import('../views/HomeView.vue')
        }
      ]
    }
  ]
})

export default router
