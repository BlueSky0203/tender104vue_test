/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const caseRouter = {
	path: '/PCIManage',
	component: Layout,
	redirect: '/PCIManage/PCIManager',
	name: 'PCIManage',
	alwaysShow: true,
	meta: {
		title: '鋪面指標',
		icon: 'el-icon-star-on', 
		roles: ['distress', 'PCIManage']
	},
	children: [
		{
			path: 'PCIManager',
			component: () => import('@/views/PCIManage/PCIManager'),
			name: 'PCIManager',
			meta: {
				title: 'PCI計算',
				roles: ['PCIManage.base']
			}
		},
		{
			path: 'roadStatus',
			component: () => import('@/views/PCIManage/roadStatus'),
			name: 'roadStatus',
			meta: { 
				title: '路況查詢', 
				roles: ['distress.inspector']
			}
		}
	]
}
export default caseRouter