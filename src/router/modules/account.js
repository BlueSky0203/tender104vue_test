import Layout from '@/layout'

const accountRouter = {
	path: '/account',
	component: Layout,
	redirect: '/account/accountList',
	name: 'accountManager',
	meta: {
		title: '帳號管理',
		icon: 'el-icon-user-solid',
		roles: ['rAdm']
	},
	children: [
		
		{
			path: 'accountList',
			component: () => import('@/views/account/accountList'),
			name: 'accountList',
			meta: {
				title: '帳號列表',
				roles: ['rAdm']
			}
		},
		{
			path: 'accountPermission',
			component: () => import('@/views/account/accountPermission'),
			name: 'accountPermission',
			meta: {
				title: '權限管理',
				roles: ['rAdm']
			},
			hidden: true
		},
		{
			path: 'accountLog',
			component: () => import('@/views/account/accountLog'),
			name: 'accountLog',
			meta: {
				title: '帳號歷程',
				roles: ['rAdm']
			}
		},
		{
			path: 'accountLoginList',
			component: () => import('@/views/account/accountLoginList'),
			name: 'accountLoginList',
			meta: {
				title: '登入歷程',
				roles: ['rAdm']
			}
		},
	]
}
export default accountRouter