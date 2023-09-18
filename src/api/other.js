import request from '@/utils/request'

export function getPrecipitation(query) {
	return request({
		url: '/other/precipitation',
		method: 'get',
		params: query
	})
}