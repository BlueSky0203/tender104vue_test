/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const dispatchRouter = {
	path: '/dispatchV0',
	component: Layout,
	redirect: '/dispatchV0/planV0',
	name: 'dispatchV0',
	meta: {
		title: '派工管理_V0',
		icon: 'clipboard-account-outline',
		roles: ['beta'],
		vTag: 'Alpha'
	},
	children: [
		{
			path: 'kitV0',
			component: () => import('@/views/dispatchV0/kit_rm100'),
			name: 'kitV0',
			meta: { 
				title: '計價套組_V0', 
				roles: ['beta'],
				vTag: 'Alpha' 
			}
		},
		{
			path: 'planV0',
			component: () => import('@/views/dispatchV0/plan_rm100'),
			name: 'planV0',
			meta: {
				title: '主任分派_V0',
				roles: ['beta'],
				vTag: 'Alpha'
			}
		},
		{
			path: 'jobTicketV0',
			component: () => import('@/views/dispatchV0/jobTicket_rm100'),
			name: 'jobTicketV0',
			meta: {
				title: '製作派工單_V0',
				roles: ['beta'],
				vTag: 'Alpha'
			}
		},
		{
			path: 'finRegisterV0',
			component: () => import('@/views/dispatchV0/finRegister_rm100'),
			name: 'finRegisterV0',
			meta: {
				title: '完工登錄_V0',
				roles: ['beta'],
				vTag: 'Alpha'
			}
		}
	]
}
export default dispatchRouter