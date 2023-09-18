<template>
	<div class="app-container job-ticket-edit" v-loading="loading">
		<h2>修改派工單 {{ listQuery.orderSN }}</h2>

		<h3>已派工案件
			<el-button-group>
				<el-button type="primary" size="mini" icon="el-icon-sort" :disabled="tableSelect.length == 0" @click="caseSort()">排序(距離)</el-button>
				<el-button type="primary" size="mini" plain :disabled="tableSelect.length == 0" @click="showMapViewer()">檢視</el-button>
			</el-button-group>
		</h3>
		<el-table
			ref="selectTable"
			empty-text="目前沒有資料"
			:data="tableSelect"
			:key="`selectCase_${deviceTypeNow}`"
			border
			fit
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			:row-class-name="({row, rowIndex}) => (row.isAssign ? 'case-assign' : '')"
			style="width: 100%"
		>
			<el-table-column label="順序" width="60" align="center" fixed>
				<template slot-scope="{ row }">
					<el-select v-model="row.OrderIndexNew" placeholder="請選擇" size="mini" :disabled="tableSelect.length <= 1" @change="changeOrder(row)">
						<el-option v-for="index in Array.from({ length: tableSelect.length }, (_, i) => i+1 ).filter(i => i != row.OrderIndex)" :key="`order_${index}`" :label="index" :value="index" />
					</el-select>
				</template>
			</el-table-column>

			<el-table-column prop="index" width="60" align="center" fixed>
				<template slot="header">
					<span v-if="tableSelect.filter(l => !l.isAssign).length == 0"> - </span>
					<el-checkbox v-else v-model="checkAll" :indeterminate="indeterminate" :disabled="list.length == 0 || tableSelect.length == 0" :key="`checkAll_${checkAll}`"/>
				</template>
				<template slot-scope="{ row }">
					<el-checkbox v-if="!row.isAssign" v-model="checkList[row.index-1]" :key="`list_${row.index}`" style="margin-right: 5px" @change="cellCheckBox(row)" />
					<span>{{ row.index }}</span>
				</template>
			</el-table-column>

			<el-table-column prop="CaseSN" label="申請單號" width="125" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span>{{ row.CaseSN }}</span>
					<br>
					<span v-if="row.IsCancel && row.IsCancel == 1" style="color: #F56C6C">(不需施作)</span>
				</template>
			</el-table-column>
			<el-table-column prop="CaseNo" label="案件編號" width="130" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span>{{ row.CaseNo }}</span>
					<br>
					<span style="color: #909399; font-size: 12px">{{ row.DName }} ({{ row.casetype }})</span>
				</template>
			</el-table-column>

			<el-table-column
				v-for="(value, key) in headersFilter"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:min-width="['Place'].includes(key) ? 80 : null"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="[ 'MillingFormula' ].includes(column.property)">
						<span v-if="row.MillingFormula != '0'">{{ row.MillingFormula }}</span>
						<span v-else>{{ row.MillingLength }} * {{ row.MillingWidth }}</span>
					</span>
					<span v-else-if="[ 'IsPressing' ].includes(column.property)">
						<i v-if="row.IsPressing == 1" class="el-icon-check" style="color: #67C23A; font-weight: bold;" />
						<span v-else> - </span>
					</span>
					<span v-else>
						<span>{{ row[column.property] || "-" }}</span>
					</span>
				</template>
			</el-table-column>
			
			<el-table-column label="動作" align="center">
				<template slot-scope="{ row }">
					<el-button-group>
						<el-button v-if="deviceTypeNow == 3" size="mini" @click="toggleExpand(row, 'selectTable')">詳情</el-button>
						<!-- <el-button v-if="deviceTypeNow == 3" type="success" size="mini" @click="beforeEdit(row)">設計</el-button> -->
						<el-button type="info" size="mini" @click="showDetail(row)">檢視</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column type="expand" width="1" align="center" style="display: none">
				<template slot-scope="{ row }">
					<span v-if="row.Content.length == 0">目前沒有資料</span>
					<span v-else>
						<el-table
							class="expandTable"
							empty-text="目前沒有資料"
							:data="row.Content"
							border
							fit
							highlight-current-row
							:header-cell-style="{ 'background-color': '#F2F6FC' }"
							stripe
							show-summary
							:summary-method="(param) => getSummaries(param, row.Content)"
							style="width: 100%"
						>
							<el-table-column type="index" label="序號" width="50" align="center" /> 
							<el-table-column
								v-for="(value, key) in detailHeaders"
								:key="key"
								:prop="key"
								:min-width="['itemName'].includes(key) ? 100 : ['itemId', 'unit', 'uPrice'].includes(key) ? 18 : 30"
								:label="value.name"
								align="center"
								:sortable="value.sortable"
							/>
						</el-table>
						<div class="expand-note">
							<!-- <div>金額合計: ${{ detailAmount(row.Content).toLocaleString() || "-" }}</div> -->
							<div>施作數量: {{ row.KitNotes.DesignDetail || "-" }}</div>
							<div>施工方式: {{ row.KitNotes.DesignDesc || "-" }}</div>
							<div>施作人力: {{ row.KitNotes.DesignWorker || "-" }}</div>
						</div>
					</span>
				</template>
			</el-table-column>
		</el-table>

		<br>

		<div class="previewPdf filter-container">
			<el-tooltip class="filter-item" effect="dark" content="請選擇案件" placement="bottom" :disabled="tableSelect.length != 0">
				<el-button-group>
					<job-ticket-pdf ref="jobTicketPdf" :loading.sync="loading" :tableSelect.sync="tableSelect" :deviceTypeNow="deviceTypeNow" :contractorNow="contractorNow" :guildMap="options.guildMap" :deviceTypeMap="options.deviceType" @downloadPdf="downloadPdf" />
				</el-button-group>
			</el-tooltip>
		</div>

		<el-divider />

		<h3>主任分派案件</h3>
		<el-table
			ref="confirmTable"
			empty-text="目前沒有資料"
			:data="listFilter"
			:key="`allCase_${deviceTypeNow}`"
			border
			fit
			highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			stripe
			style="width: 100%"
			@selection-change="handleCheckedChange"
		>
			<el-table-column width="60" align="center" fixed>
				<template slot="header">
					<span v-if="listFilter.length == 0"> - </span>
					<el-checkbox v-else v-model="checkAll" :indeterminate="indeterminate" :key="`checkAll_${checkAll}`" :disabled="list.length == 0 || listFilter.length == 0" />
				</template>
				<template slot-scope="{ row }">
					<el-checkbox v-model="checkList[row.index-1]" :key="`list_${row.index}`" style="margin-right: 5px" @change="cellCheckBox(row)" />
					<span>{{ row.index }}</span>
				</template>
			</el-table-column>
			<!-- <el-table-column type="index" label="序號" width="50" align="center" /> -->
			<el-table-column prop="CaseSN" label="申請單號" width="125" align="center" fixed sortable />
			<el-table-column prop="CaseNo" label="案件編號" width="130" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span>{{ row.CaseNo }}</span>
					<br>
					<span style="color: #909399; font-size: 12px">{{ row.DName }} ({{ row.casetype }})</span>
				</template>
			</el-table-column>

			<el-table-column
				v-for="(value, key) in headersFilter"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:min-width="['Place'].includes(key) ? 80 : null"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="[ 'MillingFormula' ].includes(column.property)">
						<span v-if="row.MillingFormula != '0'">{{ row.MillingFormula }}</span>
						<span v-else>{{ row.MillingLength }} * {{ row.MillingWidth }}</span>
					</span>
					<span v-else-if="[ 'IsPressing' ].includes(column.property)">
						<i v-if="row.IsPressing == 1" class="el-icon-check" style="color: #67C23A; font-weight: bold;" />
						<span v-else> - </span>
					</span>
					<span v-else>
						<span>{{ row[column.property] || "-" }}</span>
					</span>
				</template>
			</el-table-column>
			
			<el-table-column label="動作" align="center">
				<template slot-scope="{ row }">
					<el-button-group>
						<el-button v-if="deviceTypeNow == 3" size="mini" @click="toggleExpand(row, 'confirmTable')">詳情</el-button>
						<!-- <el-button v-if="deviceTypeNow == 3" type="success" size="mini" @click="beforeEdit(row)">設計</el-button> -->
						<el-button type="info" size="mini" @click="showDetail(row)">檢視</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column type="expand" width="1" align="center" style="display: none">
				<template slot-scope="{ row }">
					<span v-if="row.Content.length == 0">目前沒有資料</span>
					<span v-else>
						<el-table
							class="expandTable"
							empty-text="目前沒有資料"
							:data="row.Content"
							border
							fit
							highlight-current-row
							:header-cell-style="{ 'background-color': '#F2F6FC' }"
							stripe
							show-summary
							:summary-method="(param) => getSummaries(param, row.Content)"
							style="width: 100%"
						>
							<el-table-column type="index" label="序號" width="50" align="center" /> 
							<el-table-column
								v-for="(value, key) in detailHeaders"
								:key="key"
								:prop="key"
								:min-width="['itemName'].includes(key) ? 100 : ['itemId', 'unit', 'uPrice'].includes(key) ? 18 : 30"
								:label="value.name"
								align="center"
								:sortable="value.sortable"
							/>
						</el-table>
						<div class="expand-note">
							<!-- <div>金額合計: ${{ detailAmount(row.Content).toLocaleString() || "-" }}</div> -->
							<div>施作數量: {{ row.KitNotes.DesignDetail || "-" }}</div>
							<div>施工方式: {{ row.KitNotes.DesignDesc || "-" }}</div>
							<div>施作人力: {{ row.KitNotes.DesignWorker || "-" }}</div>
						</div>
					</span>
				</template>
			</el-table-column>
		</el-table>

		<!-- <pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" /> -->

		<!-- Dialog: 地圖檢視 -->
		<el-dialog class="dialog-map" :visible.sync="dialogMapVisible" width="800px">
			<map-viewer :map.sync="map" style="height: 500px"/>
		</el-dialog>

		<!-- Dialog: 案件檢視 -->
		<el-dialog width="500px" title="案件檢視" :visible.sync="showDetailDialog">
			<case-detail ref="caseDetail" :loading.sync="loading" :showDetailDialog.sync="showDetailDialog" :deviceTypeNow="deviceTypeNow" />
			<div slot="footer" class="dialog-footer">
				<!-- <el-button @click="showDispatch = false">取消</el-button> -->
				<el-button type="primary" @click="showDetailDialog = false">確定</el-button>
			</div>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getGuildMap } from "@/api/type";
import { getJobTicket, getJobTicketSort, getFinRegister, editJobTicket, getTaskReal } from "@/api/dispatch";
// import TimePicker from "@/components/TimePicker";
import JobTicketPdf from "@/components/JobTicketPdf";
import CaseDetail from "@/components/CaseDetail";
// import Pagination from "@/components/Pagination";
import MapViewer from "@/components/MapViewer";

export default {
	name: "jobTicketEdit",
	components: { JobTicketPdf, CaseDetail, MapViewer },
	data() {
		return {
			loading: false,
			dialogMapVisible: true,
			showDetailDialog: true,
			screenWidth: window.innerWidth,
			searchRange: "",
			deviceTypeNow: 1,
			contractorNow: 0,
			map: {},
			listQuery: {
				deviceType: 1,
				contractor: null,
				orderSN: null
			},
			headers: {
				// CaseSN: {
				// 	name: "申請單號",
				// 	sortable: true,
				// },
				// CaseNo: {
				// 	name: "案件編號",
				// 	sortable: true,
				// },
				// CaseType: {
				// 	name: "查報來源",
				// 	sortable: false,
				// },
				// DName: {
				// 	name: "案件類型",
				// 	sortable: false,
				// },
				// Contractor: {
				// 	name: "廠商",
				// 	sortable: false
				// },
				Place: {
					name: "案件地點",
					sortable: false
				},
				DatePlan: {
					name: "主任分派日期",
					sortable: false
				},
				// DateDeadline: {
				// 	name: "預計完工日期",
				// 	sortable: false
				// },
				// estWorkingTime: {
				// 	name: "預計施作時段",
				// 	sortable: false
				// },
				MillingFormula: {
					name: "算式",
					sortable: false,
					deviceTypeFilter: [1, 2]
				},
				// MillingLength: {
				// 	name: "預計長度",
				// 	sortable: false
				// },
				// MillingWidth: {
				// 	name: "預計寬度",
				// 	sortable: false
				// },
				MillingArea: {
					name: "預估面積",
					sortable: false,
					deviceTypeFilter: [1, 2]
				},
				MillingDepth: {
					name: "刨鋪深度",
					sortable: false,
					deviceTypeFilter: [ 1 ]
				},
				tonne: {
					name: "噸數",
					sortable: false,
					deviceTypeFilter: [ 1 ]
				},
				IsPressing: {
					name: "急件",
					sortable: false,
					deviceTypeFilter: [ 3 ]
				},
				Notes: {
					name: "工程概述",
					sortable: false,
					deviceTypeFilter: [ 3 ]
				}
			},
			detailHeaders: {
				UnitSN: {
					name: "項次",
					sortable: false,
				},
				TaskName: {
					name: "工程項目名稱",
					sortable: false,
				},
				TaskUnit: {
					name: "單位",
					sortable: false,
				},
				TaskPrice: {
					name: "單價",
					sortable: false,
				},
				number: {
					name: "數量",
					sortable: false,
				}
			},
			// total: 0,
			list: [],
			detail: [],
			checkIndeterminate: false,
			checkList: [],
			tableSelect: [],
			apiHeader: [ "SerialNo", "OrderIndex" ],
			options: {
				guildMap: {},
				deviceType: {
					1: "道路",
					2: "熱再生",
					3: "設施",
					4: "標線"
				},
				filterType: {
					1: "合約",
					2: "通報單號",
					3: "地點(關鍵字)"
				}
			}
		};
	},
	computed: {	
		headersFilter() {
			let headersFilter = {};
			Object.keys(this.headers).forEach(key => {
				const props = this.headers[key];
				if(!props.hasOwnProperty('deviceTypeFilter')) headersFilter[key] = props;
				else if(props.deviceTypeFilter.includes(this.deviceTypeNow)) headersFilter[key] = props;
			})
			return headersFilter
		},
		listFilter() {
			const SNFilter = this.tableSelect.map(row => row.SerialNo);
			return this.list.filter(row => !SNFilter.includes(row.SerialNo));
		},
		checkAll: {
			get() {
				return this.list.length > 0 && this.tableSelect.length == this.list.length;
			},
			set(newVal) {
				if(newVal) this.tableSelect = this.list;
				else this.tableSelect = this.list.filter(l => l.isAssign);;

				this.checkList = this.checkList.map((_, index) => (this.tableSelect[index] != undefined));
				this.resetOrder();
			}
		},
		indeterminate() {
			return this.tableSelect.filter(l => !l.isAssign).length > 0 && this.tableSelect.filter(l => !l.isAssign).length < this.list.filter(l => !l.isAssign).length;
		}
	},
	watch: { },
	async created() {
		// marker
		this.markers = [];

		getGuildMap().then(response => { this.options.guildMap = response.data.guildMap });
	},
	mounted() {
		this.dialogMapVisible = false;
		this.showDetailDialog = false;

		if (this.$route.params.deviceType && this.$route.params.contractor && this.$route.params.orderSN ) {
			this.listQuery.deviceType = this.$route.params.deviceType;
			this.listQuery.contractor = this.$route.params.contractor;
			this.listQuery.orderSN = this.$route.params.orderSN;
			this.getList();
		} else this.$router.push({ path: "/dispatch/jobTicketManage" });
	},
	methods: {
		async handleCheckedChange(val) {
			this.tableSelect = val;
			if(val.length == this.list.length) this.tableSelect.forEach((_, index) => this.$set(this.checkList, index, true));
			if(val.length == 0) {
				this.tableSelect = this.list.filter(l => l.isAssign);
				this.checkList = this.checkList.map((_, index) => (this.tableSelect[index] != undefined));
			}

			this.resetOrder();
		},
		cellCheckBox(row) {
			if(this.checkList[row.index-1]) this.tableSelect.push(row);
			else this.tableSelect = this.tableSelect.filter(selectRow => selectRow.index != row.index);

			this.resetOrder();
		},
		toggleExpand(row, tableName) {
			this.getTaskDetail(row).then(() => { 
				this.$refs[tableName].toggleRowExpansion(row);

				// 調整總計列欄位
				this.$nextTick(() => {
					// const expandTableSummary = document.querySelectorAll("#expandTable .el-table__footer-wrapper tr>td");
					const expandTableSumList = document.querySelectorAll(".expandTable .el-table__footer-wrapper tr");
					// console.log(expandTableSumList);
					if(expandTableSumList.length != 0) {
						for(const tableList of expandTableSumList) {
							// console.log(tableList);
							const tdList = tableList.getElementsByTagName("td");
							if(tdList.length != 0) {
								tdList[0].colSpan = 4;
								tdList[0].style.textAlign = "center";
								tdList[1].style.display = "none";
								tdList[2].style.display = "none";
								tdList[3].style.display = "none";
								tdList[4].colSpan = 2;
								tdList[4].style.textAlign = "center";
								tdList[5].style.display = "none";
							}
						}
					}
				});
			}).catch(err => this.loading = false);
		},
		changeOrder(row) {
			this.tableSelect.splice(row.OrderIndex - 1, 1);
			this.tableSelect.splice(row.OrderIndexNew - 1, 0, row);
			this.resetOrder();
		},
		resetOrder() {
			for(const [ index, row ] of this.tableSelect.entries()) row.OrderIndex = row.OrderIndexNew = index + 1;
		},
		detailAmount(content) {
			return content.reduce((acc, cur) => (acc+=cur.number*Number(cur.TaskPrice)), 0)
		},
		getSummaries(param, content) {
			const { columns, data } = param;
			const sums = [];
			columns.forEach((column, index) => {
				if (index === 0) {
					sums[index] = `金額合計`;
					return;
				}
				if(![1,2].includes(index)) {
					if(column.property == "TaskPrice") sums[index] = this.detailAmount(content).toLocaleString();
				}
			});
			return sums;
		},
		getList() {
			this.loading = true;
			this.list = [];
			this.tableSelect = [];

			getFinRegister({
				contractor: this.listQuery.contractor,
				dispatchSN: this.listQuery.orderSN,
				deviceType: this.listQuery.deviceType
			}).then(response => {
				this.tableSelect = response.data.list;
				if(this.tableSelect[0].IsAllCompleted == 1) {
					this.$message({
						message: 	`派工單號${this.listQuery.orderSN} 已完工登錄`,
						type: "error",
					});
				} else {					
					getJobTicket({
						contractor: this.listQuery.contractor,
						deviceType: this.listQuery.deviceType
					}).then(response => {
						this.list = response.data.list;
						this.deviceTypeNow = this.listQuery.deviceType;
						this.contractorNow = this.listQuery.contractor;
						
						this.list.unshift(...this.tableSelect);
						this.list.forEach((l, i) => {
							l.DatePlan = this.formatDate(l.DatePlan);
							l.DateDeadline = (l.DateDeadline == null) ? "" : this.formatDate(l.DateDeadline);
							for (const col of ['MillingDepth', 'MillingLength', 'MillingWidth', 'MillingArea']) 
								if(Number(l[col])) l[col] = Math.round(l[col] * 1000) / 1000;
							this.$set(l, "isAssign", l.OrderIndex != undefined);
							this.$set(l, "index", i+1);
							if(l.OrderIndex == undefined) {
								this.$set(l, "OrderIndex", i+1);
								this.$set(l, "OrderIndexNew", i+1);
							} else this.$set(l, "OrderIndexNew", l.OrderIndex);
							this.$set(l, "tonne", Math.round(l.MillingArea*l.MillingDepth*0.01*2.25*10) / 10);
						})
						this.checkList = Array.from({ length: this.list.length }, (_, index) => (this.tableSelect[index] != undefined));
						
						this.$refs.jobTicketPdf.imgPreload(this.list);
						this.loading = false;
					}).catch(err => this.loading = false);
				}
			}).catch(err => this.loading = false);
		},
		getTaskDetail(row) {
			return new Promise(resolve => {
			row.Content = [];
				getTaskReal({ taskRealGroup: row.TaskRealGroup }).then(response => {
					row.Content = response.data.list.filter(l => l.GroupId == row.TaskRealGroup);
					resolve();
				}).catch(err => this.loading = false);
			})
		},
		showDetail(row) {
			this.loading = true;
			this.$refs.caseDetail.getDetail(row);
		},
		caseSort() {
			const caseList = this.tableSelect.map(caseSpec => (caseSpec.SerialNo));
			getJobTicketSort({ caseList }).then(response => {
				const caseSortedList = response.data.list;
				this.tableSelect.forEach(caseSpec => {
					const index = caseSortedList.indexOf(caseSpec.SerialNo);
					this.$set(caseSpec, "OrderIndex", index + 1);
					this.$set(caseSpec, "OrderIndexNew", index + 1);
				})
				this.tableSelect.sort((a, b) => (a.OrderIndexNew - b.OrderIndex));

				this.resetOrder();

				// TODO: 測試地圖展示
				// this.showMapViewer();
			}).catch(err => console.log(err));
		},
		showMapViewer() {
			// console.log("showMap");
			// icon格式
			this.iconStyle = {
				ylw_blank: {
					url: "https://maps.google.com/mapfiles/kml/paddle/ylw-blank.png",
					anchor: new google.maps.Point(15, 30),
					scaledSize: new google.maps.Size(30, 30)
				},
				grn_pushpin: {
					url: "https://maps.google.com/mapfiles/kml/pushpin/grn-pushpin.png",
					anchor: new google.maps.Point(10, 35),
					scaledSize: new google.maps.Size(35, 35)
				}
			}

			for(const markers of this.markers) markers.setMap(null);
			this.markers = [];
			const bounds = new google.maps.LatLngBounds();

			this.tableSelect.forEach(caseSpec => {
				const position =  { lat: Number(caseSpec.CoordinateY), lng: Number(caseSpec.CoordinateX) };
				const marker = new google.maps.Marker({
					title: `${caseSpec.OrderIndex}: ${caseSpec.CaseNo}`,
					isPin: false,
					map: this.map,
					position,
					icon: this.iconStyle.ylw_blank
				})

				// marker.addListener('click', (event) => {
				// 	if(!marker.isPin) {
				// 		marker.isPin = true;

						marker.setLabel({
							text: `${caseSpec.OrderIndex}`,
							color: '#409EFF',
							fontSize: '24px',
							fontWeight: 'bold'
						});
				// 		marker.setIcon(this.iconStyle.grn_pushpin);
				// 	} else {
				// 		marker.isPin = false;
				// 		marker.setLabel("");
				// 		marker.setIcon(this.iconStyle.ylw_blank);
				// 	}
				// });

				bounds.extend(position);
				this.markers.push(marker);
			})
			this.map.fitBounds(bounds);
			this.dialogMapVisible = true;
		},
		formatDate(time) {
			return moment(time).format("YYYY-MM-DD");
		},
		caseFilterList(list) {
			// console.log(list);
			let caseFilterList = [];
			for(const row of list) {
				let caseItem = {};
				for(const key of this.apiHeader) caseItem[key] = row[key];
				caseFilterList.push(caseItem);
			}

			return caseFilterList;
		},
		downloadPdf(callback) {
			this.$confirm(
				`<p>確認將 案件編號${ this.tableSelect.map(caseSpec => caseSpec.CaseNo).join("、") } 製作派工單？</p>
				<p style="color: #F56C6C">(將刪除派工單號 ${this.listQuery.orderSN}，重新產生單號)</p>`, "確認", { showClose: false, dangerouslyUseHTMLString: true })
				.then(() => {
					editJobTicket({
						contractor: this.contractorNow,
						deviceType: this.deviceTypeNow,
						dispatchSN: this.listQuery.orderSN,
						caseList: this.caseFilterList(this.tableSelect)
					}).then(response => {
						if ( response.statusCode == 20000 ) {
							if ( response.statusCode == 20000 ) {
								const orderSN = response.data.orderSN;
								this.$message({
									message: `製作成功(新派工單號 ${orderSN})`,
									type: "success",
								});
								callback(orderSN);

								this.listQuery.orderSN = orderSN;
								this.getList();
							} else {
								this.$message({
									message: "製作失敗",
									type: "error",
								});
								this.getList();
							}
						}
					}).catch(err => { 
						console.log(err);
						this.$refs.jobTicketPdf.showJobTicket = false;
						this.getList();
					});
				}).catch(err => { 
					console.log(err);
					this.loading = false;
				});
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.job-ticket-edit
	.el-select
		.el-input__inner
			padding-left: 3px
			padding-right: 10px
			text-align: center
		.el-input__suffix
			right: 0
			transform: scale(0.7)
	.filter-container
		.filter-item
			margin-right: 5px
			.el-select
				width: 110px
			.select-contract
				.el-select:first-child .el-input__inner
					background-color: #F5F7FA
					color: #909399
					border-right: none
					border-top-right-radius: 0
					border-bottom-right-radius: 0
					&:focus
						border-color: #DCDFE6
				.el-select:last-child .el-input__inner
					border-top-left-radius: 0
					border-bottom-left-radius: 0
					padding-left: 10px
					text-align: left
	.previewPdf
		display: flex
		justify-content: center
	.el-table
		.case-assign
			background-color: #EBEEF5
		.input-length, .input-width
			max-width: 60px
		.btn-tag
			cursor: pointer
		.el-table__expand-icon
			display: none
	.expand-note 
		padding: 10px 0 0 10px
		& > *
			font-size: 14px
			margin: 5px 0
	.btn-dialog
		padding: 5px 5px
</style>