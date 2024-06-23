/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const baseRouter = {
	path: '/base',
	component: Layout,
	redirect: 'noRedirect',
	name: 'base',
	meta: {
		title: '基本資料',
		icon: 'el-icon-folder',
		roles: ['uBlock', 'PCIManage']
	},
	children: [
		{
			path: '/unit',
			component: {
				render: (c) => c('router-view')
			},
			name: 'unit',
			redirect: 'noRedirect',
			meta: {
				title: '單元管理',
				roles: ['uBlock']
			},
			children: [
				{
					path: 'roadUnit',
					component: () => import('@/views/base/unit/roadUnit'),
					name: 'roadUnit',
					meta: {
						title: '道路單元',
						roles: ['uBlock.viewer', 'uBlock.manager']
					}
				},
				{
					path: 'genLaneMap',
					component: () => import('@/views/base/unit/genLaneMap'),
					name: 'genLaneMap',
					meta: {
						title: '車道單元產生',
						roles: ['uBlock.manager']
					}
				},
				{
					path: 'laneUnit',
					component: () => import('@/views/base/unit/laneUnit'),
					name: 'laneUnit',
					meta: {
						title: '車道單元',
						roles: ['uBlock.viewer', 'uBlock.manager']
					}
				},
				{
					path: 'genBlockMap',
					component: () => import('@/views/base/unit/genBlockMap'),
					name: 'genBlockMap',
					meta: {
						title: '維護單元產生',
						roles: ['uBlock.manager']
					}
				},
				{
					path: 'blockUnit',
					component: () => import('@/views/base/unit/blockUnit'),
					name: 'blockUnit',
					meta: {
						title: '維護單元',
						roles: ['uBlock.viewer', 'uBlock.manager']
					}
				}
			]
		},
		{
			path: 'contract',
			component: () => import('@/views/base/contract'),
			name: 'contract',
			meta: {
				title: '合約管理',
				roles: ['PCIManage.base']
			}
		},
	]
}
export default baseRouter