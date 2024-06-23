import Layout from '@/layout'

const personInfoRouter = {
  path: '/personInfo',
  name: 'personalInformation',
	redirect: 'noRedirect',
  component: Layout,
	hidden: true,
  meta: {
    title: '人事資料表管理',
    icon: 'el-icon-user'
  },
  children: [
    {
      path: 'personInfo',
      component: () => import('@/views/personInfo/personInfo'),
      name: 'personInfo',
      meta: {
        title: '人事資料表'
      },
			hidden: true
    }
  ]
}

export default personInfoRouter