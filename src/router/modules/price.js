/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const dispatchRouter = {
	path: '/price',
	component: Layout,
	redirect: '/price/priceManage',
	name: 'price',
	meta: {
		title: '計價管理',
		icon: 'el-icon-money',
		roles: ['Pricing'],
		isNew: true
	},
	children: [
		
		{
			path: 'priceManage',
			component: () => import('@/views/price/price'),
			name: 'priceManage',
			meta: {
				title: '計價管理',
				roles: ['Pricing.viewer'],
				isNew: true
			}
		},
	]
}
export default dispatchRouter