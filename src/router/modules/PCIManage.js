/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const caseRouter = {
	path: '/PCIManage',
	component: Layout,
	redirect: '/PCIManage/PCIManager',
	name: 'PCIManage',
	meta: {
		title: 'PCI計算',
		icon: 'el-icon-star-on', 
		roles: ['distress']
	},
	children: [
		{
			path: 'PCIManager',
			component: () => import('@/views/PCIManage/PCIManager'),
			name: 'PCIManager',
			meta: {
				title: '合約管理',
				roles: ['distress.inspectorMaster']
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