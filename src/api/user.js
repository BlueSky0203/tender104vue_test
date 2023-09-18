import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/vue-element-admin/user/login',
    method: 'post',
		baseURL: process.env.VUE_APP_BASE_API_MOCK,
    data
  })
}

export function getInfo(token) {
  return request({
    url: '/vue-element-admin/user/info',
    method: 'get',
		baseURL: process.env.VUE_APP_BASE_API_MOCK,
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/vue-element-admin/user/logout',
		baseURL: process.env.VUE_APP_BASE_API_MOCK,
    method: 'post'
  })
}
