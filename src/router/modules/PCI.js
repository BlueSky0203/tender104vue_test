/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const PCIRouter = {
		path: '/PCI',
		component: Layout,
		redirect: '/PCI/report',
		name: 'PCI',
		meta: {
			title: 'PCI數據',
			icon: 'el-icon-s-marketing',
			roles: ['PCIanalyst']
		},
		children: [
			{
				path: 'report',
				component: () => import('@/views/PCI/report'),
				name: 'report',
				meta: { 
					title: '單元報表',
					roles: ['PCIanalyst.viewer']
				}
			},
			{
				path: 'trend',
				component: () => import('@/views/PCI/trend'),
				name: 'trend',
				meta: { 
					title: '趨勢統計',
					roles: ['PCIanalyst.viewer']
				}
			},
			{
				path: 'average',
				component: () => import('@/views/PCI/average'),
				name: 'average',
				meta: { 
					title: '變動統計',
					roles: ['PCIanalyst.viewer']
				}
			},
			{
				path: 'share',
				component: () => import('@/views/PCI/share'),
				name: 'share',
				meta: { 
					title: '佔比統計(圓餅圖)',
					roles: ['PCIanalyst.viewer']
				}
			},
			{
				path: 'shareBarChart',
				component: () => import('@/views/PCI/shareBarChart'),
				name: 'shareBarChart',
				meta: { 
					title: '佔比統計(長方圖)',
					roles: ['PCIanalyst.viewer']
				}
			},
			{
				path: 'iriDataDemo',
				component: () => import('@/views/PCI/iriDataDemo'),
				name: 'iriDataDemo',
				meta: { 
					title: 'IRI數據(Demo)',
					roles: ['PCIanalyst.viewer']
				}
			},
			{
				path: 'caseReport',
				component: () => import('@/views/PCI/caseReport'),
				name: 'caseReport',
				meta: { 
					title: '案件分析', 
					roles: ['PCIanalyst.viewer'] 
				}
			}
		]
	}
	export default PCIRouter