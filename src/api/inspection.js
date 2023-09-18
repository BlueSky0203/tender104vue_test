import request from '@/utils/request'

// 巡查路線
export function getInspectionRoute(query) {
	return request({
		url: '/inspection/route',
		method: 'get',
		params: query
	})
}

export function setInspectionRoute(data) {
	return request({
		url: '/inspection/route',
		method: 'post',
		data
	})
}

// 巡查歷程
export function getInspectionList(query) {
	return request({
		url: '/inspection/list',
		method: 'get',
		params: query
	})
}

export function setInspectionList(id, data) {
	return request({
		url: `/inspection/list/${id}`,
		method: 'put',
		data
	})
}

// 缺失標記
export function getPanoramaJson(query) {
	return request({
		url: '/inspection/panoramaJson',
		method: 'get',
		params: query
	})
}

export function getInspectionCaseGeoJson(query) {
	return request({
		url: '/inspection/caseGeoJson',
		method: 'get',
		params: query
	})
}

export function uploadInspectionCase(data) {
	return request({
		url: '/inspection/caseUpload',
		method: 'post',
		data
	})
}

// 標記列表
export function getInspectionCaseList(query) {
	return request({
		url: '/inspection/caseList',
		method: 'get',
		params: query
	})
}

export function setInspectionCaseList(id, data) {
	return request({
		url: `/inspection/caseList/${id}`,
		method: 'put',
		data
	})
}

export function getImportCase(query) {
	return request({
		url: '/inspection/caseImport',
		method: 'get',
		params: query
	})
}

export function importAllInspectCase(data) {
	return request({
		url: '/inspection/allCaseImport',
		method: 'post',
		data
	})
}

export function uploadInspectionCaseNco(data) {
	return request({
		url: '/inspection/caseUploadNco',
		method: 'post',
		data
	})
}

// 追蹤列表
export function getCaseTrackingList(query) {
	return request({
		url: '/inspection/caseTrackingList',
		method: 'get',
		params: query
	})
}

export function setCaseTrackingSpec(id, data) {
	return request({
		url: `/inspection/caseTrackingList/${id}`,
		method: 'post',
		data
	})
}