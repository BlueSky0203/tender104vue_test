<template>
	<div class="app-container case-apply" v-loading="loading">
		<h2>製作通報單</h2>
		<div class="filter-container">
			<div class="filter-item">
				<div class="el-input el-input el-input-group el-input-group--prepend">
					<div class="el-input-group__prepend">
						<span>契約</span>
					</div>
					<el-select v-model.number="listQuery.groupId" class="tender-select" placeholder="請選擇" popper-class="type-select tender" clearable @clear="listQuery.groupId = null">
						<el-option v-for="(obj, id) in options.tenderGroup" :key="id" :value="Number(id)" :label="obj.groupName" />
					</el-select>
				</div>
			</div>
			<div class="filter-item">
				<el-input v-model="listQuery.filterStr" placeholder="請輸入" style="width: 300px">
					<el-select slot="prepend" v-model="listQuery.filterType" popper-class="type-select">
						<el-option v-for="(name, type) in options.filterType" :key="type" :label="name" :value="Number(type)" />
					</el-select>
				</el-input>
			</div>
			<br>

			<span v-if="filterTypeNow != 2" class="filter-item">
				<div style="font-size: 12px; color: #909399">成案日期</div>
				<time-picker shortcutType="day" :timeTabId.sync="timeTabId" :dateRange.sync="dateRange" @search="getList" />
			</span>

			<el-button class="filter-item" type="primary" icon="el-icon-search"
				@click="listQuery.pageCurrent = 1; getList();">搜尋</el-button>
			<el-button v-if="filterTypeNow == 2" class="filter-item" type="success" icon="el-icon-download"
				:disabled="(filterTypeNow == 2 && !listQuery.filterStr) || list.length == 0"
				@click="reissueApplyTicket();">補印</el-button>

			<template v-if="filterTypeNow != 2">
				<el-divider />

				<div class="filter-item">
					<div class="el-input el-input--medium el-input-group el-input-group--prepend">
						<div class="el-input-group__prepend">
							<span>類型</span>
						</div>
						<el-select v-model.number="listQuery.deviceType" placeholder="請選擇" popper-class="type-select"
							style="width: 100px">
							<el-option v-for="(name, id) in options.deviceType" :key="id" :value="Number(id)" :label="name" />
						</el-select>
					</div>
				</div>

				<span class="filter-item">
					<el-input v-model="listQuery.caseSN">
						<span slot="prepend">通報單號</span>
					</el-input>
				</span>
				<el-tooltip class="filter-item" effect="dark" content="請選擇案件" placement="bottom"
					:disabled="tableSelect.length != 0">
					<el-button type="success" :disabled="tableSelect.length == 0" @click="createApply">建立</el-button>
				</el-tooltip>
			</template>
		</div>

		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}</h5>

		<el-table ref="caseTable" empty-text="目前沒有資料" :data="list" :key="`${deviceTypeNow}_${filterTypeNow}`" border
			fit highlight-current-row :header-cell-style="{ 'background-color': '#F2F6FC' }" stripe style="width: 100%"
			@selection-change="handleCheckedChange">
			<el-table-column v-if="filterTypeNow != 2" type="selection" width="60" align="center" fixed>
				<template slot-scope="{ row, $index }">
					<el-checkbox v-model="checkList[$index]" style="margin-right: 5px"
						@change="cellCheckBox(row, $index)" />
					<span>{{ $index + 1 }}</span>
				</template>
			</el-table-column>
			<el-table-column v-else-if="filterTypeNow == 2" prop="CaseSN" label="通報單號" width="125" align="center" fixed
				sortable />
			<el-table-column prop="CaseNo" label="案件編號" width="130" align="center" fixed sortable>
				<template slot-scope="{ row }">
					<span>{{ row.CaseNo }}</span>
					<br>
					<span style="color: #909399; font-size: 12px">{{ row.DName }} ({{ row.casetype }})</span>
				</template>
			</el-table-column>

			<el-table-column v-for="(value, key) in headers" :key="key" :prop="key" :label="value.name" :min-width="value.width" align="center"
				:formatter="formatter" :sortable="value.sortable" />

			<!-- 道路、熱再生 -->
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="算式" width="320" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.edit">
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
			<el-table-column v-if="[1,2].includes(deviceTypeNow)" label="預估面積" width="60" align="center">
				<template slot-scope="{ row }">
					<span>{{ row.MillingArea || "-" }}</span>
				</template>
			</el-table-column>

			<!-- 道路 -->
			<el-table-column v-if="filterTypeNow == 2 && deviceTypeNow == 1" label="刨鋪深度" width="80" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.edit">
						<el-select v-model="row.MillingDepth" size="mini" popper-class="type-select" @change="row[row.type] = row.MillingDepth">
							<el-option v-for="value in options.depthArr" :key="value" :label="value" :value="value"/>
						</el-select>
					</span>
					<span v-else>{{ row.MillingDepth }}</span>
				</template>
			</el-table-column>
			<el-table-column v-if="filterTypeNow == 2 && deviceTypeNow == 1" label="使用粒料" width="120" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.edit">
						<el-row :gutter="5">
							<el-select v-model="row.type" size="mini" popper-class="type-select" @change="row[row.type] = row.MillingDepth">
								<el-option label="粒料3/4" value="Aggregate34" />
								<el-option label="粒料3/8" value="Aggregate38" />
							</el-select>
						</el-row>
					</span>
					<span v-else>
						<el-row>
							<span v-if="row.Aggregate34 > 0">
								<el-col :span="16">粒料3/4: </el-col>
								<el-col :span="8" class="item-content">{{ row.Aggregate34 }}</el-col>
							</span>
							<span v-else-if="row.Aggregate38 > 0">
								<el-col :span="16">粒料3/8: </el-col>
								<el-col :span="8" class="item-content">{{ row.Aggregate38 }}</el-col>
							</span>
							<span v-else> - </span>
						</el-row>
					</span>
				</template>
			</el-table-column>

			<!-- 設施 -->
			<el-table-column v-if="deviceTypeNow == 3" label="工程概述" align="center">
				<template slot-scope="{ row }">
					<el-input v-if="row.edit" v-model="row.Notes" />
					<span v-else>{{ row.Notes || " - " }}</span>
				</template>
			</el-table-column>

			<!-- 標線 -->
			<el-table-column v-if="deviceTypeNow == 4" label="面積" width="80" align="center">
				<template slot-scope="{ row }">
					<span>{{ row.MillingArea || "-" }}</span>
				</template>
			</el-table-column>

			<!-- 設施 -->
			<el-table-column v-if="deviceTypeNow == 3" label="設計數量" width="140" align="center">
				<template slot-scope="{ row }">
					<el-button-group v-if="!row.edit">
						<el-button v-if="row.State == 1 && row.FlowState == 1" :type="row.TaskRealGroup == 0 ? 'success' : 'info'" :plain="row.TaskRealGroup != 0" size="mini" @click="beforeEdit(row)">設計</el-button>
						<el-button size="mini" @click="toggleExpand(row)">詳情</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<!-- 標線 -->
			<el-table-column v-if="filterTypeNow == 2" label="標線設計" width="140" align="center">
				<template slot-scope="{ row }">
					<el-button-group v-if="!row.edit">
						<el-button v-if="row.State == 1 && row.FlowState == 1" :type="row.Content[4].length == 0 ? 'success' : 'info'" :plain="row.Content[4].length != 0" size="mini" @click="beforeEdit(row, 4)">設計</el-button>
						<el-button size="mini" @click="toggleExpand(row, 4)">詳情</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column label="狀態" width="100" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.State & 16">已完工</span>
					<span v-else-if="row.State & 8">送出派工單</span>
					<span v-else-if="row.State & 4">已分派</span>
					<span v-else-if="row.State & 2">待分派</span>
					<span v-else-if="row.State == 1">
						<span v-if="row.FlowState & 8">施工前會勘</span>
						<span v-else-if="row.FlowState & 4 || row.FlowState & 64">分隊審核</span>
						<span v-else-if="row.FlowState & 2 || row.FlowState & 32">機關審核</span>
						<span v-else-if="row.CaseSN != 0">製作通報單</span>
						<span v-else-if="row.FlowState & 1">主任審核</span>
						<span v-else>上傳至新工</span>
					</span>
					<span v-else-if="row.State == 0">已成案</span>
					<span v-else>{{ row.State }}</span>
				</template>
			</el-table-column>

			<el-table-column label="動作" width="140" align="center">
				<template slot-scope="{ row }">
					<el-button-group v-if="!row.edit">
						<el-button v-if="deviceTypeNow != 4 && row.State == 1 && row.FlowState == 1" type="primary" size="mini"
							@click="row.edit = true">編輯</el-button>
						<el-button type="info" size="mini" @click="showDetail(row)">檢視</el-button>
					</el-button-group>
					<el-button-group v-else>
						<el-button type="primary" size="mini" @click="applySpec(row, false)">確定</el-button>
						<el-button size="mini" @click="row.edit = false; getList();">取消</el-button>
					</el-button-group>
				</template>
			</el-table-column>

			<el-table-column type="expand" width="1" align="center" style="display: none">
				<template slot-scope="{ row }">
					<span v-if="row.Content[deviceSubType].length == 0">目前沒有資料</span>
					<span v-else>
						<el-table class="expandTable" :key="deviceSubType"  empty-text="目前沒有資料" :data="row.Content[deviceSubType]" border fit highlight-current-row
							:header-cell-style="{ 'background-color': '#F2F6FC' }" stripe show-summary
							:summary-method="(param) => getSummaries(param, row.Content[deviceSubType])" style="width: 100%">
							<el-table-column type="index" label="序號" width="50" align="center" />
							<el-table-column v-for="(value, key) in detailHeaders[deviceSubType]" :key="key" :prop="key"
								:min-width="['TaskName'].includes(key) ? 100 : ['UnitSN', 'TaskUnit', 'TaskPrice'].includes(key) ? 18 : 30"
								:label="value.name" align="center" :sortable="value.sortable">
								<template slot-scope="{ row: rowSpec, column: colSpec }">
									<span v-if="['ItemPaint', 'ItemType'].includes(colSpec.property)">{{ options[`${colSpec.property}Map`][rowSpec[colSpec.property]].name }}</span>
									<span v-else>{{ rowSpec[colSpec.property] }}</span>
								</template>
							</el-table-column>
						</el-table>
						<div v-if="deviceSubType == 3" class="expand-note">
							<div>施作數量: {{ row.KitNotes.DesignDetail || "-" }}</div>
							<div>施工方式: {{ row.KitNotes.DesignDesc || "-"}}</div>
							<div>施作人力: {{ row.KitNotes.DesignWorker || "-" }}</div>
						</div>
					</span>
				</template>
			</el-table-column>
		</el-table>

		<pagination :total="total" :pageCurrent.sync="listQuery.pageCurrent" :pageSize.sync="listQuery.pageSize"
			@pagination="getList" />

		<!-- Dialog: 計價套組-->
		<el-dialog v-loading="loading" width="900px" title="設計數量" :visible.sync="showEdit" :close-on-click-modal="false" :close-on-press-escape="false" :before-close="() => cleanDetail()">
			<div v-if="deviceSubType == 3" class="filter-container">
				<el-select class="filter-item" v-model.number="listQuery.groupSN" filterable placeholder="請選擇"
					popper-class="type-select" style="width: 500px">
					<el-option v-for="kit in options.kitArr" :key="kit.SerialNo" :value="Number(kit.SerialNo)"
						:label="kit.GroupName" />
				</el-select>
				<el-button class="filter-item" type="success" size="mini" @click="importKit()">匯入套組</el-button>
			</div>
			<el-table v-loading="loading" :key="deviceSubType" empty-text="目前沒有資料" :data="detailPlus[deviceSubType]" border fit highlight-current-row
				:header-cell-style="{ 'background-color': '#F2F6FC' }" stripe style="width: 100%">
				<el-table-column v-for="(value, key) in detailHeaders[deviceSubType]" :key="key" :prop="key"
					:min-width="['TaskName'].includes(key) ? 100 : ['UnitSN', 'TaskUnit', 'TaskPrice'].includes(key) ? 20 : 30"
					:label="value.name" align="center" :sortable="value.sortable">
					<template slot-scope="{ row, column }">
						<span v-if="deviceSubType == 3">
							<span v-if="['number'].includes(column.property)" style="display: inline-flex; align-items: center;">
								<span v-if="row.isAdd || row.isEdit">
									<el-input v-model="row[column.property]" size="mini" style="width: 55px" />
									<el-button v-if="row.isEdit" class="btn-dialog" type="info" size="mini"
										@click="row.isEdit = false;">取消</el-button>
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
										<el-tooltip v-if="column.property == 'UnitSN' && row[column.property].length != 0" slot="suffix"
											effect="dark" placement="bottom" content="點選代入">
											<el-button type="text" style="padding: 5px 0" @click="getKitItem(row)">
												<i class="el-icon-check" style="color: #67C23A" />
											</el-button>
										</el-tooltip>
									</el-input>
								</span>
							</span>
							<span v-else>{{ row[column.property] }}</span>
						</span>
						<span v-else-if="deviceSubType == 4">
							<span v-if="['MillingFormula','number'].includes(column.property)" style="display: inline-flex; align-items: center;">
								<span v-if="row.isAdd || row.isEdit">
									<el-input v-model="row[column.property]" size="mini" @change="calArea(row)">
										<el-button slot="append" v-if="row.isEdit" class="btn-dialog" type="info" size="mini" @click="row.isEdit = false;">取消</el-button>
									</el-input>
								</span>
								<span v-else>
									<span>{{ row[column.property] }}</span>
									<el-button type="text" style="margin-left: 10px" size="mini" @click="row.isEdit = true">
										<i class="el-icon-edit" />
									</el-button>
								</span>
							</span>
							<span v-else-if="['ItemPaint', 'ItemType'].includes(column.property)">
								<span v-if="row.isAdd">
									<el-select v-model.number="row[column.property]" placeholder="請選擇" size="mini" popper-class="type-select" style="width: 120px">
										<el-option v-for="(val, id) in options[`${column.property}Map`]" :key="id" :value="Number(id)" :label="val.name" />
									</el-select>
								</span>
								<span v-else>{{ options[`${column.property}Map`][row[column.property]].name }}</span>
							</span>
							<span v-else>{{ row[column.property] }}</span>
						</span>
					</template>
				</el-table-column>
				<el-table-column label="動作" align="center" :min-width="30">
					<template slot-scope="{ row, $index }">
						<span v-if="row.isAdd">
							<el-button type="success" size="mini" @click="addItem">新增</el-button>
						</span>
						<span v-else-if="row.isEdit">
							<el-button type="primary" size="mini" @click="row.isEdit = false;">確定</el-button>
						</span>
						<span v-else>
							<el-button type="danger" size="mini" @click="delItem($index)">刪除</el-button>
						</span>
					</template>
				</el-table-column>
			</el-table>
			<div class="detail-caption amount">金額合計: ${{ detailAmount(detailPlus[deviceSubType]).toLocaleString() }}</div>
			<div v-if="deviceSubType == 3">
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
				<el-button type="primary" @click="applySpec()">確定</el-button>
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

		<apply-ticket-pdf ref="applyTicketPdf" style="display: none" :loading.sync="loading"
			:tableSelect.sync="tableSelect" />
	</div>
</template>

<script>
import moment from "moment";
import { getTenderGroup, getKitItemMap, getSCTypeItemMap } from "@/api/type";
import { getApplyInform, confirmInform, setDispatchSpec, getTaskGroup, getTaskGroupDetail, getTaskReal } from "@/api/dispatch";
import TimePicker from "@/components/TimePicker";
import Pagination from "@/components/Pagination";
import CaseDetail from "@/components/CaseDetail";
import ApplyTicketPdf from "@/components/ApplyTicketPdf";

export default {
	name: "caseApply",
	components: { TimePicker, Pagination, CaseDetail, ApplyTicketPdf },
	data() {
		return {
			loading: false,
			showImgViewer: false,
			showDetailDialog: true,
			showEdit: false,
			map: {},
			imgUrls: "",
			timeTabId: 1,
			screenWidth: window.innerWidth,
			dateRange: [
				moment().subtract(1, 'd').startOf("day").toDate(),
				moment().subtract(1, 'd').endOf("day").toDate(),
			],
			searchRange: "",
			filterTypeNow: 1,
			deviceTypeNow: 1,
			deviceSubType: 4,
			listQuery: {
				filter: false,
				filterType: 1,
				filterStr: null,
				groupId: null,
				deviceType: 1,
				caseSN: null,
				pageCurrent: 1,
				pageSize: 50,
			},
			headers: {
				Place: {
					name: "案件地點",
					sortable: false,
					width: 60
				},
				DateDeadline: {
					name: "預計完工日期",
					sortable: false,
					width: 40
				}
			},
			detailHeaders: {
				3: {
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
				4: {
					ItemPaint: {
						name: "顏料",
						sortable: false
					},
					ItemType: {
						name: "維修項目",
						sortable: false
					},
					MillingFormula: {
						name: "公式",
						sortable: false
					},
					number: {
						name: "數量",
						sortable: false
					},
					MillingArea: {
						name: "面積",
						sortable: false
					}
				}
			},
			total: 0,
			list: [],
			detail: {
				3: [],
				4: []
			},
			newKit: {
				GroupName: ""
			},
			rowActive: {
				Content: { 
					3: [],
					4: []
				},
				KitNotes: {
					DesignDetail: "",
					DesignDesc: "",
					DesignWorker: ""
				}
			},
			newItem: {
				3: {
					UnitSN: "",
					TaskName: "",
					TaskUnit: "",
					TaskPrice: "",
					number: 0,
					isAdd: true
				},
				4: {
					ItemPaint: 1,
					ItemType: 1,
					MillingFormula: "",
					number: 0,
					MillingArea: 0,
					editFormula: true,
					isAdd: true
				}
			},
			checkIndeterminate: false,
			checkList: [],
			tableSelect:[],
			apiHeader: [ "SerialNo", "MillingLength", "MillingWidth", "MillingDepth", "MillingFormula", "MillingArea", "IsPressing", "Notes", "TaskRealGroup", "KitNotes" ],
			options: {
				tenderGroup: {},
				filterType: {
					1: "案件編號",
					2: "通報單號"
				},
				deviceType: {
					1: "道路",
					2: "熱再生",
					3: "設施",
					4: "標線"
				},
				levelMap: {
					0: "全部",
					1: "輕",
					2: "中",
					3: "重"
				},
				depthArr: [0, 5, 10],
				ItemPaintMap: {
					1: { name: "熱塑性塑膠" },
					2: { name: "油漆" }
				},
				ItemTypeMap: { },
				kitArr: []
			}
		};
	},
	computed: {
		detailPlus() {
			return {
				3: [ ...this.detail[3], this.newItem[3]  ],
				4: [ ...this.detail[4], this.newItem[4]  ]
			}
		},
	},
	watch: {},
	created() {
		getTenderGroup().then(response => { this.options.tenderGroup = response.data.tenderGroup });
		getSCTypeItemMap().then(response => { this.options.ItemTypeMap = response.data.SCType2Map });

		if (this.$route.params.caseSN) {
			this.listQuery.groupId = Number(this.$route.params.groupId);
			this.listQuery.filterType = 2;
			this.deviceTypeNow = this.$route.params.informType;
			this.listQuery.filterStr = this.$route.params.caseSN;
			this.getList();
		}
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
		toggleExpand(row, deviceSubType = this.deviceTypeNow) {
			this.deviceSubType = deviceSubType;
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
			return content.reduce((acc, cur) => (acc+=cur.number*(Number(cur.TaskPrice) || 0)), 0)
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
			if (!this.listQuery.groupId) {
				this.$message({
					message: '請選擇契約',
					type: "error",
				});
			} else {
				this.loading = true;
				this.list = [];
				this.tableSelect = [];
				this.searchRange = '';

				let startDate = moment(this.dateRange[0]).format("YYYY-MM-DD");
				let endDate = moment(this.dateRange[1]).format("YYYY-MM-DD");
				if(this.listQuery.filterType != 2) this.searchRange = startDate + " - " + endDate;

				getApplyInform({
					groupId: this.listQuery.groupId,
					caseNo: (this.listQuery.filterType == 1 && this.listQuery.filterStr) ? this.listQuery.filterStr : null,
					caseSN: (this.listQuery.filterType == 2 && this.listQuery.filterStr) ? this.listQuery.filterStr : null,
					timeStart: (this.listQuery.filterType == 2 && this.listQuery.filterStr) ? '' : startDate,
					timeEnd: (this.listQuery.filterType == 2 && this.listQuery.filterStr) ? '' :  moment(endDate).add(1, "d").format("YYYY-MM-DD"),
					pageCurrent: this.listQuery.pageCurrent,
					pageSize: this.listQuery.pageSize
				}).then(response => {
					if (response.data.list.length == 0) {
						if(showMsg) this.$message({
							message: "查無資料",
							type: "error",
						});
						this.total = 0;
					} else {
						this.list = response.data.list;
						this.total = response.data.total;
						this.checkList = Array.from({ length: this.list.length }, () => false);
						this.filterTypeNow = this.listQuery.filterType;
						this.deviceTypeNow = response.data.informType;

						this.list.forEach(l => {
							l.DateCreate = this.formatDate(l.DateCreate);
							l.DateDeadline = this.formatDate(l.DateDeadline);
							for (const col of ['MillingDepth', 'MillingLength', 'MillingWidth', 'MillingArea']) 
								if(Number(l[col])) l[col] = Math.round(l[col] * 1000) / 1000;
							this.$set(l, "Content", { 3: [], 4: l.Content }) 
							this.$set(l, "type", l.Aggregate34 > 0 ? 'Aggregate34' : 'Aggregate38');
							this.$set(l, "editFormula", l.MillingFormula != '0');
							this.$set(l, "notesSync", true);
							this.$set(l, "edit", false);
						})
					}
					this.loading = false;
				}).catch(err => this.loading = false);	
			}
		},
		getTaskDetail(row) {
			return new Promise(resolve => {
				row.Content[3] = [];

				if(this.deviceSubType == 3) {
					getTaskReal({ taskRealGroup: row.TaskRealGroup }).then(response => {
						row.Content[3] = response.data.list.filter(l => l.GroupId == row.TaskRealGroup);
						resolve();
					}).catch(err => this.loading = false);
				} else resolve();
			})
		},
		calArea(row) {
			const replaceObj = { " ": "", "m": "", "M": "", "=": "", "＝": "", "＋": "+", "－": "-", "＊": "*", "x": "*", "X": "*", "×": "*", "／": "/", "（": "(", "）": ")",
				"０": '0', "１": "1", "２": "2", "３": "3", "４": "4", "５": "5", "６": "6", "７": "7", "８": "8", "９": "9" };
			// const regex = new RegExp('^[0-9*+\/().-]+$', 'g');
			const regex = /^[^*+/-](?:[*+/-]?[(]*\d+\.?\d*[)]*)+$/g;
			const number = row.number != undefined ? Number(row.number) : 1;
			
			if( (row.editFormula == undefined && row.MillingFormula && row.MillingFormula != '0' && row.MillingFormula.length != 0) || row.editFormula)  {
				for(const key in replaceObj) row.MillingFormula = row.MillingFormula.replaceAll(key, replaceObj[key]);
				row.MillingArea = regex.test(row.MillingFormula) ? Math.round(new Function(`return ${row.MillingFormula} * ${number}`)() * 100) / 100 : 0;
			} else row.MillingArea = Math.round(row.MillingLength * row.MillingWidth * number * 100) / 100;
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
		beforeEdit(row, deviceSubType = this.deviceTypeNow) {
			this.deviceSubType = deviceSubType;
			for(const row of this.list) this.$refs.caseTable.toggleRowExpansion(row, false);
			this.loading = true;

			this.getTaskDetail(row).then(() => { 
				this.rowActive = JSON.parse(JSON.stringify(row)); 
				this.detail[this.deviceSubType] = this.rowActive.Content[this.deviceSubType];
				this.detail[this.deviceSubType].forEach(row => {
					this.$set(row, "isAdd", false);
					this.$set(row, "isEdit", false);
				});

				const newItemSample = {
					3: { UnitSN: "", TaskName: "", TaskUnit: "", TaskPrice: "", number: 0, isAdd: true },
					4: { ItemPaint: 1, ItemType: 1, MillingFormula: "", number: 0, MillingArea: 0, editFormula: true, isAdd: true } 
				}
				Object.assign(this.newItem, newItemSample);	

				getTaskGroup({
					groupId: this.listQuery.groupId,
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
			this.detail = {
				3: [],
				4: []
			};
			this.rowActive = {
				Content: {
					3: [],
					4: []
				},
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
					const detailFilter = this.detail[this.deviceSubType].filter(itemNow => itemNow.UnitSN == itemAdd.UnitSN);
					if( detailFilter.length == 0) this.detail[this.deviceSubType].push(itemAdd);
					else detailFilter[0].number += itemAdd.number;
				});
				this.detail[this.deviceSubType].forEach(l => { this.$set(l, "isEdit", false); });

				const isReplaceNote = (Object.values(this.rowActive.KitNotes).filter(val => val && val.length != 0)).length == 0;
				if(isReplaceNote) this.rowActive.KitNotes = this.options.kitArr.filter(kit => (kit.SerialNo == this.listQuery.groupSN)).map(kit => ({ DesignDetail: kit.DesignDetail, DesignDesc: kit.DesignDesc, DesignWorker: kit.DesignWorker }))[0];

				this.loading = false;
			}).catch(err => this.loading = false);
		},
		async getKitItem(row) {
			return new Promise(resolve => {
				this.loading = true;
				const rowActive = row.SerialNo != undefined ? row : this.newItem[this.deviceSubType];
				Object.assign(rowActive, { TaskName: "", TaskUnit: "", TaskPrice: "" });

				getKitItemMap({
					tenderId: String(this.rowActive.SurveyId),
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
		async addItem() {
			if(this.deviceSubType == 3) await this.addKitItem();
			else if(this.deviceSubType == 4) this.addMarkerItem();
		},
		async addKitItem() {
			const newItem = this.newItem[this.deviceSubType];
			if(!newItem.UnitSN) {
				this.$message({
					message: "請填入正確項次",
					type: "error",
				});

				return;
			}

			await this.getKitItem(newItem);

			if(!newItem.TaskName || !newItem.TaskUnit || !newItem.TaskPrice || newItem.number == 0) {
				const itemText = newItem.number == 0 ? "數量" : "項次";
				this.$message({
					message: `請填入正確${itemText}`,
					type: "error",
				});
			} else {
				this.newItem.isAdd = false;
				this.detail[this.deviceSubType].push({...newItem, isEdit: false});

				Object.assign(newItem, { UnitSN: "", TaskName: "", TaskUnit: "", TaskPrice: "", number: 0, DTeam: this.rowActive.DTeam, isAdd: true });
			}
		},
		async addMarkerItem() {
			const newItem = this.newItem[this.deviceSubType];
			if(!newItem.ItemPaint || !newItem.ItemType || newItem.MillingFormula.length == 0 || newItem.number == '0') {
				const itemText = newItem.MillingFormula.length == 0 ? "公式" : "數量";
				this.$message({
					message: `請填入正確${itemText}`,
					type: "error",
				});
			} else {
				newItem.isAdd = false;
				this.detail[this.deviceSubType].push({...newItem, isEdit: false});

				Object.assign(newItem, { ItemPaint: 1, ItemType: 1, MillingFormula: "", number: 1, MillingArea: 0, editFormula: true, isAdd: true });
			}
		},
		delItem(index) {
			this.detail[this.deviceSubType].splice(index, 1);
		},
		applySpec(row = this.rowActive, editContent = true) {
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

						if(this.deviceTypeNow == 1) {
							for(const key of [ "Aggregate34", "Aggregate38" ]) caseSpec[key] = row[key];
						}

					} else if(this.deviceTypeNow == 3) {
						if(this.detail[3].length > 0) caseSpec.KitContent = this.detail[3];
						caseSpec.KitNotes = JSON.stringify(caseSpec.KitNotes);
						if(row.notesSync) caseSpec.Notes = row.KitNotes.DesignDesc;
					} 

					for(let deviceType of [3, 4]) {
						this.detail[deviceType].forEach(row => {
							row.number = Number(row.number);
							for(const key of [ "SerialNo", "GroupId", "editFormula", "isAdd", "isEdit" ]) delete row[key];
						});
					}
					caseSpec.Content = JSON.stringify(editContent ? this.detail[4] : row.Content[4]);
					
					setDispatchSpec({
						deviceType: this.deviceTypeNow,
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
		createApply() {
			this.$confirm(`確認建立通報單？`, "確認", { showClose: false }).then(() => {
				confirmInform({
					deviceType: this.listQuery.deviceType,
					groupId: this.listQuery.groupId,
					caseSN: this.listQuery.caseSN || '',
					serialNoArr: this.tableSelect.map(l => l.SerialNo)
				}).then(response => {
					if ( response.statusCode == 20000 ) {
						const caseSN = response.data.caseSN;
						// getApplyInform({
						// 	caseSN: caseSN,
						// 	pageCurrent: 1,
						// 	pageSize: 999999
						// }).then(response => {
						// 	const list = response.data.list;
						// 	list.forEach(l => {
						// 		l.DateCreate = this.formatDate(l.DateCreate);
						// 		l.DateDeadline = this.formatDate(l.DateDeadline);
						// 		for (const col of ['MillingDepth', 'MillingLength', 'MillingWidth', 'MillingArea'])
						// 			if (Number(l[col])) l[col] = Math.round(l[col] * 1000) / 1000;
						// 	})

						// 	this.tableSelect.splice(0, this.tableSelect.length, ...list);
						// 	this.$refs.applyTicketPdf.imgPreload(this.tableSelect);
						// 	this.$refs.applyTicketPdf.createPdf(caseSN).then(() => {
						// 		this.$refs.applyTicketPdf.pdfDoc.save(`修復通報單_${caseSN}.pdf`);
						// 		// this.loading = false;
						// 		this.getList(false);
						// 	});

						// 	this.$message({
						// 		message: `建立成功(通報單號 ${caseSN})`,
						// 		type: "success",
						// 	});
						// }).catch(err => { console.log(err); this.loading = false; });
						this.$message({
							message: `建立成功(通報單號 ${caseSN})`,
							type: "success",
						});
						this.deviceTypeNow = this.listQuery.deviceType;
						this.listQuery.filterType = 2;
						this.listQuery.filterStr = caseSN;
						this.getList(false);
					} else {
						this.$message({
							message: "建立失敗",
							type: "error",
						});
						this.getList(false);
					}
				})
			}).catch(err => {
				console.log(err);
				this.$refs.applyTicketPdf.showApplyTicket = false;
				this.loading = false;
			});
		},
		reissueApplyTicket() {
			this.loading = true;
			this.tableSelect.splice(0, this.tableSelect.length, ...this.list);
			this.$refs.applyTicketPdf.imgPreload(this.tableSelect);
			this.$refs.applyTicketPdf.createPdf(this.listQuery.filterStr, "通報", this.options.tenderGroup[this.listQuery.groupId].groupName).then(() => { 
				this.$refs.applyTicketPdf.pdfDoc.save(`修復通報單_${this.listQuery.filterStr}.pdf`);
				this.loading = false;
			});
		},
		showDetail(row) {
			this.loading = true;
			this.$refs.caseDetail.getDetail(row);
		},
		formatter(row, column) {
			if (column.property.indexOf("id") == -1 && column.property.indexOf("Id") == -1 && Number(row[column.property])) return row[column.property].toLocaleString();
			else return row[column.property] || "-";
		},
		formatDate(time) {
			return moment(time).isValid() ? moment(time).format("YYYY-MM-DD") : "-";
		}
	},
};
</script>

<style lang="sass">
// *
// 	border: 1px solid #000
// 	box-sizing: border-box
.imgHover
	max-width: 800px
	// height: 400px
.case-apply
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
					margin-right: -3px
					transform: scale(0.7)
				&.tender-select
					width: 330px
					.el-input__inner
						padding-left: 10px
						text-align: left
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
	.btn-action
		margin-left: 5px
		padding: 5px
	.img-preview
		width: 100%
		.el-image-viewer__mask
			opacity: 0.7
		.el-icon-circle-close
			color:  #FFF
	.dialog-filter 
		.el-dialog
			width: 450px
			overflow: hidden
		.el-dialog__header
			background-color: #EBEEF5
		.el-dialog__body
			height: 80%
			padding: 10px
			margin: 0px 10px
			.el-row
				display: flex
				flex-wrap: wrap
				.el-col
					padding: 10px 0px
					position: relative
					&::before
						display: block
						content: ''
						position: absolute
						border: 1px solid #eee
						height: 100%
						width: 100%
					&.check-all-col::before
						box-shadow: 0px 0px 2px #409EFF
					.el-checkbox
						width: 100%
						padding-left: 20px
					.check-all-btn
						padding-left: 10px
						margin-bottom: 5px
						background-color: #F2F6FC
						border: none
						border-radius: 0px
						box-shadow: inset 0px 0px 1px #C0C4CC
						&.is-checked
							background-color: #409EFF
							span
								color: white
					.el-checkbox__input.is-indeterminate .el-checkbox__inner
						background-color: lighten(#409EFF, 15)
					.el-select
						width: 55px
						.el-input__inner
							padding: 0 13px 0 5px
							text-align: center
							background-color: transparent
						.el-input__suffix
							right: 0px
							margin-right: -3px
							transform: scale(0.7)
			.el-dialog__footer
				margin: 5px 0px
	.dialog-map
		min-height: 300px 
		.el-dialog__body
			height: 30%
</style>