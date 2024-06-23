import request from '@/utils/request'

//區域
export function getDistMap(query) {
	return request({
		url: '/type/unitZip',
		method: 'get',
		params: query
	})
}

// 區域Geo
export function getDistGeo(query) {
	return request({
		url: '/type/unitZipGeo',
		method: 'get',
		params: query
	})
}

// PCI區塊Geo
export function getBlockGeo(query) {
	return request({
		url: '/type/blockGeo',
		method: 'get',
		params: query
	})
}

export function getBlockNcoGeo(query) {
	return request({
		url: '/type/blockNcoGeo',
		method: 'get',
		params: query
	})
}

// 施工廠商Map
export function getGuildMap(query) {
	return request({
		url: '/type/guild',
		method: 'get',
		params: query
	})
}

// 契約Map
export function getTenderGroup(query) {
	return request({
		url: '/type/tenderGroup',
		method: 'get',
		params: query
	})
}

// 合約Map
export function getTenderMap(query) {
	return request({
		url: '/type/tenderMap',
		method: 'get',
		params: query
	})
}

// 合約區間
export function getTenderRound(query) {
	return request({
		url: '/type/tenderRound',
		method: 'get',
		params: query
	})
}

export function addTenderRound(data) {
	return request({
		url: `/type/tenderRound/`,
		method: 'post',
		data
	})
}

export function setTenderRound(id, data) {
	return request({
		url: `/type/tenderRound/${id}`,
		method: 'put',
		data
	})
}

export function archiveTenderRound(id, data) {
	return request({
		url: `/type/tenderRound/archive/${id}`,
		method: 'put',
		data
	})
}

// 進程
export function getActionProcess(query) {
	return request({
		url: '/type/action',
		method: 'get',
		params: query
	})
}

// 類型Map
export function getTypeMap(query) {
	return request({
		url: '/type/caseTypeMap',
		method: 'get',
		params: query
	})
}

export function getDTypeMap(query) {
	return request({
		url: '/type/distressTypeMap',
		method: 'get',
		params: query
	})
}

export function getCompetentTypeMap(query) {
	return request({
		url: '/type/competentTypeMap',
		method: 'get',
		params: query
	})
}

// 套組Map
// TODO: rm100
export function getKitItemMapV0(query) {
	return request({
		url: '/typeV0/kitItemMap',
		method: 'get',
		params: query
	})
}

export function getKitItemMap(query) {
	return request({
		url: '/type/kitItemMap',
		method: 'get',
		params: query
	})
}

// 標線Map
export function getSCTypeItemMap(query) {
	return request({
		url: '/type/scType2ItemMap',
		method: 'get',
		params: query
	})
}

// 完工登錄照片Map
export function getRestoredImgMap(query) {
	return request({
		url: '/type/restoredImgMap',
		method: 'get',
		params: query
	})
}