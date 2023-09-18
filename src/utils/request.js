import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import router, { resetRouter } from '@/router'
import { getToken } from '@/utils/auth'

// create an axios instance
const service = axios.create({
	baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
	// withCredentials: true, // send cookies when cross-domain requests
	timeout: 40000 // request timeout
})

// request interceptor
service.interceptors.request.use(
	config => {
		// do something before request is sent

		if (store.getters.token) {
			// let each request carry token
			// ['X-Token'] is a custom headers key
			// please modify it according to the actual situation
			config.headers['Authorization'] = 'Bearer ' + getToken();
		}
		return config
	},
	error => {
		// do something with request error
		console.log(error) // for debug
		return Promise.reject(error)
	}
)

// response interceptor
service.interceptors.response.use(
	/**
	 * If you want to get http information such as headers or status
	 * Please return  response => response
	*/

	/**
	 * Determine the request status by custom code
	 * Here is just an example
	 * You can also judge the status by HTTP Status Code
	 */
	response => {
		const res = response.data

		// if the custom code is not 20000, it is judged as an error.
		if (res.statusCode !== 20000) {
			Message({
				message: res.message || 'Error',
				type: 'error',
				duration: 20000
			})

			// 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
			if (res.statusCode === 50008 || res.statusCode === 50012 || res.statusCode === 50014) {
				// to re-login
				MessageBox.confirm('You have been logged out, you can cancel to stay on this page, or log in again', 'Confirm logout', {
					confirmButtonText: 'Re-Login',
					cancelButtonText: 'Cancel',
					type: 'warning'
				}).then(() => {
					store.dispatch('user/resetToken').then(() => {
						location.reload()
					})
				})
			}
			return Promise.reject(new Error(res.message || 'Error'))
		} else {
			return res
		}
	},
	error => {
		console.log('err' + error) // for debug
		if (error && error.response) {
			switch (error.response.status) {
				case 400:
					error.message = '請求錯誤'
					break
				case 401:
					error.message = '驗證失敗'

					// 跳至登入頁
					store.dispatch('user/resetToken')
					localStorage.clear();
					sessionStorage.clear();
					let fullPath = router.currentRoute.fullPath;
					let query = fullPath.indexOf('login') == -1 ? { redirect: fullPath } : {};

					router.push({
						path: "/login",
						query: query
					})
					resetRouter();
					break
				case 403:
					error.message = '拒絕訪問'
					break
				case 404:
					error.message = `請求位址錯誤: ${error.response.config.url}`
					break
				case 406:
					error.message = '無法接受請求'
					break
				case 408:
					error.message = '請求超時'
					break
				case 500:
					error.message = '伺服器錯誤'
					break
				case 502:
					error.message = '網路錯誤'
					break
				case 503:
					error.message = '服務不可用'
					break
				case 504:
					error.message = '網路超時'
					break
				default: error.message = `連接錯誤`
			}
		}
		else {
			error.message = `連接錯誤`
		}

		Message({
			message: error.message,
			type: 'error',
			duration: 5 * 1000
		})
		return Promise.reject(error)
	}
)

export default service
