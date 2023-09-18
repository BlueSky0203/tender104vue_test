/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const expAnalysisRouter = {
	path: '/expAnalysis',
	component: Layout,
	redirect: '/expAnalysis/estimate',
	name: 'expAnalysis',
	meta: {
		title: '經費分析',
		icon: 'chart',
		roles: ['PIcase.analyst']
	},
	children: [
		{
			path: 'estimate',
			component: () => import('@/views/expAnalysis/estimate'),
			name: 'estimate',
			meta: { 
				title: '經費估算', 
				roles: ['PIcase.analyst']
			}
		},
		{
			path: 'execution',
			component: () => import('@/views/expAnalysis/execution'),
			name: 'execution',
			meta: { 
				title: '經費執行', 
				roles: ['PIcase.analyst']
			}
		},
		{
			path: 'compare',
			component: () => import('@/views/expAnalysis/compare'),
			name: 'compare',
			meta: { 
				title: '經費(估算/執行)',
				roles: ['PIcase.analyst']
			}
		},
		{
			path: 'assignCaseRatio',
			component: () => import('@/views/expAnalysis/assignCaseRatio'),
			name: 'ratio',
			meta: {
				title: '機關交辦金額統計',
				roles: ['PIcase.analyst']
			}
		},
	]
}
export default expAnalysisRouter