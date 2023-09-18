<template>
	<div class="app-container exp-estimate" v-loading="loading">
		<h2>經費估算</h2>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1" style="width: 150px">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<el-date-picker class="filter-item" v-model="searchDate" type="month" placeholder="選擇月份" :picker-options="pickerOptions" align="center" :clearable="false" :editable="false" style="width: 150px" @change="getList" />
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
					/>
					<el-select
						v-else-if="isEdit(row, value) && value.editType == 'select'"
						v-model="row[key]"
						style="width: 200px;"
						filterable
						allow-create
						@change="addTypeList"
					>
						<el-option v-for="(type, id) in typeMap" :key="id" :label="type" :value="Number(id)">
							<span>{{ type }}</span>
							<el-button type="text" style="position: absolute; right: 15px;" @click="delTypeList(id)">
								<i class="el-icon-close" style="color: #F56C6C;" />
							</el-button>
						</el-option>
					</el-select>
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
								@click="row.editValue = true"
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
require('echarts/lib/chart/pie');
import { getExpType, addExpType, delExpType, getExpEstimate, setExpEstimate, delExpEstimate } from "@/api/case";

export default {
	name: "expEstimate",
	data() {
		return {
			loading: false,
			// screenWidth: window.innerWidth,
			searchDate: moment().startOf("month").toDate(),
			pickerOptions: {
				disabledDate(date) {
					return moment(date).valueOf() >= moment().endOf("d").valueOf();
				},
			},
			zipCodeNow: 104,
			listQuery: {
				zipCode: 104,
			},
			headers: {
				typeId: {
					name: "類別",
					sortable: false,
					editable: true,
					editType: "select"
				},
				amount: {
					name: "金額",
					sortable: false,
					editable: true,
					editType: "number",
					chartType: 'bar'
				}
			},
			typeMap: {},
			list: [],
			newItem: {
				typeId: 0,
				amount: 1
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
			chart: null,
		};
	},
	computed: {
		tempList() {
			return [ ...this.list, this.newItem ]
		}
	},
	created() {
		this.getTypeList(true);
	},
	mounted() {
		this.chart = echarts.init(this.$refs.chart, 'macarons', {
			width: 'auto',
			height: 'auto'
		});
		this.getList();
	},
	methods: {
		getTypeList(isInit = false, typeId = 0) {
			this.loading = true;
			this.typeMap = {};
			getExpType().then(response => {
				if(response.data.list.length != 0) {
					response.data.list.forEach(l => this.$set(this.typeMap, l.id, l.type));
					if(isInit) this.$nextTick(() => this.newItem.typeId = Number(Object.keys(this.typeMap)[0]));
					else if (typeId != 0) this.$nextTick(() => this.newItem.typeId = typeId);
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		addTypeList(id) {
			if(!Object.keys(this.typeMap).map(key => Number(key)).includes(id)) {
				addExpType({ 
					type: id
				}).then(response => {
						this.getTypeList(false, response.typeId);
				}).catch(err => {
					console.log(err);
				})
			}
		},
		delTypeList(id) {
			delExpType(id).then(response => {
				this.getTypeList(id == this.newItem.typeId);
			}).catch(err => {
				console.log(err);
				this.getTypeList();
			})
		},
		getList() {
			this.loading = true;
			this.list = [];
			getExpEstimate({
				zipCode: this.listQuery.zipCode,
				dataTime: moment(this.searchDate).format("YYYY-MM-DD")
			}).then(response => {
				this.zipCodeNow = this.listQuery.zipCode;
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.list = response.data.list;
				}
				this.setChartOptions();
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		isEdit(row, value) {
			return (row.id == undefined && value.editable) || ( row.id != undefined && row.editValue) 
		},
		addItem() {
			setExpEstimate({
				zipCode: this.zipCodeNow,
				dataTime: moment(this.searchDate).format("YYYY-MM-DD"),
				typeId: this.newItem.typeId,
				amount: this.newItem.amount
			}).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "新增成功",
						type: "success",
					});

					this.newItem = {
						typeId: Number(Object.keys(this.typeMap)[0]),
						amount: 1
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
			setExpEstimate({
				zipCode: this.zipCodeNow,
				id: row.id,
				dataTime: moment(this.searchDate).format("YYYY-MM-DD"),
				typeId: row.typeId,
				amount: row.amount
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
			delExpEstimate(row.id).then(response => {
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
			const series = [{
				type: 'pie',
				radius: ['30%', '70%'],
				data: this.list.map(l => ({ value: l.amount, name: this.typeMap[l.typeId] })),
				label: { 
					formatter: '{d}%',
					fontSize: 14
				}
			}];

			const options = {
				title: {
					// text: '成效式契約經費分析',
					textStyle: {
						color: 'black',
						fontWeight: 'bold'
					}
				},
				tooltip: {
					trigger: 'item',
					formatter: '{b} : {c} ({d}%)'
				},
				grid: {
					top: 55,
					bottom: 20,
					left: 30,
					right: 100,
					containLabel: true
				},
				legend: { 
					orient: 'vertical',
					type: 'plain',
					top: 'middle',
					right: '10%',
					textStyle: { fontSize: 14 },
					data: this.list.map(l => l.type) 
				},
				series: series
			};

			this.chart.setOption(options);
		},
		formatTime(time) {
			return moment(time).utc().format("YYYY-MM-DD");
		},
		formatContent(row, key) {
			if(key == "typeId") return this.typeMap[row[key]];
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
.exp-estimate
	.chart
		height: 400px
</style>