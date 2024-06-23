<template>
	<div class="app-container case-plan" v-loading="loading">
		<h2>廠商分派 (主任分派)</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>類型</span>
					</div>
					<el-select v-model.number="listQuery.deviceType" placeholder="請選擇" popper-class="type-select" style="width: 100px">
						<el-option v-for="(name, id) in options.deviceType" :key="id" :value="Number(id)" :label="name" />
					</el-select>
				</div>
			</div>

			<span class="filter-item">
				<div style="font-size: 12px; color: #909399">{{ listQuery.filter ? '分派日期' : '成案日期' }}</div>
				<time-picker shortcutType="day" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList"/>
			</span>
			<br />

			<div class="filter-item">
				<div v-if="listQuery.filterType == 1" class="select-contract">
					<el-select v-model="listQuery.filterType" popper-class="type-select">
						<el-option v-for="(name, type) in options.filterType" :key="type" :label="name" :value="Number(type)" />
					</el-select>
					<el-select v-model.number="listQuery.groupId" class="tender-select" placeholder="請選擇" popper-class="type-select tender" clearable @clear="listQuery.groupId = null">
						<el-option v-for="(obj, id) in options.tenderGroup" :key="id" :value="Number(id)" :label="obj.groupName" />
					</el-select>
				</div>
				
				<el-input v-else v-model="listQuery.filterStr" placeholder="請輸入" style="width: 300px">
					<el-select slot="prepend" v-model="listQuery.filterType" popper-class="type-select">
						<el-option v-for="(name, type) in options.filterType" :key="type" :label="name" :value="Number(type)" />
					</el-select>
				</el-input>
			</div>

			<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList();">搜尋</el-button>
			<el-checkbox v-model="listQuery.filter" style="margin-left: 20px">已分派</el-checkbox>
		</div>

		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

		<div v-if="!filterNow" class="filter-container">
			<div v-if="deviceTypeNow != 3" class="filter-item">
				<div class="el-input el-input--medium el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>廠商</span>
					</div>
					<el-select v-model.number="listQuery.contractor" placeholder="請選擇" popper-class="type-select" style="width: 100px">
						<el-option v-for="(name, id) in options.guildMap" :key="id" :value="Number(id)" :label="name" />
					</el-select>
				</div>
			</div>
			<el-tooltip effect="dark" content="請選擇廠商和案件" placement="bottom" :disabled="tableSelect.length != 0 && Number(listQuery.contractor) > 0">
				<span>
					<el-button class="filter-item" type="success" icon="el-icon-s-claim" :disabled="tableSelect.length == 0 || Number(listQuery.contractor) == 0" @click="dispatch()">分派</el-button>
				</span>
			</el-tooltip>
		</div>

		<el-table
			ref="caseTable"
			empty-text="目前沒有資料"
			:data="list"
			:key="deviceTypeNow"
			border
			fit
			highlight-current-row
			:header-cell-style="{ 'background-color': '#F2F6FC' }"
			stripe
			style="width: 100%"
			@selection-change="handleCheckedChange"
		>
			<el-table-column v-if="!filterNow" :key="filterNow" type="selection" width="60" align="center" fixed>
				<template slot-scope="{ row, $index }">
					<el-checkbox v-model="checkList[$index]" style="margin-right: 5px" @change="cellCheckBox(row, $index)" />
					<span>{{ $index + 1 }}</span>
				</template>
			</el-table-column>
			<!-- <el-table-column type="index" label="序號" width="50" align="center" /> -->
			<el-table-column prop="CaseSN" label="通報單號" width="125" align="center" fixed sortable />
			<el-table-column prop="CaseNo" label="案件編號" width="130" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span>{{ row.CaseNo }}</span>
					<br>
					<span style="color: #909399; font-size: 12px">{{ row.DName }} ({{ row.casetype }})</span>
				</template>
			</el-table-column>

			<el-table-column prop="FlowState" label="分派" width="90" align="center" fixed>
				<template slot-scope="{ row }">
					<span v-if="row.FlowState & 4">廠商</span>
					<span v-else-if="row.FlowState & 64">分隊</span>
					<span v-else> - </span>
				</template>
			</el-table-column>

			<el-table-column v-if="filterNow" :key="filterNow" prop="Contractor" label="廠商" width="90" align="center" fixed />

			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:width="['DateDeadline'].includes(key) ? 220 : null"
				:min-width="['Place'].includes(key) ? 80 : null"
				:sortable="value.sortable"
			>
				<!-- <template slot-scope="{ row, column }">
					<span v-if="[ 'DateDeadline' ].includes(column.property)">
						<el-row type="flex" align="middle">
							<el-col :span="18"><el-date-picker v-model="row.DateDeadline" type="date" value-format="yyyy-MM-dd" placeholder="選擇日期" style="width: 100%" /></el-col>
							<el-col :span="6"><el-tag class="btn-tag" :type="row.detailTime ? 'success': 'info'" @click="row.detailTime = !row.detailTime">時段</el-tag></el-col>
						</el-row>
						<el-time-picker v-if="row.detailTime" v-model="row.estWorkingTime" is-range range-separator="至"  start-placeholder="開始時間" end-placeholder="結束時間" placeholder="選擇時間" style="width: 100%" />
					</span>
					<span v-else>
						<span>{{ row[column.property] || "-" }}</span>
					</span>
				</template> -->
			</el-table-column>

			<!-- 道路、熱再生 -->
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="算式" :width="filterNow ? 240 : 500" align="center">
				<template slot-scope="{ row }">
					<span v-if="!filterNow && row.edit">
						<el-row v-if="row.editFormula" :gutter="5" type="flex" align="middle">
							<el-col :span="4"><el-tag class="btn-tag" type="success" @click="row.editFormula = false; calArea(row);">自訂</el-tag></el-col>
							<el-col :span="20"><el-input v-model="row.MillingFormula" @change="calArea(row)" /></el-col>
						</el-row>
						<el-row v-else :gutter="5" type="flex" align="middle">
							<el-col :span="4"><el-tag class="btn-tag" @click="row.editFormula = true; calArea(row);">簡單</el-tag></el-col>
							<el-col :span="8"><el-input v-model="row.MillingLength" @change="calArea(row)" /></el-col>
							<el-col :span="2" style="line-height: 36px"> ✕ </el-col>
							<el-col :span="8"><el-input v-model="row.MillingWidth" @change="calArea(row)" /></el-col>
						</el-row>
					</span>
					<span v-else>
						<span v-if="row.MillingFormula != '0'">{{ row.MillingFormula }}</span>
						<span v-else>{{ row.MillingLength }} * {{ row.MillingWidth }}</span>
					</span>
				</template>
			</el-table-column>
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="預估面積" width="85" align="center">
				<template slot-scope="{ row }">
					<!-- <el-input v-model="row.MillingArea" /> -->
					<span>{{ row.MillingArea || "-" }}</span>
				</template>
			</el-table-column>

			<!-- 設施 -->
			<el-table-column v-if="deviceTypeNow == 3" label="急件" width="55" align="center">
				<template slot-scope="{ row }">
					<el-checkbox v-if="!filterNow && row.edit" v-model="row.IsPressing" :true-label="1" :false-label="0" />
					<span v-else>
						<i v-if="row.IsPressing == 1" class="el-icon-check" style="color: #67C23A; font-weight: bold;" />
						<span v-else> - </span>
					</span>
				</template>
			</el-table-column>
			<el-table-column v-if="deviceTypeNow == 3" label="工程概述" align="center">
				<template slot-scope="{ row }">
					<el-input v-if="!filterNow && row.edit" v-model="row.Notes" />
					<span v-else>{{ row.Notes || " - " }}</span>
				</template>
			</el-table-column>
			<el-table-column v-if="deviceTypeNow == 3" label="設計數量" width="140" align="center">
				<template slot-scope="{ row }">
					<el-button-group v-if="!row.edit">
						<!-- <el-button v-if="!filterNow" :type="row.TaskRealGroup == 0 ? 'success' : 'info'" :plain="row.TaskRealGroup != 0" size="mini" @click="beforeEdit(row)">設計</el-button> -->
						<el-button size="mini" @click="toggleExpand(row)">詳情</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column :label="filterNow ? '主任分派日期' : '是否退件'" width="120" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.IsReturn"> 前ㄧ分派時間: </span>
					<span>{{ row.DatePlanBefore || "-" }}</span>
					<div v-if="row.IsReturn && row.StateNotes"> 原因: {{ row.StateNotes }}</div>
				</template>
			</el-table-column>
			
			<el-table-column label="動作" width="140" align="center">
				<template slot-scope="{ row }">
					<el-button-group v-if="!row.edit">
						<!-- <el-button v-if="deviceTypeNow != 4 && !filterNow" type="primary" size="mini" @click="row.edit = true">編輯</el-button> -->
						<el-button type="info" size="mini" @click="showDetail(row)">檢視</el-button>
					</el-button-group>
					<el-button-group v-else>
						<el-button type="primary" size="mini" @click="dispatchSpec(row, false)">確定</el-button>
						<el-button size="mini" @click="row.edit = false; getList();">取消</el-button>
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
								:min-width="['TaskName'].includes(key) ? 100 : ['UnitSN', 'TaskUnit', 'TaskPrice'].includes(key) ? 18 : 30"
								:label="value.name"
								align="center"
								:sortable="value.sortable"
							/>
						</el-table>
						<div class="expand-note">
							<!-- <div>金額合計: ${{ detailAmount(row.Content).toLocaleString() || "-" }}</div> -->
							<div>施作數量: {{ row.KitNotes.DesignDetail || "-" }}</div>
							<div>施工方式: {{ row.KitNotes.DesignDesc || "-"}}</div>
							<div>施作人力: {{ row.KitNotes.DesignWorker || "-" }}</div>
						</div>
					</span>
				</template>
			</el-table-column>
		</el-table>

		<!-- <pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize" @pagination="getList" /> -->

		<!-- Dialog: 計價套組-->
		<el-dialog v-loading="loading" width="900px" title="設計數量" :visible.sync="showEdit" :close-on-click-modal="false" :close-on-press-escape="false" :before-close="() => cleanDetail()">
			<div class="filter-container">
				<el-select class="filter-item" v-model.number="listQuery.groupSN" filterable placeholder="請選擇" popper-class="type-select" style="width: 500px">
					<el-option v-for="kit in options.kitArr" :key="kit.SerialNo" :value="Number(kit.SerialNo)" :label="kit.GroupName" />
				</el-select>
				<el-button class="filter-item" type="success" size="mini" @click="importKit()">匯入套組</el-button>
			</div>
			<el-table
				v-loading="loading"
				empty-text="目前沒有資料"
				:data="detailPlus"
				border
				fit
				highlight-current-row
				:header-cell-style="{ 'background-color': '#F2F6FC' }"
				stripe
				style="width: 100%"
			>
				<el-table-column
					v-for="(value, key) in detailHeaders"
					:key="key"
					:prop="key"
					:min-width="['TaskName'].includes(key) ? 100 : ['UnitSN', 'TaskUnit', 'TaskPrice'].includes(key) ? 20 : 30"
					:label="value.name"
					align="center"
					:sortable="value.sortable"
				>
					<template slot-scope="{ row, column }">
						<span v-if="['number'].includes(column.property)" style="display: inline-flex; align-items: center;">
							<span v-if="row.isAdd || row.isEdit">
								<el-input v-model="row[column.property]" size="mini" style="width: 55px"/>
								<el-button v-if="row.isEdit" class="btn-dialog" type="info" size="mini" @click="row.isEdit = false;">取消</el-button>
							</span>
							<span v-else>
								<span>{{ row[column.property] }}</span>
								<el-button type="text" style="margin-left: 10px" size="mini" @click="row.isEdit = true">
									<i class="el-icon-edit" />
								</el-button>
							</span>
						</span>
						<span v-else-if="['UnitSN'].includes(column.property) && row.isAdd">
							<span v-if="row.isAdd || row.isEdit">
								<el-input v-model="row[column.property]" size="mini">
									<el-tooltip v-if="column.property == 'UnitSN' && row[column.property].length != 0" slot="suffix" effect="dark" placement="bottom" content="點選代入">
										<el-button type="text" style="padding: 5px 0" @click="getKitItem(row)">
											<i class="el-icon-check" style="color: #67C23A" />
										</el-button>
									</el-tooltip>
								</el-input>
							</span>
						</span>
						<span v-else>{{ row[column.property] }}</span>
					</template>
				</el-table-column>
				<el-table-column label="動作" align="center" :min-width="30">
					<template slot-scope="{ row, $index }">
						<span v-if="row.isAdd">
							<el-button type="success" size="mini" @click="addKitItem">新增</el-button>
						</span>
						<span v-else-if="row.isEdit">
							<el-button type="primary" size="mini" @click="row.isEdit = false;">確定</el-button>
						</span>
						<span v-else>
							<el-button type="danger" size="mini" @click="delKitItem($index)">刪除</el-button>
						</span>
					</template>
				</el-table-column>
			</el-table>
			<div class="detail-caption amount">金額合計: ${{ detailAmount(detailPlus).toLocaleString() }}</div>
			<div>
				<el-input placeholder="請輸入" v-model="rowActive.KitNotes.DesignDetail">
					<template slot="prepend">施作數量</template>
				</el-input>
				<el-input placeholder="請輸入" v-model="rowActive.KitNotes.DesignDesc">
					<template slot="prepend">施工方式</template>
					<el-checkbox slot="append" v-model="rowActive.notesSync">更新「工程概述」</el-checkbox>
				</el-input>
				<el-input placeholder="請輸入" v-model="rowActive.KitNotes.DesignWorker">
					<template slot="prepend">施作人力</template>
				</el-input>
			</div>
			<div slot="footer" class="dialog-footer">
				<el-button @click="cleanDetail()">取消</el-button>
				<el-button type="primary" @click="dispatchSpec()">確定</el-button>
			</div>
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
import { getTenderGroup, getKitItemMap, getGuildMap } from "@/api/type";
import { getDispatch, setDispatch, setDispatchSpec, getTaskGroup, getTaskGroupDetail, getTaskReal } from "@/api/dispatch";
import TimePicker from "@/components/TimePicker";
import CaseDetail from "@/components/CaseDetail";
// import Pagination from "@/components/Pagination";

export default {
	name: "caseAssign",
	components: { TimePicker, CaseDetail },
	data() {
		return {
			loading: false,
			showDispatch: false,
			showDetailDialog: true,
			showEdit: false,
			timeTabId: 1,
			dateTimePickerVisible: false,
			screenWidth: window.innerWidth,
			dateRange: [
				moment().subtract(1, 'd').startOf("day").toDate(),
				moment().subtract(1, 'd').endOf("day").toDate(),
			],
			searchRange: "",
			deviceTypeNow: 1,
			filterNow: false,
			listQuery: {
				filter: false,
				filterType: 1,
				filterStr: null,
				groupId: null,
				deviceType: 1,
				contractor: null,
				groupSN: null
				// pageCurrent: 1,
				// pageSize: 50,
			},
			headers: {
				// CaseSN: {
				// 	name: "通報單號",
				// 	sortable: true,
				// },
				// CaseNo: {
				// 	name: "案件編號",
				// 	sortable: true,
				// },
				// casetype: {
				// 	name: "查報來源",
				// 	sortable: false,
				// },
				// DName: {
				// 	name: "案件類型",
				// 	sortable: false,
				// },
				Place: {
					name: "案件地點",
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
				// MillingFormula: {
				// 	name: "複雜算式",
				// 	sortable: false
				// },
				// MillingLength: {
				// 	name: "預計長度",
				// 	sortable: false
				// },
				// MillingWidth: {
				// 	name: "預計寬度",
				// 	sortable: false
				// },
				// MillingArea: {
				// 	name: "預估面積",
				// 	sortable: false
				// },
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
			total: 0,
			list: [],
			detail: [],
			newKit: {
				GroupName: ""
			},
			newItem: {
				UnitSN: "",
				TaskName: "",
				TaskUnit: "",
				TaskPrice: "",
				number: 0,
				DTeam: 0,
				isAdd: true
			},
			rowActive: {
				KitNotes: {
					DesignDetail: "",
					DesignDesc: "",
					DesignWorker: ""
				}
			},
			checkIndeterminate: false,
			checkList: [],
			tableSelect: [],
			apiHeader: [ "SerialNo", "RestoredId", "MillingLength", "MillingWidth", "MillingDepth", "MillingFormula", "MillingArea", "IsPressing", "Notes", "TaskRealGroup", "KitNotes" ],
			options: {
				tenderGroup: {},
				guildMap: {},
				deviceType: {
					1: "道路",
					2: "熱再生",
					3: "設施",
					4: "標線"
				},
				filterType: {
					1: "契約",
					2: "通報單號",
					3: "地點(關鍵字)",
					4: "通報單號"
				},
				kitArr: []
			}
		};
	},
	computed: {
		detailPlus() {
			return [ ...this.detail, this.newItem ]
		},
	},
	watch: { },
	created() { 
		getTenderGroup().then(response => { this.options.tenderGroup = response.data.tenderGroup });
		getGuildMap().then(response => { this.options.guildMap = response.data.guildMap });
	},
	mounted() {
		this.showDetailDialog = false;
	},
	methods: {
		async handleCheckedChange(val) {
			this.tableSelect = val;
			if(this.tableSelect.length == this.list.length) this.tableSelect.forEach((_, index) => this.$set(this.checkList, index, true));
			if(this.tableSelect.length == 0) this.checkList = this.checkList.map(() => false);
		},
		cellCheckBox(row, index) {
			if(this.checkList[index]) this.$refs.caseTable.toggleRowSelection(row, true);
			else this.$refs.caseTable.toggleRowSelection(row, false);
		},
		toggleExpand(row) {
			this.getTaskDetail(row).then(() => { 
				this.$refs.caseTable.toggleRowExpansion(row);

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
		getList(showMsg = true) {
			this.loading = true;
			this.list = [];
			this.tableSelect = [];

			let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
			let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
			this.searchRange = startDate + " - " + endDate;

			getDispatch({
				filter: this.listQuery.filter,
				groupId: this.listQuery.filterType == 1 ? this.listQuery.groupId : null,
				reportSN: (this.listQuery.filterType == 2 && this.listQuery.filterStr) ? this.listQuery.filterStr : null,
				keywords: (this.listQuery.filterType == 3 && this.listQuery.filterStr) ? this.listQuery.filterStr : null,
				caseSN: (this.listQuery.filterType == 4 && this.listQuery.filterStr) ? this.listQuery.filterStr : null,
				deviceType: this.listQuery.deviceType,
				timeStart: startDate,
				timeEnd: moment(endDate).add(1, "d").format("YYYY-MM-DD")
			}).then(response => {
				if (response.data.list.length == 0) {
					if(showMsg) this.$message({
						message: "查無資料",
						type: "error",
					});
					this.total = 0;
				} else {
					this.list = response.data.list;
					this.checkList = Array.from({ length: this.list.length }, () => false);
					this.deviceTypeNow = this.listQuery.deviceType;
					this.filterNow = this.listQuery.filter;
					this.listQuery.contractor = null;
					if(this.deviceTypeNow == 3) {
						const guildFilter = Object.keys(this.options.guildMap).filter(key => this.options.guildMap[key] == '泓景');
						if(guildFilter.length > 0) this.listQuery.contractor = Number(guildFilter[0]);
					}

					this.list.forEach(l => {
						l.Contractor = this.options.guildMap[l.Contractor] || "-";
						l.DatePlan = this.formatTime(l.DatePlan);
						l.DatePlanBefore = this.formatTime(l.DatePlanBefore);
						l.DateDeadline = this.formatTime(l.DateDeadline);
						for (const col of ['MillingDepth', 'MillingLength', 'MillingWidth', 'MillingArea']) 
							if(Number(l[col])) l[col] = Math.round(l[col] * 1000) / 1000;
						// this.$set(l, "detailTime", false);
						this.$set(l, "editFormula", l.MillingFormula != '0');
						this.$set(l, "notesSync", true);
						this.$set(l, "edit", false);
					})
				}
				this.loading = false;
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
		calArea(row) {
			const replaceObj = { " ": "", "m": "", "M": "", "=": "", "＝": "", "＋": "+", "－": "-", "＊": "*", "x": "*", "X": "*", "×": "*", "／": "/", "（": "(", "）": ")",
				"０": '0', "１": "1", "２": "2", "３": "3", "４": "4", "５": "5", "６": "6", "７": "7", "８": "8", "９": "9" };
			// const regex = new RegExp('^[0-9*+\/().-]+$', 'g');
			const regex = /^[^*+/-](?:[*+/\-]?[(]*\d+\.?\d*[)]*)+$/g;
			
			if( (row.editFormula == undefined && row.MillingFormula && row.MillingFormula != '0' && row.MillingFormula.length != 0) || row.editFormula)  {
				for(const key in replaceObj) row.MillingFormula = row.MillingFormula.replaceAll(key, replaceObj[key]);
				row.MillingArea = regex.test(row.MillingFormula) ? Math.round(new Function(`return ${row.MillingFormula}`)() * 100) / 100 : 0;
			} else row.MillingArea = Math.round(row.MillingLength * row.MillingWidth * 100) / 100;
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
		beforeEdit(row) {
			for(const row of this.list) this.$refs.caseTable.toggleRowExpansion(row, false);
			this.loading = true;

			this.getTaskDetail(row).then(() => { 
				this.rowActive = JSON.parse(JSON.stringify(row)); 
				this.detail = this.rowActive.Content;
				this.detail.forEach(row => {
					this.$set(row, "isAdd", false);
					this.$set(row, "isEdit", false);
				});
				Object.assign(this.newItem, { UnitSN: "", TaskName: "", TaskUnit: "", TaskPrice: "", number: 0, DTeam: this.rowActive.DTeam, isAdd: true });	

				getTaskGroup({
					groupId: this.rowActive.GroupId,
					pageCurrent: 1,
					pageSize: 999999
				}).then(response => {
					this.options.kitArr = response.data.list;
					this.loading = false;
					this.showEdit = true;
				}).catch(err => this.loading = false);
			}).catch(err => this.loading = false);
		},
		cleanDetail() {
			this.detail = [];
			this.rowActive = {
				KitNotes: {
					DesignDetail: "",
					DesignDesc: "",
					DesignWorker: ""
				}
			};
			this.showEdit = false;
		},
		importKit() {
			this.loading = true;
			getTaskGroupDetail({
				groupSN: this.listQuery.groupSN,
			}).then(response => {
				const itemArr = response.data.list;
				itemArr.forEach(itemAdd => {
					const detailFilter = this.detail.filter(itemNow => itemNow.UnitSN == itemAdd.UnitSN);
					if( detailFilter.length == 0) this.detail.push(itemAdd);
					else detailFilter[0].number += itemAdd.number;
				});
				this.detail.forEach(l => { this.$set(l, "isEdit", false); });

				const isReplaceNote = (Object.values(this.rowActive.KitNotes).filter(val => val && val.length != 0)).length == 0;
				if(isReplaceNote) this.rowActive.KitNotes = this.options.kitArr.filter(kit => (kit.SerialNo == this.listQuery.groupSN)).map(kit => ({ DesignDetail: kit.DesignDetail, DesignDesc: kit.DesignDesc, DesignWorker: kit.DesignWorker }))[0];

				this.loading = false;
			}).catch(err => this.loading = false);
		},
		async getKitItem(row) {
			return new Promise(resolve => {
				this.loading = true;
				const rowActive = row.SerialNo != undefined ? row : this.newItem;
				Object.assign(rowActive, { TaskName: "", TaskUnit: "", TaskPrice: "" });

				getKitItemMap({
					tenderId: String(this.rowActive.DTeam),
					UnitSN: rowActive.UnitSN
				}).then((response) => {
					if (response.data.item == undefined) {
						this.$message({
							type: "error",
							message: "查無項次資料"
						});
					} else {
						Object.assign(rowActive, response.data.item);
					}
					this.loading = false;
					resolve();
				}).catch(err => { this.loading = false; resolve(); });
			})
		},
		async addKitItem() {
			if(!this.newItem.UnitSN) {
				this.$message({
					message: "請填入正確項次",
					type: "error",
				});

				return;
			}

			await this.getKitItem(this.newItem);

			if(!this.newItem.TaskName || !this.newItem.TaskUnit || !this.newItem.TaskPrice || this.newItem.number == 0) {
				const itemText = this.newItem.number == 0 ? "數量" : "項次";
				this.$message({
					message: `請填入正確${itemText}`,
					type: "error",
				});
			} else {
				this.newItem.isAdd = false;
				this.detail.push({...this.newItem, isEdit: false});

				Object.assign(this.newItem, { UnitSN: "", TaskName: "", TaskUnit: "", TaskPrice: "", number: 0, DTeam: this.rowActive.DTeam, isAdd: true });
			}
		},
		delKitItem(index) {
			this.detail.splice(index, 1);
		},
		dispatchSpec(row = this.rowActive, editContent = true) {
			this.$confirm(`確認 案件編號${row.CaseNo} 資料登錄?`, "確認", { showClose: false } )
				.then(() => {
					this.loading = true;
					row.edit = false;
					this.showEdit = false;
					
					if(!row.editFormula) row.MillingFormula = '0';
					let caseSpec = JSON.parse(JSON.stringify(this.caseFilterList([row])[0]));
					if([1,2].includes(this.deviceTypeNow)) {
						this.calArea(caseSpec);
						
						if(caseSpec.MillingFormula && caseSpec.MillingFormula != '0' && caseSpec.MillingFormula.length != 0) {
							delete caseSpec.MillingLength;
							delete caseSpec.MillingWidth;
						} else delete caseSpec.MillingFormula;

						delete caseSpec.KitNotes;
					} else if([3,4].includes(this.deviceTypeNow)) {
						this.detail.forEach(row => {
							row.number == Number(row.number);
							for(const key of [ "SerialNo", "isAdd", "isEdit" ]) delete row[key];
						});

						if(this.deviceTypeNow == 3) {
							if(this.detail.length > 0) caseSpec.KitContent = this.detail;
							caseSpec.KitNotes = JSON.stringify(caseSpec.KitNotes);
							if(row.notesSync) caseSpec.Notes = row.KitNotes.DesignDesc;
						} else if(this.deviceTypeNow == 4) caseSpec.Content = JSON.stringify(editContent ? this.detail : row.Content);
					}
					
					setDispatchSpec({
						deviceType: this.listQuery.deviceType,
						caseSpec
					}).then(response => {
						if ( response.statusCode == 20000 ) {
							this.$message({
								message: "登錄成功",
								type: "success",
							});

							this.getList();
						} 
					}).catch(err => {
						console.log(err);
						this.getList();
					})
				}).catch(err => {});
		},
		dispatch() {
			let confirmText = `確認分派 案件編號${ this.tableSelect.map(caseSpec => caseSpec.CaseNo).join("、") } `;
			if(this.deviceTypeNow != 3) confirmText += `給 ${ this.options.guildMap[this.listQuery.contractor] } `;
			confirmText += `?`;

			this.$confirm(confirmText, "確認", { showClose: false })
				.then(() => {
					const tableSelectFilter = this.tableSelect.filter(caseSpec => caseSpec.TaskRealGroup == 0);
					const condition = this.deviceTypeNow == 3 && tableSelectFilter.length != 0;
					if(condition) {
						this.$message({
							type: "error",
							message: `案件編號${ tableSelectFilter.map(caseSpec => caseSpec.CaseNo).join("、") } 未填入「設計數量」`
						});
					} else {
						this.loading = true;
						let caseList = JSON.parse(JSON.stringify(this.caseFilterList(this.tableSelect)));
						caseList.forEach(row => { 
							if([1,2].includes(this.deviceTypeNow)) {
								this.calArea(row); 

								if(row.MillingFormula && row.MillingFormula != '0' && row.MillingFormula.length != 0) {
									delete row.MillingLength;
									delete row.MillingWidth;
								} else delete row.MillingFormula;

								delete row.KitNotes;
							} else if(this.deviceTypeNow == 3) row.KitNotes = JSON.stringify(row.KitNotes);
						});

						setDispatch({
							contractor: this.listQuery.contractor,
							deviceType: this.listQuery.deviceType,
							caseList
						}).then(response => {
							if ( response.statusCode == 20000 ) {
								this.$message({
									message: "分派成功",
									type: "success",
								});
								this.getList(false);
							} 
						}).catch(err => {
							console.log(err);
							this.$message({
								message: "分派失敗",
								type: "error",
							});
							this.getList(false);
						})
					}
				}).catch(err => {});
		},
		showDetail(row) {
			this.loading = true;
			this.$refs.caseDetail.getDetail(row);
		},
		formatTime(time) {
			return moment(time).isValid() ? moment(time).format("YYYY/MM/DD") : "" ;
		}
	},
};
</script>

<style lang="sass">
*
	// border: 1px solid #000
	// box-sizing: border-box
.case-plan
	.filter-container
		.filter-item
			margin-right: 5px
			.el-select
				width: 110px
				.el-input__inner
					padding-left: 3px
					padding-right: 10px
					text-align: center
				.el-input__suffix
					right: 0
					// margin-right: -5px
					transform: scale(0.7)
				&.tender-select
					width: 330px
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
	.el-table
		.el-input__inner
			padding: 0 5px
		.btn-tag
			cursor: pointer
		.el-table__expand-icon
			display: none
	.detail-caption
		width: 100%
		height: 30px
		font-size: 16px
		font-weight: bold
		text-align: center
		line-height: 30px
		&.title
			padding-bottom: 40px
			border-bottom: 1px solid #DFE6EC
		&.amount
			// border: 1px solid #DFE6EC
			background-color: #DFE6EC
			margin: 10px 0 30px 0
	.expand-note 
		padding: 10px 0 0 10px
		& > *
			font-size: 14px
			margin: 5px 0
	.btn-dialog
		padding: 5px 5px
</style>