/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const caseHistRouter = {
	path: '/caseHist',
	component: Layout,
	redirect: '/caseHist/inspectionHist',
	name: 'caseHist',
	meta: {
		title: '案件紀錄',
		icon: 'el-icon-suitcase',
		roles: ['case']
	},
	children: [
		{
			path: 'inspectionHist',
			component: () => import('@/views/caseHist/inspection'),
			name: 'inspectionHist',
			meta: { 
				title: '分派紀錄', 
				roles: ['case.viewer'],
			}
		},
		{
			path: 'finishHist',
			component: () => import('@/views/caseHist/finish'),
			name: 'finishHist',
			meta: { 
				title: '完工紀錄', 
				roles: ['case.viewer']
			}
		},
	]
}
export default caseHistRouter