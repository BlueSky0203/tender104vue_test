/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const inspectionRouter = {
	path: '/inspectionRes',
	component: Layout,
	redirect: '/inspection/inspectionProgress',
	name: 'inspectionRes',
	meta: {
		title: '調查成果',
		icon: 'el-icon-s-marketing',
		roles: ['inspection.viewer', 'inspection.editor'],
		isNew: true 
	},
	children: [
		{
			path: 'caseInspectionMap',
			component: () => import('@/views/inspectionRes/caseInspectionMap'),
			name: 'caseInspectionMap',
			meta: {
				title: '案件地圖',
				roles: ['inspection.viewer'],
			}
		},
		{
			path: 'caseTrackingList',
			component: () => import('@/views/inspectionRes/caseTrackingList'),
			name: 'caseTrackingList',
			meta: {
				title: '缺失判核',
				roles: ['inspection.editor']
			}
		},
		{
			path: 'caseTrackingStatic',
			component: () => import('@/views/inspectionRes/caseTrackingStatic'),
			name: 'caseTrackingStatic',
			meta: {
				title: '判核分析',
				roles: ['inspection.viewer']
			}
		},
		{
			path: 'caseTrackingStaticA',
			component: () => import('@/views/inspectionRes/caseTrackingStaticA'),
			name: 'caseTrackingStaticA',
			meta: {
				title: '判核分析(全)',
				roles: ['inspection.viewer'],
				isNew: true
			}
		}
	]
}
export default inspectionRouter