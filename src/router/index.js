import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

/* Layout */
import Layout from '@/layout';

/* Router Modules */
import accountList from './modules/account';
import baseRouter from './modules/base';
import inspectionRouter from './modules/inspection';
import inspectionReaRouter from './modules/inspectionRes';
import caseRouter from './modules/case';
import pciManageRouter from './modules/PCIManage';
import maintManageRouter from './modules/maintManage'
import maintenanceRouter from './modules/maintenance';
import PCIRouter from './modules/PCI';
import expAnalysisRouter from './modules/expAnalysis';
import PIRouter from './modules/PI';
import PIReportRouter from './modules/PIReport';
import otherRouter from './modules/other';
import carRouter from './modules/car';
import appRouter from './modules/app';
import personInfo from './modules/personInfo';

import sewerageSys from './modules/sewerageSys';

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
		roles: ['admin','editor']    control the page roles (you can set multiple roles)
		title: 'title'               the name show in sidebar and breadcrumb (recommend set)
		icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
		noCache: true                if set true, the page will no be cached(default is false)
		affix: true                  if set true, the tag will affix in the tags-view
		breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
		activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
		vTag: 'Alpha'                顯示「Alpha」、「Beta」測試版本標籤
		isNew: true                  設成true，顯示「NEW!!」標籤
	}
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
	{
		path: '/redirect',
		component: Layout,
		hidden: true,
		children: [
			{
				path: '/redirect/:path(.*)',
				component: () => import('@/views/redirect/index')
			}
		]
	},
	{
		path: '/login',
		component: () => import('@/views/login/index'),
		hidden: true
	},
	{
		path: '/auth-redirect',
		component: () => import('@/views/login/auth-redirect'),
		hidden: true
	},
	{
		path: '/404',
		component: () => import('@/views/error-page/404'),
		hidden: true
	},
	{
		path: '/401',
		component: () => import('@/views/error-page/401'),
		hidden: true
	},
	{
		path: '/',
		component: Layout,
		redirect: '/dashboard',
		children: [
			{
				path: 'dashboard',
				component: () => import('@/views/dashboard/index'),
				name: 'Dashboard',
				meta: { title: 'Dashboard', icon: 'dashboard', affix: true }
			}
		],
		hidden: true
	},
	personInfo
]

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */
export const asyncRoutes = [
	accountList,
	baseRouter,
	carRouter,
	inspectionRouter,
	inspectionReaRouter,
	caseRouter,
	pciManageRouter,
	maintManageRouter,
	maintenanceRouter,
	PCIRouter,
	PIRouter,
	PIReportRouter,
	expAnalysisRouter,
	otherRouter,
	appRouter,
	sewerageSys,
	// 404 page must be placed at the end !!!
	{ path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
	// mode: 'history', // require service support
	scrollBehavior: () => ({ y: 0 }),
	routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
	const newRouter = createRouter()
	router.matcher = newRouter.matcher // reset router
}

export default router
