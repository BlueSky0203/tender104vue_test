import request from '@/utils/request'

export function getInspectFlowList(query) {
	return request({
		url: '/app/inspectFlowList',
		method: 'get',
		params: query
	})
}

export function setInspectFlowList(id, data) {
	return request({
		url: `/app/inspectFlowList/${id}`,
		method: 'put',
		data
	})
}

export function trackingImgUpload(data) {
	return request({
		url: '/app/trackingImgUpload',
		method: 'post',
		data
	})
}