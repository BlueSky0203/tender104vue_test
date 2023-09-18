import request from '@/utils/request';

// 維護案件
export function getCaseReport(query) {
	return request({
		url: '/case/caseReport',
		method: 'get',
		params: query
	})
}

export function getMCaseList(query) {
	return request({
		url: '/case/mCaseList',
		method: 'get',
		params: query
	})
}

// 案件紀錄
export function getCaseList(query) {
	return request({
		url: '/case/caseList',
		method: 'get',
		params: query
	})
}

// 交辦案件金額
export function getAssignCaseAmt(query) {
	return request({
		url: '/case/assignCaseAmt',
		method: 'get',
		params: query
	})
}

export function setAssignCaseAmt(data) {
	return request({
		url: '/case/assignCaseAmt',
		method: 'post',
		data
	})
}

export function delAssignCaseAmt(id, data) {
	return request({
		url: `/case/assignCaseAmt/${id}`,
		method: 'delete',
		data
	})
}

// 經費類別
export function getExpType(query) {
	return request({
		url: '/case/expType',
		method: 'get',
		params: query
	})
}

export function addExpType(data) {
	return request({
		url: '/case/expType',
		method: 'post',
		data
	})
}

export function delExpType(id, data) {
	return request({
		url: `/case/expType/${id}`,
		method: 'delete',
		data
	})
}

// 經費估算
export function getExpEstimate(query) {
	return request({
		url: '/case/expEstimate',
		method: 'get',
		params: query
	})
}

export function setExpEstimate(data) {
	return request({
		url: '/case/expEstimate',
		method: 'post',
		data
	})
}

export function delExpEstimate(id, data) {
	return request({
		url: `/case/expEstimate/${id}`,
		method: 'delete',
		data
	})
}

// 經費執行
export function getExpExecution(query) {
	return request({
		url: '/case/expExecution',
		method: 'get',
		params: query
	})
}

export function setExpExecution(data) {
	return request({
		url: '/case/expExecution',
		method: 'post',
		data
	})
}

export function delExpExecution(id, data) {
	return request({
		url: `/case/expExecution/${id}`,
		method: 'delete',
		data
	})
}

// 經費比較
export function getExpCompare(query) {
	return request({
		url: '/case/expCompare',
		method: 'get',
		params: query
	})
}

// 巡查數量
export function getInspectCase(query) {
	return request({
		url: '/case/inspectCase',
		method: 'get',
		params: query
	})
}