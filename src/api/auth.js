import request from '@/utils/request'

export function login(data) {
	return request({
		url: '/auth/login',
		method: 'post',
		data
	})
}

export function getInfo(token) {
	return request({
		url: '/auth/check',
		method: 'get',
		params: { token }
	})
}

export function logout() {
	return request({
		url: '/auth/logout',
		method: 'post'
	})
}

export function changePassword(data) {
	return request({
		url: '/auth/password',
		method: 'post',
		data
	})
}


//帳號列表
export function getAccountList(query) {
	return request({
		url: '/auth/accountList',
		method: 'get',
		params: query
	})
}

//登入紀錄
export function getLoginLog(query) {
	return request({
		url: '/auth/loginLog',
		method: 'get',
		params: query
	})
}

//帳號歷程
export function getUsersData(query) {
	return request({
		url: '/auth/usersData',
		method: 'get',
		params: query
	})
}

//登入歷程
export function getLoginData(query) {
	return request({
		url: '/auth/loginData',
		method: 'get',
		params: query
	})
}

//帳號新增
export function addAccount(data) {
	return request({
		url: '/auth/account',
		method: 'post',
		data
	})
}

//帳號停用啟用
export function changeActive(data) {
	return request({
		url: '/auth/active',
		method: 'post',
		data
	})
}

//修改密碼(他人)
export function updatePassword(data) {
	return request({
		url: '/auth/changePassword',
		method: 'post',
		data
	})
}

//修改備註
export function updateNotes(data) {
	return request({
		url: '/auth/notes',
		method: 'post',
		data
	})
}

//權限管理
export function getPermit(query) {
	return request({
		url: '/auth/permit',
		method: 'get',
		params: query
	})
}

export function setPermit(data) {
	return request({
		url: '/auth/permit',
		method: 'post',
		data
	})
}