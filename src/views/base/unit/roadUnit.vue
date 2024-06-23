<template>
	<div class="app-container road-unit" v-loading="loading">
		<h2>道路單元</h2>
		<div class="filter-container">
			<el-cascader
				class="filter-item"
				v-model="listQuery.distList"
				placeholder="請選擇區域"
				:key="listQuery.distList.length"
				:options="districtOpt"
				:show-all-levels="false"
				:props="{ expandTrigger: 'hover', multiple: true, emitPath: false }"
				style="width: 500px"
			>
				<template slot-scope="{ node, data }">
					<span>{{ data.label }}</span>
					<span v-if="!node.isLeaf"> ({{ listQuery.distList.length }}) </span>
				</template>
			</el-cascader>

			<div class="filter-item">
				<el-tooltip effect="dark" content="不填為查詢全部" placement="bottom-end">
					<el-input
						v-model="listQuery.roadName"
						type="textarea"
						:rows="1"
						:autosize="{ minRows: 2, maxRows: 2 }" 
						placeholder="請輸入道路名稱，多個以「,」分隔"
						style="width: 500px"
						@input="listQuery.roadName = listQuery.roadName.replace(/\s+/g, '')"
					/>
				</el-tooltip>
			</div>
		</div>

		<div class="filter-container">
			<div class="filter-item" style="margin-left: 12px">
				<el-tooltip effect="dark" content="填0為不限制" placement="bottom-end">
					<el-input
						v-model.number="listQuery.width[0]"
						type="number"
						:min="0"
						placeholder="公尺"
						style="width: 160px"
						@input="() => { 
							if (listQuery.width[0] < 0) listQuery.width[0] = 0; 
							if (listQuery.width[1] != 0 && listQuery.width[0] >= listQuery.width[1]) listQuery.width[1] = listQuery.width[0];
						}"
					>
						<el-select slot="prepend" v-model="listQuery.widthType" popper-class="type-select">
							<el-option v-for="(name, type) in widthTypeMap" :key="type" :label="name" :value="Number(type)" />
						</el-select>
					</el-input>
				</el-tooltip>

				<span style="margin: 0 12px"> - </span>

				<el-tooltip effect="dark" content="填0為不限制" placement="bottom-end">
					<el-input
						v-model.number="listQuery.width[1]"
						type="number"
						:min="0"
						placeholder="公尺"
						style="width: 160px"
						@input="() => {
							if (listQuery.width[1] < 0) listQuery.width[1] = 0; 
							if (listQuery.width[1] != 0 && listQuery.width[0] >= listQuery.width[1]) listQuery.width[1] = listQuery.width[0]; 
						}"
					>
						<el-select slot="prepend" v-model="listQuery.widthType" popper-class="type-select">
							<el-option v-for="(name, type) in widthTypeMap" :key="type" :label="name" :value="Number(type)" />
						</el-select>
					</el-input>
				</el-tooltip>
			</div>

			<el-button class="filter-item" type="primary" icon="el-icon-search" style="margin-left: 40px" @click="listQuery.pageCurrent = 1; getList();">搜尋</el-button>
			<el-button class="filter-item" type="info" icon="el-icon-document" :circle="screenWidth < 567" @click="handleDownload">輸出列表</el-button>
		</div>

		<el-divider />

		<h4>道路單元數：{{ total }}</h4>
		<!-- <h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5> -->

		<div class="el-input-group" style="margin-bottom: 10px; max-width: 1075px; min-width: 500px">
			<div class="el-input-group__prepend">
				<el-checkbox v-model="allHeaders" :indeterminate="partHeaders">欄位</el-checkbox>
			</div>
			<el-checkbox-group class="el-input__inner column-filter-item" v-model="headersCheckVal" style="line-height: 15px;">
				<el-checkbox v-for="(value, key) in headersOpt" :key="key" :label="key">{{ value.name }}</el-checkbox>
			</el-checkbox-group>
		</div>

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
				v-for="(value, key) in headersFilter"
				:key="key"
				:prop="key"
				:label="value.name"
				:min-width="value.minWidth"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			/>
			<el-table-column label="操作" width="140" align="center">
				<template slot-scope="{ row }">
					<div v-if="row.unitLaneNum != 0">車道區塊: {{ row.unitLaneNum }}</div>
					<div v-if="row.unitBlockNum != 0">單元區塊: {{ row.unitBlockNum }}</div>
					<el-button-group>
						<el-button :type="row.unitLaneNum == 0 ? 'primary' : 'info' " plain size="mini" round @click="showMap(row, 1)">街道</el-button>
						<el-button :type="row.unitBlockNum == 0 ? 'primary' : 'info' " plain size="mini" round @click="showMap(row, 2)">單元</el-button>
					</el-button-group>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />
	</div>
</template>

<script>
import moment from "moment";
import { getRoadUnit } from "@/api/road";
import Pagination from "@/components/Pagination";

export default {
	name: "roadUnit",
	components: { Pagination },
	data() {
		return {
			loading: false,
			screenWidth: window.innerWidth,
			listQuery: {
				distList: [],
				roadName: "",
				widthType: 1,
				width: [ 0, 0 ],
				pageCurrent: 1,
				pageSize: 50,
			},
			headersFixed: {
				RoadId: {
					name: "Id",
					sortable: false,
					minWidth: 40
				},
				notes: {
					name: "道路編號",
					sortable: true,
					minWidth: 80
				},
				dist: {
					name: "行政區",
					sortable: true,
					minWidth: 60
				},
				roadName: {
					name: "道路名稱",
					sortable: true
				},
			},
			headersOpt: {
				crossName: {
					name: "交叉道路",
					sortable: false,
				},
				roadStart: {
					name: "起始道路",
					sortable: false,
				},
				roadEnd: {
					name: "結束道路",
					sortable: false,
				},
				width: {
					name: "計畫路寬",
					sortable: true,
					minWidth: 60
				},
				widthReal: {
					name: "實際路寬",
					sortable: true,
					minWidth: 60
				},
				lane: {
					name: "車道數量",
					sortable: false,
					minWidth: 30
				},
				length: {
					name: "區塊長度",
					sortable: true,
					minWidth: 60
				},
				area: {
					name: "區塊面積",
					sortable: true,
					minWidth: 60
				},
				areaCross: {
					name: "道路面積(扣除路口重覆)",
					sortable: true,
					minWidth: 50
				},
			},
			total: 0,
			list: [],
			headersCheckVal: [],
			allHeaders: true,
			widthTypeMap: {
				1: "計畫路寬",
				2: "實際路寬",
			},
			roadIdMap: {
				0: "路口",
				1: "順向",
				2: "逆向",
			},
			districtList: {
				100: {
					name: "中正區",
					engName: "Zhongzheng",
				},
				103: {
					name: "大同區",
					engName: "Datong",
				},
				104: {
					name: "中山區",
					engName: "Zhongshan",
				},
				105: {
					name: "松山區",
					engName: "Songshan",
				},
				106: {
					name: "大安區",
					engName: "Da’an",
				},
				108: {
					name: "萬華區",
					engName: "Wanhua",
				},
				110: {
					name: "信義區",
					engName: "Xinyi",
				},
				111: {
					name: "士林區",
					engName: "Shilin",
				},
				112: {
					name: "北投區",
					engName: "Beitou",
				},
				114: {
					name: "內湖區",
					engName: "Neihu",
				},
				115: {
					name: "南港區",
					engName: "Nangang",
				},
				116: {
					name: "文山區",
					engName: "Wenshan",
				},
				999: {
					name: "橋涵區"
				}
			}
		};
	},
	computed: {
		partHeaders() {
			return (this.headersCheckVal.length != 0 && this.headersCheckVal.length < Object.keys(this.headersOpt).length);
		},
		headersFilter() {
			if (this.headersCheckVal.length == 0) this.allHeaders = false;

			let headersFilter = Object.assign({}, this.headersFixed);
			this.headersCheckVal.forEach((header) => headersFilter[header] = this.headersOpt[header]);
			return headersFilter;
		},
		districtOpt() {
			let districtOpt = [{ value: 0, label: "台北市", children: [] }];
			for (const zip in this.districtList)
				districtOpt[0].children.push({
					value: Number(zip),
					label: this.districtList[zip].name,
				});

			return districtOpt;
		},
	},
	watch: {
		allHeaders(val) {
			if (val) this.headersCheckVal = Object.keys(this.headersOpt);
			else this.headersCheckVal = [];
		},
	},
	created() {
		this.listQuery.distList = Object.keys(this.districtList);
		if (this.allHeaders) this.headersCheckVal = Object.keys(this.headersOpt).filter(key => !['areaCross'].includes(key));
		else this.headersCheckVal = [];

		this.getList();
	},
	methods: {
		showMap(row, type) {
			const codeTypeMap = {
				1: "/unit/genLaneMap",	// 街道
				2: "/unit/genBlockMap"	// 單元
			};

			this.$router.push({
				path: codeTypeMap[type],
				query: { roadId: row.RoadId },
			});
		},
		getList() {
			this.loading = true;

			// let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			// let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			// this.searchRange = startDate + " - " + endDate;

			this.list = [];
			let query = {
				// width: this.listQuery.width,
				// widthReal: this.listQuery.widthReal,
				pageCurrent: this.listQuery.pageCurrent,
				pageSize: this.listQuery.pageSize,
				// timeStart: startDate,
				// timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
			};
			if (this.listQuery.distList.length > 0) query.distList = this.listQuery.distList.join(",");
			if (this.listQuery.roadName.length > 0) query.roadName = this.listQuery.roadName;
			if (this.listQuery.widthType == 1) query.width = this.listQuery.width;
			else if (this.listQuery.widthType == 2) query.widthReal = this.listQuery.width;

			getRoadUnit(query).then(response => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.total = 0;
				} else {
					this.total = response.data.total;
					this.list = response.data.list;
					this.list.forEach(l => l.dist = this.districtList[l.zip].name);
				}
				this.loading = false;
			}).catch(err => this.loading = false);
		},
		indexMethod(index) {
			return (index + 1 + (this.listQuery.pageCurrent - 1) * this.listQuery.pageSize);
		},
		formatter(row, column) {
			if (Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property] || "-";
		},
		formatTime(time) {
			return moment(time).format("YYYY-MM-DD");
		},
		async handleDownload() {
			// await this.dateWatcher();

			// const startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			// const endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");

			let query = {
				pageCurrent: 1,
				pageSize: this.total,
				// timeStart: startDate,
				// timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
			};
			if (this.listQuery.distList.length > 0) query.distList = this.listQuery.distList.join(",");
			if (this.listQuery.roadName.length > 0) query.roadName = this.listQuery.roadName;
			if (this.listQuery.widthType == 1) query.width = this.listQuery.width;
			else if (this.listQuery.widthType == 2) query.widthReal = this.listQuery.width;

			getRoadUnit(query).then((response) => {
				let list = response.data.list;
				list.forEach(l => l.dist = this.districtList[l.zip].name);

				const tHeader = Object.values(this.headersFilter).map((h) => h.name);
				const filterVal = Object.keys(this.headersFilter);
				// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ]
				// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ]
				const data = this.formatJson(filterVal, list);

				import("@/vendor/Export2Excel").then((excel) => {
					excel.export_json_to_excel({
						header: tHeader,
						data,
					});
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
.road-unit
	.filter-container
		.el-textarea .el-textarea__inner
			resize: none
			height: 62px !important
		.el-input__inner
			padding-left: 5px
			text-align: center
		.el-select
			width: 85px
			.el-input__inner
				padding-left: 3px
				padding-right: 10px
			.el-input__suffix
				right: 0
				margin-right: -3px
				transform: scale(0.7)
		.filter-item
			margin-right: 5px
			vertical-align: middle
			input[type=number]
				padding: 0
				overflow: hidden
				&::-webkit-inner-spin-button
					transform: scale(1.2, 1) translateX(-11%)
	.el-input__inner.column-filter-item
		width: auto
		// max-width: 1200px
		text-align: left
		.el-checkbox
			margin: 0 4px 0 10px
</style>