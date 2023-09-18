<template>
	<div class="app-container assign-case-ratio" v-loading="loading">
		<h2>機關交辦金額統計</h2>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1" style="width: 150px">
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
			:data="tempList"
			border
			fit
			highlight-current-row
			:header-cell-style="{'background-color': '#F2F6FC'}"
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
					<el-input
						v-if="isEdit(row, value) && value.editType == 'string'"
						v-model="row[key]"
						size="mini"
						placeholder="月/日"
						style="width: 100px"
					/>
					<el-input-number
						v-else-if="isEdit(row, value) && value.editType == 'number'"
						v-model="row[key]"
						size="mini"
						:precision="0"
						:step="1"
						:min="0"
						@change="row.ratio = calcRatio(row);"
					/>
					<span v-else>{{ formatContent(row, key) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="動作" align="center">
				<template slot-scope="{ row }">
					<el-button
						v-if="row.id == undefined"
						type="success"
						size="mini"
						@click="addItem()"
					>新增</el-button>
					<span v-else-if="row.id != undefined">
						<el-button
							v-if="row.editValue"
							type="success"
							size="mini"
							@click="editItem(row)"
						>確定</el-button>
						<span v-else>
							<el-button
								type="primary"
								style="margin-left: 10px"
								size="mini"
								@click="row.editValue = true; this.getList();"
							>修改</el-button>
							<el-button
								type="danger"
								size="mini"
								@click="removeItem(row)"
							>刪除</el-button>
						</span>
					</span>
				</template>
			</el-table-column>
		</el-table>

	</div>
</template>

<script>
import moment from "moment";
import echarts from 'echarts/lib/echarts';
require('echarts/theme/macarons');
require('echarts/lib/chart/bar');
import { getAssignCaseAmt, setAssignCaseAmt, delAssignCaseAmt } from "@/api/case";
// import TimePicker from '@/components/TimePicker';

export default {
	name: "assignCaseRatio",
	// components: { TimePicker },
	data() {
		return {
			loading: false,
			// timeTabId: -1,
			// dateTimePickerVisible: false,
			// screenWidth: window.innerWidth,
			// dateRange: [moment().startOf("d").toDate(), moment().endOf("d").toDate()],
			// searchRange: "",
			zipCodeNow: 104,
			listQuery: {
				zipCode: 104,
			},
			headers: {
				month: {
					name: "月份",
					sortable: false,
					editable: true,
					editType: "string"
				},
				implement: {
					name: "聖東執行金額",
					sortable: false,
					editable: true,
					editType: "number",
					chartType: 'bar'
				},
				assign: {
					name: "機關交辦金額",
					sortable: false,
					editable: true,
					editType: "number",
					chartType: 'bar'
				},
				ratio: {
					name: "交辦金額百分比 (%)",
					sortable: false,
					editable: false,
					editType: "",
					chartType: null
				}
			},
			list: [],
			newItem: {
				month: moment().format("yyyy/MM"),
				implement: 0,
				assign: 1
			},
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
			chart: null
		};
	},
	computed: {
		tempList() {
			return [ ...this.list, this.newItem ]
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
			this.list = [];
			getAssignCaseAmt({
				zipCode: this.listQuery.zipCode
			}).then(response => {
				this.zipCodeNow = this.listQuery.zipCode;
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.list = response.data.list;
					this.list.map(l=>{
						this.$set(l, "ratio", this.calcRatio(l));
					})
				}
				this.setChartOptions();
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		isEdit(row, value) {
			return (row.id == undefined && value.editable) || ( row.id != undefined && row.editValue) 
		},
		calcRatio(row) {
			return Math.round((row.assign / row.implement) * 10000) / 100;
		},
		addItem() {
			setAssignCaseAmt({
				zipCode: this.zipCodeNow,
				month: this.newItem.month,
				implement: this.newItem.implement,
				assign: this.newItem.assign
			}).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "新增成功",
						type: "success",
					});

					this.newItem = {
						month: moment().format("yyyy/MM"),
						implement: 0,
						assign: 0
					};
					this.getList();
				} else {
					this.$message({
						message: "新增失敗",
						type: "error",
					});
				}
			}).catch(err => {
				console.log(err);
				this.getList();
			})
		},
		editItem(row) {
			setAssignCaseAmt({
				zipCode: this.zipCodeNow,
				month: row.month,
				implement: row.implement,
				assign: row.assign
			}).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "修改成功",
						type: "success",
					});
					this.getList();
				} else {
					this.$message({
						message: "修改失敗",
						type: "error",
					});
				}
			}).catch(err => {
				console.log(err);
				this.getList();
			})
		},
		removeItem(row) {
			delAssignCaseAmt(row.id).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "刪除成功",
						type: "success",
					});
					this.getList();
				} else {
					this.$message({
						message: "刪除失敗",
						type: "error",
					});
				}
			}).catch(err => {
				console.log(err);
				this.getList();
			})
		},
		setChartOptions() {
			const headerFilter = Object.fromEntries(Object.entries(this.headers).filter(([key, _]) => key != "type"));
			let legend = [];
			let series = [];

			for(const key in headerFilter) {
				if(headerFilter[key].chartType == null) continue;
				legend.push(headerFilter[key].name);
				series.push({
					type: headerFilter[key].chartType,
					name: headerFilter[key].name,
					data: this.list.map(l=>l[key]),
					stack: '金額',
					barWidth: '40%',
					offset: [0, 20],
					label: {
						show: (key == 'assign'),
						precision: 2,
						position: 'inside',
						formatter: (params) => {
							return `${this.list[params.dataIndex].ratio} %`
						}
					}
				});
			}

			const options = {
				xAxis: {
					name: '月份',
					type: 'category',
					data: this.list.map(l=>l.month),
					axisTick: {
						alignWithLabel: true
					}
				},
				yAxis: {
					name: '金額',
					type: 'value',
					axisTick: {
						show: false
					}
				},
				tooltip: {
					trigger: 'axis',
					axisPointer: {
						type: 'cross'
					},
					padding: [5, 10]
				},
				grid: {
					top: 55,
					bottom: 20,
					left: 30,
					right: 100,
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
		formatContent(row, key) {
			if(key == "month") return row[key];
			else if (row[key] == 0 || Number(row[key])) return Number(row[key]).toLocaleString();
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
.assign-case-ratio
	.chart
		height: 400px
</style>