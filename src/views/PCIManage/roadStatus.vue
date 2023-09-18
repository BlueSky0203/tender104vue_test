<template>
	<div class="app-container road-status" v-loading="loading">
		<h2>路況查詢</h2>
		<div class="filter-container">
			<!-- <el-cascader
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
			</el-cascader> -->

			<!-- <div class="filter-item">
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
			</div> -->

			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>區塊類型</span>
					</div>
					<el-select v-model="listQuery.groupType" popper-class="type-select">
						<el-option v-for="(name, type) in options.groupType" :key="type" :label="name" :value="Number(type)" />
					</el-select>
				</div>
			</div>

			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>計算依據</span>
					</div>
					<el-select v-model="listQuery.computeType" popper-class="type-select">
						<el-option v-for="(name, type) in options.computeType" :key="type" :label="name" :value="Number(type)" />
					</el-select>
				</div>
			</div>

			<time-picker class="filter-item" :hasWeek="false" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>

			<el-button class="filter-item" type="primary" icon="el-icon-search" style="margin-left: 20px" @click="listQuery.pageCurrent = 1; getList();">搜尋</el-button>
			<el-button class="filter-item" type="info" icon="el-icon-document" :circle="screenWidth < 567" @click="handleDownload">輸出列表</el-button>

			<el-checkbox v-model="listQuery.filter" style="margin-left: 20px">排除路口</el-checkbox>
		</div>

		<el-divider />

		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

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
			<el-table-column label="序號" type="index" width="100" align="center" :index="indexMethod" />
			<el-table-column
				v-for="(value, key) in headersFilter"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			/>
			<el-table-column label="操作" align="center">
				<template slot-scope="{ row }">
					<el-button-group v-if="row.wkb_geometry">
						<el-button v-if="filterType.groupType == 1" class="btn-action" type="primary" plain size="mini" round @click="showMap(row)">地圖</el-button>
						<el-button class="btn-action" type="info" icon="el-icon-search" plain size="mini"  round @click="showMapViewer(row)" />
					</el-button-group>
					<span v-else> - </span>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" />

		<el-dialog class="dialog-map" :visible.sync="dialogMapVisible" width="600px">
			<map-viewer :map.sync="map"/>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getRoadStatus } from "@/api/road";
import TimePicker from '@/components/TimePicker';
import Pagination from "@/components/Pagination";
import MapViewer from "@/components/MapViewer";

export default {
	name: "roadStatus",
	components: { TimePicker, Pagination, MapViewer },
	data() {
		return {
			loading: false,
			dialogMapVisible: true,
			timeTabId: 1,
			dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			map: {},
			dateRange: [ moment().subtract(1, "month").startOf("month").toDate(), moment().subtract(1, "month").endOf("month").toDate() ],
			searchRange: "",
			filterType: {
				groupType: 1,
				computeType: 2
			},
			listQuery: {
				filter: true,
				distList: [],
				tenderRound: 91001,
				groupType: 1,
				computeType: 2,
				pageCurrent: 1,
				pageSize: 50,
			},
			headers: {
				fcl_id: {
					name: "道路編碼",
					sortable: false,
					groupTypeFilter: [ 1 ]
				},
				dist: {
					name: "行政區",
					sortable: false
				},
				fcl_road: {
					name: "道路名稱",
					sortable: false
				},
				road_direction: {
					name: "道路方向",
					sortable: false
				},
				fcl_roadx: {
					name: "交叉道路",
					sortable: false,
					groupTypeFilter: [ 1 ]
				},
				fcl_sta_ro: {
					name: "起始道路",
					sortable: false,
					groupTypeFilter: [ 1 ]
				},
				fcl_end_ro: {
					name: "結束道路",
					sortable: false,
					groupTypeFilter: [ 1 ]
				},
				PCI_value: {
					name: "PCI",
					sortable: false,
					computeTypeFilter: [ 2 ]
				},
			},
			total: 0,
			list: [],
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
			},
			options: {
				groupType: {
					1: "街廓",
					2: "路段",
				},
				computeType: {
					// 1: "缺失數量",
					2: "PCI分數"
				},
				roadIdMap: {
					0: "路口",
					1: "順",
					2: "逆"
				},
			}
		};
	},
	computed: {
		districtOpt() {
			let districtOpt = [{ value: 0, label: "台北市", children: [] }];
			for (const zip in this.districtList)
				districtOpt[0].children.push({
					value: Number(zip),
					label: this.districtList[zip].name,
				});

			return districtOpt;
		},
		headersFilter() {
			let headersFilter = {};
			Object.keys(this.headers).forEach(key => {
				const props = this.headers[key];
				if(props.hasOwnProperty('groupTypeFilter') && props.groupTypeFilter.includes(this.filterType.groupType)) headersFilter[key] = props;
				else if(props.hasOwnProperty('computeTypeFilter') && props.computeTypeFilter.includes(this.filterType.computeType)) headersFilter[key] = props;
				else if(!props.hasOwnProperty('groupTypeFilter') && !props.hasOwnProperty('computeTypeFilter')) headersFilter[key] = props;
			})
			return headersFilter
		}
	},
	watch: {},
	created() {
		this.listQuery.distList = Object.keys(this.districtList);

		this.getList();
	},
	mounted(){
		this.dialogMapVisible = false;
	},
	methods: {
		showMap(row) {
			this.$router.push({
				path: "/case/caseMap",
				query: { tenderRound: this.listQuery.tenderRound, blockId: row.fcl_id },
			});
		},
		showMapViewer(row) {
			// console.log("showMap");
			this.map.data.forEach(feature => this.map.data.remove(feature));
			this.dialogMapVisible = true;

			let geoJSON_road = { 
				"type": "FeatureCollection",
				"name": "polyJSON",
				"features": []
			};
			// console.log(row.wkb_geometry);

			geoJSON_road.features.push({
				"type": "Feature",
				"properties": { },
				"geometry": row.wkb_geometry
			});

			this.map.data.addGeoJson(geoJSON_road);
			this.map.data.setStyle({ 
				strokeWeight: 1,
				strokeOpacity: 0.5,
				fillColor: '#409EFF',
				fillOpacity: 0.8
			});

			const paths = row.wkb_geometry.coordinates.flat(2).map(point => ({ lat: point[1], lng: point[0] }));
			const bounds = new google.maps.LatLngBounds();
			paths.forEach(position => bounds.extend(position));
			this.map.fitBounds(bounds);
			const zoom = this.map.getZoom();
			this.map.setZoom(zoom < 18 ? 18 : zoom);
			// this.map.setCenter(bounds.getCenter());
			// this.map.panToBounds(bounds);
		},
		getList() {
			this.loading = true;

			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;
			this.list = [];
			this.filterType.groupType = this.listQuery.groupType;
			this.filterType.computeType = this.listQuery.computeType;

			getRoadStatus({
				filter: this.listQuery.filter,
				groupType: this.listQuery.groupType,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
				pageCurrent: this.listQuery.pageCurrent,
				pageSize: this.listQuery.pageSize
			}).then((response) => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
					this.total = 0;
				} else {
					this.total = response.data.total;
					this.list = response.data.list;
					this.list.forEach(l => {
						// if(this.listQuery.groupType == 2) l.fcl_road += ` - ${this.options.roadIdMap[l.pci_id_group.slice(-1)]}`;
						l.dist = this.districtList[l.zip_code].name;
						if(l.wkb_geometry) l.wkb_geometry = JSON.parse(l.wkb_geometry);
					});
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
			return moment(time).utc().format("YYYY-MM-DD");
		},
		async handleDownload() {
			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");

			let query = {
				groupType: this.listQuery.groupType,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD"),
				pageCurrent: 1,
				pageSize: this.total
			};

			getRoadStatus(query).then((response) => {
				let list = response.data.list;
				list.forEach((l, i) => {
					this.$set(l, "index", i+1);
					l.dist = this.districtList[l.zip_code].name;
				});

				const tHeader = [ "序號", ...Object.values(this.headersFilter).map((h) => h.name) ];
				const filterVal = [ "index", ...Object.keys(this.headersFilter) ];
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
.road-status
	.filter-container
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
		.el-input-group--prepend .el-select .el-input.is-focus .el-input__inner
			border-color: #DCDFE6
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
	.btn-action
		margin-left: 5px
		padding: 5px
	.dialog-map 
		min-height: 300px 
		.el-dialog__body
			height: 30%
</style>