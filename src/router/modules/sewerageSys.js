/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const sewerageSysRouter = {
	path: '/sewerageSys',
	component: Layout,
	redirect: '/sewerageSys/holeMap',
	name: 'sewerageSys',
	meta: {
		title: '衛工處',
		icon: 'map-marker-path',
		roles: ['rAdm'],
		isNew: true 
	},
	children: [
		{
			path: 'holeMap',
			component: () => import('@/views/sewerageSys/holeMap'),
			name: 'holeMap',
			meta: {
				title: '孔蓋地圖',
				roles: ['rAdm'],
				vTag: 'alpha'
			}
		}
	]
}
export default sewerageSysRouter