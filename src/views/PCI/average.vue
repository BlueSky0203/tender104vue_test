<template>
	<div class="app-container PCI-average" v-loading="loading">
		<h2>變動統計</h2>
		<aside>「{{ districtList[zipCodeNow].name }}」資料初始為 {{ tenderStartDate }}</aside>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<!-- <time-picker class="filter-item" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/> -->
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
			<!-- <el-button
				class="filter-item"
				type="info"
				icon="el-icon-document"
				:circle="screenWidth<567"
				@click="handleDownload"
			>輸出報表</el-button> -->
		</div>
		
		<!-- <h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5> -->

		<div class="chart" ref="chart" />

		<el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			highlight-current-row
			:header-cell-style="{'background-color': '#F2F6FC'}"
			stripe
			style="width: 100%"
		>
			<!-- <el-table-column 
				v-for="header in Object.keys(headers['fixed'])" :prop="header" :label="headers[reportCate]['fixed'][header]"
			align="center" fixed/>-->
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:sortable="value.sortable"
			/>
		</el-table>

	</div>
</template>

<script>
import moment from "moment";
import echarts from 'echarts/lib/echarts';
require('echarts/theme/macarons');
require('echarts/lib/chart/line');
require('echarts/lib/chart/bar');
import { getPCIAverage } from "@/api/pci";
import TimePicker from '@/components/TimePicker';

// const data = [
// 	{
// 		month: "2021/03",
// 		PCIAverage: 86.19
// 	},
// 	{
// 		month: "2021/04",
// 		PCIAverage: 88.48
// 	},
// 	{
// 		month: "2021/05",
// 		PCIAverage: 95.8
// 	},
// 	{
// 		month: "2021/06",
// 		PCIAverage: 86.6
// 	},
// 	{
// 		month: "2021/07",
// 		PCIAverage: 83.53
// 	},
// 	{
// 		month: "2021/08",
// 		PCIAverage: 82.1
// 	},
// 	{
// 		month: "2021/09",
// 		PCIAverage: 81.43
// 	},
// 	{
// 		month: "2021/10",
// 		PCIAverage: 78.35
// 	}
// ]

export default {
	name: "PCIAverage",
	components: { TimePicker },
	data() {
		return {
			loading: false,
			// timeTabId: -1,
			// dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			// dateRange: [moment().startOf("d").toDate(), moment().endOf("d").toDate()],
			// searchRange: "",
			zipCodeNow: 104,
			listQuery: {
				zipCode: 104
			},
			headers: {
				month: {
					name: "月份",
					sortable: false
				},
				PCIAverage: {
					name: "PCI平均",
					sortable: false,
					chartType: 'bar'
				},
				variation: {
					name: "變動量",
					sortable: false,
					chartType: 'line'
				}
			},
			list: [],
			districtList: {
				// 100: {
				// 	"name": "中正區",
				// 	"engName": "Zhongzheng"
				// },
				103: {
					"name": "大同區",
					"start": "2023/2/1"
				},
				104: {
					"name": "中山區",
					"start": "2022/6/1"
				},
				// 105: {
				// 	"name": "松山區",
				// 	"engName": "Songshan"
				// },
				// 106: {
				// 	"name": "大安區",
				// 	"engName": "Da’an"
				// },
				// 108: {
				// 	"name": "萬華區",
				// 	"engName": "Wanhua",
				// },
				// 110: {
				// 	"name": "信義區",
				// 	"engName": "Xinyi"
				// },
				// 111: {
				// 	"name": "士林區",
				// 	"engName": "Shilin"
				// },
				// 112: {
				// 	"name": "北投區",
				// 	"engName": "Beitou"
				// },
				// 114: {
				// 	"name": "內湖區",
				// 	"engName": "Neihu"
				// },
				// 115: {
				// 	"name": "南港區",
				// 	"engName": "Nangang"
				// },
				// 116: {
				// 	"name": "文山區",
				// 	"engName": "Wenshan"
				// }
			},
			chart: null
		};
	},
	computed: {
		tenderStartDate() {
			return moment(this.districtList[this.zipCodeNow].start).format("yyyy年MM月")
		}
	},
	mounted() {
		this.chart = echarts.init(this.$refs.chart, 'macarons', {
			width: 'auto',
			height: 'auto'
		});
		this.getList();
	},
	methods: {
		getList() {
			this.loading = true;
			// if (moment(this.dateRange[1]).isAfter(moment())) {
			//   this.dateRange[1] = moment().endOf("d").toDate();
			// }

			// let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			// let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			// this.searchRange = startDate + " - " + endDate;

			this.list = [];
			getPCIAverage({
				zipCode: this.listQuery.zipCode
			}).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.zipCodeNow = this.listQuery.zipCode;
					this.list = response.data.list;
					this.list.forEach((l, i) => {
						l.month = moment(l.datestar).format("YYYY/MM");
						l.PCIAverage = Math.floor((l.PCIAverage) * 100) / 100;
						if(i == 0) this.$set(l, 'variation', 0);
						else this.$set(l, 'variation', Math.round((this.list[i].PCIAverage - this.list[i-1].PCIAverage) * 100) / 100);
					})
					this.setChartOptions();
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		setChartOptions() {
			const headerFilter = Object.fromEntries(Object.entries(this.headers).filter(([key, _]) => key != "month"));
			let legend = [];
			let series = [];

			for(const key in headerFilter) {
				if(headerFilter[key].chartType == null) continue;
				legend.push(headerFilter[key].name);
				series.push({
					type: headerFilter[key].chartType,
					name: headerFilter[key].name,
					data: this.list.map(l=>l[key]),
					yAxisIndex: headerFilter[key].chartType == "bar" ? 0 : 1,
					barWidth: '40%',
					label: {
						show: headerFilter[key].chartType != "bar",
						position: 'bottom',
						formatter: '{c}'
					},
					smooth: false
				});
			}

			series.push({
				type: 'line',
				name: "PCI平均",
				data: this.list.map(l=>l.PCIAverage),
				yAxisIndex: 0,
				lineStyle: { 
					color: "black",
					width: 1,
					type: 'dashed'
				},
				label: {
						show: true,
						formatter: '{c}'
					},
				smooth: false
			});

			const options = {
				xAxis: {
					name: '月份',
					type: 'category',
					nameLocation: 'middle',
					nameGap: 25,
					data: this.list.map(l=>l.month),
					axisTick: {
						alignWithLabel: true
					}
				},
				yAxis: [
					{
						name: 'PCI平均',
						type: 'value',
						axisTick: {
							show: false
						},
						splitLine: {
							lineStyle: {
								color: ['#bbb'],
								type: 'dashed',
								opacity: 0.3
							}
						},
						splitArea: {
							show: false
						}
					},
					{
						name: '變動量',
						type: 'value',
						axisTick: {
							show: false
						},
						splitLine: {
							show: false
						},
						splitArea: {
							show: false
						}
					},
				],
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						type: 'shadow'
					},
					formatter: (e) => {
						const eFilter = e.reduce((res, curr) => {
							if(res.length == 0 || res.filter(r => r.seriesName == curr.seriesName).length == 0) res.push(curr);
							return res;
						}, [])

						let htmlStr = `<div>${eFilter[0].axisValueLabel}<br>`;
						for(const data of eFilter) htmlStr += `${data.marker} ${data.seriesName}: ${data.value} <br>`;
						htmlStr += `</div>`

						return htmlStr
					}
				},
				grid: {
					top: 55,
					bottom: 25,
					left: 30,
					right: 30,
					containLabel: true
				},
				legend: { data: legend },
				series: series
			};

			this.chart.setOption(options);
		},
		formatTime(time) {
			return moment(time).utc().format("YYYY-MM-DD");
		},
		handleDownload() {
			let tHeader = Object.values(this.headers);
			let filterVal = Object.keys(this.headers);
			// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ]
			// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ]
			let data = this.formatJson(filterVal, this.list);

			import("@/vendor/Export2Excel").then((excel) => {
				excel.export_json_to_excel({
					header: tHeader,
					data,
				});
			});
		},
		formatJson(filterVal, jsonData) {
			return jsonData.map((v) => filterVal.map((j) => v[j]));
		},
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.PCI-average
	.filter-container 
		.el-select
			width: 105px
		.el-input__inner
			padding-left: 5px
			text-align: center
	.filter-item
		margin-right: 5px
	.chart
		height: 400px
</style>