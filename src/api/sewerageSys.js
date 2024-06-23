import request from '@/utils/request'

export function getHoleGeoJSON(query) {
	return request({
		url: '/sewerageSys/holeGeoJson',
		method: 'get',
		params: query
	})
}