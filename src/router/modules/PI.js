/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const PIRouter = {
	path: '/PIIndex',
	component: Layout,
	redirect: 'noRedirect',
	name: 'PIIndex',
	meta: {
		title: '成效指標',
		icon: 'el-icon-s-check',
		roles: ['PIcase']
	},
	children: [
		{
			path: 'caseCheck',
			component: {
				render: (c) => c('router-view')
			},
			name: 'caseCheck',
			redirect: '/PIIndex/caseCheck/caseList',
			meta: {
				title: '案件稽核',
				roles: ['PIcase.viewer', 'PIcase.inspector', 'PIcase.supervisor', 'PIcase.editor']
			},
			children: [
				{
					path: 'caseList',
					component: () => import('@/views/PI/caseCheck/caseList'),
					name: 'PICaseList',
					meta: {
						title: '案件稽核(自巡)',
						roles: ['PIcase.viewer', 'PIcase.inspector', 'PIcase.supervisor', 'PIcase.editor']
					}
				},
				{
					path: 'insCaseList',
					component: () => import('@/views/PI/caseCheck/insCaseList'),
					name: 'insCaseList',
					meta: {
						title: '案件稽核(環景)',
						roles: ['PIcase.viewer', 'PIcase.inspector', 'PIcase.supervisor', 'PIcase.editor'],
						isNew: true
					},
				},
				{
					path: 'caseList_unaccepted',
					component: () => import('@/views/PI/caseCheck/caseList_unaccepted'),
					name: 'PICaseList_unaccepted',
					meta: {
						title: '申覆稽核(不合理案件)',
						roles: ['PIcase.viewer', 'PIcase.inspector', 'PIcase.supervisor', 'PIcase.editor']
					}
				},
				{
					path: 'checkResult',
					component: () => import('@/views/PI/caseCheck/checkResult'),
					name: 'PICheckResult',
					meta: {
						title: '稽核結果(自巡)',
						roles: ['PIcase.viewer']
					}
				},
				{
					path: 'caseUpload',
					component: () => import('@/views/PI/caseCheck/caseUpload'),
					name: 'PICaseUpload',
					meta: {
						title: '案件上傳',
						roles: ['PIcase.editor']
					}
				},
				{
					path: 'caseUploadList',
					component: () => import('@/views/PI/caseCheck/caseUploadList'),
					name: 'PICaseUploadList',
					meta: {
						title: '案件上傳結果',
						roles: ['PIcase.editor']
					}
				},
			]
		},
		{
			path: 'caseWarrantyList',
			component: () => import('@/views/PI/caseWarrantyList'),
			name: 'caseWarrantyList',
			meta: {
				title: '保固案件列表',
				roles: ['PIcase.editor']
			}
		},
		{
			path: 'mCaseStatics',
			component: () => import('@/views/PI/mCaseStatics'),
			name: 'mCaseStatics',
			meta: { 
				roles: ['PIcase.analyst'],
				title: '維護數量統計' 
			}
		},
		{
			path: 'mCaseList',
			component: () => import('@/views/PI/mCaseList'),
			name: 'mCaseList',
			meta: { 
				title: '維護案件列表', 
				roles: ['PIcase.analyst']
			}
		},
		{
			path: 'inspectCase',
			component: () => import('@/views/PI/inspectCase'),
			name: 'inspectCase',
			meta: { 
				title: '缺失分析',
				roles: ['PIcase.analyst']
			}
		},
	]
}
export default PIRouter