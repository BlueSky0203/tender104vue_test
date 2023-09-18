import request from '@/utils/request';

// PCI總表
export function getPCIList(query) {
	return request({
		url: '/pci/list',
		method: 'get',
		params: query
	})
}

// PCI每月分額
export function getPCIShare(query) {
	return request({
		url: '/pci/share',
		method: 'get',
		params: query
	})
}

// PCI平均
export function getPCIAverage(query) {
	return request({
		url: '/pci/average',
		method: 'get',
		params: query
	})
}

// 派工和PCI分析
export function getCaseAndPCI(query) {
	return request({
		url: '/pci/caseReport',
		method: 'get',
		params: query
	})
}

export function getCaseList(query) {
	return request({
		url: '/pci/caseList',
		method: 'get',
		params: query
	})
}