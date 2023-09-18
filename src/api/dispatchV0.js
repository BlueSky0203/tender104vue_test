import request from '@/utils/request'

// 案件詳細
export function getCaseDetailV0(query) {
	return request({
		url: '/dispatchV0/detail',
		method: 'get',
		params: query
	})
}

// 套組列表
export function getCostKitV0(query) {
	return request({
		url: '/dispatchV0/kit',
		method: 'get',
		params: query
	})
}

// 套組細項
export function getCostKitDetailV0(query) {
	return request({
		url: '/dispatchV0/kitDetail',
		method: 'get',
		params: query
	})
}

// 主任分派列表
export function getDispatchListV0(query) {
	return request({
		url: '/dispatchV0/list',
		method: 'get',
		params: query
	})
}

// 廠商派工單列表
export function getJobTicketV0(query) {
	return request({
		url: '/dispatchV0/jobTicket',
		method: 'get',
		params: query
	})
}

// 完工登錄列表
export function getFinRegisterV0(query) {
	return request({
		url: '/dispatchV0/finRegister',
		method: 'get',
		params: query
	})
}