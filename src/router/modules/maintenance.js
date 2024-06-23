/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const maintenanceRouter = {
	path: '/maintenance',
	component: Layout,
	redirect: 'noRedirect',
	name: 'maintenance',
	meta: {
		title: '鋪面養護',
		icon: 'clipboard-account-outline',
		roles: ['restored', 'Pricing'],
		isNew: true
	},
	children: [
		{
			path: 'inform',
			component: {
				render: (c) => c('router-view')
			},
			name: 'inform',
			redirect: 'noRedirect',
			meta: {
				title: '養護判核',
				roles: ['restored.assign']
			},
			children: [
				{
					path: 'caseApplyManage',
					component: () => import('@/views/maintenance/inform/caseApplyManage'),
					name: 'caseApplyManage',
					meta: {
						title: '判核單管理',
						roles: ['restored.assign'],
						vTag: 'alpha'
					}
				},
				{
					path: 'caseApply',
					component: () => import('@/views/maintenance/inform/caseApply'),
					name: 'caseApply',
					meta: {
						title: '製作判核單',
						roles: ['restored.assign'],
						vTag: 'alpha'
					}
				},
				{
					path: 'applyReview',
					component: () => import('@/views/maintenance/inform/applyReview'),
					name: 'applyReview',
					meta: {
						title: '分工判核',
						roles: ['restored.assign'],
						vTag: 'alpha'
					}
				},
			]
		},
		{
			path: 'job',
			component: {
				render: (c) => c('router-view')
			},
			name: 'job',
			redirect: 'noRedirect',
			meta: {
				title: '養護施作',
				roles: ['restored.assign', 'restored.order', 'restored.reporter', 'restored.viewer']
			},
			children: [
				{
					path: 'plan',
					component: () => import('@/views/maintenance/job/plan'),
					name: 'plan',
					meta: {
						title: '廠商分派 (主任分派)',
						roles: ['restored.assign'],
						isNew: true
					}
				},
				{
					path: 'jobReview',
					component: () => import('@/views/maintenance/job/jobReview'),
					name: 'jobReview',
					meta: {
						title: '派工審核',
						roles: ['restored.order'],
						isNew: true
					}
				},
				{
					path: 'jobTicketManage',
					component: () => import('@/views/maintenance/job/jobTicketManage'),
					name: 'jobTicketManage',
					meta: {
						title: '派工單管理',
						roles: ['restored.viewer'],
						isNew: true
					}
				},
				{
					path: 'jobTicket',
					component: () => import('@/views/maintenance/job/jobTicket'),
					name: 'jobTicket',
					meta: {
						title: '製作派工單',
						roles: ['restored.order'],
						isNew: true
					}
				},
				{
					path: 'jobTicketEdit',
					component: () => import('@/views/maintenance/job/jobTicketEdit'),
					name: 'jobTicketEdit',
					meta: {
						title: '修改派工單',
						roles: ['restored.order']
					},
					hidden: true
				},
				{
					path: 'finRegister',
					component: () => import('@/views/maintenance/job/finRegister'),
					name: 'finRegister',
					meta: {
						title: '完工登錄',
						roles: ['restored.reporter'],
						isNew: true
					}
				}
			]
		},
		{
			path: 'informReport',
			component: {
				render: (c) => c('router-view')
			},
			name: 'informReport',
			redirect: 'noRedirect',
			meta: {
				title: '養護通報',
				roles: ['restored.assign', 'restored.order', 'restored.reporter', 'restored.viewer']
			},
			children: [
				{
					path: 'caseInformManage',
					component: () => import('@/views/maintenance/informReport/caseInformManage'),
					name: 'caseInformManage',
					meta: {
						title: '通報單管理',
						roles: ['restored.assign'],
						vTag: 'alpha'
					}
				},
				{
					path: 'caseInform',
					component: () => import('@/views/maintenance/informReport/caseInform'),
					name: 'caseInform',
					meta: {
						title: '製作通報單',
						roles: ['restored.assign'],
						vTag: 'alpha'
					}
				}
			]
		},
		{
			path: 'price',
			component: {
				render: (c) => c('router-view')
			},
			name: 'price',
			redirect: 'noRedirect',
			alwaysShow: true,
			meta: {
				title: '養護費用',
				roles: ['Pricing.viewer']
			},
			children: [
				{
					path: 'priceManage',
					component: () => import('@/views/maintenance/price/price'),
					name: 'priceManage',
					meta: {
						title: '計價管理',
						roles: ['Pricing.viewer'],
						isNew: true
					}
				}
			]
		}
	]
}
export default maintenanceRouter