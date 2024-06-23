import Layout from '@/layout'

const appRouter = {
	path: '/app',
	component: Layout,
	redirect: 'noRedirect',
	name: 'app',
	meta: {
		title: 'APP',
		icon: 'el-icon-mobile-phone',
		roles: ['app']
	},
	children: [
		
		{
			path: 'inspectFinReport',
			component: () => import('@/views/app/inspectFinReport'),
			name: 'inspectFinReport',
			meta: {
				title: '巡查回報',
				roles: ['app.inspector']
			}
		},
	]
}
export default appRouter