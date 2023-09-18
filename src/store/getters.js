const getters = {
	sidebar: state => state.app.sidebar,
	size: state => state.app.size,
	device: state => state.app.device,
	blockGeo_bell: state => state.block.blockGeo_bell,
	blockGeo_nco: state => state.block.blockGeo_nco,
	visitedViews: state => state.tagsView.visitedViews,
	cachedViews: state => state.tagsView.cachedViews,
	token: state => state.user.token,
	avatar: state => state.user.avatar,
	name: state => state.user.name,
	introduction: state => state.user.introduction,
	roles: state => state.user.roles,
	permission_routes: state => state.permission.routes,
	errorLogs: state => state.errorLog.logs
}
export default getters
