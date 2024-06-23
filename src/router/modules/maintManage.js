/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const maintManageRouter = {
	path: '/maintManage',
	component: Layout,
	redirect: 'noRedirect',
	name: 'maintManage',
	alwaysShow: true,
	meta: {
		title: '養護管理',
		icon: 'clipboard-account-outline',
		roles: ['restored'],
		isNew: true
	},
	children: [
		{
			path: 'kit',
			component: () => import('@/views/maintManage/kit'),
			name: 'kit',
			meta: {
				title: '工法管理',
				roles: ['restored.assign'],
				isNew: true
			}
		}
	]
}
export default maintManageRouter