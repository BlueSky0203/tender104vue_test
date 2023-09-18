<template>
	<div class="app-container exp-compare" v-loading="loading">
		<h2>經費(估算/執行)</h2>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1" style="width: 150px">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
			<!-- <el-button
				class="filter-item"
				type="info"
				icon="el-icon-document"
				:circle="screenWidth<567"
				@click="handleDownload"
			>輸出報表</el-button> -->
		</div>

		<div class="chart" ref="chart" />

		<el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			stripe
			style="width: 100%"
		>
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row }">
					<span>{{ formatContent(row, key) }}</span>
				</template>
			</el-table-column>
		</el-table>
	</div>
</template>

<script>
import moment from "moment";
import echarts from "echarts/lib/echarts";
require("echarts/theme/macarons");
require("echarts/lib/chart/bar");
import { getExpType, getExpCompare } from "@/api/case";
// import TimePicker from '@/components/TimePicker';

export default {
	name: "costCompare",
	// components: { TimePicker },
	data() {
		return {
			loading: false,
			zipCodeNow: 104,
			listQuery: {
				zipCode: 104,
			},
			headers: {
				month: {
					name: "月份",
				},
				expType: {
					name: "經費類型",
				},
				// type: {
				// 	name: "類別"
				// },
				// amount: {
				// 	name: "金額",
				// 	sortable: false,
				// 	editable: true,
				// 	editType: "number",
				// 	chartType: 'bar'
				// }
			},
			expTypeMap: {
				estList: "估算",
				execList: "執行",
			},
			typeMap: {},
			estList: [],
			execList: [],
			districtList: {
				// 100: {
				// 	"name": "中正區",
				// 	"engName": "Zhongzheng"
				// },
				103: {
					name: "大同區",
					start: "2023/2/1",
				},
				104: {
					name: "中山區",
					start: "2022/6/1",
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
			chart: null,
		};
	},
	computed: {
		list() {
			return [...this.estList, ...this.execList].sort((a, b) =>
				a.dataTime.localeCompare(b.dataTime)
			);
		},
	},
	created() {
		this.getTypeList(true);
	},
	mounted() {
		this.chart = echarts.init(this.$refs.chart, "macarons", {
			width: "auto",
			height: "auto",
		});
		this.getList();
	},
	methods: {
		getTypeList(isInit = false, typeId = 0) {
			this.loading = true;
			this.typeMap = {};
			getExpType().then((response) => {
				if (response.data.list.length != 0) {
					response.data.list.forEach((l) => {
						this.$set(this.typeMap, l.id, l.type);
						this.$set(this.headers, `type${l.id}`, { name: l.type, chartType: "bar" });
					});
				}
				this.loading = false;
			}).catch((err) => (this.loading = false));
		},
		getList() {
			this.loading = true;
			getExpCompare({
				zipCode: this.listQuery.zipCode
			}).then((response) => {
				this.zipCodeNow = this.listQuery.zipCode;
				if (response.data.estList.length == 0 && response.data.execList.length == 9) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					for (const lName in response.data) {
						// this[lName] = response.data[lName].map(l => {
						// 	l.month = this.formatTime(l.dataTime);
						// 	l.type = this.typeMap[l.typeId];
						// 	l[`type${l.typeId}`] = l.amount;
						// 	return l;
						// });

						this[lName] = response.data[lName].reduce((acc, curr) => {
							if (acc.length == 0 || !moment(curr.dataTime).isSame(acc[acc.length - 1].dataTime)) {
								const temp = {
									dataTime: curr.dataTime,
									expType: this.expTypeMap[lName],
									month: this.formatTime(curr.dataTime),
								};
								// for(const typeId in this.typeMap) {
								// 	if(typeId == curr.typeId) temp[`type${curr.typeId}`] = curr.amount;
								// 	else temp[`type${typeId}`] = 0;
								// }
								temp[`type${curr.typeId}`] = curr.amount;
								acc.push(temp);
							} else acc[acc.length - 1][`type${curr.typeId}`] = curr.amount;
							return acc;
						}, []);
					}
				}
				this.setChartOptions();
				this.loading = false;
			}).catch((err) => (this.loading = false));
		},
		setChartOptions() {
			const monthList = Array.from(new Set(this.list.map((l) => l.month)));
			let legend = [];
			let series = [];

			for (const [index, key] of Object.keys(this.headers).entries()) {
				if (this.headers[key].chartType == null) continue;
				legend.push(this.headers[key].name);

				for (const expType in this.expTypeMap) {
					series.push({
						type: this.headers[key].chartType,
						name: this.headers[key].name,
						data: this[expType].reduce((acc, curr) => {
							const index = monthList.indexOf(curr.month);
							if (curr[key] != undefined) acc[index] = curr[key];
							return acc;
						}, Array.from({ length: monthList.length }).fill("-")),
						stack: `金額_${expType}`,
						barWidth: expType == "estList" ? "10%" : "30%",
						itemStyle: {
							borderColor: "#aaa",
							borderWidth: expType == "estList" ? 2 : 0,
							borderType: expType == "estList" ? "dashed" : "solid",
							opacity: expType == "estList" ? 0.85 : 1,
						},
						offset: [0, 20],
						label: {
							show: index == 2,
							distance: 3,
							color: '#666',
							position: 'bottom',
							formatter: expType == "estList" ? '估算' : '執行'
						}
					});
				}
			}

			// console.log(series);

			const options = {
				xAxis: {
					name: "月份",
					type: "category",
					data: monthList,
					axisTick: {
						show: false,
						// alignWithLabel: true
					},
					axisLabel: {
						margin: 25
					}
				},
				yAxis: {
					name: "金額",
					type: "value",
					axisTick: {
						show: false,
					},
				},
				tooltip: {
					trigger: "axis",
					axisPointer: {
						type: "shadow",
						shadowStyle: {
							opacity: 0.9,
						},
					},
					padding: [5, 10],
					formatter: (e) => {
						let htmlStr = `<div>${e[0].axisValueLabel}<br>`;
						const expType = Object.values(this.expTypeMap);
						for (const [index, data] of e.entries()) {
							if (data.value != "-")
								htmlStr += `${data.marker} ${data.seriesName}(${expType[index % 2]}): ${data.value} <br>`;
						}
						htmlStr += `</div>`;

						return htmlStr;
					},
				},
				grid: {
					top: 55,
					bottom: 20,
					left: 30,
					right: 100,
					containLabel: true,
				},
				legend: { data: legend },
				series: series,
			};

			this.chart.setOption(options);
		},
		formatTime(time) {
			return moment(time).format("YYYY/MM");
		},
		formatContent(row, key) {
			if (["month", "expType"].includes(key)) return row[key];
			else if (row[key] == 0 || Number(row[key]))
				return Number(row[key]).toLocaleString();
			else return "-";
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
.exp-compare
	.chart
		height: 400px
</style>