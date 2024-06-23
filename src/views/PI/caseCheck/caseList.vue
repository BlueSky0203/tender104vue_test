<template>
	<div class="app-container PI-case-list" v-loading="loading">
		<h2>案件稽核(自巡)</h2>
		<div class="filter-container">
			<el-select class="filter-item" v-model="listQuery.zipCode" :disabled="Object.keys(districtList).length <= 1">
				<el-option v-for="(info, zip) in districtList" :key="zip" :label="info.name" :value="Number(zip)" />
			</el-select>
			<span class="filter-item time-picker">
				<div style="font-size: 12px; color: #909399">通報日期</div>
				<el-button-group v-if="!dateTimePickerVisible">
					<el-button
						v-for="(t, i) in pickerOptions.shortcuts"
						:key="i"
						type="primary"
						:plain="i != timeTabId"
						size="mini"
						@click="dateShortcuts(i)"
					>{{ t.text }}</el-button>
				</el-button-group>
				<el-date-picker
					v-else
					class="filter-item"
					v-model="searchDate"
					type="date"
					placeholder="日期"
					:picker-options="pickerOptions"
					:clearable="false"
					@change="timeTabId = -1"
				/>
				<el-button
					:type="dateTimePickerVisible ? 'info' : 'primary'"
					plain
					size="mini"
					@click="dateTimePickerVisible = !dateTimePickerVisible"
				>{{ dateTimePickerVisible ? '返回' : '進階' }}</el-button>
				<el-button class="filter-item" type="primary" icon="el-icon-search" @click="getList()">搜尋</el-button>
			</span>

			<el-popover
				placement="top"
				width="260"
				title="確定「輸出報表」？"
				v-model="showDlConfirm">
				<p>「輸出報表」後，<br/>{{ searchRange }}的案件列表將<span style="color: #F56C6C">無法修改</span>。</p>
				<div style="text-align: center; margin: 0">
					<el-button size="mini" type="text" @click="showDlConfirm = false">取消</el-button>
					<el-button type="primary" size="mini" @click="handleDownload">確定</el-button>
				</div>
				<el-button
					slot="reference"
					v-if="checkPermission(['PIcase.editor'])"
					class="filter-item"
					type="info"
					icon="el-icon-document"
					:disabled="isArchive || list.length == 0"
				>輸出報表</el-button>
			</el-popover>
		</div>
		
		<h5 v-if="list.length != 0">查詢期間：{{ searchRange }}
			<span v-if="isArchive" style="color: #F56C6C">(已封存)</span>
		</h5>

		<!-- 資訊列表 -->
		<el-row :gutter="40" class="panel-group">
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-form">
						<svg-icon icon-class="form" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">廠商通報數</div>
						<div class="card-panel-num">{{ list.length }}</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-people">
						<svg-icon icon-class="people" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">監造抽查 (15%)</div>
						<div class="card-panel-num"> 
							路面: {{ checkNum.SV.AC.check }} <span class="fail-num">({{ checkNum.SV.AC.fail }})</span> / {{ checkNum.SV.AC.total }} 
							<br>
							設施: {{ checkNum.SV.facility.check }} <span class="fail-num">({{ checkNum.SV.facility.fail }})</span> / {{ checkNum.SV.facility.total }}
						</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-domain">
						<svg-icon icon-class="domain" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">機關抽查 (5%)</div>
						<div class="card-panel-num">
							路面: {{ checkNum.Organ.AC.check }} <span class="fail-num">({{ checkNum.Organ.AC.fail }})</span> / {{ checkNum.Organ.AC.total }} 
							<br>
							設施: {{ checkNum.Organ.facility.check }} <span class="fail-num">({{ checkNum.Organ.facility.fail }})</span> / {{ checkNum.Organ.facility.total }}
						</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
				<div class="card-panel">
					<div class="card-panel-icon-wrapper icon-message-alert">
						<svg-icon icon-class="message-alert" class-name="card-panel-icon" />
					</div>
					<div class="card-panel-description">
						<div class="card-panel-text">不合格件數</div>
						<div class="card-panel-num">
							<span> {{ reasonTypeArr[1] }} <el-tooltip class="item" effect="dark" content="損壞情形說明與現況不符(PI1.2)" placement="bottom"><i class="icon-tooltip el-icon-warning" /></el-tooltip></span>	 / 
							<span> {{ reasonTypeArr[2] }} <el-tooltip class="item" effect="dark" content="損壞程度與現況不符(PI2.2)" placement="bottom"><i class="icon-tooltip el-icon-warning" /></el-tooltip></span>
						</div>
					</div>
				</div>
			</el-col>
		</el-row>
		<br>

		<!-- 抽查結果列表 -->
		<el-table
			empty-text="目前沒有資料"
			:data="resultList"
			border
			fit
			highlight-current-row
			:header-cell-style="{'background-color': '#F2F6FC'}"
			stripe
			style="width: 100%"
		>
			<el-table-column label="序號" type="index" width="100" align="center" />
			<el-table-column
				v-for="(value, key) in resultHeader"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="column.property == 'UploadCaseNo'"> <el-link :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank">{{ row[column.property] }}</el-link></span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="不合格原因(監造)" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.State & 32">{{ row.StateNotes.SV }}</span>
					<span v-else> - </span>
				</template>
			</el-table-column>
			<el-table-column label="不合格原因(機關)" align="center">
				<template slot-scope="{ row }">
					<span v-if="row.State & 64">{{ row.StateNotes.Organ }}</span>
					<span v-else> - </span>
				</template>
			</el-table-column>

			<!-- NOTE: 展示用，還未實作 -->
			<el-table-column label="操作" align="center">
				<template slot-scope="{ row }">
					<el-button class="btn-action" type="info" plain size="mini" round disabled @click="showMap(row)">地圖</el-button>
				</template>
			</el-table-column>
		</el-table>
		<br>

		<!-- 案件列表 -->
		<el-table
			empty-text="目前沒有資料"
			:data="list"
			border
			fit
			:header-cell-style="{'background-color': '#F2F6FC'}"
			style="width: 100%"
		>
			<el-table-column label="序號" type="index" width="45" align="center" />
			<!-- <el-table-column label="案件編號" prop="UploadCaseNo" align="center">
				<template slot-scope="{ row }">
					<template v-if="row.edit">
						<el-input
							v-model="row.UploadCaseNo"
							size="mini"
							style="width: 100px"
						/>
						<el-button type="text" @click="row.edit = false;">
							<i class="el-icon-success" />
						</el-button>
						<el-button type="text" @click="row.edit = false; getList()">
							<i class="el-icon-error" />
						</el-button>
					</template>
					<template v-else>
						<span>{{ row.UploadCaseNo || "-" }}</span>
						<el-link v-if="!row.UploadCaseNo" @click="row.edit = true" style="margin-left: 5px">
							<i class="el-icon-edit" />
						</el-link>
					</template>
				</template>
			</el-table-column> -->
			<el-table-column
				v-for="(value, key) in headers"
				:key="key"
				:prop="key"
				:label="value.name"
				align="center"
				:width="['organAssign'].includes(key) ? 70 : ['UploadCaseNo', 'CaseDate', 'DeviceType'].includes(key) ? 120 : null"
				:formatter="formatter"
				:sortable="value.sortable"
			>
				<template slot-scope="{ row, column }">
					<span v-if="column.property == 'UploadCaseNo'"> <el-link :href="`https://road.nco.taipei/RoadMis2/web/ViewDefectAllData.aspx?RDT_ID=${row[column.property]}`" target="_blank">{{ row[column.property] }}</el-link></span>
					<span v-else-if="!isArchive && checkPermission(['PIcase.editor']) && [ 'organAssign', 'BType', 'BrokeType', 'BrokeType', 'BrokeStatus', 'PCIValue' ].includes(column.property)">
						<span v-if="row.edit">
							<span v-if="[ 'organAssign' ].includes(column.property)">
								<el-checkbox v-model.number="row[column.property]" :true-label="1" :false-label="0" />
							</span>
							<el-select v-else-if="[ 'BType', 'BrokeType', 'BrokeType', 'BrokeStatus' ].includes(column.property)" class="edit-select" v-model.number="row[column.property == 'BrokeStatus' ? 'BrokeType' : column.property]" size="mini" popper-class="type-select">
								<el-option v-for="(name, type) in options[column.property]" :key="`${column.property}_${type}`" :label="name" :value="Number(type)" />
							</el-select>
							<el-input-number 
								v-else-if="[ 'PCIValue' ].includes(column.property)" 
								class="edit-number"
								v-model.number="row[column.property]"
								controls-position="right"
								size="mini"
								:precision="1"
								:step="0.1"
								:min="0"
								:max="100"
								style="width: 80px"
							/>
							<el-button type="text" @click="rowActive = row; setResult();">
								<i class="el-icon-success" />
							</el-button>
							<el-button type="text" @click="row.edit = false; getList()">
								<i class="el-icon-error" />
							</el-button>
						</span>
						<span v-else>
							<span>{{ formatter(row, column) }}</span>
							<el-link @click="row.edit = true" style="margin-left: 5px">
								<i class="el-icon-edit" />
							</el-link>
						</span>
					</span>
					<span v-else>{{ formatter(row, column) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="監造抽查" width="160px" align="center">
				<template slot-scope="{ row }">
					<template v-if="!isArchive && checkPermission(['PIcase.inspector']) && !(row.State & 2) && !(row.State & 32)">
						<el-button-group>
							<el-button v-for="(name, type) in options.resultType.SV" :key="type" :type="type == 2 ? 'success' : 'danger'" size="mini" @click="beforeSetResult(row, Number(type))">{{ name }}</el-button>
						</el-button-group>
					</template>
					<template v-else>
						<span v-if="(row.State & 2) || (row.State & 32)">
							<i v-if="row.State & 2" class="el-icon-check" style="color: #67C23A; font-weight: bold;" />
							<i v-else-if="row.State & 32" class="el-icon-close" style="color: #F56C6C; font-weight: bold;" />
							<el-button v-if="!isArchive && checkPermission(['PIcase.inspector'])" class="btn-revoke" size="mini" plain round @click="beforeSetResult(row, -2)">撤銷</el-button>
						</span>
						<span v-else> - </span>
					</template>
				</template>
			</el-table-column>
			<el-table-column label="機關抽查" width="160px" align="center">
				<template slot-scope="{ row }">
					<template v-if="!isArchive && checkPermission(['PIcase.supervisor']) && !(row.State & 4) && !(row.State & 64)">
						<el-button-group>
							<el-button v-for="(name, type) in options.resultType.Organ" :key="type" :type="type == 4 ? 'success' : 'danger'" size="mini" @click="beforeSetResult(row, Number(type))">{{ name }}</el-button>
						</el-button-group>
					</template>
					<template v-else>
						<span v-if="(row.State & 4) || (row.State & 64)">
							<i v-if="row.State & 4" class="el-icon-check" style="color: #67C23A; font-weight: bold;" />
							<i v-else-if="row.State & 64" class="el-icon-close" style="color: #F56C6C; font-weight: bold;" />
							<el-button v-if="!isArchive && checkPermission(['PIcase.supervisor'])" class="btn-revoke" size="mini" plain round @click="beforeSetResult(row, -4)">撤銷</el-button>
						</span>
						<span v-else> - </span>
					</template>
				</template>
			</el-table-column>

			<!-- NOTE: 展示用，還未實作 -->
			<el-table-column label="操作" width="80px" align="center">
				<template slot-scope="{ row }">
					<el-button class="btn-action" type="info" plain size="mini" round disabled @click="showMap(row)">地圖</el-button>
				</template>
			</el-table-column>
		</el-table>

		<!-- 抽查結果Dialog -->
		<el-dialog
			:visible.sync="showResultConfirm"
			width="300px"
			:show-close="false"
			:close-on-click-modal="false"
			:close-on-press-escape="false"
			center
		>	
			<span slot="title">確認提交 {{ rowActive.UploadCaseNo }}的抽查結果？</span>
			<div>來源案號: {{ rowActive.CaseNo }}</div>
			<div v-if="rowActive.resultType < 0" style="color: #F56C6C" >撤銷抽查</div>
			<div v-else>抽查結果: 
				<span v-if="rowActive.State & 2 || rowActive.State & 4" style="color: #67C23A">合格</span>
				<span v-else-if="rowActive.State & 32 || rowActive.State & 64" style="color: #F56C6C">不合格</span>
			</div>
			<div v-if="rowActive.resultType > 0 && (rowActive.resultType & 32 || rowActive.resultType & 64)">原因: 
				<el-select v-model="rowActive.ReasonType">
					<el-option v-for="( name, key ) in options.reasonType" :key="key" :label="name" :value="Number(key)" />
				</el-select>
			</div>
			<span slot="footer" class="footer-btns">
				<el-button @click="showResultConfirm = false; getList();">取消</el-button>
				<el-button type="primary" :loading="loading" @click="setResult()">確定</el-button>
			</span>
		</el-dialog>
	</div>
</template>

<script>
import moment from "moment";
import { getTypeMap } from "@/api/type";
import { getCaseList, setCaseList, archiveCaseList } from "@/api/PI";
import checkPermission from '@/utils/permission';

export default {
	name: "PICaseList",
	data() {
		return {
			loading: false,
			timeTabId: 1,
			dateTimePickerVisible: false,
			showResultConfirm: false,
			showDlConfirm: false,
			isArchive: false,
			pickerOptions: {
				firstDayOfWeek: 1,
				shortcuts: [
					{
						text: "今日",
						onClick(picker) {
							const date = moment();
							picker.$emit("pick", date);
						},
					},
					{
						text: "昨日",
						onClick(picker) {
							const date = moment().subtract(1, "d");
							picker.$emit("pick", date);
						}
					},
					{
						text: "前日",
						onClick(picker) {
							const date = moment().subtract(2, "d");
							picker.$emit("pick", date);
						}
					}
				],
				disabledDate(date) {
					return moment(date).valueOf() >= moment().endOf("d").valueOf();
				},
			},
			searchDate: moment().startOf("d").subtract(1, "d"),
			searchRange: "",
			zipCodeNow: 0,
			listQuery: {
				zipCode: 104
			},
			resultHeader: {
				UploadCaseNo: {
					name: "案件編號",
					sortable: true
				}
			},
			headers: {
				UploadCaseNo: {
					name: "案件編號",
					sortable: true
				},
				// CaseDate: {
				// 	name: "成案日期",
				// 	sortable: false,
				// },
				ReportDate: {
					name: "通報日期",
					sortable: false,
				},
				DeviceType: {
					name: "設施類型",
					sortable: true
				},
				// rDeviceType: {
				// 	name: "認列類型",
				// 	sortable: true
				// },
				organAssign: {
					name: "機關交辦",
					sortable: false
				},
				CaseName: {
					name: "地址",
					sortable: false
				},
				CaseNo: {
					name: "來源案號",
					sortable: true
				},
				// CaseType: {
				// 	name: "損壞情況",
				// 	sortable: false
				// },
				BType: {
					name: "損壞態樣",
					sortable: false
				},
				BrokeType: {
					name: "損壞程度",
					sortable: false
				},
				// BrokeStatus: {
				// 	name: "損壞狀況",
				// 	sortable: false
				// },
				PCIValue: {
					name: "PCI",
					sortable: false
				}
			},
			resultList: [],
			list: [],
			rowActive: {},
			districtList: {
				// 100: {
				// 	"name": "中正區"
				// },
				103: {
					"name": "大同區"
				},
				104: {
					"name": "中山區"
				},
				// 105: {
				// 	"name": "松山區"
				// },
				// 106: {
				// 	"name": "大安區"
				// },
				// 108: {
				// 	"name": "萬華區"
				// },
				// 110: {
				// 	"name": "信義區"
				// },
				// 111: {
				// 	"name": "士林區"
				// },
				// 112: {
				// 	"name": "北投區"
				// },
				// 114: {
				// 	"name": "內湖區"
				// },
				// 115: {
				// 	"name": "南港區"
				// },
				// 116: {
				// 	"name": "文山區"
				// }
			},
			options: {
				DeviceType: {},
				BType: {},
				BrokeType: {
					1: "輕",
					2: "中",
					3: "重"
				},
				// BrokeStatus: {
				// 	1: "觀察", //輕度
				// 	2: "短期改善", //中度
				// 	3: "立即改善", //重度
				// },
				resultType: {
					SV: {
						2: "合格",
						32: "不合格"
					},
					Organ: {
						4: "合格",
						64: "不合格"
					}
				},
				reasonType: {
					1: "損壞情形說明與現況不符(PI1.2)",
					2: "損壞程度與現況不符(PI2.2)"
				},
			}
		};
	},
	computed: {
		reasonTypeArr() {
			let reasonTypeArr = { 1: 0, 2: 0 };
			this.resultList.forEach(l => {
				for(let type of Object.keys(this.options.reasonType)) {
					if((l.State & 32) && l.StateNotes.SV == this.options.reasonType[type]) reasonTypeArr[type]++;
					if((l.State & 64) && l.StateNotes.Organ == this.options.reasonType[type]) reasonTypeArr[type]++;
				}
			})
			return reasonTypeArr
		},
		checkNum() {
			return { 
				SV: { 
					AC: { 
						check: this.list.filter(l => ((l.State & 2) || (l.State & 32)) && l.DeviceType == 1).length, 
						fail: this.list.filter(l => (l.State & 32) && l.DeviceType == 1).length,
						total: Math.round(this.list.length * 0.15 * 0.6, 0) 
					}, 
					facility: { 
						check: this.list.filter(l => ((l.State & 2) || (l.State & 32)) && l.DeviceType != 1).length, 
						fail: this.list.filter(l => (l.State & 32) && l.DeviceType != 1).length,
						total: Math.round(this.list.length * 0.15 * 0.4, 0) 
					} 
				}, 
				Organ: { 
					AC: { 
						check: this.list.filter(l => ((l.State & 4) || (l.State & 64)) && l.DeviceType == 1).length, 
						fail: this.list.filter(l => (l.State & 64) && l.DeviceType == 1).length,
						total: Math.round(this.list.length * 0.05 * 0.6, 0) 
					}, 
					facility: {
						check: this.list.filter(l => ((l.State & 4) || (l.State & 64)) && l.DeviceType != 1).length, 
						fail: this.list.filter(l => (l.State & 64) && l.DeviceType != 1).length,
						total: Math.round(this.list.length * 0.05 * 0.4, 0) 
					} 
				} 
			};
		}
	},
	created() {
		getTypeMap().then(response => {
			this.options.DeviceType = response.data.DeviceTypeMap;
			this.options.BType = response.data.BTypeMap;
		});
		this.getList();
	},
	methods: {
		checkPermission,
		dateShortcuts(index) {
			this.timeTabId = index;

			const DATE_OPTION = {
				TODAY: 0,
				YESTERDAY: 1,
				DAYBEFOREYEST: 2
			};

			switch (index) {
				case DATE_OPTION.TODAY:
					this.searchDate = moment();
					break;
				case DATE_OPTION.YESTERDAY:
					this.searchDate = moment().subtract(1, "d");
					break;
				case DATE_OPTION.DAYBEFOREYEST:
					this.searchDate = moment().subtract(2, "d");
					break;
			}
			this.getList();
		},
		getList() {
			this.loading = true;
			let date = moment(this.searchDate).format("YYYY-MM-DD");
			this.searchRange = date;
			this.isArchive = false;
			this.list = [];
			this.resultList = [];

			getCaseList({
				filterType: 2,
				caseType: 1,
				zipCode: this.listQuery.zipCode,
				timeStart: date,
				timeEnd: moment(date).add(1, "d").format("YYYY-MM-DD")
			}).then((response) => {
				if (response.data.list.length == 0) {
					this.$message({
						message: "查無資料",
						type: "error",
					});
				} else {
					this.isArchive = response.data.list[0].Archive;
					this.zipCodeNow = this.listQuery.zipCode;
					this.list = response.data.list;
					this.resultList = response.data.resultList;
					this.list.forEach(l => {
						for(const key of ["Firm", "SV", "Organ"]) {
							if(!l.StateNotes.hasOwnProperty(key)) this.$set(l.StateNotes, key, "");
						}
						this.$set(l, "edit", false);
					})
				}
				this.loading = false;
			}).catch(err => { this.loading = false; });
		},
		beforeSetResult(row, result) {
			this.rowActive = JSON.parse(JSON.stringify(row));

			if((result & 32) || (result & 64)) this.$set(this.rowActive, "ReasonType", 1);
			else this.$set(this.rowActive, "ReasonType", 0);

			this.$set(this.rowActive, "resultType", result);
			if(result == -2) {
				if(this.rowActive.State & 2) this.rowActive.State -= 2;
				if(this.rowActive.State & 32) this.rowActive.State -= 32;
			} else if(result == -4) {
				if(this.rowActive.State & 4) this.rowActive.State -= 4;
				if(this.rowActive.State & 64) this.rowActive.State -= 64;
			} else this.rowActive.State += result;

			this.showResultConfirm = true;
		},
		setResult() {
			this.loading = true;
			this.showResultConfirm = false;
			if(this.rowActive.State & 32) this.rowActive.StateNotes.SV = this.options.reasonType[this.rowActive.ReasonType] || this.rowActive.StateNotes.SV;
			else this.rowActive.StateNotes.SV = "";
			if(this.rowActive.State & 64) this.rowActive.StateNotes.Organ = this.options.reasonType[this.rowActive.ReasonType] || this.rowActive.StateNotes.Organ;
			else this.rowActive.StateNotes.Organ = "";

			setCaseList( this.rowActive.id, {
				zipCode: this.zipCodeNow,
				rDeviceType: this.rowActive.rDeviceType,
				organAssign: this.rowActive.organAssign,
				BType: this.rowActive.BType,
				BrokeType: this.rowActive.BrokeType,
				PCIValue: this.rowActive.PCIValue,
				State: this.rowActive.State,
				StateNotes: JSON.stringify(this.rowActive.StateNotes)
			}).then(response => {
				if ( response.statusCode == 20000 ) {
					this.$message({
						message: "提交成功",
						type: "success",
					});
					this.getList();
				} 
			}).catch(err => {
				console.log(err);
				this.getList();
			})
		},
		formatter(row, column) {
			if([ 'organAssign' ].includes(column.property)) return row[column.property] == 1 ? '是' : '-';
			else if(['DeviceType', 'rDeviceType'].includes(column.property)) return this.options.DeviceType[row[column.property]];
			else if(column.property == 'BType') return this.options.BType[row[column.property]];
			else if(column.property == 'BrokeType') return this.options.BrokeType[row[column.property]];
			// else if(column.property == 'BrokeStatus') return this.options.BrokeStatus[row.BrokeType];
			else if(column.property.indexOf('Date') != -1) return row[column.property] ? this.formatTime(row[column.property]) : "-";
			else if(column.property.indexOf('Area') != -1) return Number(row[column.property]) ? row[column.property].toLocaleString() : "-";
			else return row[column.property] && row[column.property] != '0' ? row[column.property] : "-";
		},
		formatTime(time) {
			return moment(time).format("YYYY/MM/DD");
		},
		handleDownload() {
			this.showDlConfirm = false;
			const date = moment(this.searchDate).format("YYYY-MM-DD");

			archiveCaseList({
				zipCode: this.zipCodeNow,
				timeStart: date,
				timeEnd: moment(date).add(1, "d").format("YYYY-MM-DD")
			}).then(response => {
				const tHeader = Object.values(this.headers).map(value => value.name).concat(["監造抽查", "機關抽查", "備註"]);
				const filterVal = Object.keys(this.headers).concat(["SVCheck", "OrganCheck", "Note"]);
				// tHeader = [ "日期", "星期", "DAU", "新增帳號數", "PCU", "ACU", "儲值金額", "DAU帳號付費數", "DAU付費率", "DAU ARPPU", "DAU ARPU", "新增帳號儲值金額", "新增帳號付費數", "新增付費率", "新增帳號ARPPU", "新增帳號ARPU" ];
				// filterVal = [ "date", "weekdayText", "dau", "newUser", "pcu", "acu", "amount", "dauPaid", "dauPaidRatio", "dauARPPU", "dauARPU", "newUserAmount", "newUserPaid", "newUserPaidRatio", "newUserARPPU", "newUserARPU" ];
				const dataList = JSON.parse(JSON.stringify(this.list)).map(l => {
					l.CaseDate = this.formatTime(l.CaseDate);
					l.ReportDate = this.formatTime(l.ReportDate);
					l.DeviceType = this.options.DeviceType[l.DeviceType];
					l.organAssign =  l.organAssign == 1 ? "是" : "";
					l.BType = this.options.BType[l.BType];
					l.BrokeType = this.options.BrokeType[l.BrokeType];
					// l.BrokeStatus = this.options.BrokeStatus[l.BrokeType];
					l.PCIValue = l.PCIValue == 0 ? "" : l.PCIValue;

					l.SVCheck = (l.State & 2) ? "V" : (l.State & 32) ? "X" : "";
					l.OrganCheck = (l.State & 4) ? "V" : (l.State & 64) ? "X" : "";

					l.Note = (l.State & 32) ? l.StateNotes.SV : (l.State & 64) ? l.StateNotes.Organ : "";
					return l
				}) 
				const data = this.formatJson(filterVal, dataList);

				import("@/vendor/Export2Excel").then((excel) => {
					excel.export_json_to_excel({
						header: tHeader,
						data,
					});
				});
				this.getList();
			}).catch(err => {
				console.log(err);
				this.getList();
			})
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
.PI-case-list
	height: calc(100vh - 50px)
	overflow: scroll
	.filter-container 
		.el-select
			width: 110px
		.el-input__inner
			padding-left: 5px
			text-align: center
		.filter-item
			margin-right: 5px
		.time-picker 
			& > *
				margin-right: 5px
			.el-date-editor.el-input
				width: 165px
				.el-input__inner
					width: 155px
					padding: 0 10px
	.panel-group 
		position: sticky
		top: -20px
		display: flex
		align-items: center
		background-color: rgba(#fff, 1)
		box-shadow: 0 5px 5px rgba(#eee, 0.1)
		width: calc(100% + 40px)
		margin: 0 !important
		transform: translateX(-15px)
		padding: 5px
		// margin: 5px 0
		// margin-top: 18px
		z-index: 2
		.card-panel-col 
			position: relative
			margin: auto
		.card-panel 
			height: 125px
			font-size: 12px
			position: relative
			// overflow: hidden
			color: #666
			background: #fff
			box-shadow: 4px 4px 40px rgba(0, 0, 0, .05)
			border-color: rgba(0, 0, 0, .05)
			display: flex
			justify-content: space-around
			align-items: center
			&:hover 
				.card-panel-icon-wrapper 
					color: #fff
				.icon-form
					background: #40c9c6
				.icon-people
					background: #36a3f7
				.icon-domain
					background: #FF9800
				.icon-message-alert
					background: #f4516c
			.icon-form
				color: #40c9c6
			.icon-people
				color: #36a3f7
			.icon-domain
				color: #FF9800
			.icon-message-alert
				color: #f4516c
			.card-panel-icon-wrapper 
				float: left
				margin: 14px 0 0 14px
				padding: 16px
				transition: all 0.38s ease-out
				border-radius: 6px
			.card-panel-icon 
				float: left
				font-size: 48px
			.card-panel-description 
				float: right
				font-weight: bold
				margin: 26px
				margin-left: 0px
				.card-panel-text 
					line-height: 18px
					color: rgba(0, 0, 0, 0.45)
					font-size: 16px
					margin-bottom: 12px
				.card-panel-num 
					font-size: 18px
					.fail-num
						color: #F56C6C
						// font-size: 20px
						vertical-align: text-top
	.icon-tooltip
		font-size: 16px
		color: #606266
		margin-left: 3px
	.el-icon-edit
		color: #67C23A
		margin-bottom: 5px
		&:hover
			color: white
			background-color: #67C23A
			border-radius: 50%
	.el-icon-success
		margin-right: -10px
	.el-icon-error
		color: #F56C6C
	.el-select.edit-select
		width: 85px
		.el-input__inner
			padding-left: 3px
			padding-right: 10px
		.el-input__suffix
			right: 0
			margin-right: -3px
			transform: scale(0.7)
	.edit-number.el-input-number .el-input__inner
		padding: 0 10px
		text-align: left
	.el-table
		.el-table__row:hover > td
			background: inherit
		.el-button--danger
			padding: 7px 9px
	.btn-revoke
		padding: 5px 10px
		margin-left: 5px
	.el-dialog
		.el-dialog__body > div
			margin-top: 10px
		.el-select
			margin-top: 5px
			width: 250px
		.footer-btns
			display: flex
			justify-content: center
</style>