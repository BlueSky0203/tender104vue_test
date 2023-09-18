/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const caseRouter = {
	path: '/caseV1',
	component: Layout,
	redirect: '/caseV1/caseList',
	name: 'road',
	meta: {
		title: '鋪面管理V1',
		icon: 'el-icon-s-release', 
		roles: ['beta']
	},
	children: [
		{
			path: 'caseUpload',
			component: () => import('@/views/caseV1/caseUpload'),
			name: 'caseUpload',
			meta: {
				title: '缺失上傳',
				roles: ['beta']
			}
		},
		{
			path: 'caseList',
			component: () => import('@/views/caseV1/list'),
			name: 'caseList',
			meta: { 
				title: '缺失列表', 
				roles: ['beta']
			}
		},
		{
			path: 'caseMap',
			component: () => import('@/views/caseV1/caseMap'),
			name: 'caseMap',
			meta: { 
				title: '缺失地圖', 
				roles: ['beta']
			}
		},
		{
			path: 'roadStatus',
			component: () => import('@/views/caseV1/roadStatus'),
			name: 'roadStatus',
			meta: { 
				title: '路況查詢', 
				roles: ['beta']
			}
		},
		{
			path: 'PCIManager',
			component: () => import('@/views/caseV1/PCIManager'),
			name: 'PCIManager',
			meta: {
				title: 'PCI管理',
				roles: ['beta']
			}
		},
		{
			path: 'PCIMap',
			component: () => import('@/views/caseV1/PCIMap'),
			name: 'PCIMap',
			meta: { 
				title: '查核地圖', 
				roles: ['beta']
			}
		},
		{
			path: 'PCIMap_new',
			component: () => import('@/views/caseV1/PCIMap_new'),
			name: 'PCIMap_new',
			meta: { 
				title: '查核地圖(測試)', 
				roles: ['beta'],
				vTag: 'Alpha'
			}
		}
	]
}
export default caseRouter