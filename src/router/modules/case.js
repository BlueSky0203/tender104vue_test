/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const caseRouter = {
	path: '/case',
	component: Layout,
	redirect: '/case/caseList',
	name: 'road',
	meta: {
		title: '鋪面檢測',
		icon: 'el-icon-s-release', 
		roles: ['distress']
	},
	children: [
		{
			path: 'caseUpload',
			component: () => import('@/views/case/caseUpload'),
			name: 'caseUpload',
			meta: {
				title: '缺失上傳',
				roles: ['distress.inspectorMaster']
			}
		},
		{
			path: 'caseList',
			component: () => import('@/views/case/list'),
			name: 'caseList',
			meta: { 
				title: '缺失列表', 
				roles: ['distress.viewer']
			}
		},
		{
			path: 'caseMap',
			component: () => import('@/views/case/caseMap'),
			name: 'caseMap',
			meta: { 
				title: '缺失地圖', 
				roles: ['distress.viewer']
			}
		},
		{
			path: 'PCIMap',
			component: () => import('@/views/case/PCIMap'),
			name: 'PCIMap',
			meta: { 
				title: '查核地圖', 
				roles: ['distress.inspectorMap']
			}
		}
	]
}
export default caseRouter