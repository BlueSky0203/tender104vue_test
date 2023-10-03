import Layout from '@/layout'

const personInfoRouter = {
  path: '/personInfo/personInfo',
  name: 'personalInformation',
  component: Layout,
  meta: {
    title: '人事資料表管理',
    icon: 'el-icon-user',
    roles: ['rAdm']
  },
  children: [
    {
      path: 'personInfo',
      component: () => import('@/views/personInfo/personInfo'),
      name: 'personInfo',
      meta: {
        title: '人事資料表',
        roles: ['rAdm']
      }
    }
  ]
}

export default personInfoRouter