import request from '@/utils/request'

// 案件詳細
export function getCaseDetail(query) {
	return request({
		url: '/dispatch/detail',
		method: 'get',
		params: query
	})
}

//---------------------------------------
// 套組列表
export function getTaskGroup(query) {
	return request({
		url: '/dispatch/taskGroup',
		method: 'get',
		params: query
	})
}

export function addTaskGroup(data) {
	return request({
		url: '/dispatch/taskGroup',
		method: 'post',
		data
	})
}

export function delTaskGroup(data) {
	return request({
		url: '/dispatch/taskGroup',
		method: 'delete',
		data
	})
}

// 套組細項
export function getTaskGroupDetail(query) {
	return request({
		url: '/dispatch/taskGroupDetail',
		method: 'get',
		params: query
	})
}

export function setTaskGroupDetail(data) {
	return request({
		url: '/dispatch/taskGroupDetail',
		method: 'post',
		data
	})
}

// 套組內容(設計、實際)
export function getTaskReal(query) {
	return request({
		url: '/dispatch/taskReal',
		method: 'get',
		params: query
	})
}

//---------------------------------------
// 案件通報
export function getInform(query) {
	return request({
		url: '/dispatch/inform',
		method: 'get',
		params: query
	})
}

export function confirmInform(data) {
	return request({
		url: '/dispatch/inform',
		method: 'post',
		data
	})
}

//---------------------------------------
// 主任分派
export function getDispatch(query) {
	return request({
		url: '/dispatch/plan',
		method: 'get',
		params: query
	})
}

export function setDispatch(data) {
	return request({
		url: '/dispatch/plan',
		method: 'post',
		data
	})
}

export function setDispatchSpec(data) {
	return request({
		url: `/dispatch/planSpec`,
		method: 'post',
		data
	})
}

//---------------------------------------
// 派工審核
export function getJobReview(query) {
	return request({
		url: '/dispatch/jobReview',
		method: 'get',
		params: query
	})
}

export function setJobSubCTR(data) {
	return request({
		url: '/dispatch/jobSubCTR',
		method: 'post',
		data
	})
}

//---------------------------------------
// 製作派工單
export function getJobTicket(query) {
	return request({
		url: '/dispatch/jobTicket',
		method: 'get',
		params: query
	})
}

export function getJobTicketSort(query) {
	return request({
		url: '/dispatch/jobTicketSort',
		method: 'get',
		params: query
	})
}

export function confirmJobTicket(data) {
	return request({
		url: '/dispatch/jobConfirm',
		method: 'post',
		data
	})
}

export function revokeDispatch(data) {
	return request({
		url: '/dispatch/revoke',
		method: 'delete',
		data
	})
}

//---------------------------------------
// 修改派工單
export function editJobTicket(data) {
	return request({
		url: '/dispatch/jobTicketEdit',
		method: 'post',
		data
	})
}

//---------------------------------------
// 完工登錄
export function getFinRegister(query) {
	return request({
		url: '/dispatch/finRegister',
		method: 'get',
		params: query
	})
}

export function finImgUpload(data) {
	return request({
		url: `/dispatch/finImgUpload`,
		method: 'post',
		data
	})
}

export function finRegister(data) {
	return request({
		url: '/dispatch/finRegister',
		method: 'post',
		data
	})
}

export function finRegisterSpec(data) {
	return request({
		url: `/dispatch/finRegisterSpec`,
		method: 'post',
		data
	})
}

// 標記為「不需施作」
export function caseCancel(data) {
	return request({
		url: `/dispatch/cancel`,
		method: 'put',
		data
	})
}

//---------------------------------------
// 派工單管理
export function getJobTicketList(query) {
	return request({
		url: '/dispatch/jobTicketList',
		method: 'get',
		params: query
	})
}

export function getJobTicketSpec(query) {
	return request({
		url: '/dispatch/jobTicketSpec',
		method: 'get',
		params: query
	})
}

export function setJobTicketAmt(data) {
	return request({
		url: '/dispatch/jobTicketAmt',
		method: 'put',
		data
	})
}

export function unFinRegister(data) {
	return request({
		url: '/dispatch/unFinRegister',
		method: 'put',
		data
	})
}